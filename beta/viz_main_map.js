var MainMap = (function() {

function hsla(h, s, l, a) {
  return 'hsla(' + h + ',' + 100 * s + '%,' + 100 * l + '%,' + a + ')';
}

function resultValuesToObj(result) {
  var o = {};
  for (var prop in result) {
    o[prop] = result[prop].value;
  }
  return o;
}

function MainMap(mainVizContainer) {
  this.DOM = {};
  this.mainVizContainer = mainVizContainer;
  this.init();
}

MainMap.prototype.initSVG = function() {
  this.w = window.innerWidth;
  this.h = window.innerHeight - 360;
  this.h = Math.min(this.h, 500);
  this.h = Math.max(300, this.h);
  this.svg = d3.select(this.mainVizContainer)
    .append('svg')
    .attr('width', this.w)
    .attr('height', this.h);

  this.svg.append('rect')
    .attr('fill', '#808080')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', this.w)
    .attr('height', this.h);
}

MainMap.prototype.init = function() {
  this.initSVG();

  this.preloader = $('<img id="vizPreloader" src="'+VizConfig.assetsPath+'/preloader.gif"/>');
  $(this.mainVizContainer).append(this.preloader);

  this.getOrganisations().then(function(organisations) {

    this.organisations = organisations;
    this.buildViz(organisations);
    this.hijackSearch();

     //pre cache
    this.getCollaborations().then(function(collaborations) {
      this.getProjectsInfo(collaborations).then(function() {
        this.preloader.fadeOut('slow')
      }.bind(this));
    }.bind(this));
  }.bind(this));
}

MainMap.prototype.hijackSearch = function() {
  $('#q').parent().submit(function(e) {
    var searchTerm = $('#q').val();
    $('#q').val('');

    var foundOrgs = this.organisations.filter(function(org) {
      return org.label.toLowerCase().indexOf(searchTerm) != -1;
    });

    if (foundOrgs.length > 0) {
      this.showNetwork(foundOrgs[0].org);
    }

    $('#q').hide();
    e.preventDefault();
    return false;
  }.bind(this));
}

MainMap.prototype.getOrganisations = function() {
  var deferred = Q.defer();
  this.runOrganisationsQuery().then(function(results) {
    var organisations = results.map(resultValuesToObj);
    deferred.resolve(organisations);
  });
  return deferred.promise;
}

MainMap.prototype.getCollaborations = function() {
  if (!this.collaorationsPromise) {
    var deferred = Q.defer();
    var collaborations = {
      byProject: {},
      byOrganisation: {}
    };
    this.runCollaboratorsQuery().then(function(results) {
      results.forEach(function(c) {
        var org = c.org.value;
        var projects = c.activity_values.value.split(',');
        projects.forEach(function(project) {
          if (!collaborations.byProject[project]) collaborations.byProject[project] = [];
          collaborations.byProject[project].push(org);
          if (!collaborations.byOrganisation[org]) collaborations.byOrganisation[org] = [];
          collaborations.byOrganisation[org].push(project);
        });
        deferred.resolve(collaborations);
      })
    });
    this.collaorationsPromise = deferred.promise;
  }

  return this.collaorationsPromise;
}

MainMap.prototype.getProjectsInfo = function(collaborations) {
  var deferred = Q.defer();
  this.runProjectsInfoQuery().then(function(results) {
    var projects = results.map(function(p) {
      return {
        p: p.p.value,
        label: p.label_values.value,
        technologyFocus: p.tf_values.value.split(',').map(function(f) { return f.substr(f.lastIndexOf('/')+1); }),
        areaOfDigitalSocialInnovation: p.adsi_values.value.split(',').map(function(f) { return f.substr(f.lastIndexOf('/')+1); })
      }
    })

    projects.forEach(function(project) {
      var orgs = collaborations.byProject[project.p] || [];
      //if (Math.random() > 0.99) console.log(project.p)
      orgs.forEach(function(orgId) {
        //if (Math.random() > 0.99) console.log(orgId)
        var org = this.organisationsById[orgId];
        if (!org) {
          return;
        }
        if (!org.projects) org.projects = [];
        if (!org.technologyFocus) org.technologyFocus = [];
        if (!org.areaOfDigitalSocialInnovation) org.areaOfDigitalSocialInnovation = [];
        org.projects.push(project);
        project.technologyFocus.forEach(function(technologyFocus) {
          if (org.technologyFocus.indexOf(technologyFocus) == -1) {
            org.technologyFocus.push(technologyFocus);
          }
        })
        project.areaOfDigitalSocialInnovation.forEach(function(areaOfDigitalSocialInnovation) {
          if (org.areaOfDigitalSocialInnovation.indexOf(areaOfDigitalSocialInnovation) == -1) {
            org.areaOfDigitalSocialInnovation.push(areaOfDigitalSocialInnovation);
          }
        })
      }.bind(this))
    }.bind(this));
    //projects
    //console.log('collaborations', collaborations)

    deferred.resolve(projects);
  }.bind(this));
  return deferred.promise;
}

MainMap.prototype.runOrganisationsQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?org ?label ?lon ?lat ?country ?city ?org_type ?tf ?activity ?activity_label')
    .where('?org', 'a', 'o:Organization')
    //.where('?org', 'ds:organizationType', '?org_type')
    .where('?org', 'rdfs:label', '?label')
    .where('?org', 'o:hasPrimarySite', '?org_site')
    .where('?org_site', 'geo:long', '?lon')
    .where('?org_site', 'geo:lat', '?lat')
    //.where('?org_site', 'o:siteAddress', '?org_address')
    //.where('?org_address', 'vcard:country-name', '?country')
    //.where('?org_address', 'vcard:locality', '?city')
    //.where("?am", "a", "ds:ActivityMembership")
    //.where("?am", "ds:organization", "?org")
    //.where("?am", "ds:activity", "?activity")
    //.where("?activity", "rdfs:label", "?activity_label")
    //.where("?activity", "ds:technologyMethod", "?tm")
    //  .where("?activity", "ds:technologyFocus", "?tf")
    .execute();
}

MainMap.prototype.runCollaboratorsQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?org (group_concat(distinct ?activity ; separator = ",") AS ?activity_values)')
    .where('?org', 'a', 'o:Organization')
    .where("?am", "a", "ds:ActivityMembership")
    .where("?am", "ds:organization", "?org")
    .where("?am", "ds:activity", "?activity")
    .groupBy("?org")
    .execute();
}

