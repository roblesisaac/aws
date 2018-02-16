const connectToDb = require('./db');
const models = {
  note: require('./models/Notes'),
  site: require('./models/sites')
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
          site = site || {};
          const html = `
            <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
              </head>
              <style>
                h1 { color: #73757d; }
              </style>
              <body>
                <div id="app">
                  <h1>Welcome to ${siteName}</h1>
                  <button @click="createSheet">Create Sheet</button>
                </div>
              </body>
              <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
              <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
              <script src="https://unpkg.com/vue"></script>
              <script type="text/javascript">
                var url = '${siteName}';
                var site = new Vue({
                  data: {
                    id: '${site._id}',
                    url: '${siteName}'
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
            callback(null, {
              statusCode: 200,
              headers: {
                'Content-Type': 'text/html',
              },
              body: html,
            });      
        });      
    });
};
