
var runOrganisationsQuery = function() {
  //var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL, 'json');

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    //.select('?org ?lon ?lat ?country')
    .select('?org')
    .where('?org', 'a', 'o:Organization')
    //.where('?org', 'o:hasPrimarySite', '?org_site')
    //.where('?org_site', 'geo:long', '?lon')
    //.where('?org_site', 'geo:lat', '?lat')
    //.where('?org_site', 'o:siteAddress', '?org_address')
    //.where('?org_address', 'vcard:country-name', '?country')
    .execute();
};

var runOrganisationQueryForOrgType = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL, 'json');

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?org ?label ?tf ?activity ?activity_label ?org_type ?area_of_society')
    .where('?org', 'a', 'o:Organization')
    //.where('?org', 'ds:organizationType', '?org_type')
    //.where('?org_type', 'rdfs:label', '?org_type_label')
    //.where('?org', 'rdfs:label', '?label')
    .where("?am", "a", "ds:ActivityMembership")
    .where("?am", "ds:organization", "?org")
    .where("?am", "ds:activity", "?activity")
    //.where("?activity", "rdfs:label", "?activity_label")
    //.where("?activity", "ds:areaOfSociety", "?area_of_society", { optional: true })
    .execute();
};

console.time('runOrganisationQueryForOrgType');
runOrganisationQueryForOrgType().then(function(json) {
  console.timeEnd('runOrganisationQueryForOrgType');
  console.log('loaded', json.length);
  console.log(json[0], json[0].org.org)
  console.log(json.filter(function(org) {
    return org.org.value == 'http://data.digitalsocial.eu/id/organization/faaefa6f-4696-1514-c54d-5d7f0499fb89';
  }));
})