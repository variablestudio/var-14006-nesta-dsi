var CSV = require('../js/CSVNode');
var fs = require('fs');

function toNumber(value) {
  return Number(value);
}

function notNull(o) {
  return o != null;
}

var AreaTypes = ['open-democracy', 'new-ways-of-making', 'awarness-networks', 'collaborative-economy', 'open-access', 'funding-acceleration-and-incubation'];

var TechnologyAreaTypes = ['', 'open-data', 'open-hardware', 'open-knowledge', 'open-networks'];

CSV.load('new_schema_values_filled.csv').then(function(data) {
  var lines = data.slice(1, 310);

  projects = lines.map(function(tokens) {
    return {
      name: tokens[1],
      description: tokens[2],
      technologyArea: tokens[3],
      tags: tokens[4].split(' '),
      url: tokens[5],
      areas: tokens.slice(6, 12)
        .map(toNumber)
        .map(function(value, index) { return value === 1 ? AreaTypes[index] : null;})
        .filter(notNull)
    }
  });

  var resultLines = [];

  projects.forEach(function(project) {
    project.areas.forEach(function(area) {
      resultLines.push(project.url + ' http://data.digitalsocial.eu/def/concept/area-of-digital-social-innovation/' + area);
    })
  })

  console.log(resultLines.join('\n'), resultLines.length)

  fs.writeFileSync('new_schema_list.txt', resultLines.join('\n'), 'utf8');
}).fail(function(e) {
  console.log(e);
});