MainMap.prototype.runProjectsInfoQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?p (group_concat(distinct ?label ; separator = ",") AS ?label_values) (group_concat(distinct ?adsi ; separator = ",") AS ?adsi_values) (group_concat(distinct ?tf ; separator = ",") AS ?tf_values)')
    .where('?p', 'a', 'ds:Activity')
    .where("?p", "ds:technologyFocus", "?tf")
    .where("?p", "rdfs:label", "?label")
    .where("?p", "ds:areaOfDigitalSocialInnovation", "?adsi")
    .groupBy("?p")
    .execute(false);
}

MainMap.prototype.buildViz = function(organisations) {
  var w = this.w;
  var h = this.h;
  var svg = this.svg;

  var scale  = 700;
  var offset = [w/2, h/2];
  var center = [10, 50];
  var projection = d3.geo.mercator()
    .scale(scale).center(center)
    .translate(offset);

  organisations.forEach(function(org) {
    var pos = projection([org.lon, org.lat]);
    org.x = pos[0];
    org.y = pos[1];
  });

  var organisationsById = {};
  organisations.forEach(function(org) {
    organisationsById[org.org] = org;
  });
  this.organisationsById = organisationsById;

  this.DOM.g = svg.append('g');
  this.DOM.mapGroup = this.DOM.g.append('g');
  this.DOM.networkGroup = this.DOM.g.append('g');
  this.DOM.orgGroup = this.DOM.g.append('g');

  var zoom = this.addZoom(svg, this.DOM.g, w, h);
  this.showWorldMap(svg, this.DOM.g, projection);
  this.showOrganisations(svg, this.DOM.g, projection, center, organisations, zoom);

  //console.log('org', organisations[0]);

  VizConfig.events.addEventListener('filter', function(e) {
    var filteredOrganisations = organisations.filter(function(o) {
      var value = o[e.property] || '';
      return value.indexOf(e.id) != -1;
    });
    var color = '#000000'
    if (e.property == 'areaOfDigitalSocialInnovation') {
      color = VizConfig.dsiAreasById[e.id].color;
    }
    this.showOrganisations(svg, this.DOM.g, projection, center, filteredOrganisations, zoom, color);
    //console.log(e, organisations.length, filteredOrganisations.length);
  }.bind(this))
  //this.showIsoLines(svg, this.DOM.g, organisations, w, h, zoom);
}

