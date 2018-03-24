const connectToDb = require('./db');
const models = {
  users: require('./models/users'),
  sites: require('./models/sites'),
  sheets: require('./models/sheets')
};

function areThereAnyYet(name, data, next) {
  models[name].find().then(function(res) {
    if(res.length === 0 || name === 'sheets') {
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
          js: "var tmplts = {};\nfor(var i in ply.sheets) {\n  for(var t in ply.sheets[i].templates) {\n    tmplts[ply.sheets[i].templates[t].name] = ply.sheets[i].templates[t].text;\n  }\n}\n\nvar api = axios.create({\n  baseURL: 'https://www.blockometry.com/plaza/api/',\n  headers: {\n    'ply-token': window.sessionStorage['ply-token'],\n    userid: window.sessionStorage.userid,\n    'Pragma': 'no-cache'\n  }\n});\n\nfunction login(user) {\n  axios.post('https://www.blockometry.com/login', {\n    username: user.username,\n    password: user.password\n  }).then(function(res) {\n    window.sessionStorage['ply-token'] = res.data['ply-token'];\n    window.sessionStorage.userid = res.data.userid;\n  });\n}\n\nvar Sheet = {\n  current: function() {\n    var sheet = {};\n    for(var i in ply.sheets) {\n      if(ply.sheets[i].link === ply.link) {\n        sheet = ply.sheets[i];\n      }\n    }\n    return sheet;    \n  },\n  createComponent: function(sheet) {\n    var vue,\n      template;\n    for(var i in sheet.templates) {\n      var t = sheet.templates[i];\n      if(t.name === 'main') template = t.text;\n    }\n    if(sheet.name !== 'sheets') eval(sheet.js);\n    vue = vue || {};\n    vue.template = vue.template || template || \"<div>no template yet</div>\";\n    Vue.component('ply-'+sheet.name, vue);\n  }\n};\n\nVue.component('ply-nav', {\n  data: function() {\n    return {\n      ply: ply\n    };\n  },\n  template: `\n  <div class=\"grid-x\">\n    <a v-for=\"sheet in ply.sheets\" @click=\"ply.link=sheet.link\" class=\"cell auto button large\">{{ sheet.link }}</a>\n  </div>\n  `\n});\n\nVue.component('ply-panel', {\n  template: '<div>panel</div>'\n});\n\nVue.component('ply-form', {\n  computed: {\n    obj: function() {\n      var obj = {};\n      for(var i in this.sheet._schema) {\n        var sch = this.sheet._schema[i];\n        obj[sch.propName] = '';\n      }\n      return obj;\n    },\n    sheet: Sheet.current\n  },\n  methods: {\n    save: function() {\n      api.post(this.sheet.link, this.obj).then(function(res){\n        console.log('saved!');\n      });\n    }\n  },\n  template: `\n  <form>\n  <div v-for=\"(i, name) in obj\" class=\"grid-x\">\n    <div class=\"cell auto\">{{ name }}: </div>\n    <div class=\"cell shrink\">\n     <input type=\"text\" v-model=\"obj[name]\">\n    </div>\n  </div>\n  <a @click=\"save\" class=\"button large\">save</a>  \n  </form>\n  `\n});\n\nVue.component('ply-sheet', {\n  computed: {\n    sheet: function() {\n      if(this.obj) {\n        return this.obj;\n      } else {\n        Sheet.current()._init = Sheet.current()._init || 'front-end';\n        return Sheet.current();\n      }\n    }\n  },\n  props: ['obj'],\n  template: `\n  <div>\n    <a v-if=\"sheet._init==='front-end'\" @click=\"sheet._init='back-end'\"><b>Back-end</b></a>\n    <a v-else @click=\"sheet._init='front-end'\"><b>Front-end</b></a>\n    <component :is=\"sheet._init\"></component>\n  </div>\n  `\n});\n\nVue.component('back-end', {\n  computed: {\n    sheet: Sheet.current\n  },\n  created: function() {\n    this.getDb();\n  },\n  data: function() {\n    return {\n      db: [],\n      ply: ply\n    };\n  },\n  methods: {\n    getDb: function() {\n      var vm = this;\n      vm.db = [];\n      if(this.sheet.link) {\n        api.get(this.sheet.link).then(function(res){\n          vm.db = res.data;\n        });\n      }\n    }\n  },\n  watch: {\n    'sheet.link': function() {\n      this.getDb();\n    }\n  },\n  template: `\n  <div class=\"grid-x\">\n    <div class=\"cell medium-4\">\n      <ply-form></ply-form>\n    </div>\n    <div class=\"cell medium-8\">\n      <ply-obj v-for=\"obj in db\" :obj=\"obj\" :key=\"obj._id\"></ply-obj>\n    </div>\n  </div>\n  `\n});\n\nVue.component('ply-obj', {\n  computed: {\n    sheet: Sheet.current\n  },\n  data: function() {\n    return {\n      exc: ['_id', '__v']\n    };\n  },\n  methods: {\n    _delete: function(id) {\n      api.delete(this.sheet.link + '/' + id).then(function(res){\n        console.log('deleted!');\n      });\n    },\n    _save: function(id) {\n      api.put(this.sheet.link + '/' + id, this.obj).then(function(res){\n        console.log(id + ' saved!');\n      });      \n    },\n    valueAndKeyAreValid: function(value, key) {\n      return (this.exc.indexOf(key) === -1) && (typeof value !== 'object' );\n    }\n  },\n  props: ['obj'],\n  template: `\n    <div class=\"grid-x\">\n      <div class=\"cell small-12\">\n        <a @click=\"_delete(obj._id)\" class=\"cell auto\">Delete {{ obj.name }}</a>\n        <a @click=\"_save(obj._id)\" class=\"cell auto\">Save {{ obj.name }}</a>          \n      </div>\n      <div class=\"cell small-12\">\n        <div v-if=\"valueAndKeyAreValid(value, key)\" v-for=\"(value, key) in obj\" class=\"grid-x\">\n          <div class=\"cell auto\">{{ key }}</div>\n          <input class=\"cell shrink\" v-model=\"obj[key]\">\n        </div>          \n      </div>\n    </div>\n  `\n});\n\nVue.component('front-end', {\n  beforeCreate: function() {\n    Sheet.createComponent(Sheet.current());\n  },\n  computed: {\n    sheet: Sheet.current\n  },\n  data: function() {\n    return {\n      show: true\n    };\n  },\n  template: '<component v-if=\"show\" :is=\"\\'ply-\\'+sheet.name\"></component>',\n  watch: {\n    'sheet.link': function() {\n      this.show = false;\n      Sheet.createComponent(Sheet.current());\n      this.show = true;\n    }\n  }\n});\n\nvar site = new Vue({\n  created: function() {\n    var vm = this;\n    api.get(this.ace.url).then(function(res) {\n      vm.ace.send = res.data[0] || {};\n      vm.ace.url += vm.ace.send._id || '';\n      vm.ace.txt = vm.ace.send[vm.ace.prop] || '//enter code here';\n    });\n  },\n  data: {\n    ace: {\n      url: 'https://www.blockometry.com/plaza/api/sheets/',\n      prop: 'js',\n      send: null,\n      txt: ply.sheets[0].js\n    },\n    ply: ply\n  },\n  el: '#app',\n  methods: {\n    saveSheet: function() {\n      this.ace.send[this.ace.prop] = this.ace.txt;\n      api.put(this.ace.url, this.ace.send).then(function(res) {\n        console.log(res.data);\n      });\n    }\n  },\n  template: `\n  <div class=\"grid-x\">\n    <ply-nav class=\"cell small-12\"></ply-nav>\n    <ply-sheet class=\"cell small-12\"></ply-sheet>\n  </div>\n  `\n});\n"
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
