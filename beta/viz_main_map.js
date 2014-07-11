/*global window, localStorage, d3, $, Q, L, fn, SPARQLDataSource, VizConfig */

var MainMap = (function() {

// function hsla(h, s, l, a) {
//   return 'hsla(' + h + ',' + 100 * s + '%,' + 100 * l + '%,' + a + ')';
// }

function resultValuesToObj(result) {
  var o = {};
  var prop;
  for (prop in result) {
    if (result.hasOwnProperty(prop)) {
      o[prop] = result[prop].value;
    }
  }
  return o;
}

function MainMap(mainVizContainer) {
  this.DOM = {};
  this.mainVizContainer = mainVizContainer;
  this.init();
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
        this.preloader.fadeOut('slow');
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

MainMap.prototype.initSVG = function() {
  this.w = window.innerWidth;
  this.h = window.innerHeight - 360;
  this.h = Math.min(this.h, 500);
  this.h = Math.max(300, this.h);

  this.DOM.map = d3.select(this.mainVizContainer)
    .append('div')
    .attr('id', 'map');

  // for some strange reason can't set this width d3.style()
  $('#map').css({ 'width': this.w, 'height': this.h });

  var scale  = 4;
  var center = [50, -17];
  this.showWorldMap(center, scale);

  this.DOM.svg = d3.select("#map")
    .select("svg")
    .append("g")
    .attr("class", "viz");

  this.defaultViewBox = d3.select("#map").select("svg").attr("viewBox").split(" ").map(function(v) { return +v; });
};

MainMap.prototype.hijackSearch = function() {
  $('#q').parent().submit(function(e) {
    var searchTerm = $('#q').val();
    $('#q').val('');

    var foundOrgs = this.organisations.filter(function(org) {
      return org.label.toLowerCase().indexOf(searchTerm) !== -1;
    });

    if (foundOrgs.length > 0) {
      this.showNetwork(foundOrgs[0].org);
    }

    $('#q').hide();
    e.preventDefault();
    return false;
  }.bind(this));
};

MainMap.prototype.getOrganisations = function() {
  var deferred = Q.defer();
  this.runOrganisationsQuery().then(function(results) {
    var organisations = results.map(resultValuesToObj);
    deferred.resolve(organisations);
  });
  return deferred.promise;
};

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
          if (!collaborations.byProject[project]) {
            collaborations.byProject[project] = [];
          }
          collaborations.byProject[project].push(org);

          if (!collaborations.byOrganisation[org]) {
            collaborations.byOrganisation[org] = [];
          }
          collaborations.byOrganisation[org].push(project);
        });
        deferred.resolve(collaborations);
      });
    });
    this.collaorationsPromise = deferred.promise;
  }

  return this.collaorationsPromise;
};

MainMap.prototype.getProjectsInfo = function(collaborations) {
  var deferred = Q.defer();
  this.runProjectsInfoQuery().then(function(results) {
    var projects = results.map(function(p) {
      return {
        p: p.p.value,
        label: p.label_values.value,
        technologyFocus: p.tf_values.value.split(',').map(function(f) { return f.substr(f.lastIndexOf('/')+1); }),
        areaOfDigitalSocialInnovation: p.adsi_values.value.split(',').map(function(f) { return f.substr(f.lastIndexOf('/')+1); })
      };
    });

    projects.forEach(function(project) {
      var orgs = collaborations.byProject[project.p] || [];
      //if (Math.random() > 0.99) console.log(project.p)
      orgs.forEach(function(orgId) {
        //if (Math.random() > 0.99) console.log(orgId)
        var org = this.organisationsById[orgId];
        if (!org) {
          return;
        }
        if (!org.projects) {
          org.projects = [];
        }
        if (!org.technologyFocus) {
          org.technologyFocus = [];
        }
        if (!org.areaOfDigitalSocialInnovation) {
          org.areaOfDigitalSocialInnovation = [];
        }
        org.projects.push(project);
        project.technologyFocus.forEach(function(technologyFocus) {
          if (org.technologyFocus.indexOf(technologyFocus) === -1) {
            org.technologyFocus.push(technologyFocus);
          }
        });
        project.areaOfDigitalSocialInnovation.forEach(function(areaOfDigitalSocialInnovation) {
          if (org.areaOfDigitalSocialInnovation.indexOf(areaOfDigitalSocialInnovation) === -1) {
            org.areaOfDigitalSocialInnovation.push(areaOfDigitalSocialInnovation);
          }
        });
      }.bind(this));
    }.bind(this));
    //projects
    //console.log('collaborations', collaborations)

    deferred.resolve(projects);
  }.bind(this));
  return deferred.promise;
};