MainMap.prototype.addZoom = function(svg, g, w, h) {
  var rectSize = 30;
  var margin = 20;
  var spacing = 2;

  var zoomReset = svg.append('g');
  zoomReset.append('rect')
    .attr('fill', '#DDD')
    .attr('x', w - rectSize - margin)
    .attr('y', margin)
    .attr('width', rectSize)
    .attr('height', rectSize);
  zoomReset.append('circle')
    .attr('stroke', '#666')
    .attr('fill', 'none')
    .attr('cx', w - rectSize - margin + rectSize/2)
    .attr('cy', margin + rectSize/2)
    .attr('r', rectSize/4)
  zoomReset.append('circle')
    .attr('fill', '666')
    .attr('cx', w - rectSize - margin + rectSize/2)
    .attr('cy', margin + rectSize/2)
    .attr('r', 1)


  var zoomIn = svg.append('g');
  zoomIn.append('rect')
    .attr('fill', '#DDD')
    .attr('x', w - rectSize - margin)
    .attr('y', margin+ (rectSize + spacing)*1 + margin)
    .attr('width', rectSize)
    .attr('height', rectSize);

  zoomIn.append('text')
    .attr('fill', '#666')
    .text('+')
    .attr('x', w - rectSize*0.5 - margin)
    .attr('y', margin + (rectSize + spacing)*1 + rectSize*0.65 + margin)
    .attr('text-anchor', 'middle')

  var zoomOut = svg.append('g');
  zoomOut.append('rect')
    .attr('fill', '#DDD')
    .attr('x', w - rectSize - margin)
    .attr('y', margin + (rectSize + spacing)*2 + margin)
    .attr('width', rectSize)
    .attr('height', rectSize);
  zoomOut.append('text')
    .attr('fill', '#666')
    .text('-')
    .attr('x', w - rectSize*0.5 - margin)
    .attr('y', margin + (rectSize + spacing)*2 + rectSize*0.65 + margin)
    .attr('text-anchor', 'middle')

  var prevScale = 1;

  //can't make animations work at the moment
  function updateTransform(translate, scale, animate) {
    if (animate) {
      prevScale = scale;
      //g.transition().duration(200).attr('transform','translate('+translate.join(',')+')scale('+scale+')');
      g.attr('transform','translate('+translate.join(',')+')scale('+scale+')');
    }
    else {
      g.attr('transform','translate('+translate.join(',')+')scale('+scale+')');
    }

    //if (scale < 0.5) {
    //  zoom.scale(0.5);
    //  zoom.event(svg);
    //}
  }

  var zoom = d3.behavior.zoom().scaleExtent([1, 8192]).on('zoom', function() {
    updateTransform(d3.event.translate, d3.event.scale);
  });

  zoomReset.on('click', function(e) {
    d3.event.stopPropagation()
    d3.event.preventDefault();
    zoom.scale(1);
    zoom.translate([0, 0]);
    zoom.event(svg)
    return false;
  })

  zoomIn.on('click', function(e) {
    d3.event.stopPropagation()
    d3.event.preventDefault();
    var scale = 2;
    var newZoom = zoom.scale() * scale;
    if (newZoom > 2048) return;
    var newX = ((zoom.translate()[0] - (w / 2)) * scale) + w / 2;
    var newY = ((zoom.translate()[1] - (h / 2)) * scale) + h / 2;
    zoom.scale(newZoom);
    zoom.translate([newX, newY]);
    zoom.event(svg)
    return false;
  })

  zoomOut.on('click', function(e) {
    d3.event.stopPropagation()
    d3.event.preventDefault();
    var scale = 1/2;
    var newZoom = zoom.scale() * scale;
    if (newZoom < 0.3) return;
    var newX = ((zoom.translate()[0] - (w / 2)) * scale) + w / 2;
    var newY = ((zoom.translate()[1] - (h / 2)) * scale) + h / 2;
    zoom.scale(newZoom);
    zoom.translate([newX, newY])
    zoom.event(svg);
    return false;
  })

  svg.call(zoom)
  svg
  //.on("mousewheel.zoom", null)
  //.on("DOMMouseScroll.zoom", null)
  //.on("wheel.zoom", null)
  .on("dblclick.zoom", null);

  return zoom;
}

