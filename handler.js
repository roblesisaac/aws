require('dotenv').config({ path: './variables.env' });
const connectToDatabase = require('./db');
const Note = require('./models/Notes');
const sheet = require('./models/sheets');

module.exports.sheet = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  connectToDatabase()
    .then(() => {
      let query = {};
      if(event.queryStringParameters) {
        query = event.queryStringParameters;
      }
      sheet.find(query)
        .then(sheets => callback(null, {
          statusCode: 200,
          body: JSON.stringify(sheets)
        }))
        .catch(err => callback(null, {
          statusCode: err.statusCode || 500,
          headers: { 'Content-Type': 'text/plain' },
          body: 'Could not fetch the sheets.'
        }))
    });
};

module.exports.create = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  connectToDatabase()
    .then(() => {
      Note.create(JSON.parse(event.body))
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

  connectToDatabase()
    .then(() => {
      Note.findById(event.pathParameters.id)
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

  connectToDatabase()
    .then(() => {
      let query = {};
      if(event.queryStringParameters) {
        query = event.queryStringParameters;
      }
      Note.find(query)
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

  connectToDatabase()
    .then(() => {
      Note.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
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

  connectToDatabase()
    .then(() => {
      Note.findByIdAndRemove(event.pathParameters.id)
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
  let siteName = 'plysheet';
  // check for GET params and use if available
  if (event.pathParameters && event.pathParameters.sitename) {
    siteName = event.pathParameters.sitename;
  }

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <script src="//cdn.auth0.com/js/lock/10.1.0/lock.min.js"></script>
    </head>
    <style>
      h1 { color: #73757d; }
    </style>
    <body>
      <div id="app">
        <h1>Welcome to ${siteName}</h1>
        <button @click="login">Login</button>
        <button @click="post('public')">Public</button>
        <button @click="post('private')">Private</button>
      </div>
    </body>
    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.23.0/polyfill.min.js"></script>
    <script src="https://npmcdn.com/axios/dist/axios.min.js"></script>
    <script src="https://unpkg.com/vue"></script>
    <script type="text/javascript">
      var url = '${siteName}';
      var site = new Vue({
        created: function() {
          this.lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
            auth: {
              params: {
                scope: 'openid email'
              }
            }
          });

          this.lock.on("authenticated", function(authResult) {
            console.log(authResult)
            lock.getProfile(authResult.idToken, function(error, profile) {
              if (error) {
                // Handle error
                console.log(JSON.stringify(error))
                return false
              }
              // authResult.accessToken && authResult.idToken
              // Save the JWT token.
              localStorage.setItem('access_token', authResult.accessToken)
              localStorage.setItem('id_token', authResult.idToken)
          
              // Save the profile
              localStorage.setItem('profile', JSON.stringify(profile))
            });
          });
        },
        computed: {
          height: function() {
            return this.$el.clientHeight;
          }
        },
        data: {
          ply: "ply",
          lock: null,
          AUTH0_CLIENT_ID: "OVQTtDOjwc1QMCs9gBJMrAsyA5Z0KY6d",
          AUTH0_DOMAIN: "plysheet.auth0.com",
          
        },
        el: '#app',
        methods: {
          login: function() {
            this.lock.show();
          },
          post: function(type) {
            axios.post('https://www.blockometry.com/api/'+type).then(function(res){
              console.log(res);
            })
          }
        }
      });
    </script>
  </html>`;

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  };

  // callback is sending HTML back
  callback(null, response);
};
