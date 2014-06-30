var mainVizInit = (function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
var ds = new SPARQLDataSource(SPARQL_URL);
var useCache = false;
var allResults;

function init() {
  if (useCache && localStorage['data_19']) {
    allResults = JSON.parse(localStorage['data_19']);
    buildViz(allResults);
  }
  else {
    d3.json('data/org_query.json', function(data) {
      allResults = data.results.bindings;
      var orgHashMap = {};
      var activityHashMap = {};
      allResults.forEach(function(org) {
        if (!orgHashMap[org.org.value]) {
          orgHashMap[org.org.value] = org;
          orgHashMap[org.org.value].activities = [];
          orgHashMap[org.org.value].dsiAreas = [];
        }
        var orgData = orgHashMap[org.org.value];
        var activityData = activityHashMap[org.activity.value];
        if (!activityData) {
          activityData = {
            label: org.activity.value,
            technologyFocus: [],
            dsiAreas: []
          }
          activityHashMap[org.activity.value] = activityData;
        }
        activityData.technologyFocus.push(org.tf.value);
        orgData.activities.push(activityData);
      })
      var groupedResults = [];
      for(var orgId in orgHashMap) {
        groupedResults.push(orgHashMap[orgId]);
      }
      //localStorage['data_18'] = JSON.stringify(groupedResults);
      allResults = groupedResults;

      console.log(activityHashMap)

      DSIAreasData.forEach(function(row) {
        var activity = 'http://data.digitalsocial.eu/id/activity/' + row[0];
        var dsiArea = row[1];
        var activityData = activityHashMap[activity];
        if (activityData) {
          activityData.dsiAreas.push(dsiArea);
        }
      })

      for(var orgId in orgHashMap) {
        var org = orgHashMap[orgId];
        org.activities.forEach(function(a){
          a.dsiAreas.forEach(function(area) {
            org.dsiAreas.push(area);
          })
        })
      }

      buildViz(allResults);
    })
  }
}

function hsla(h, s, l, a) {
  return 'hsla(' + h + ',' + 100 * s + '%,' + 100 * l + '%,' + a + ')';
}


var svg;

function buildViz(results, color) {
  var hue = 229;
  color = color || '#DDDDDD';
  console.log('buildViz', results.length);
  var w = window.innerWidth;
  var h = Math.min(window.innerHeight - 360, 500);


  d3.select('#sidebar').style('height', h + 'px');

  var longitude = d3.scale.linear().domain([-20, 30]).range([0, w]);
  var latitude = d3.scale.linear().domain([65, 30]).range([0, h]);

  results.forEach(function(org) {
    org.x = longitude(org.long.value);
    org.y = latitude(org.lat.value);
  })

  if (!svg) {
    svg = d3.select('#mainViz')
              .append('svg')
              .attr('width', w)
              .attr('height', h);

    svg.append('rect')
      .attr('fill', '#FAFAFA')
      .attr('class', 'bg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', w)
      .attr('height', h);

  }

  var cities = [];
  var cityInfo = {};
  var orgTypes = [];

  results.forEach(function(org) {
    var type = org.org_type.value;
    var city = org.city.value;
    if (orgTypes.indexOf(type) == -1) orgTypes.push(type);
    if (!cityInfo[city]) {
      cityInfo[city] = { name: city, lat: 0, long:0, organizations: [] };
      cities.push(cityInfo[city]);
    }
    cityInfo[city].organizations.push(org);
    cityInfo[city].lat += Number(org.lat.value);
    cityInfo[city].long += Number(org.long.value);
  });

  cities.forEach(function(city) {
    city.lat /= city.organizations.length;
    city.long /= city.organizations.length;
    if (city.name == 'London') {

    }
    else {
      //city.lat = 9999;
    }
  });

  buildIsoLines(results, svg, longitude, latitude, color);

  var circles = svg.selectAll('circle.org').data(results)
    circles.enter()
      .append('circle')
      .attr('class', 'org')
      .attr('r', 0)

    circles
      .transition()
      .duration(300)
      .attr('cx', function(org) {
        var city = cityInfo[org.city.value];
        return longitude(city.long);
      })
      .attr('cy', function(org) {
        var city = cityInfo[org.city.value];
        return latitude(city.lat);
      })
      .attr('fill', function(org) {
        var typeIndex = orgTypes.indexOf(org.org_type.value);
        //return hsla(typeIndex/orgTypes.length*360 + 50, 0.8, 0.6, 0.12)
        //return hsla(hue, 0.52, 0.6, 0.29)
        //return '#7A92FD'
        return '#000000';
        //return color;
      })
      .attr('r', function(org) {
        var city = cityInfo[org.city.value];
        return 2 + Math.pow(city.organizations.length, 0.5);
      })

    circles.exit().transition().duration(300).attr('r', 0).remove()
  }

  //gen random points
  //triangulate
  //count number of nearby projects
  //grow circle accordingly

  //? uniform triangulation

  function buildIsoLines(results, svg, longitude, latitude, color) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var randomPoints;
    var numPoints = 4002;

    if (localStorage['randomPoints'] && localStorage['randomPoints'] != 'null') {
      randomPoints = JSON.parse(localStorage['randomPoints']);
      if (randomPoints.length != numPoints) {
        randomPoints = null;
      }
    }
    if (!randomPoints) {
      var d = 30;
      randomPoints = d3.range(0, numPoints).map(function(i) {
        return [ 200 + Math.random() * (w - 200), Math.random() * h, 1];
        //return [ 200 + (i % d)/d * (w - 200), Math.floor(i / d)/d * h, 1];
      });
      localStorage['randomPoints'] = JSON.stringify(randomPoints);
    }

    var minR = 100;
    var minR2 = minR * minR;

    randomPoints.forEach(function(p) {
      results.forEach(function(org) {
        var dx = p[0] - org.x;
        var dy = p[1] - org.y;
        if (dx*dx + dy*dy < minR2) {
          p[2]++;
        }
      })
    })

    var points = svg.selectAll('circle.triPoint').data(randomPoints);
    points.enter()
      .append('circle')
      .attr('class', 'triPoint')
      .style('fill', 'rgba(255,0,0,0.2)');

    points.exit().remove()

    points
      .attr('cx', function(d) { return d[0]; })
      .attr('cy', function(d) { return d[1]; })
      .attr('r', function(d) { return Math.pow(d[2], 0.7); })
      .style('display', 'none');

    var triangles = d3.geom.delaunay(randomPoints);
    var toArrayOfPoints = function(p) { return [p[0], p[1]]; };

    var linePoints = [];

    function sections(p1, p2, mod, p3) {
      var val1 = p1[2];
      var val2 = p2[2];
      var val3 = p3[2];
      if (val1 < val2) {
        var start = Math.ceil(val1 / mod) * mod;
        var dist = val2 - val1;
        var results = [];
        for(var v = start; v <= val2; v += mod) {
          var ratio = (val1 == val2) ? 0 : (v-val1)/(val2-val1);
          results.push({ value: v, ratio: ratio, point: [p1[0]+(p2[0]-p1[0])*ratio, p1[1]+(p2[1]-p1[1])*ratio] });
        }
        return results;
      }
      else {
        var start = Math.ceil(val2 / mod) * mod;
        var dist = val1 - val2;
        var results = [];
        for(var v = start; v <= val1; v += mod) {
          var ratio = (val1 == val2) ? 0 : 1.0-(v-val2)/(val1-val2);
          if (ratio == 0 && (val1 == val2 && val2 == val3)) continue;
          results.push({ value: v, ratio: ratio, point: [p1[0]+(p2[0]-p1[0])*ratio, p1[1]+(p2[1]-p1[1])*ratio] });
        }
        return results;
      }
    }

    function addLines(sections1, sections2) {
      for(var i=0; i<sections1.length; i++) {
        for(var j=0; j<sections2.length; j++) {
          if (sections1[i].value == sections2[j].value) {
            linePoints.push([sections1[i].point, sections2[j].point, sections2[j].value])
          }
        }
      }
    }

    triangles.forEach(function(triangle, triangeIndex) {
      var p0 = triangle[0];
      var p1 = triangle[1];
      var p2 = triangle[2];
      //if (triangeIndex % 21 == 0) {
        //linePoints.push([p0, p1]);
        //console.log('triangeIndex', triangeIndex);
        //if (triangeIndex != 21 ) return;
        //if (triangeIndex != 168 ) return;
        var sections0 = sections(p0, p1, 3, p2);
        var sections1 = sections(p0, p2, 3, p1);
        var sections2 = sections(p1, p2, 3, p0);
        addLines(sections0, sections1);
        addLines(sections0, sections2);
        addLines(sections1, sections2);
      //}
      //var sections = 
    })

    svg.selectAll("g.edgeLine").remove();
    var path = svg.append("g").attr("class", 'edgeLine').selectAll("path.edgeLine");
    path = path.data(triangles.map(function(d) { 
      return "M" + d.map(toArrayOfPoints).join("L") + "Z"; 
    }), String);
    path.exit().remove();
    path.enter().append("path").attr("d", String);
    path.style('stroke', 'rgba(255,0,0,0.1)')
    path.style('fill', 'none');
    path.style('display', 'none');

    svg.selectAll("g.isoLine").remove();
    var path = svg.append("g").attr("class", 'isoLine').selectAll("path.isoLine");
    path = path.data(linePoints.map(function(d) { 
      return {
      data: "M" + toArrayOfPoints(d).join("L") + "",
      value: d[2]
    }; }));
    path.exit().remove();
    path.enter()
      .append("path")
      .attr('stroke', function(d) { return hsla(1, 0.52, 0.6, 0.029 + d.value/100) })
      //.attr('stroke', function(d) { return hsla(hue, 0.52, 0.6, 0.29) })
      .attr('stroke', color)
      //.attr('stroke-width', function(d) { return 10.0-Math.sqrt(d.value)})
      //.attr('stroke-width', 1)
      .attr("d", function(d) { return d.data });
    path.style('fill', 'none');
  }

  function filter(dsiArea, color) {
    console.log('filter', dsiArea, color)
    buildViz(allResults.filter(function(org) {
      return org.dsiAreas.indexOf(dsiArea) !== -1;
    }), color);
  }

  return init;
})();