MainMap.prototype.runOrganisationsQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('geo:', '<http://www.w3.org/2003/01/geo/wgs84_pos#>')
    .prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?org ?label ?lon ?lat ?country ?city ?street ?org_type ?tf ?activity ?activity_label')
    .where('?org', 'a', 'o:Organization')
    //.where('?org', 'ds:organizationType', '?org_type')
    .where('?org', 'rdfs:label', '?label')
    .where('?org', 'o:hasPrimarySite', '?org_site')
    .where('?org_site', 'geo:long', '?lon')
    .where('?org_site', 'geo:lat', '?lat')
    .where('?org_site', 'o:siteAddress', '?org_address')
    .where('?org_address', 'vcard:country-name', '?country')
    .where('?org_address', 'vcard:street-address', '?street')
    .where('?org_address', 'vcard:locality', '?city')
    //.where("?am", "a", "ds:ActivityMembership")
    //.where("?am", "ds:organization", "?org")
    //.where("?am", "ds:activity", "?activity")
    //.where("?activity", "rdfs:label", "?activity_label")
    //.where("?activity", "ds:technologyMethod", "?tm")
    //  .where("?activity", "ds:technologyFocus", "?tf")
    .execute();
};

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
};

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
};

MainMap.prototype.buildViz = function() {
  var svg = this.DOM.svg;

  this.DOM.g = svg.append('g');
  this.DOM.mapGroup = this.DOM.g.append('g');
  this.DOM.networkGroup = this.DOM.g.append('g').attr("class", "network");
  this.DOM.orgGroup = this.DOM.g.append('g');

  this.organisationsById = this.organisations.reduce(function(memo, org) {
    org.LatLng = new L.LatLng(org.lat, org.lon);
    memo[org.org] = org;

    return memo;
  }, {});

  this.showOrganisations();
  VizConfig.events.addEventListener('filter', function() {
    this.showOrganisations;
    this.updateCaseStudiesTitle();
  }.bind(this));

  //this.showIsoLines(svg, this.DOM.g, organisations, w, h, zoom);
};

MainMap.prototype.showWorldMap = function(center, scale) {
  var mapLayerStr = "http://b.tiles.mapbox.com/v3/swirrl.ikeb7gn0/{z}/{x}/{y}.png";

  this.map = L.map('map', {
    center: new L.LatLng(center[0], center[1]),
    zoom: scale,
    inertia: false,
    bounceAtZoomLimits: false,
    zoomControl: false,
    layers: [ new L.TileLayer(mapLayerStr, { maxZoom: 16, minZoom: 3 }) ]
  });

  this.map.addControl(new L.control.zoom({ position: 'topright' }));
  this.map._initPathRoot(); // adds svg layer to leaflet

  this.map.on("viewreset", function() {
    VizConfig.popup.close();
    this.updateTranslation();
  }.bind(this));

  this.map.on("click", function() {
    VizConfig.popup.close();
    // this.hideNetworks();
  }.bind(this));

  this.map.on("movestart", function() {
    VizConfig.popup.close();
  });
};

