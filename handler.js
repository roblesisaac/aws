const connectToDb = require('./db');
const models = {
  sheet: require('./models/sheets'),
  site: require('./models/sites')
};

const rhtml = function(site, sheets) {
  site = site || {name: 'plysheet', url: 'plysheet'};
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      </head>
      <body>
        <div id="app">
          <h1>Welcome to {{ url }}</h1>
          <button @click="createSheet">Create Sheet</button>
        </div>
      </body>
      <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
      <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
      <script src="https://unpkg.com/vue"></script>
      <script type="text/javascript">
        var site = new Vue({
          data: {
            id: '${site._id}',
            name: '${site.name}',
            url: '${site.url}',
            sheets: ${sheets}
          },
          el: "#app",
          methods: {
            createSheet: function() {
              axios.post("https://www.blockometry.com/plysheet/api/sheets", this.sheet).then(function(res){
                console.log(res.data)
              });                  
            }
          }
        });
      </script>
    </html>`;
};

module.exports.landingPage = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  let siteName = 'plysheet';
  // check for GET params and use if available
  if (event.pathParameters && event.pathParameters.sitename) {
    siteName = event.pathParameters.sitename;
  }

  connectToDb()
    .then(() => {
      models.site.findOne({url: siteName})
        .then(function(site) {
          if(site) {
            models.sheet.find({siteId: site._id})
              .then(sheets => {
                callback(null, {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'text/html',
                  },
                  body: rhtml(site, sheets)
                });                 
              });
          } else {
            callback(null, {
              statusCode: 200,
              headers: {
                'Content-Type': 'text/html',
              },
              body: `<h1>No ${siteName} exists</h1>`
            });             
          }
        });      
    });
};
