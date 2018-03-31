const ply = require('ply');

module.exports.sheets = (event, context, callback) => {
  ply.res(callback, 'hi');
};

module.exports.sheetProp = (event, context, callback) => {
  // define the functions
  const res = (string, isCss) => {
    let type;
    isCss ? type = 'text/css' : type = 'application/javascript';
    callback(null, {
      statusCode: 200,
      headers: { 'Content-Type': type },
      body: (string || "").toString()
    });       
  };
  const isReady = (body) => {
    return ['object', 'array'].indexOf(typeof body) === -1;
  };
  const createQueryFilterObjFrom = (queryStringParameters, next) => {
    let q = queryStringParameters || {};
    let s = q.select || 'selector is not defined';
    delete q.select;
    next(q, s);
  };
  const findAMatch = (arr, query, next) => {
    let match = {};
    for(var i=0; i<arr.length; i++) {
      let item = arr[i];
      let matches = [];
      for(var key in query) matches.push(item[key] === query[key]);
      if(matches.indexOf(false) === -1) { 
        i=arr.length;
        match = item;
      }
    }
    next(match);
  };
  const getObjFrom = (body, query, next) => {
    if(Array.isArray(body)) {
      findAMatch(body, query, function(obj){
        next(obj);
      });
    } else {
      next(body);
    }
  };
  //execute the functions
  ply.findSheet(event, context, function(err, sheet){
    if(err) return ply.error(callback, err);
    const propRaw = event.pathParameters.prop;
    const prop = propRaw.split('?')[0];
    const body = sheet[prop] || 'no ' + prop;
    if(isReady(body)) {
      res(body);
    } else {
      const queryStringParameters = event.queryStringParameters;
      createQueryFilterObjFrom(queryStringParameters, function(query, select) {
        getObjFrom(body, query, function(obj) {
          let isCss;
          if(query.name.includes('css')) isCss = true;
          res(obj[select] || JSON.stringify({
            query: query,
            select: select,
            body: obj
          }), isCss);
        }); 
      });
    }
  });
};

module.exports.post = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
    model.create(JSON.parse(event.body)).then(function(data){
      ply.res(callback, JSON.stringify(data));
    }); 
  });
};

module.exports.get = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
    let params = event.queryStringParameters || {};
    model.find(params).then(function(data){
      ply.res(callback, JSON.stringify(data));
    });
  });
};

module.exports.getOne = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
    model.findById(event.pathParameters.id).then(function(data){
      ply.res(callback, JSON.stringify(data));
    });
  });
};

module.exports.put = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
      model.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true }).then(function(data){
        ply.res(callback, JSON.stringify(data));
      });
  });
};

module.exports.delete = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
      model.findByIdAndRemove(event.pathParameters.id).then(function(data){
        ply.res(callback, JSON.stringify(data));
      }); 
  });
};

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
    models.site.findOne({url: siteName}).then(function(site){
      if(site) {
        models.sheet.find({siteId: site._id}).then(function(sheets){
          var data = {
            site: site,
            user: {},
            sheets: sheets,
            link: sheets[0].name
          };
          response.body = response.body.replace('{{data}}', JSON.stringify(data));
          callback(null, response); 
        });
      } else {
        response.body = `<h1>No ${siteName} exists</h1>`;
        callback(null, response);             
      }
    });
  });
};
