function addMethodToArray(name, fn) {
  Object.defineProperty(Array.prototype, name, {
    enumerable: false,
    writable: true,
    value: fn
  });
}
function itemMatches(item, filter) {
  var matches = [];
  for(var key in filter) if(filter[key] !== undefined) matches.push(filter[key] === item[key]);
  return matches.indexOf(false) === -1; 
}
addMethodToArray("find", function(filter){
  var match = [];
  for (var i = 0; i<this.length; i++) {
    if(itemMatches(this[i], filter)) match.push(this[i]);
  }
  return match;
});
addMethodToArray("findOne", function(filter){
  var match = null;
  for (var i = 0; i<this.length; i++) {
    if(itemMatches(this[i], filter)) {
      match = this[i];
      match.i = i;
      i = this.length;
    }
  }
  return match;
});
addMethodToArray("excludes", function(keyword){
  return this.indexOf(keyword) == -1;
});
addMethodToArray("loop", function(fn, o) {
  if(fn === undefined) return console.log("Please define fn.");
  if(this === undefined) return console.log("Please define array");
  o = o || {
    then: function(fn) {
      if(!this.resolve) this.resolve = fn;
    }
  };
  o.i === undefined ? o.i = 0 : o.i++;
  if(!this[o.i]) {
    if(o.resolve) o.resolve();
    return o;
  }
  var self = this;
  fn(o.i, this[o.i], function() {
    setTimeout(function(){
      self.loop(fn, o);
    }, 0);
  });
  return o;
});
addMethodToArray("sortByProp", function(prop, descend){
  this.sort(function(a, b) {
    var sorted = a[prop] > b[prop];
    if(descend) {
      return sorted ? -1 : 1;
    } 
    return  sorted ? 1 : -1; 
  });
});
if(!Object.loop) {
  Object.loop = function(obj, fn, parent) {
    parent = parent || obj;
    
    for(var key in obj) {
      var val = obj[key];
      
      if(Array.isArray(val)) {
        for(var i in val) {
          if(val[i] !== undefined) {
           var item = val[i];
           typeof item !== "object"
              ? fn(val, i, item, parent)
              : Object.loop(item, fn, parent);
          }
        }
      } else if(typeof val === "object") {
        Object.loop(val, fn, parent);
      } else {
        fn(obj, key, val, parent); 
      }
    }
    
    return obj;
  };
}
if(!Object.matches) {
  Object.matches = function(obj1, obj2) {
    var obj1Keys = Object.keys(obj1),
        obj2Keys = Object.keys(obj2),
        shallowKeysMatch = JSON.stringify(obj1Keys) == JSON.stringify(obj2Keys);
    if(!shallowKeysMatch) return false;
    var obj1Data = "";
    Object.loop(obj1, function(obj, key, value){
      obj1Data += (key+(value.name || value))+typeof value;
    });
    var obj2Data = "";
    Object.loop(obj2, function(obj, key, value){
      obj2Data += (key+(value.name || value))+typeof value;
    });
    return obj1Data == obj2Data;
  };
}
const emptyObj = function(obj) {
  Object.loop(obj, function(o, key){
    o[key] = "";
  });
  return obj;
};
var obj = function(o) {
  for (var key in o) {
  	if(o[key] !== undefined) this[key] = o[key];
  }
};
obj.prototype.loop = Object.loop;
function loop(arr) {
  return { async: arr };
}
function proper(str) { 
  str = str.toLowerCase();
  let spl = str.split("");
  spl[0] = spl[0].toUpperCase();
  return spl.join("");
}
function renameProp(obj, oldProp, newProp) {
  var newObj = {};
  for(var key in obj) {
    if(key == oldProp) {
      newObj[newProp] = obj[key];
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
var typeTimer = 0;
function whenTypingStops(fn) {
  clearTimeout(typeTimer);
  typeTimer = setTimeout(function () {
    fn();
  }, 500);
}

if (!String.prototype.includes) {
  String.prototype.includes = function() {
    'use strict';
    return String.prototype.indexOf.apply(this, arguments) !== -1;
  };
}
if (!String.prototype.excludes) {
  String.prototype.excludes = function() {
    'use strict';
    return String.prototype.indexOf.apply(this, arguments) === -1;
  };
}
