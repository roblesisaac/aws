const connectToDb = require('./db');
const Vue = require('vue');
const renderer = require('vue-server-renderer').createRenderer();
// const fs = require('fs');
// fs.readdir('views/partials/', function (err, data) {
//   for (i=0; i<data.length; i++) tmplts[data[i].slice(0,-4)] = fs.readFileSync('views/partials/' + data[i], 'utf8');
//   for (var key in tmplts) defaults[key] = tmplts[key];
//   for (var key in customs) tmplts[key] = customs[key];
//   fn(tmplts);
// });

module.exports.vue = (event, context, callback) => {
  const app = new Vue({
    data: {
      url: event.pathParameters.sitename
    },
    template: `<div>The visited URL is: {{ url }}</div>`
  });

  callback(null, {
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Hello</title></head>
      <body>hi</body>
    </html>
    `
  });

  // renderer.renderToString(app, (err, html) => {
  //   if (err) {
  //     res.status(500).end('Internal Server Error');
  //     return;
  //   }
  //   callback(null, {
  //     headers: {
  //       'Content-Type': 'text/html',
  //     },
  //     body: `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //       <head><title>Hello</title></head>
  //       <body>${html}</body>
  //     </html>
  //     `
  //   });
  // });
};


const models = { sheet: require('./models/sheets'), site: require('./models/sites') };

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
    body: `<html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/foundation/6.4.3/css/foundation.min.css">
            </head>
            <body>
              <div id="app" class="grid-x">
                <div class="cell small-12">
                  <input type="text" v-model="ace.url">
                  <br>
                  <textarea rows="45" v-model="ace.txt"></textarea>
                  <button @click="saveSheet">Save</button>
                </div>
              </div>
            </body>
            <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/foundation/6.4.3/js/foundation.min.js"></script>
            <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
            <script src="https://unpkg.com/vue"></script>
            <script src="https://www.blockometry.com/plaza/sheet/sheets/scripts/main"></script>
            <script type="text/javascript">
              site.sheet = {{sheets}}
            </script>
          </html>`
  };

  connectToDb()
    .then(() => {
      models.site.findOne({url: siteName})
        .then(function(site) {
          if(site) {
            models.sheet.find({siteId: site._id})
              .then(sheets => {
                response.body = response.body.replace('{{sheets}}', JSON.stringify(sheets));
                callback(null, response);                 
              });
          } else {
            response.body = `<h1>No ${siteName} exists</h1>`;
            callback(null, response);             
          }
        });      
    });
};
