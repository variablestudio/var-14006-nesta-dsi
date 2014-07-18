/*global window, localStorage, d3, $, Q, L, fn, SPARQLDataSource, VizConfig */

var MainMap = (function() {

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

function indexOfProp(data, prop, val) {
  return data.map(function(o) { return o[prop]; }).indexOf(val);
}

function MainMap(mainVizContainer) {
  this.DOM = {};
  this.mainVizContainer = mainVizContainer;
  this.selectedOrg = null;
  this.collaborators = null;
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
        this.showClusterNetwork(this.map.leaflet.getZoom());
        this.preloader.fadeOut('slow');
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

MainMap.prototype.initSVG = function() {
  this.w = window.innerWidth;
  this.h = VizConfig.initialMapHeight;

  this.DOM.map = d3.select(this.mainVizContainer)
    .append('div')
    .attr('id', 'map');

  // for some strange reason can't set this width d3.style()
  $('#map').css({ 'width': this.w, 'height': this.h });

  var scale  = 4;
  var center = [50, 7];
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
      var cluster = this.drawOrganisationHex(foundOrgs[0].org);
      this.selectedOrg = foundOrgs[0].org;
      this.showOrganisations(this.map.leaflet.getZoom());
      this.showClusterNetwork(this.map.leaflet.getZoom());
      if (cluster) { this.displayPopup(cluster); }
    }

    $('#q').hide();
    e.preventDefault();
    return false;
  }.bind(this));
};

MainMap.prototype.drawOrganisationHex = function(org) {
  if (org) {
    this.selectedOrg = org;
  }
  else if (this.selectedOrg) {
    org = this.selectedOrg;
  }

  var orgCluster;
  org = this.organisationsById[org];

  if (org) {
    orgCluster = {
      center: org.center || { x: org.x, y: org.y },
      organisations: [ org ]
    };

    var selectedHex = this.drawHexes(this.DOM.selectedHexGroup, [ orgCluster ], { fromCluster: true });
    this.handleMouse(selectedHex);
  }

  return orgCluster;
};

MainMap.prototype.hideOrganisationHex = function() {
  this.drawHexes(this.DOM.selectedHexGroup, [  ], { fromCluster: true });
};

