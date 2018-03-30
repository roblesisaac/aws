const ply = require('ply');

module.exports.sheets = (event, context, callback) => {
  ply.getModel(event, context, function(message) {
    ply.res(message);
  });
  // ply.findSheet(event, context, function(err, sheet) {
  //   ply.checkIfSheetIsPublic(event, context, sheet, function(err, sheet){
  //     if(err) {
  //       ply.error(callback, err);
  //     } else {
  //       ply.res(callback, JSON.stringify(sheet));
  //     }
  //   });
  // });
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
    model.create(JSON.parse(event.body))
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.get = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
    let params = event.queryStringParameters || {};
    model.find(params)
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.getOne = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
    model.findById(event.pathParameters.id)
      .then(data => callback(null, {
        statusCode: 200,
        body: JSON.stringify(data)
      }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.put = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
      model.findByIdAndUpdate(event.pathParameters.id, JSON.parse(event.body), { new: true })
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
      .catch(err => callback(null, err)); 
  });
};

module.exports.delete = (event, context, callback) => {
  ply.getModel(event, context, function(error, model) {
    if(error) return ply.error(callback, error);
      model.findByIdAndRemove(event.pathParameters.id)
        .then(data => callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        }))
      .catch(err => callback(null, err)); 
  });
};
