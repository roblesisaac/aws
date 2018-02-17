const connectToDb = require('./db');
const models = {
  sheet: require('./models/sheets'),
  site: require('./models/sites')
};

module.exports.sheet = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const siteName = event.pathParameters.sitename;
  const sheetName = event.pathParameters.sheet;
  const prop = event.pathParameters.prop;
  const name = event.pathParameters.name;
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: 'Nothing yet.'
  };
  connectToDb()
    .then(() => {
      models.site.findOne({url: siteName})
        .then(function(site) {
            if (!site) {
              response.body = JSON.stringify({message: 'No Site ' + siteName});
              return callback(null, response);
            }
            models.sheet.findOne({siteId: site._id, name: sheetName})
              .then(function(sheet){
                  if(!sheet) {
                    response.body = JSON.stringify({message: 'No Sheet ' + sheetName});
                    return callback(null, response);
                  }
                  response.headers['Content-Type'] = "application/javascript";
                  let arr = sheet[prop];
                  let res = null;
                  for(var i=0; i<arr.length; i++) {
                    if(arr[i].name === name) res = arr[i].txt;
                    i=arr.length;
                  }
                  response.body = res;
                  callback(null, response);
                });
          });
    });
};

const rhtml = function(site, sheets) {
  site = site || {name: 'plysheet', url: 'plysheet'};
  site.sheets = {};
  // for (var i in sheets) {
  //   sheets[i]._id = JSON.stringify(sheets[i]._id);
  //   site.sheet[sheets[i].name] = sheets[i];
  // }
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      </head>
      <body>
        <div id="app">
          <h1>Welcome to {{ url }}</h1>
          <textarea rows="45"></textarea>
          <button @click="saveSheet">Save</button>
        </div>
      </body>
      <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
      <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
      <script src="https://unpkg.com/vue"></script>
      <script src="https://www.blockometry.com/plaza/sheet/sheets/scripts/main"></script>
      <script type="text/javascript">
        var site = new Vue({
          data: {
            id: '${site._id}',
            name: '${site.name}',
            url: '${site.url}'
          },
          el: "#app",
          methods: {
            saveSheet: function() {
              
            }
          }
        });
      </script>
    </html>`;
};

module.exports.landingPage = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  let siteName = 'plysheet';
  if (event.pathParameters && event.pathParameters.sitename) {
    siteName = event.pathParameters.sitename;
  }
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: '<h1>Empty</h1>'
  };

  connectToDb()
    .then(() => {
      models.site.findOne({url: siteName})
        .then(function(site) {
          if(site) {
            models.sheet.find({siteId: site._id})
              .then(sheets => {
                response.body = rhtml(site, sheets);
                callback(null, response);                 
              });
          } else {
            response.body = `<h1>No ${siteName} exists</h1>`;
            callback(null, response);             
          }
        });      
    });
};
