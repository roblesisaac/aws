const connectToDb = require('./db');
const models = {
  note: require('./models/Notes'),
  site: require('./models/sites')
};

module.exports.create = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDb()
    .then(() => {
      models.note.create(JSON.parse(event.body))
        .then(note => callback(null, {
          statusCode: 200,
          body: JSON.stringify(note)
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not create the note.'
        }));
    });
};

module.exports.getOne = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDb()
    .then(() => {
      models.note.findById(event.pathParameters.id)
        .then(note => callback(null, {
          statusCode: 200,
          body: JSON.stringify(note)
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not fetch the note.'
        }));
    });
};

module.exports.getAll = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDb()
    .then(() => {
      let query = {};
      if(event.queryStringParameters) {
        query = event.queryStringParameters;
      }
      models.note.find(query)
        .then(notes => callback(null, {
          statusCode: 200,
          body: JSON.stringify(notes)
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not fetch the notes.'
        }))
    });
};

module.exports.update = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDb()
    .then(() => {
      models.note.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
        .then(note => callback(null, {
          statusCode: 200,
          body: JSON.stringify(note)
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not fetch the notes.'
        }));
    });
};

module.exports.delete = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDb()
    .then(() => {
      models.note.findByIdAndRemove(event.pathParameters.id)
        .then(note => callback(null, {
          statusCode: 200,
          body: JSON.stringify({ message: 'Removed note with id: ' + note._id, note: note })
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not fetch the notes.'
        }));
    });
};

// Public API
module.exports.publicEndpoint = (event, context, callback) => {
  return callback(null, {
    statusCode: 200,
    headers: {
      /* Required for CORS support to work */
      "Access-Control-Allow-Origin": "*",
      /* Required for cookies, authorization headers with HTTPS */
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({
      message: 'Hi ⊂◉‿◉つ from Public API',
    }),
  })
}

// Private API
module.exports.privateEndpoint = (event, context, callback) => {
  return callback(null, {
    statusCode: 200,
    headers: {
      /* Required for CORS support to work */
      "Access-Control-Allow-Origin": "*",
      /* Required for cookies, authorization headers with HTTPS */
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({
      message: 'Hi ⊂◉‿◉つ from Private API. Only logged in users can see this',
    }),
  })
}

module.exports.landingApi = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to the api of ' + event.pathParameters.sitename + '.com !!',
      context: context,
      event: event
    }),
  };

  callback(null, response);
}

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
              Username: <input type="text" v-model="user.username">
              <br>
              Password: <input type="text" v-model="user.password">
              <br>
              Name: <input type="text" v-model="user.name">
              <br>
              <button @click="create">Create</button>
              <br>
              <button @click="login">Login</button>
              <br>
              site name: <input type="text" v-model="site.name">
              <br>
              site url: <input type="text" v-model="site.url">
              <br>
              site userId: <input type="text" v-model="site.userId">
              <br>
              <button @click="createSite">Create</button>
              <br>
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
              computed: {
                height: function() {
                  return this.$el.clientHeight;
                }
              },
              data: {
                id: '${site._id}',
                user: {
                  username: "Eiken",
                  name: "isaac robles",
                  password: "pass"
                },
                sheet: {
                  "name" : "sheets",
                  "link" : "sheets",
                  "sort" : 1,
                  "load" : "",
                  "public" : "false",
                  "scripts": [{
                    name: "main",
                    txt: "console.log('here is the sheet script!')"
                  }],
                  "tmplts" : [{
                    name: "main",
                    txt: "<h1>here is the main text</h1>"
                  }],
                  "users": [{
                    username: "Eiken",
                    apps: ["all"]
                  }],
                  "siteId": '${site._id}'   
                },
                site: {
                  name: "plaza",
                  url: "plaza",
                  userId: "",
                }
              },
              el: "#app",
              methods: {
                create: function() {
                  axios.post("https://www.blockometry.com/plysheet/api/users", this.user).then(function(res){
                    console.log(res.data)
                  });
                },
                createSheet: function() {
                  axios.post("https://www.blockometry.com/plysheet/api/sheets", this.sheet).then(function(res){
                    console.log(res.data)
                  });                  
                },
                createSite: function() {
                  axios.post("https://www.blockometry.com/plysheet/api/sites", this.site).then(function(res){
                    console.log(res.data)
                  });
                },
                login: function() {
                  axios.post("https://www.blockometry.com/plysheet/api/auth", this.user).then(function(res){
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