MainMap.prototype.showWorldMap = function(svg, g, projection) {
  d3.json("assets/world-50m.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    var neighbors = topojson.neighbors(world.objects.countries.geometries);

    var path = d3.geo.path()
      .projection(projection);

    this.DOM.mapGroup.selectAll(".country")
      .data(countries)
      .enter().insert("path", ".graticule")
      .attr("class", "country")
      .attr("d", path)
      .attr("stroke", "none")
      .attr("fill", "#FFF");
  }.bind(this));
}

MainMap.prototype.showOrganisations = function(svg, g, projection, center, organisations, zoom, color) {
  var circles = this.DOM.orgGroup.selectAll('circle.org').data(organisations);

  color = color || '#000000';

  circles.enter()
    .append('circle')
    .attr('class', 'org')
    .attr('r', 2)
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('transform', function(d) {
      var pos = projection(center);
      return "translate(" + pos[0] + "," + pos[1] + ")"
    })

  circles
    .transition()
    .duration(300)
    .attr('transform', function(d) {
      return "translate(" + d.x + "," + d.y + ")"
    })
    //.attr('fill', 'rgba(0,20,0,0.1)')
    //.attr('stroke', 'rgba(0,20,0,0.3)')
    .attr('fill', color)
    .attr('stroke', color)
    .attr('opacity', 0.5)
    .attr('r', 3)

  circles.exit().transition().duration(300).attr('r', 0).remove();

  circles.on('click', function(organization) {
    this.showNetwork(organization.org);

    var url = 'http://digitalsocial.eu/organisations/';
    url += organization.org.substr(organization.org.lastIndexOf('/') + 1);
    var popupContent = '<h4><a href="' + url + '">'+organization.label+'</a></h4>Projects:';
    if (organization.projects) {
      organization.projects.forEach(function(project) {
        var url = 'http://digitalsocial.eu/projects/' + project.p.substr(project.p.lastIndexOf('/')+1);
        popupContent += '<a href="' + url + '">'+project.label+'</a>'
      })
    }
    VizConfig.popup.html($(popupContent));
    var windowOffset = $(svg[0]).offset();
    VizConfig.popup.open(organization.x, organization.y, windowOffset.left, windowOffset.top, zoom);
  }.bind(this));

  circles.on('mouseover', function(organization) {
    VizConfig.tooltip.show();
    VizConfig.tooltip.html(organization.label);
  }.bind(this));

  circles.on('mouseout', function(organization) {
    VizConfig.tooltip.hide();
  }.bind(this));

  zoom.on('zoom.circles', function() {
    var r = 3 * 1/d3.event.scale * Math.pow(d3.event.scale, 0.29);
    var strokeWidth = 1 / d3.event.scale;
    circles
      .attr('r', r)
      .attr('stroke-width', strokeWidth)
    g.selectAll('line.network').attr('stroke-width', 1/d3.event.scale);
  });

  var NESTA = "http://data.digitalsocial.eu/id/organization/eb70a18d-2f2b-62fd-76ca-5a33f71b9f50";

  //TODO: verify this is correct data

  //showNetwork(NESTA);
}