MainMap.prototype.filterOrganisations = function() {
  var filteredOrganisations = this.organisations;
  var color = '#000000';

  var filters = VizConfig.vizKey.getActiveFilters();
  var numAreasOfDsi = filters.reduce(function(sum, filter) { return sum + ((filter.property === 'areaOfDigitalSocialInnovation') ? 1 : 0); }, 0);

  filters.forEach(function(filter) {
    filteredOrganisations = filteredOrganisations.filter(function(org) {
      var value = org[filter.property] || '';
      return value.indexOf(filter.id) !== -1;
    });

    if (filter.property === 'areaOfDigitalSocialInnovation' && numAreasOfDsi == 1) {
      color = VizConfig.dsiAreasById[filter.id].color;
    }
  });

  return {
    organisations: filteredOrganisations,
    color: color
  };
};

MainMap.prototype.clusterOrganisations = function(organisations) {
  var groupingDist = 30;
  var iterations = 0, maxIterations = 2;
  var finishedClustering = false;

  var currentZoom = this.map.getZoom();
  var clusterByCountry = currentZoom < 7;
  var clusterByDistance = 7 <= currentZoom && currentZoom < 13;

  var calcDist = function(a, b) {
    var xd = (b.x - a.x);
    var yd = (b.y - a.y);
    return Math.sqrt(xd * xd + yd * yd);
  };

  var calcCenter = function(arr) {
    var avg = arr.reduce(function(memo, o) {
      memo.x += o.x;
      memo.y += o.y;
      return memo;
    }, { x: 0, y: 0 });

    avg.x /= arr.length;
    avg.y /= arr.length;

    return avg;
  };

  var indexOfProp = function(data, prop, val) {
    return data.map(function(o) { return o[prop]; }).indexOf(val);
  };

  var clusters = organisations.map(function(org) {
    var pos = this.map.latLngToLayerPoint(org.LatLng);

    org.x = pos.x;
    org.y = pos.y;

    return { center: pos, organisations: [ org ] };
  }.bind(this));

  if (clusterByCountry) {
    clusters = clusters.reduce(function(memo, cluster) {
      var org = cluster.organisations[0];
      var index = indexOfProp(memo, "country", org.country);

      if (index < 0) {
        memo.push({ country: org.country, organisations: [ org ] });
      }
      else {
        memo[index].organisations.push(org);
      }

      return memo;
    }, []).map(function(cluster) {
      cluster.center = calcCenter(cluster.organisations);
      return cluster;
    });
  }
  else if (clusterByDistance) {
    while (!finishedClustering && iterations < maxIterations) {
      finishedClustering = true;
      iterations++;

      clusters = clusters.filter(function(cluster){
        return cluster.organisations.length > 0;
      }).map(function(cluster) {
        cluster.center = calcCenter(cluster.organisations);
        return cluster;
      });

      clusters.forEach(function(cluster1, clusterIndex1) {
        clusters.forEach(function(cluster2, clusterIndex2) {
          if (clusterIndex1 !== clusterIndex2) {
            cluster2.organisations = cluster2.organisations.filter(function(org) {
              var shouldKeep = true;

              if (calcDist(cluster1.center, org) < groupingDist) {
                cluster1.organisations.push(org);
                finishedClustering = false;
                shouldKeep = false;
              }

              return shouldKeep;
            });
          }
        });
      });
    }
  }

  return clusters;
};

MainMap.prototype.connectOrgByIdWithClusters = function() {
  var org, pos, found, filtered, orgCluster;

  for (org in this.organisationsById) {
    if (this.organisationsById.hasOwnProperty(org)) {
      pos = this.map.latLngToLayerPoint(this.organisationsById[org].LatLng);
      this.organisationsById[org].x = pos.x;
      this.organisationsById[org].y = pos.y;

      orgCluster = this.clusters.reduce(function(memo, cluster) {
        found = false;

        if (!memo) {
          filtered = cluster.organisations.filter(function(clusterOrg) {
            return (clusterOrg.org === org);
          });

          found = (filtered.length === 1);
        }

        if (found) { memo = cluster; }

        return memo;
      }, null);

      if (orgCluster) {
        this.organisationsById[org].center = orgCluster.center;
      }
    }
  }
};

