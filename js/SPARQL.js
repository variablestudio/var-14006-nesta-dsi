function SPARQLDataSource(endpoint) {
  this.endpoint = endpoint;
}

SPARQLDataSource.prototype.createCORSRequest = function(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
}

SPARQLDataSource.prototype.executeQuery = function(query) {
  var deferred = Q.defer();
  var url = this.endpoint + encodeURIComponent(query);

  var xhr = this.createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported!');
    deferred.reject(new Error('CORS not supported!'));
    return;
  }

  xhr.onload = function() {
    deferred.resolve(JSON.parse(xhr.responseText).results.bindings);
  };

  xhr.onerror = function() {
    console.log('error')
    deferred.reject(new Error('Error making request to ' + url));
  };

  xhr.send();

  return deferred.promise;
}

SPARQLDataSource.prototype.predicateValues = function(predicate) {
  var deferred = Q.defer();
  var predicateName = predicate.substr(predicate.indexOf(':')+1);
  this.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?o ?s_label ?o_label')
    //.select('from <test_file>')
    .where('?o', predicate, '?s')
    .where('?s', 'rdfs:label', '?s_label')
    .execute().then(function(results) {
      var values = map(results, compose(get('s_label'), get('value')));
      values.sort();
      deferred.resolve(countValues(values));
    });
  return deferred.promise;
}

SPARQLDataSource.prototype.query = function() {
  return new SPARQLQuery(this);
}

function SPARQLQuery(dataSource) {
  this.dataSource = dataSource;
  this.lines = {
    prefix: [],
    select: [],
    describe: [],
    where: []
  };
}

SPARQLQuery.prototype.prefix = function(prefix, uri) {
  this.lines.prefix.push('PREFIX ' + prefix + ' ' + uri);
  return this;
}

SPARQLQuery.prototype.where = function(subject, predicate, object, options) {
  var q = ' ' + subject + ' ' + predicate + ' ' + object + '.';
  if (options && options.optional) {
    q = 'OPTIONAL { ' + q + ' } ';
  }
  this.lines.where.push(q);
  return this;
}

SPARQLQuery.prototype.select = function(subject) {
  this.lines.select.push(subject);
  return this;
}

SPARQLQuery.prototype.describe = function(subject) {
  this.lines.describe.push(subject);
  return this;
}

SPARQLQuery.prototype.compile = function() {
  var str = '';
  str += this.lines.prefix.join('\n');
  if (this.lines.describe.length > 0) str += '\nDESCRIBE ' + this.lines.describe.join(' ');
  if (this.lines.select.length > 0) str += '\nSELECT ' + this.lines.select.join(' ');
  str += '\n' + 'WHERE {\n';
  str += this.lines.where.join('\n');
  str += '\n}';
  return str;
}

SPARQLQuery.prototype.execute = function(callback) {
  var queryStr = this.compile();
  return this.dataSource.executeQuery(queryStr, callback);
}
