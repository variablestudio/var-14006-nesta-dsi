var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';

//o: <http://www.w3.org/ns/org#>
//foaf: <http://xmlns.com/foaf/0.1/>
//ds: <http://data.digitalsocial.eu/def/ontology/>
//rdfs: <http://www.w3.org/2000/01/rdf-schema#>
//rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
//purl-terms: <http://purl.org/dc/terms/>
//purl-event: <http://purl.org/NET/c4dm/event.owl#>
//vcard: <http://www.w3.org/2006/vcard/ns/>

//Organization http://data.digitalsocial.eu/doc/organization/faaefa6f-4696-1514-c54d-5d7f0499fb89
//o:hasPrimarySite http://data.digitalsocial.eu/id/site/d394ea97-f0ba-8dca-407b-3d114b2bfe3b
//foaf:logo http://s3-eu-west-1.amazonaws.com/digitalsocialinnovation/logos/524ac14d72b09e3422000008/original.JPG?1380630861
//ds:organizationType http://data.digitalsocial.eu/def/concept/organization-type/government-and-public-sector
//ds:twitterAccount http://twitter.com/culture_public
//ds:numberOfFTEStaff http://data.digitalsocial.eu/def/concept/FTE-range/11-25
//foaf:page http://www.culturerepublic.co.uk
//rdf:label "Culture Republic"
//rdfs:type http://www.w3.org/ns/org#Organization

//Activity http://data.digitalsocial.eu/doc/activity/7795ec63-2cec-dc77-f953-e176368bf0ff
//purl-terms:description
//ds:areaOfSociety http://data.digitalsocial.eu/def/concept/area-of-society/neighbourhood-regeneration
//ds:activityType http://data.digitalsocial.eu/def/concept/activity-type/research-project
//ds:technologyMethod http://data.digitalsocial.eu/def/concept/technology-method/social-networks
//rdf:type http://data.digitalsocial.eu/def/ontology/Activity
//ds:technologyFocus http://data.digitalsocial.eu/def/concept/technology-focus/open-knowledge
//rdfs:label "focus on grass-roots communities"
//purl-terms:description "Make a positive social impact\r\nCreate a \"network effect\""
//purl-event:time http://data.digitalsocial.eu/id/timeline-interval/4200a08c-270c-af99-c2db-0249ff76f7c3

//ActivityMembership http://data.digitalsocial.eu/doc/activity-membership/1a93fce9-12b2-5840-4265-f51c2e20a88b
//ds:role Co-funder
//ds:activity "Make Things Do Stuff"
//ds:organization http://data.digitalsocial.eu/def/ontology/ActivityMembership Nesta
//rdf:type http://data.digitalsocial.eu/def/ontology/ActivityMembership

function map(list, fn) {
  return list.map(fn);
}

function get(prop) {
  return function(o) {
    return o[prop];
  }
}

function compose(a, b) {
  return function() {
    return b(a(arguments[0]));
  }
}

function countValues(list) {
  var o = {};
  list.forEach(function(value) {
    if (!o[value]) o[value] = 0;
    o[value]++;
  });
  var result = [];
  for(var value in o) {
    result.push({ value: value, count: o[value] });
  }
  result.sort(function(a, b) {
    return -(a.count - b.count);
  })
  return result;
}