MainMap.prototype.updateCaseStudiesTitle = function() {
  var filters = VizConfig.vizKey.getActiveFilters();
  var title = VizConfig.text.caseStudiesTitle;
  if (filters.length > 0) {
    title += ' from ';
    title += filters.map(function(filter) {
      if (filter.property == 'areaOfDigitalSocialInnovation') return VizConfig.dsiAreasById[filter.id].title.replace('<br/>', '');
      if (filter.property == 'technologyFocus') return VizConfig.technologyFocusesById[filter.id].title;
    }).join(', ');
    d3.select('#caseStudiesTitle').text(title);
  }
}

MainMap.prototype.showOrganisations = function() {
  var filteredOrganisations = this.filterOrganisations();
  this.clusters = this.clusterOrganisations(filteredOrganisations.organisations);
  var color = filteredOrganisations.color;

  var hexDisplayZoom = 10;
  var data;
  var clusters, hexes;

  if (this.map.getZoom() >= hexDisplayZoom) {
    data = this.clusters.reduce(function(memo, cluster) {
      if (cluster.organisations.length > 1) {
        memo.circles.push(cluster);
      }
      else if (cluster.organisations[0]) {
        memo.hexes.push(cluster);
      }

      return memo;
    }, { hexes: [], circles: [] });
  }
  else {
    data = { hexes: [], circles: this.clusters };
  }

  var drawClusters = function() {
    clusters = this.DOM.orgGroup
      .selectAll('g.org')
      .data(data.circles);

    var groupEnter = clusters
      .enter()
      .append('g')
      .attr('class', 'org')
      .attr('transform', function(d) {
        return "translate(" + d.center.x + "," + d.center.y + ")";
      });

    groupEnter
      .append('circle')
      .attr('r', 0);

    groupEnter
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dx', 0)
      .attr('dy', 3)
      .attr('font-size', '11px')
      .text('');

    clusters.selectAll('text').attr('fill', (color == '#000000') ? '#FFF' : '#000')

    var groupTransform = clusters
      .attr('transform', function(d) {
        return "translate(" + d.center.x + "," + d.center.y + ")";
      });

    groupTransform
      .select("circle")
      .transition()
      .duration(300)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('opacity', 0.75)
      .attr('r', function(d) {
        return d.organisations.length > 1 ? 12 + Math.sqrt(d.organisations.length) : 5;
      });

    groupTransform
      .select("text")
      .transition()
      .text(function(d) {
        return d.organisations.length > 1 ? d.organisations.length : '';
      });

    var groupExit = clusters.exit();

    groupExit
      .select('circle')
      .transition()
      .duration(300)
      .attr('r', 0);

    groupExit
      .select('text')
      .transition()
      .duration(300)
      .attr("opacity", 0);

    groupExit
      .transition()
      .duration(300)
      .remove();
  };

  var drawHexes = function() {
    var hexR = 20;
    var drawHex = this.drawHex;

    var countDataForHex = function(data) {
      return data.projects ? data.projects.reduce(function(memo, project) {
        project.areaOfDigitalSocialInnovation.forEach(function(area) {
          if (memo[area]) {
            memo[area]++;
          }
          else {
            memo[area] = 1;
          }
        });
        return memo;
      }, {}) : null;
    };

    this.DOM.orgGroup.selectAll('g.hex').remove();

    hexes = this.DOM.orgGroup
      .selectAll('g.hex')
      .data(data.hexes.map(function(hex) {
        var org = hex.organisations[0]
        return {
          organisations: hex.organisations,
          r: hexR,
          x: org.x,
          y: org.y,
          center: { x: org.x, y: org.y },
          counts: countDataForHex(hex.organisations[0])
        };
      }));

    hexes.enter()
      .append('g')
      .attr('class', 'hex')
      .each(function(d) {
        drawHex(d3.select(this), d);
      });

    hexes.exit().remove();
  };

  var handleMouse = function(selection) {
    selection.on('click', function(cluster) {
      d3.event.preventDefault();
      d3.event.stopPropagation();

      this.hideNetworks();

      var maxOrgCount = 3;
      var cutOrganisationsCount = cluster.organisations.length > maxOrgCount;
      var organisations = cluster.organisations;

      if (cutOrganisationsCount) {
        organisations = organisations.slice(0, maxOrgCount);
      }

      var popupHTML = organisations.map(function(organization) {
        this.showNetwork(organization.org);

        var url = 'http://digitalsocial.eu/organisations/';
        url += organization.org.substr(organization.org.lastIndexOf('/') + 1);
        var popupContent = '<h4><a href="' + url + '">'+organization.label+'</a></h4>';
        popupContent += '<span>' + organization.street + ", " + organization.city + ", " + organization.country + '</span>';

        if (organization.projects) {
          popupContent += 'Projects:';

          organization.projects.forEach(function(project) {
            var projectUrl = 'http://digitalsocial.eu/projects/' + project.p.substr(project.p.lastIndexOf('/')+1);
            popupContent += '<a href="' + projectUrl + '">'+project.label+'</a>';
          });
        }

        return popupContent;
      }.bind(this)).join("<br/>");

      if (cutOrganisationsCount) {
        popupHTML += "<br/><div style='text-align:center'>...</div>";
      }

      VizConfig.popup.html($(popupHTML));

      var windowOffset = $("#map").offset();
      var viewBox = d3.select("#map").select("svg").attr("viewBox").split(" ").map(function(v) { return +v; });

      var dx = windowOffset.left + this.defaultViewBox[0] - viewBox[0];
      var dy = windowOffset.top + this.defaultViewBox[1] - viewBox[1];

      VizConfig.popup.open(cluster.center.x, cluster.center.y - 8, dx, dy);
    }.bind(this));

    selection.on('mouseover', function(cluster) {
      VizConfig.tooltip.show();

      var maxOrgCount = 6;
      var cutOrganisationsCount = cluster.organisations.length > maxOrgCount;
      var organisations = cluster.organisations;

      if (cutOrganisationsCount) {
        organisations = organisations.slice(0, maxOrgCount);
      }

      var html = organisations.map(function(o) { return o.label; }).join("<br/>");

      if (cutOrganisationsCount) {
        html += "<br/>...";
      }

      VizConfig.tooltip.html(html);
    }.bind(this));

    selection.on('mouseout', function() {
      VizConfig.tooltip.hide();
    }.bind(this));
  }

  drawClusters.call(this);
  drawHexes.call(this);

  handleMouse.call(this, clusters);
  handleMouse.call(this, hexes);
};