MainMap.prototype.getOrganisations = function() {
  var deferred = Q.defer();
  this.runOrganisationsQuery().then(function(results) {
    var organisations = results.map(resultValuesToObj);

    var reduceOrgByProp = function(data, prop, newPropName) {
      return data.reduce(function(memo, org) {
        if (org[prop]) {
          org[prop] = org[prop].substr(org[prop].lastIndexOf('/') + 1);
        }

        var index = indexOfProp(memo, "org", org.org);

        if (index >= 0 && org[prop]) {
          if (memo[index][newPropName].indexOf(org[prop]) < 0) {
            memo[index][newPropName].push(org[prop]);
          }
        }
        else {
          if (org[prop]) {
            org[newPropName] = [ org[prop] ];
            delete org[prop];
          }

          memo.push(org);
        }

        return memo;
      }, []);
    };

    organisations = reduceOrgByProp(organisations, "org_type", "organisationType");
    organisations = reduceOrgByProp(organisations, "area_of_society", "areaOfSociety");

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
    var self = this;
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
        self.collaborations = collaborations;
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
      orgs.forEach(function(orgId) {
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
    .select('?org ?label ?lon ?lat ?country ?city ?street ?tf ?activity ?activity_label ?org_type ?area_of_society')
    .where('?org', 'a', 'o:Organization')
    .where('?org', 'ds:organizationType', '?org_type')
    .where('?org_type', 'rdfs:label', '?org_type_label')
    .where('?org', 'rdfs:label', '?label')
    .where('?org', 'o:hasPrimarySite', '?org_site')
    .where('?org_site', 'geo:long', '?lon')
    .where('?org_site', 'geo:lat', '?lat')
    .where('?org_site', 'o:siteAddress', '?org_address')
    .where('?org_address', 'vcard:country-name', '?country')
    .where('?org_address', 'vcard:street-address', '?street')
    .where('?org_address', 'vcard:locality', '?city')
    .where("?am", "a", "ds:ActivityMembership")
    .where("?am", "ds:organization", "?org")
    .where("?am", "ds:activity", "?activity")
    .where("?activity", "rdfs:label", "?activity_label")
    .where("?activity", "ds:areaOfSociety", "?area_of_society", { optional: true })
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
  this.DOM.networkGroup = this.DOM.g.append('g').attr("class", "network");
  this.DOM.orgGroup = this.DOM.g.append('g').attr("class", "orgs");
  this.DOM.hexGroup = this.DOM.g.append("g").attr("class", "hexes");
  this.DOM.selectedHexGroup = this.DOM.g.append("g").attr("class", "hexes-selected");

  this.organisationsById = this.organisations.reduce(function(memo, org) {
    org.LatLng = new L.LatLng(org.lat, org.lon);
    memo[org.org] = org;

    return memo;
  }, {});

  this.showOrganisations(this.map.leaflet.getZoom());

  VizConfig.events.addEventListener('filter', function() {
    this.selectedOrg = null;
    this.showOrganisations(this.map.leaflet.getZoom());
    this.showClusterNetwork(this.map.leaflet.getZoom());
    this.updateCaseStudiesTitle();
    this.hideOrganisationHex();
    VizConfig.popup.close();
  }.bind(this));
};

MainMap.prototype.showWorldMap = function(center, scale) {
  var continentLayer = new L.TileLayer("http://b.tiles.mapbox.com/v3/swirrl.ikeb7gn0/{z}/{x}/{y}.png", { maxZoom: 16, minZoom: 2 });
  var streetLayer = new L.TileLayer("http://a.tiles.mapbox.com/v3/swirrl.il8el3gj/{z}/{x}/{y}.png", { maxZoom: 16, minZoom: 2 });

  this.map = {
    leaflet: L.map('map', {
      center: new L.LatLng(center[0], center[1]),
      zoom: scale,
      inertia: false,
      bounceAtZoomLimits: false,
      zoomControl: false,
      layers: [ continentLayer ]
    }),
    fullscreeen: false
  };

  this.map.leaflet._initPathRoot(); // adds svg layer to leaflet

  this.map.leaflet.addControl(new L.control.customButton({
    title: 'Fullscreen',

    className: 'leaflet-fullscreen-button',

    click: function() {
      if (this.map.fullscreen) {
        $('#map').css({
          'height': this.h,
          'position': 'relative'
        });

        // ugly workarounds for fixed positioning / z-index
        $('.nav-bar .search').show();
        $('#caseStudiesViz').show();
      }
      else {
        $('#map').css({
          'height': window.innerHeight,
          'position': 'fixed',
          'top': 0,
          'left': 0
        });

        // ugly workarounds for fixed positioning / z-index
        $('.nav-bar .search').hide();
        $('#caseStudiesViz').hide();
      }

      this.map.leaflet.invalidateSize();
      this.map.fullscreen = !this.map.fullscreen;
    }.bind(this),

    mouseover: function() {
      VizConfig.tooltip.html("Fullscreen");
      VizConfig.tooltip.show();
    },

    mouseout: function() {
      VizConfig.tooltip.hide();
    }
  }));

  this.map.leaflet.addControl(new L.control.zoom({ position: 'topright' }));

  $(".leaflet-control-zoom-in").on("mouseover", function() {
    VizConfig.tooltip.html("Zoom In");
    VizConfig.tooltip.show();
  });

  $(".leaflet-control-zoom-in").on("mouseout", function() {
    VizConfig.tooltip.hide();
  });

  $(".leaflet-control-zoom-out").on("mouseover", function() {
    VizConfig.tooltip.html("Zoom Out");
    VizConfig.tooltip.show();
  });

  $(".leaflet-control-zoom-out").on("mouseout", function() {
    VizConfig.tooltip.hide();
  });

  this.map.leaflet.addControl(new L.control.customButton({
    title: 'Center',

    className: 'leaflet-center-button',

    click: function() {
      this.map.leaflet.setView(new L.LatLng(center[0], center[1]), scale);
    }.bind(this),

    mouseover: function() {
      VizConfig.tooltip.html("Center");
      VizConfig.tooltip.show();
    },

    mouseout: function() {
      VizConfig.tooltip.hide();
    }
  }));

  // map redraws including zoom
  this.map.leaflet.on("zoomstart", function() {
    VizConfig.popup.close();

    this.hideClusterNetwork();
    this.hideOrganisations();
  }.bind(this));

  this.map.leaflet.on("zoomend", function() {
    this.showOrganisations(this.map.leaflet.getZoom());
    this.showClusterNetwork(this.map.leaflet.getZoom());

    if (this.map.leaflet.getZoom() >= 7) {
      if (!this.map.leaflet.hasLayer(streetLayer)) {
        this.map.leaflet.addLayer(streetLayer);
        setTimeout(function() {
          this.map.leaflet.removeLayer(continentLayer);
        }.bind(this), 500);
      }
    }
    else {
      if (!this.map.leaflet.hasLayer(continentLayer)) {
        this.map.leaflet.addLayer(continentLayer);
        setTimeout(function() {
          this.map.leaflet.removeLayer(streetLayer);
        }.bind(this), 500);
      }
    }
  }.bind(this));

  this.map.leaflet.on("click", function() {
    VizConfig.popup.close();
  }.bind(this));

  this.map.leaflet.on("movestart", function() {
    VizConfig.popup.close();
  });
};

MainMap.prototype.filterOrganisations = function() {
  var deferred = Q.defer();
  var filteredOrganisations = this.organisations;
  var color = '#000000';

  var filters = VizConfig.vizKey.getActiveFilters();
  var numAreasOfDsi = filters.reduce(function(sum, filter) { return sum + ((filter.property === 'areaOfDigitalSocialInnovation') ? 1 : 0); }, 0);

  var collaborators = this.collaborations;
  if (this.selectedOrg && collaborators) {
    var orgProjects = collaborators.byOrganisation[this.selectedOrg];
    filteredOrganisations = filteredOrganisations.filter(function(org) {
      var found = false;
      var anotherOrgProjects = collaborators.byOrganisation[org.org];
      if (!anotherOrgProjects) {
        return false;
      }

      anotherOrgProjects.forEach(function(project) {
        if (orgProjects.indexOf(project) !== -1) { found = true; }
      });

      return found;
    }.bind(this));
  }

  filters.forEach(function(filter) {
    filteredOrganisations = filteredOrganisations.filter(function(org) {
      var value = org[filter.property] || '';
      return value.indexOf(filter.id) !== -1;
    });

    if (filter.property === 'areaOfDigitalSocialInnovation' && numAreasOfDsi === 1) {
      color = VizConfig.dsiAreasById[filter.id].color;
    }
  });

  deferred.resolve({
    organisations: filteredOrganisations,
    color: color
  });

  return deferred.promise;
};

MainMap.prototype.clusterOrganisations = function(organisations, zoom) {
  var groupingDist = 140;
  var iterations = 0, maxIterations = 2;
  var finishedClustering = false;

  var currentZoom = zoom;
  var clusterByCountry = 3 < currentZoom && currentZoom < 7;
  var clusterByDistance = (currentZoom <= 3) || (7 <= currentZoom && currentZoom < 15);

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

  var clusters = organisations.map(function(org) {
    var pos = this.map.leaflet.latLngToLayerPoint(org.LatLng);

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
    var calculateClusters = function(clusters) {
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

      return clusters;
    };

    var filterEmpty = function(clusters) {
      return clusters.filter(function(cluster){
        return cluster.organisations.length > 0;
      });
    };

    var updateCenters = function(clusters) {
      return clusters.map(function(cluster) {
        cluster.center = calcCenter(cluster.organisations);
        return cluster;
      });
    };

    while (!finishedClustering && iterations < maxIterations) {
      finishedClustering = true;
      iterations++;

      clusters = calculateClusters(clusters);
      clusters = filterEmpty(clusters);
      clusters = updateCenters(clusters);
    }
  }

  return clusters;
};

MainMap.prototype.updateOrgByIdPositions = function() {
  var org, pos, orgCluster;

  var findOrgInClusters = function(org, clusters) {
    var found;

    return clusters.reduce(function(memo, cluster) {
      found = false;

      if (!memo) {
        found = cluster.organisations.reduce(function(memo, clusterOrg) {
          if (!memo) { memo = (clusterOrg.org === org); }
          return memo;
        }, false);
      }

      if (found) { memo = cluster; }

      return memo;
    }, null);
  };

  for (org in this.organisationsById) {
    if (this.organisationsById.hasOwnProperty(org)) {
      pos = this.map.leaflet.latLngToLayerPoint(this.organisationsById[org].LatLng);
      this.organisationsById[org].x = pos.x;
      this.organisationsById[org].y = pos.y;

      orgCluster = findOrgInClusters(org, this.clusters);
      if (orgCluster) { this.organisationsById[org].center = orgCluster.center; }
    }
  }
};

MainMap.prototype.updateCaseStudiesTitle = function() {
  var filters = VizConfig.vizKey.getActiveFilters();
  var title = VizConfig.text.caseStudiesTitle;
  if (filters.length > 0) {
    title += ' from ';
    title += filters.map(function(filter) {
      if (filter.property === 'areaOfDigitalSocialInnovation') { return VizConfig.dsiAreasById[filter.id].title.replace('<br/>', ''); }
      if (filter.property === 'technologyFocus') { return VizConfig.technologyFocusesById[filter.id].title; }
    }).join(', ');
    d3.select('#caseStudiesTitle').text(title);
  }
};

MainMap.prototype.showOrganisations = function(zoom) {
  // in order to show organisations we need to update clusters, saving them globally for network drawing
  this.filterOrganisations().then(function(filteredOrganisations) {
    this.clusters = this.clusterOrganisations(filteredOrganisations.organisations, zoom);
    this.updateOrgByIdPositions();
    var color = filteredOrganisations.color;

    var hexDisplayZoom = 10;
    var data;

    if (zoom >= hexDisplayZoom) {
      data = this.clusters.reduce(function(memo, cluster) {
        if (cluster.organisations.length > 1) {
          memo.clusters.push(cluster);
        }
        else if (cluster.organisations[0]) {
          memo.hexes.push(cluster);
        }

        return memo;
      }, { hexes: [], clusters: [] });
    }
    else {
      data = { hexes: [], clusters: this.clusters };
    }

    // draw clusters and hexes
    var clusters = this.drawClusters(this.DOM.orgGroup, data.clusters, color);
    var hexes = this.drawHexes(this.DOM.hexGroup, data.hexes);

    // act on mouse
    this.handleMouse(clusters, { fromCluster: true });
    this.handleMouse(hexes);

    this.drawOrganisationHex();
  }.bind(this));
};

MainMap.prototype.hideOrganisations = function() {
  this.DOM.orgGroup.selectAll('g')
    .transition()
    .duration(200)
    .attr('opacity', 0);

  this.DOM.hexGroup.selectAll('g')
    .transition()
    .duration(200)
    .attr('opacity', 0);
};

MainMap.prototype.drawClusters = function(selection, data) {
  var clusters = selection
    .selectAll('g.org')
    .data(data);

  var groupEnter = clusters
    .enter()
    .append('g')
    .attr('class', 'org')
    .each(function(d) {
      d.iconScale = Math.max(12 - Math.sqrt(d.organisations.length), 7);
    })
    .attr('transform', function(d) {
      return "translate(" + d.center.x + "," + d.center.y + ")";
    })
    .attr('opacity', 0);

  groupEnter
    .append('svg:image')
    .attr('xlink:href', 'assets/drop-icon.png')
    .attr('width', function(d) {
      return 257 / d.iconScale;
    })
    .attr('height', function(d) {
      return 308 / d.iconScale;
    })
    .attr('x', function(d) {
      return -(257 / d.iconScale) / 2;
    })
    .attr('y', function(d) {
      return -(308 / d.iconScale);
    });

  groupEnter
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dx', 0)
    .attr('dy', function(d) {
      return -(154 / d.iconScale);
    })
    .attr('fill', '#000')
    .attr('font-size', '11px')
    .text('');

  var groupTransform = clusters
    .attr('transform', function(d) {
      return "translate(" + d.center.x + "," + d.center.y + ")";
    })
    .attr('opacity', 1);

  groupTransform
    .select("text")
    .transition()
    .text(function(d) {
      return d.organisations.length;
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

  return clusters;
};

MainMap.prototype.drawHexes = function(selection, data) {
  var hexR = 20;
  var drawHex = this.drawHex;
  var className = "hex-default";

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

  // remove all previous hexes
  selection.selectAll('g.' + className).remove();

  var hexes = selection
    .selectAll('g.' + className)
    .data(data.map(function(hex) {
      var org = hex.organisations[0];
      var orgCenter = org.center || { x: org.x, y: org.y };
      var pos = hex.center || orgCenter;

      return {
        organisations: hex.organisations,
        r: hexR,
        x: pos.x,
        y: pos.y,
        counts: countDataForHex(hex.organisations[0])
      };
    }));

  hexes.enter()
    .append('g')
    .attr('class', className)
    .each(function(d) {
      drawHex(d3.select(this), d);
    });

  hexes.exit().remove();

  return hexes;
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

  var hexBorder = function(x, y, r, i) {
    var a = i/6 * Math.PI * 2 + Math.PI/6;
    var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
    return [
      [x + r * Math.cos(a), y + r * Math.sin(a)],
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
      //.attr("stroke", "#666")
      .attr("fill", "#FFF");
  }.bind(this));

  fn.sequence(0, 6).forEach(function(i) {
    var bite = hex.append("path");

    bite
      .attr("d", function() {
        return "M" + hexBorder(data.x, data.y, data.r, i).join("L") + "Z";
      })
      .attr("stroke", "#666")
      .attr("fill", "none");
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

MainMap.prototype.displayPopup = function(cluster) {
  var maxOrgCount = 99;
  var maxProjectCount = 3;
  var cutOrganisationsCount = cluster.organisations.length > maxOrgCount;
  var organisations = cluster.organisations;
  var isSingleOrganisation = cluster.organisations.length === 1;

  if (cutOrganisationsCount) { organisations = organisations.slice(0, maxOrgCount); }

  var popupHTML = organisations.map(function(organization) {
    var url = 'http://digitalsocial.eu/organisations/';
    url += organization.org.substr(organization.org.lastIndexOf('/') + 1);
    var popupContent = '<h4><a href="' + url + '">'+organization.label+'</a></h4>';

    if (isSingleOrganisation) {
      popupContent += '<span>';
      popupContent += organization.street;
      popupContent += ", " + organization.city;
      popupContent += ", " + organization.country;
      popupContent += '</span>';
    }

    if (organization.projects && isSingleOrganisation) {
      popupContent += 'Projects:';

      var projects = organization.projects;
      var cutProjectCount = projects.length > maxProjectCount;
      if (cutProjectCount) { projects = projects.slice(0, maxProjectCount); }

      projects.forEach(function(project) {
        var projectUrl = 'http://digitalsocial.eu/projects/' + project.p.substr(project.p.lastIndexOf('/')+1);
        popupContent += '<a href="' + projectUrl + '">'+project.label+'</a>';
      });

      if (cutProjectCount) {
        popupContent += "<div>...</div>";
      }
    }

    return popupContent;
  }).join(isSingleOrganisation ? "<br/>" : "");

  if (cutOrganisationsCount) {
    popupHTML += "<br/><div style='text-align:center'>...</div>";
  }

  VizConfig.popup.html($(popupHTML));

  var windowOffset = $("#map").offset();
  var viewBox = d3.select("#map").select("svg").attr("viewBox").split(" ").map(function(v) { return +v; });

  var dx = windowOffset.left + this.defaultViewBox[0] - viewBox[0];
  var dy = windowOffset.top + this.defaultViewBox[1] - viewBox[1];

  var x = cluster.center ? cluster.center.x : cluster.x;
  var y = cluster.center ? cluster.center.y : cluster.y;

  // ugly hack for nice popup positioning
  y -= this.map.fullscreen ? 70 : 26;

  VizConfig.popup.open(x, y, dx, dy);
};

MainMap.prototype.handleMouse = function(selection) {
  var displayPopup = this.displayPopup.bind(this);
  var isPreloading = function() { return this.preloader.is(":visible"); }.bind(this);

  selection.on('click', function(cluster) {
    d3.event.preventDefault();
    d3.event.stopPropagation();

    if (isPreloading()) { return; }

    displayPopup(cluster);
  });

  selection.on('mouseover', function(cluster) {
    if (isPreloading()) { return; }

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
  });

  selection.on('mouseout', function() {
    VizConfig.tooltip.hide();
  });
};

MainMap.prototype.showClusterNetwork = function(zoom) {
  this.getCollaborations().then(function(collaborations) {
    var collaborators = this.clusters.map(function(cluster) {
      return cluster.organisations.reduce(function(memo, org) {
        if (org.projects) {
          org.projects.forEach(function(project) {
            if (collaborations.byProject.hasOwnProperty(project.p)) {
              collaborations.byProject[project.p].forEach(function(collaborator) {
                var isInCluster = this.clusters.reduce(function(memo, cluster) {
                  if (!memo) { memo = (indexOfProp(cluster.organisations, "org", collaborator) >= 0); }
                  return memo;
                }, false);

                var collaboratorOrg = this.organisationsById[collaborator];

                if (collaboratorOrg && isInCluster) {
                  memo.push({ org: org, collaborator: collaboratorOrg });
                }
              }.bind(this));
            }
          }.bind(this));
        }

        return memo;
      }.bind(this), []);
    }.bind(this)).reduce(function(memo, array) {
      if (array) { memo.push.apply(memo, array); }
      return memo;
    }, []);

    function makePosHash(orgA, orgB) {
      return orgA.center.x + ' ' + orgA.center.y + ' ' + orgB.center.x + ' ' + orgB.center.y;
    }
    function makeIdHash(orgA, orgB) {
      return orgA.org + ' ' + orgB.org;
    }

    //group collaborators by source and target to have only unique connections
    var collabMap = {};
    var uniqueLinks = [];
    collaborators = collaborators.filter(function(collab) {
      return (collab.org.org !== collab.collaborator.org);
    });

    collaborators.forEach(function(collab) {
      var posHash = makePosHash(collab.org, collab.collaborator);
      var idHash = makeIdHash(collab.org, collab.collaborator);
      var reversePosHash = makePosHash(collab.collaborator, collab.org);
      var reverseIdHash = makeIdHash(collab.collaborator, collab.org);
      if (collabMap[posHash] && collabMap[posHash].orgs.indexOf(idHash) === -1 && collabMap[posHash].orgs.indexOf(reverseIdHash) === -1) {
        collabMap[posHash].strength++;
      }
      if (collabMap[reversePosHash] && collabMap[reversePosHash].orgs.indexOf(idHash) === -1 && collabMap[reversePosHash].orgs.indexOf(reverseIdHash) === -1) {
        collabMap[reversePosHash].strength++;
      }
      else {
        uniqueLinks.push(collab);
        collabMap[posHash] = collab;
        collabMap[posHash].orgs = [];
        collabMap[posHash].orgs.push(idHash);
        collabMap[posHash].orgs.push(reverseIdHash);
        collabMap[posHash].strength = 1;
      }
    });

    var networkPaths = this.DOM.networkGroup
      .selectAll('line.network')
      .data(uniqueLinks);

    networkPaths
      .enter()
      .append('line')
      .attr('class', 'network')
      .attr('x1', function(d) { return d.org.center.x; })
      .attr('y1', function(d) { return d.org.center.y; })
      .attr('x2', function(d) { return d.collaborator.center.x; })
      .attr('y2', function(d) { return d.collaborator.center.y; })
      .attr('stroke', '#00B993')
      .attr('stroke-opacity', 0)
      .attr('stroke-width', 1);

    var zoomStrokeWidth  = Math.max(0, (zoom-5));

    networkPaths
      .attr('x1', function(d) { return d.org.center.x; })
      .attr('y1', function(d) { return d.org.center.y; })
      .attr('x2', function(d) { return d.collaborator.center.x; })
      .attr('y2', function(d) { return d.collaborator.center.y; })
      .attr('stroke-width', 1)
      .transition()
      .delay(400)
      .duration(200)
      .attr('stroke-opacity', function(d) { return Math.max(0.05, Math.min(d.strength/5, 1)); })
      .attr('stroke-width', function(d) { 
        var width = Math.max(0.2, Math.min((2*d.strength+zoomStrokeWidth)/10, 20));
        return width;
      });

    networkPaths
      .exit()
      .transition()
      .duration(200)
      .attr('stroke-opacity', 0)
      .remove();
  }.bind(this));
};

MainMap.prototype.hideClusterNetwork = function() {
  this.DOM.networkGroup
    .selectAll('line.network')
    .transition()
    .duration(200)
    .attr('stroke-opacity', 0);
};

return MainMap;
}());
