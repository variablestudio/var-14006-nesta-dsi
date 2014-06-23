var fn = {};
fn.sequence = function(start, end) {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  var result = [];
  for(var i=start; i<end; i++) {
    result.push(i);
  }
  return result;
};

fn.get = function(prop) {
  return function(o) {
    return o[prop];
  }
}

fn.notNull = function(o) {
  return o != null;
}

fn.trimToSlash = function(s) {
  return s.substr(s.lastIndexOf('/')+1);
}

fn.join = function(separator) {
  return function(list) {
    return list.join(separator);
  }
}

fn.last = function(list) {
  return list[list.length-1];
}

fn.first = function(list) {
  return list[0];
}

fn.zipMap = function(keys, values) {
  var map = {};
  keys.forEach(function(key, index) {
    map[key] = values[index];
  });
  return map;
};

fn.values = function(obj) {
  var result = [];
  for(var propertyName in obj) {
    result.push(obj[propertyName]);
  }
  return result;
};

fn.keys = function(obj) {
  var result = [];
  for(var propertyName in obj) {
    result.push(propertyName);
  }
  return result;
};

fn.flatten = function(list) {
  var result = [];
  for(var i=0; i<list.length; i++) {
    if (Array.isArray(list[i])) {
      result = result.concat(list[i]);
    }
    else {
      result.push(list[i]);
    }
  }
  return result;
};

fn.toNumber = function(value) {
  return Number(value);
}

fn.partition = function(list, count) {
  var result = [];
  var i = 0;
  while (i < list.length) {
    var step = 0;
    var group = [];
    while (step < count && i < list.length) {
      step++;
      group.push(list[i]);
      i++;
    }
    result.push(group);
  }
  return result;
};

fn.zip = function(lista, listb) {
  var result = [];
  var len = Math.min(lista.length, listb.length);
  for(var i=0; i<len; i++) {
    push.push([lista[i], listb[i]]);
  }
  return result;
}

fn.getValuesAt = function(list, indices) {
  return indices.map(function(i) {
    return list[i];
  });
}

fn.unique = function(list) {
  var results = [];
  list.forEach(function(value) {
    if (results.indexOf(value) == -1) {
      results.push(value);
    }
  });
  return results;
}

fn.countValues = function(list) {
  return list.reduce(function(resultsMap, value) {
    if (!resultsMap[value]) {
      resultsMap[value] = 0;
    }
    resultsMap[value]++;
    return resultsMap;
  }, {});
}

fn.groupBy = function(list, prop) {
  var groups = {};
  list.forEach(function(item) {
    var value = item[prop];
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
  })
  return groups;
}

fn.forEachTwo = function(list, cb) {
  var n = list.length;
  for(var i=0; i<n; i+=2) {
    if (i + 2 < n) {
      cb(list[i], list[i+1]);
    }
  }
}

fn.forEachAndNext = function(list, cb) {
  var n = list.length;
  for(var i=0; i<n; i++) {
    if (i + 2 < n) {
      cb(list[i], list[i+1]);
    }
  }
}

fn.min = function(a, b) {
  return Math.min(a, b);
}

fn.max = function(a, b) {
  return Math.max(a, b);
}