MainMap.prototype.drawHex = function(selection, data) {
  var hexBite = function(x, y, r, i) {
    var a = i/6 * Math.PI * 2 + Math.PI/6;
    var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
    return [
      [x, y],
      [x + r * Math.cos(a), y + r * Math.sin(a)],
      [x + r * Math.cos(na), y + r * Math.sin(na)]
    ];
  };

  var hex = selection.append("g").attr("class", "hex");

  fn.sequence(0, 6).forEach(function(i) {
    var bite = hex.append("path");

    bite
      .attr("d", function() {
        return "M" + hexBite(data.x, data.y, data.r, i).join("L") + "Z";
      })
      .attr("stroke", "#666")
      .attr("fill", "#FFF");
  }.bind(this));

  // fill hex only if data is passed
  if (data.counts) {
    fn.sequence(0, 6).forEach(function(i) {
      var dsiArea = VizConfig.dsiAreas[i].id;
      var bite = hex.append("path");

      bite
        .attr("d", function() {
          return "M" + hexBite(
            data.x,
            data.y,
            5 + Math.min(data.r - 5, Math.pow(data.counts[dsiArea], 0.6)) || 1,
            i
          ).join("L") + "Z";
        })
        .attr("fill", VizConfig.dsiAreas[i].color);
    }.bind(this));
  }
};