MainMap.prototype.showNetwork = function(org, limit) {
  this.getCollaborations().then(function(collaborations) {
    var projects = collaborations.byOrganisation[org];
    var collaborators = [];

    if (!projects) return;
    projects.forEach(function(project) {
      collaborations.byProject[project].forEach(function(member) {
        if (member == org) return;
        if (collaborators.indexOf('member') == -1) {
          collaborators.push(member);
        }
      })
    });

    var ns = 'org'
    if (limit) {
      collaborators = collaborators.filter(function(c) {
        return limit.indexOf(c) != -1;
      });
      ns += limit.indexOf(org);
    }
    else {
      this.DOM.networkGroup.selectAll('line.network').remove(); //remove existing
    }

    var networkPaths = this.DOM.networkGroup.selectAll('line.network.' + ns).data(collaborators);
    networkPaths.enter()
      .append('line')
      .attr('class', 'network ' + ns)
      .attr('x1', function() { return this.organisationsById[org].x; }.bind(this))
      .attr('y1', function() { return this.organisationsById[org].y; }.bind(this))
      .attr('x2', function(c) { return this.organisationsById[c].x; }.bind(this))
      .attr('y2', function(c) { return this.organisationsById[c].y; }.bind(this))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('opacity', limit ? 0.05 : 1)

    if (!limit) {
      collaborators.forEach(function(org_collab) {
        this.showNetwork(org_collab, collaborators)
      }.bind(this));
    }
  }.bind(this));
}

MainMap.prototype.showIsoLines = function(svg, g, organisations, w, h, zoom) {
  var randomPoints;
  var numPoints = 4002;

  var color = hsla(0, 0, 0, 0.2);

  if (localStorage['randomPoints'] && localStorage['randomPoints'] != 'null') {
    randomPoints = JSON.parse(localStorage['randomPoints']);
    if (randomPoints.length != numPoints) {
      randomPoints = null;
    }
  }
  if (!randomPoints) {
    var d = 30;
    randomPoints = d3.range(0, numPoints).map(function(i) {
      return [ Math.random() * w, Math.random() * h, 1];
      //return [ 200 + (i % d)/d * (w - 200), Math.floor(i / d)/d * h, 1];
    });
    localStorage['randomPoints'] = JSON.stringify(randomPoints);
  }

  var minR = 30;
  var minR2 = minR * minR;

  randomPoints.forEach(function(p) {
    organisations.forEach(function(org) {
      var dx = p[0] - org.x;
      var dy = p[1] - org.y;
      if (dx*dx + dy*dy < minR2) {
        p[2]++;
      }
    })
  })

  /*
  //Debug circles
  var points = g.selectAll('circle.triPoint').data(randomPoints);
  points.enter()
    .append('circle')
    .attr('class', 'triPoint')
    //.style('fill', 'rgba(255,0,0,0.2)');
    .style('fill', 'none')
    .style('stroke', 'rgba(255,0,0,0.2)');

  points.exit().remove()

  points
    .attr('cx', function(d) { return d[0]; })
    .attr('cy', function(d) { return d[1]; })
    //.attr('r', function(d) { return Math.pow(d[2], 0.47); })
    .attr('r', minR)
    //.style('display', 'none');
  */

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
    var sections0 = sections(p0, p1, 10, p2);
    var sections1 = sections(p0, p2, 10, p1);
    var sections2 = sections(p1, p2, 10, p0);
    addLines(sections0, sections1);
    addLines(sections0, sections2);
    addLines(sections1, sections2);
  })

  g.selectAll("g.isoLine").remove();
  var path = g.append("g").attr("class", 'isoLine').selectAll("path.isoLine");
  path = path.data(linePoints.map(function(d) {
    return {
      data: "M" + toArrayOfPoints(d).join("L") + "",
      value: d[2]
    };
  }));
  path.exit().remove();
  path.enter()
    .append("path")
    .attr('stroke', color)
    .attr("d", function(d) { return d.data });
  path.style('fill', 'none');

  zoom.on('zoom.isolines', function() {
    path.attr('stroke-width', function() {
      return 2 /  d3.event.scale;
    })
  });
}


return MainMap;

})();