function unique(list) {
  list.sort();
  return list.filter(function(value, i) {
    return value != list[i+1];
  })
}

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
    deferred.reject(new Error('CORS not supported!'));
    return;
  }

  xhr.onload = function() {
    deferred.resolve(JSON.parse(xhr.responseText).results.bindings);
  };

  xhr.onerror = function() {
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

SPARQLQuery.prototype.where = function(subject, predicate, object) {
  this.lines.where.push(' ' + subject + ' ' + predicate + ' ' + object + '.');
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


var ds = new SPARQLDataSource(SPARQL_URL);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .select('?org ?label')
  .select('from <test_file>')
  .where('?org', 'a', 'o:Organization')
  .where('?org', 'rdfs:label', '?label')
  .execute(function(success, results) {
    //console.log(results[0].label.value)
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .select('?org')
  .select('?type')
  .select('from <test_file>')
  .where('?org', 'a', 'o:Organization')
  .where('?org', 'rdf:type', '?type')
  .execute(function(success, results) {
    //console.log(map(results, compose(get('type'), get('value'))));
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
  .select('?activity')
  .select('?label')
  .select('from <test_file>')
  //.where('?activity', 'a', '?kind')
  .where('?activity', 'a', 'ds:Activity')
  //.where('?activity', 'ds:type', 'ds:Activity')
  .where('?activity', 'rdfs:label', '?label')
  .execute(function(success, results) {
    //console.log(results.length);
    //console.log(map(results, compose(get('label'), get('value'))));
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
  .select('?activity_label ?label')
  .select('from <test_file>')
  .where('?org', 'a', 'o:Organization')
  //.where('?org', 'rdfs:label', '?label')
  .where('?org', 'rdfs:label', '"Swirrl"')
  .where('?activity_membership', 'a', 'ds:ActivityMembership')
  .where('?activity_membership', 'ds:organization', '?org')
  .where('?activity_membership', 'ds:activity', '?activity')
  .where('?activity', 'rdfs:label', '?activity_label')
  .execute(function(success, results) {
    //console.log(map(results, compose(get('activity_label'), get('value'))));
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
  .select('?org ?p ?o')
  //.select('from <test_file>')
  //.where('?org', 'a', 'o:Organization')
  .where('?org', 'rdfs:label', '"Make Things Do Stuff"')
  .where('?org', '?p', '?o')
  .execute(function(success, results) {
    //console.log(results);
    //console.log(map(results, compose(get('org'), get('value'))));
    //console.log(map(results, compose(get('p'), get('value'))));
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
  //.select('DISTINCT ?o_label ?activity_label')
  .select('?org_label ?activity_label')
  .where('?org', 'a', 'o:Organization')
  //.select('from <test_file>')
  //.where('?org', 'ds:areaOfSociety', '?org')
  .where('?org', 'rdfs:label', '?org_label')
  .where('?am', 'a', 'ds:ActivityMembership')
  .where('?am', 'ds:organization', '?org')
  .where('?am', 'ds:activity', '?activity')
  .where('?activity', 'rdfs:label', '?activity_label')
  .where('?activity', 'ds:technologyMethod', '<http://data.digitalsocial.eu/def/concept/technology-method/crowdfunding>')
  .execute(function(success, results) {
    //console.log(results);
    //console.log(unique(map(results, compose(get('activity_label'), get('value')))).length);
    //console.log();
    //console.log(map(results, get('label')));
  }
);

ds.query()
  .prefix('o:', '<http://www.w3.org/ns/org#>')
  .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
  .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
  .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
  .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
  //.select('DISTINCT ?o_label ?activity_label')
  .select('?org_label ?org_country ?org_locality')
  .where('?org', 'a', 'o:Organization')
  .where('?org', 'rdfs:label', '?org_label')
  .where('?org', 'o:hasPrimarySite', '?org_site')
  .where('?org_site', 'o:siteAddress', '?org_address')
  .where('?org_address', 'vcard:country-name', '?org_country')
  .where('?org_address', 'vcard:locality', '?org_locality')
  .execute().then(function(results) {
    var results = countValues(map(results, compose(get('org_locality'), get('value'))));
    results.forEach(function(entry) {
      entry.name = entry.value;
    });
    buildBarChart('cities', results, 180)
  });

//ds.predicateValues('ds:organizationType', console.log);
//ds.predicateValues('ds:activityType', console.log);
//ds.predicateValues('ds:areaOfSociety', console.log);
//ds.predicateValues('ds:technologyFocus', console.log);
//ds.predicateValues('ds:technologyMethod', console.log);

function graphPredicate(predicate) {
  ds.predicateValues(predicate).then(function(results) {
    results.forEach(function(entry) {
      entry.name = entry.value;
    });
    buildBarChart(predicate, results, 220)
  });
}

graphPredicate('ds:organizationType');
graphPredicate('ds:activityType');
graphPredicate('ds:areaOfSociety');
graphPredicate('ds:technologyFocus');
graphPredicate('ds:technologyMethod');
graphPredicate('ds:areaOfDigitalSocialInnovation');

