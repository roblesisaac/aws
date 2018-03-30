const Vue = require('vue');
const renderer = require('vue-server-renderer').createRenderer();
const ply = require('ply');
// const fs = require('fs');
// fs.readdir('views/partials/', function (err, data) {
//   for (i=0; i<data.length; i++) tmplts[data[i].slice(0,-4)] = fs.readFileSync('views/partials/' + data[i], 'utf8');
//   for (var key in tmplts) defaults[key] = tmplts[key];
//   for (var key in customs) tmplts[key] = customs[key];
//   fn(tmplts);
// });

const models = { sheet: require('./models/sheets'), site: require('./models/sites') };

module.exports.landingPage = (event, context, callback) => {
  let siteName = 'plysheet';
  if (event.pathParameters && event.pathParameters.sitename) {
    siteName = event.pathParameters.sitename;
  }
  const response = {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body:`
      <html>
        <head>
          <title>${siteName}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/foundation/6.4.3/css/foundation.min.css">
          <link rel="stylesheet" href="https://www.blockometry.com/plaza/sheets/templates?name=slidecss&select=text">
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
          <link rel="stylesheet" href="https://www.blockometry.com/plaza/sheets/templates?name=css&select=text" />
          <link href="https://fonts.googleapis.com/css?family=Work+Sans:900|Lobster" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css?family=Coda:800|Maven+Pro:900" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css?family=Roboto+Mono" rel="stylesheet">
        </head>
        <body>
          <div id="app" class="grid-x"></div>
        </body>
        <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/foundation/6.4.3/js/foundation.min.js"></script>
        <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
        <script src="https://unpkg.com/vue"></script>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.3/ace.js"></script>
        <script type="text/javascript">
          var ply = {{data}};
        </script>
        <script src="https://www.blockometry.com/plaza/sheets/js"></script>
      </html>
    `
  };
  ply.connect(context).then(function(){
    ply.res(callback, 'hi');
    // models.site.findOne({url: siteName}).then(function(site){
    //   if(site) {
    //     models.sheet.find({siteId: site._id}).then(function(sheet){
    //       var data = {
    //         site: site,
    //         user: {},
    //         sheets: sheets,
    //         link: sheets[0].name
    //       };
    //       response.body = response.body.replace('{{data}}', JSON.stringify(ply));
    //       callback(null, response); 
    //     });
    //   } else {
    //     response.body = `<h1>No ${siteName} exists</h1>`;
    //     callback(null, response);             
    //   }
    // });
  });
};

module.exports.vue = (event, context, callback) => {
  const app = new Vue({
    data: {
      url: event.pathParameters.sitename
    },
    template: `<div>The visited URL is: {{ url }}</div>`
  });

  renderer.renderToString(app, (err, html) => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Hello</title>
        </head>
        <body>${html}</body>
      </html>
      `
    });
  });
};
