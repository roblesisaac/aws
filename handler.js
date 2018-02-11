require('dotenv').config({ path: './variables.env' });
const jwt = require('jsonwebtoken')
const connectToDatabase = require('./db');
const Note = require('./models/Notes');
// Set in `enviroment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {}
  authResponse.principalId = principalId
  if (effect && resource) {
    const policyDocument = {}
    policyDocument.Version = '2012-10-17'
    policyDocument.Statement = []
    const statementOne = {}
    statementOne.Action = 'execute-api:Invoke'
    statementOne.Effect = effect
    statementOne.Resource = resource
    policyDocument.Statement[0] = statementOne
    authResponse.policyDocument = policyDocument
  }
  return authResponse
}

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
  // context.callbackWaitsForEmptyEventLoop = false;

  // connectToDatabase()
  //   .then(() => {
  //     Note.findById(event.pathParameters.id)
  //       .then(note => callback(null, {
  //         statusCode: 200,
  //         body: JSON.stringify(note)
  //       }))
  //       .catch(err => callback(null, {
  //         statusCode: err.statusCode || 500,
  //         headers: { 'Content-Type': 'text/plain' },
  //         body: 'Could not fetch the note.'
  //       }));
  //   });
};

module.exports.getAll = (event, context, callback) => {
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
  // context.callbackWaitsForEmptyEventLoop = false;

  // connectToDatabase()
  //   .then(() => {
  //     Note.find()
  //       .then(notes => callback(null, {
  //         statusCode: 200,
  //         body: JSON.stringify(notes)
  //       }))
  //       .catch(err => callback(null, {
  //         statusCode: err.statusCode || 500,
  //         headers: { 'Content-Type': 'text/plain' },
  //         body: 'Could not fetch the notes.'
  //       }))
  //   });
};

module.exports.update = (event, context, callback) => {
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
  // context.callbackWaitsForEmptyEventLoop = false;

  // connectToDatabase()
  //   .then(() => {
  //     Note.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
  //       .then(note => callback(null, {
  //         statusCode: 200,
  //         body: JSON.stringify(note)
  //       }))
  //       .catch(err => callback(null, {
  //         statusCode: err.statusCode || 500,
  //         headers: { 'Content-Type': 'text/plain' },
  //         body: 'Could not fetch the notes.'
  //       }));
  //   });
};

module.exports.delete = (event, context, callback) => {
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
  // context.callbackWaitsForEmptyEventLoop = false;

  // connectToDatabase()
  //   .then(() => {
  //     Note.findByIdAndRemove(event.pathParameters.id)
  //       .then(note => callback(null, {
  //         statusCode: 200,
  //         body: JSON.stringify({ message: 'Removed note with id: ' + note._id, note: note })
  //       }))
  //       .catch(err => callback(null, {
  //         statusCode: err.statusCode || 500,
  //         headers: { 'Content-Type': 'text/plain' },
  //         body: 'Could not fetch the notes.'
  //       }));
  //   });
};

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
module.exports.auth = (event, context, callback) => {
  console.log('event', event)
  if (!event.authorizationToken) {
    return callback('Unauthorized')
  }

  const tokenParts = event.authorizationToken.split(' ')
  const tokenValue = tokenParts[1]

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    // no auth token!
    return callback('Unauthorized')
  }
  const options = {
    audience: AUTH0_CLIENT_ID,
  }
  // decode base64 secret. ref: http://bit.ly/2hA6CrO
  const secret = new Buffer.from(AUTH0_CLIENT_SECRET, 'base64')
  try {
    jwt.verify(tokenValue, secret, options, (verifyError, decoded) => {
      if (verifyError) {
        console.log('verifyError', verifyError)
        // 401 Unauthorized
        console.log(`Token invalid. ${verifyError}`)
        return callback('Unauthorized')
      }
      // is custom authorizer function
      console.log('valid from customAuthorizer', decoded)
      return callback(null, generatePolicy(decoded.sub, 'Allow', event.methodArn))
    })
   } catch (err) {
    console.log('catch error. Invalid token', err)
    return callback('Unauthorized')
  }
}

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
    <style>
      h1 { color: #73757d; }
    </style>
    <body>
      <h1>Welcome to ${siteName}</h1>
    </body>
    <script type="text/javascript">
      var url = '${siteName}';
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