MainMap.prototype.updateTranslation = function() {
  // unfortunately no other way to update clustered organisations
  this.DOM.orgGroup.selectAll('circle.org').remove();
  this.showOrganisations(this.organisations);

  // update orgbyid
  this.connectOrgByIdWithClusters();

  var getPos = function(org) {
    org = this.organisationsById[org];

    return {
      x: org.center ? org.center.x : org.x,
      y: org.center ? org.center.y : org.y
    };
  }.bind(this);

  // update lines
  this.DOM.networkGroup.selectAll('line')
    .attr('x1', function(d) { return getPos(d.org).x; })
    .attr('y1', function(d) { return getPos(d.org).y; })
    .attr('x2', function(d) { return getPos(d.collab).x; })
    .attr('y2', function(d) { return getPos(d.collab).y; });
};

MainMap.prototype.showNetwork = function(org, limit) {
  this.getCollaborations().then(function(collaborations) {
    var projects = collaborations.byOrganisation[org];
    var collaborators = [];

    if (!projects) {
      return;
    }

    projects.forEach(function(project) {
      collaborations.byProject[project].forEach(function(member) {
        if (member === org) {
          return;
        }

        if (collaborators.indexOf('member') === -1) {
          collaborators.push(member);
        }
      });
    });

    var ns = 'org';

    if (limit) {
      collaborators = collaborators.filter(function(c) {
        return limit.indexOf(c) !== -1;
      });
      ns += limit.indexOf(org);
    }

    collaborators = collaborators.map(function(collaborator) {
      return { org: org, collab: collaborator };
    });

    this.connectOrgByIdWithClusters();

    var getPos = function(org) {
      org = this.organisationsById[org];

      return {
        x: org.center ? org.center.x : org.x,
        y: org.center ? org.center.y : org.y
      };
    }.bind(this);

    var networkPaths = this.DOM.networkGroup.selectAll('line.network.' + ns).data(collaborators);
    networkPaths.enter()
      .append('line')
      .attr('class', 'network ' + ns)
      .attr('x1', function(d) { return getPos(d.org).x; })
      .attr('y1', function(d) { return getPos(d.org).y; })
      .attr('x2', function(d) { return getPos(d.collab).x; })
      .attr('y2', function(d) { return getPos(d.collab).y; })
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('opacity', limit ? 0.05 : 1);

    networkPaths.exit().remove();

    if (!limit) {
      collaborators.forEach(function(org_collab) {
        this.showNetwork(org_collab, collaborators);
      }.bind(this));
    }
  }.bind(this));
};

MainMap.prototype.hideNetworks = function() {
  this.DOM.networkGroup.selectAll("line").remove();
};

// MainMap.prototype.showIsoLines = function(svg, g, organisations, w, h, zoom) {
//   var randomPoints;
//   var numPoints = 4002;

//   var color = hsla(0, 0, 0, 0.2);

//   if (localStorage['randomPoints'] && localStorage['randomPoints'] !== 'null') {
//     randomPoints = JSON.parse(localStorage['randomPoints']);
//     if (randomPoints.length !== numPoints) {
//       randomPoints = null;
//     }
//   }
//   if (!randomPoints) {
//     var d = 30;
//     randomPoints = d3.range(0, numPoints).map(function() {
//       return [ Math.random() * w, Math.random() * h, 1];
//       //return [ 200 + (i % d)/d * (w - 200), Math.floor(i / d)/d * h, 1];
//     });
//     localStorage['randomPoints'] = JSON.stringify(randomPoints);
//   }

//   var minR = 30;
//   var minR2 = minR * minR;

