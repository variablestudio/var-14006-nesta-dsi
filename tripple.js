var fs = require('fs');

function loadNt(path) {
  var str = fs.readFileSync(path, 'utf-8');
  var lines = str.split('\n');

  var orgIds = lines.filter(function(line) {
    return line.indexOf('http://www.w3.org/ns/org#Organization') != -1;
  }).map(function(line) {
    return line.match(/<([^>]+)>.+/)[1];
  });

  var orgLabels = [];
  lines.forEach(function(line) {
    if (line.indexOf('http://www.w3.org/2000/01/rdf-schema#label') != -1 && line.indexOf('organization') != -1) {
      orgLabels.push(line);
    }
  })
  console.log(orgIds.length, orgLabels.length);
}

module.exports.loadNt = loadNt;


loadNt('data/dataset_data_organizations-and-activities_20140519011501.nt');