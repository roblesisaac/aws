const connectToDb = require('./db');
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

function areThereAnyYet(name, data, next) {
  models[name].find().then(function(res) {
    if(res.length === 0) {
      createFirst(name, data, function(firstItem) {
        next(firstItem);
      });
    } else {
      next(res[0]);
    }
  });      
}
function createFirst(name, data, next) {
  models[name].create(data).then(function(res){
    next(res);
  });
}

module.exports.init = (event, context, callback) => {  
  context.callbackWaitsForEmptyEventLoop = false;
  connectToDb().then(() => {
    const firstUser = { name: 'Eiken', password: 'pass' };
    areThereAnyYet('users', firstUser, function(user) {
      const firstSite = { name: 'plysheet', userId: user._id, url: 'plysheet' };
      areThereAnyYet('sites', firstSite, function(site) {
        const firstSheet = {
          name: "sheets",
          link: 'sheets',
          siteId: site._id,
          public: true,
          sort: 1
          ,_init: "",
          templates: [{name: 'main', text: '<h1>here is the main text</h1>'}],
          _schema: [{propName: "name",propType: "string"},{propName: "link",propType: "string"},{propName: "sort",propType: "number"},{propName: "_init",propType: "string"},{propName: "public",propType: "boolean"},{propName: "_schema",propType: "array"},{propName: "templates",propType: "array"},{propName: "users",propType: "array"},{propName: "siteId",propType: "string"},{propName: "js",propType: "string"}],users: [{apps: ["all"],username: "Eiken"}],
          js: "function login(user) { axios.post('https://www.blockometry.com/login', { username: user.username, password: user.password }).then(function(res) { window.sessionStorage['ply-token'] = res.data['ply-token']; window.sessionStorage.userid = res.data.userid; }); } var instance = axios.create({ headers: { 'ply-token': window.sessionStorage['ply-token'], userid: window.sessionStorage.userid } }); var ply = new Vue({ created: function() { var vm = this; instance.get(this.ace.url).then(function(res) { vm.ace.send = res.data[0] || {}; vm.ace.url += vm.ace.send._id || ''; vm.ace.txt = vm.ace.send[vm.ace.prop] || '//enter code here'; }); }, data: { ace: { url: 'https://www.blockometry.com/plaza/api/sheets/', prop: 'js', send: null, txt: sheets[0].js }, link: sheets[0].name, sheets: sheets }, el: '#app', methods: { saveSheet: function() { this.ace.send[this.ace.prop] = this.ace.txt; instance.put(this.ace.url, this.ace.send).then(function(res) { console.log(res.data); }); } } });"
        };
        areThereAnyYet('sheets', firstSheet, function(sheet){
          callback(null, {
            statusCode: 200,
            body: JSON.stringify({
              user: user,
              site: site,
              sheet: sheet
            })
          }); 
        });
      });  
    });
  });
};