//   randomPoints.forEach(function(p) {
//     organisations.forEach(function(org) {
//       var dx = p[0] - org.x;
//       var dy = p[1] - org.y;
//       if (dx*dx + dy*dy < minR2) {
//         p[2]++;
//       }
//     });
//   });

//   /*
//   //Debug circles
//   var points = g.selectAll('circle.triPoint').data(randomPoints);
//   points.enter()
//     .append('circle')
//     .attr('class', 'triPoint')
//     //.style('fill', 'rgba(255,0,0,0.2)');
//     .style('fill', 'none')
//     .style('stroke', 'rgba(255,0,0,0.2)');

//   points.exit().remove()

//   points
//     .attr('cx', function(d) { return d[0]; })
//     .attr('cy', function(d) { return d[1]; })
//     //.attr('r', function(d) { return Math.pow(d[2], 0.47); })
//     .attr('r', minR)
//     //.style('display', 'none');
//   */

//   var triangles = d3.geom.delaunay(randomPoints);
//   var toArrayOfPoints = function(p) { return [p[0], p[1]]; };

//   var linePoints = [];

//   function sections(p1, p2, mod, p3) {
//     var val1 = p1[2];
//     var val2 = p2[2];
//     var val3 = p3[2];
//     if (val1 < val2) {
//       var start = Math.ceil(val1 / mod) * mod;
//       var dist = val2 - val1;
//       var results = [];
//       var v, ratio;
//       for(v = start; v <= val2; v += mod) {
//         ratio = (val1 === val2) ? 0 : (v-val1)/(val2-val1);
//         results.push({ value: v, ratio: ratio, point: [p1[0]+(p2[0]-p1[0])*ratio, p1[1]+(p2[1]-p1[1])*ratio] });
//       }
//       return results;
//     }
//     else {
//       var start = Math.ceil(val2 / mod) * mod;
//       var dist = val1 - val2;
//       var results = [];
//       for(var v = start; v <= val1; v += mod) {
//         var ratio = (val1 == val2) ? 0 : 1.0-(v-val2)/(val1-val2);
//         if (ratio == 0 && (val1 == val2 && val2 == val3)) continue;
//         results.push({ value: v, ratio: ratio, point: [p1[0]+(p2[0]-p1[0])*ratio, p1[1]+(p2[1]-p1[1])*ratio] });
//       }
//       return results;
//     }
//   }

//   function addLines(sections1, sections2) {
//     for(var i=0; i<sections1.length; i++) {
//       for(var j=0; j<sections2.length; j++) {
//         if (sections1[i].value == sections2[j].value) {
//           linePoints.push([sections1[i].point, sections2[j].point, sections2[j].value])
//         }
//       }
//     }
//   }

//   triangles.forEach(function(triangle, triangeIndex) {
//     var p0 = triangle[0];
//     var p1 = triangle[1];
//     var p2 = triangle[2];
//     var sections0 = sections(p0, p1, 10, p2);
//     var sections1 = sections(p0, p2, 10, p1);
//     var sections2 = sections(p1, p2, 10, p0);
//     addLines(sections0, sections1);
//     addLines(sections0, sections2);
//     addLines(sections1, sections2);
//   })

//   g.selectAll("g.isoLine").remove();
//   var path = g.append("g").attr("class", 'isoLine').selectAll("path.isoLine");
//   path = path.data(linePoints.map(function(d) {
//     return {
//       data: "M" + toArrayOfPoints(d).join("L") + "",
//       value: d[2]
//     };
//   }));
//   path.exit().remove();
//   path.enter()
//     .append("path")
//     .attr('stroke', color)
//     .attr("d", function(d) { return d.data });
//   path.style('fill', 'none');

//   zoom.on('zoom.isolines', function() {
//     path.attr('stroke-width', function() {
//       return 2 /  d3.event.scale;
//     })
//   });
// }


return MainMap;

}());
