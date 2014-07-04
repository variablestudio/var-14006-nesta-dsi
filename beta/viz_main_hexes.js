/*jslint todo: true */
/*global window, d3, ds, SPARQLDataSource, $, fn, Q, VizConfig */

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

function MainHexes(mainVizContainer) {
	this.DOM = {};
	this.mainVizContainer = mainVizContainer;
	this.init();

	this.ConceptSchemes = {
		areaOfDigitalSocialInnovation: {
			label: 'Area of Digital Social Innovation',
			predicate: 'ds:areaOfDigitalSocialInnovation',
			property: 'areaOfDigitalSocialInnovation',
			urlBase: 'http://data.digitalsocial.eu/def/concept/area-of-digital-social-innovation/'
		},
		technologyFocus: {
			label: 'Technology focus',
			predicate: 'ds:technologyFocus',
			property: 'technologyFocus',
			urlBase: 'http://data.digitalsocial.eu/def/concept/technology-focus/'
		},
		areaOfSociety: {
			label: 'Domain',
			predicate: 'ds:areaOfSociety',
			property: 'areaOfSociety',
			urlBase: 'http://data.digitalsocial.eu/def/concept/area-of-society/'
		},
		organizationType: {
			label: 'Organization Type',
			predicate: 'ds:organizationType',
			property: 'organizationType',
			urlBase: 'http://data.digitalsocial.eu/def/concept/organization-type/'
		},
		activityType: {
			label: 'Activity Type',
			predicate: 'ds:activityType',
			property: 'activityType',
			urlBase: 'http://data.digitalsocial.eu/def/concept/activity-type/'
		},
		technologyMethod: {
			label: 'Technology method',
			predicate: 'ds:technologyMethod',
			property: 'technologyMethod',
			urlBase: 'http://data.digitalsocial.eu/def/concept/technology-method/'
		}
	};

	this.DSIAreaTypes = ['open-democracy', 'new-ways-of-making', 'awareness-networks', 'collaborative-economy', 'open-access', 'funding-acceleration-and-incubation'];
	this.DSIAreaColors = ['#F9EB40', '#f53944', '#31ac33', '#1DAEEC', '#f274c7', '#f79735'];
}

MainHexes.prototype.initSVG = function() {
	this.w = window.innerWidth;
	//this.h = 700; // TODO: should be calculated from data?
	this.h = window.innerHeight - 360;
	this.h = Math.min(this.h, 800);
	this.h = Math.max(300, this.h);

	this.svg = d3.select(this.mainVizContainer)
		.append('svg')
		.attr('width', this.w)
		.attr('height', this.h);

	this.svg.append('rect')
		.attr('fill', '#EEEEEE')
		.attr('class', 'bg')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.w)
		.attr('height', this.h);
};

MainHexes.prototype.init = function() {
	this.initSVG();

	this.preloader = $('<img id="vizPreloader" src="'+VizConfig.assetsPath+'/preloader.gif"/>');
	$(this.mainVizContainer).append(this.preloader);

	fn.values(this.ConceptSchemes).map(function(concept) {
		return this.getConceptValues(concept).then(function(values) {
			var countedValues = fn.countValues(values);
			var valueList = fn.keys(countedValues).map(function(value) {
				return {
					name: value,
					label: value.replace(/-/g, ' '),
					count: countedValues[value]
				};
			});
			valueList.sort(this.compareProperty('count'));
			valueList = valueList.reverse();
			concept.values = valueList;
			//console.log(concept.name, JSON.stringify(valueList));
		}.bind(this));
	}.bind(this));

  this.loadVizData();
};

MainHexes.prototype.getConceptValues = function(concept) {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(SPARQL_URL);
	var deferred = Q.defer();
	ds.query()
	.prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
	.select('?propValue')
	.where('?subject', concept.predicate, '?propValue')
	.execute().then(function(results) {
		var values = results
		.map(fn.get('propValue'))
		.map(fn.get('value'))
		.map(function(value) { return value.replace(concept.urlBase, ''); });

		deferred.resolve(values);
	});

	return deferred.promise;
};

MainHexes.prototype.loadOrganizationsData = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);
	var deferred = Q.defer();
	ds.query()
		.prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
		.prefix('o:', '<http://www.w3.org/ns/org#>')
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.select('?org ?label ?p ?ot ?as')
		.where('?org', 'a', 'o:Organization')
		.where("?org", "rdfs:label", "?label")
		.where('?am', 'a', 'ds:ActivityMembership')
		.where('?am', 'ds:organization', '?org')
		.where('?am', 'ds:activity', '?p')
		.where("?org", "ds:organizationType", "?ot", { optional: true })
		.execute().then(function(results) {
			var organizations = {
				byId: {},
				list: []
			};
			results.forEach(function(row) {
				var organizationId = row.org.value;
				var organization = organizations.byId[organizationId];
				if (!organization) {
					organization = { id: organizationId, organizationType: [], projects: [] };
					organizations.byId[organizationId] = organization;
					organizations.list.push(organization);
				}
				organization.label = row.label.value;
				if (row.p && organization.projects.indexOf(row.p.value) === -1) {
					organization.projects.push(row.p.value);
				}
				if (row.ot && organization.organizationType.indexOf(row.ot.value.substr(row.ot.value.lastIndexOf('/')+1)) === -1) {
					organization.organizationType.push(row.ot.value.substr(row.ot.value.lastIndexOf('/')+1));
				}
			});
			deferred.resolve(organizations);
		});

	return deferred.promise;
};

MainHexes.prototype.loadProjectData = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);
	var deferred = Q.defer();
	ds.query()
		.prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
		.select('?p')
		.select('(group_concat(distinct ?adsi ; separator = ",") AS ?adsi_values)')
		.select('(group_concat(distinct ?tf ; separator = ",") AS ?tf_values)')
		.select('(group_concat(distinct ?tm ; separator = ",") AS ?tm_values)')
		.select('(group_concat(distinct ?at ; separator = ",") AS ?at_values)')
		.select('(group_concat(distinct ?as ; separator = ",") AS ?as_values)')
		.select('(group_concat(distinct ?label ; separator = ",") AS ?label_values)')
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.where('?p', 'a', 'ds:Activity')
		.where("?p", "rdfs:label", "?label")
		.where("?p", "ds:areaOfDigitalSocialInnovation", "?adsi", { optional: true })
		.where("?p", "ds:technologyFocus", "?tf", { optional: true })
		.where("?p", "ds:technologyMethod", "?tm", { optional: true })
		.where("?p", "ds:activityType", "?at", { optional: true })
		.where("?p", "ds:areaOfSociety", "?as", { optional: true })
		.groupBy('?p')
		.execute().then(function(results) {
			console.log('loadProjectData', results.length, results[0]);
			var projects = {
				byId: {},
				list: []
			};
			results.forEach(function(row) {
				var projectId = row.p.value;
				var project = { id: projectId };
				projects.list.push(project);
				projects.byId[projectId] = project;
				project.label = row.label_values.value;
				project.areaOfDigitalSocialInnovation = row.adsi_values ? row.adsi_values.value.split(',').map(this.cutPrefix) : [];
				project.technologyFocus = row.tf_values ? row.tf_values.value.split(',').map(this.cutPrefix) : [];
				project.technologyMethod = row.tm_values ? row.tm_values.value.split(',').map(this.cutPrefix) : [];
				project.areaOfSociety = row.as_values ? row.as_values.value.split(',').map(this.cutPrefix) : [];
				project.activityType = row.at_values ? row.at_values.value.split(',').map(this.cutPrefix) : [];
			}.bind(this));
			deferred.resolve(projects);
		}.bind(this));

	return deferred.promise;
};

MainHexes.prototype.compareProperty = function(prop) {
	return function(a, b) {
		var val = 0;
		if (a[prop] > b[prop]) { val = 1; }
		if (a[prop] < b[prop]) { val = -1; }

		return val;
	};
};

MainHexes.prototype.cutPrefix = function(s) {
	return s.substr(s.lastIndexOf('/') + 1);
};

MainHexes.prototype.loadVizData = function() {
	Q.all([ this.loadOrganizationsData(), this.loadProjectData() ]).then(function(results) {
		var organizationsResults = results[0];
		var projectsResults = results[1];
		console.log('loadOrganizations', organizationsResults.list.length);
		console.log('loadProjectData', projectsResults.list.length);

		organizationsResults.list.forEach(function(org) {
			org.projects = org.projects.map(function(projectId) {
				var project = projectsResults.byId[projectId];
				//if (!project) { console.log('loadVizData: Missing project', org.id, projectId); }
				return project;
			}).filter(fn.notNull);
			var areasOfDSI = fn.flatten(org.projects.map(fn.get('areaOfDigitalSocialInnovation')));
			org.areaOfDigitalSocialInnovation = fn.unique(areasOfDSI);
			org.areaOfDigitalSocialInnovationCounted = fn.countValues(areasOfDSI);
		});

		this.preloader.fadeOut("slow");
		this.buildViz(organizationsResults.list, projectsResults.list);
	}.bind(this));
};

MainHexes.prototype.buildViz = function(organizations, projects) {
	var w = window.innerWidth;
	var dx = 50;
	var dy = 50;
	var r = 20;
	var r2 = r * 2;
	var marginRight = 60;
	var svg = this.svg;

	var numCols = Math.floor((w - marginRight) / (r * 2));

	function hexBite(x, y, r, i) {
		var a = i/6 * Math.PI * 2 + Math.PI/6;
		var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
		return [
			[x, y],
			[x + r * Math.cos(a), y + r * Math.sin(a)],
			[x + r * Math.cos(na), y + r * Math.sin(na)]
		];
	}

	function hexEdge(x, y, r, i) {
		var a = i/6 * Math.PI * 2 + Math.PI/6;
		var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
		var r2 = r ? r - 3 : 0;
		return [
			[x + r2 * Math.cos(na), y + r2 * Math.sin(na)],
			[x + r2 * Math.cos(a), y + r2 * Math.sin(a)],
			[x + r * Math.cos(a), y + r * Math.sin(a)],
			[x + r * Math.cos(na), y + r * Math.sin(na)]
		];
	}

	var items = projects.concat(organizations);

	function render(items) {
		var itemGroup = svg.selectAll('g.item').data(items);

		itemGroup.enter()
			.append('g')
			.attr('class', 'item');

		itemGroup.exit()
			.remove();

		fn.sequence(0,6).map(function(i) {
			var bite = itemGroup.append('path');
			bite.attr('d', function(item, itemIndex) {
				var col = (itemIndex % numCols);
				var row = Math.floor(itemIndex / numCols);
				var x = dx + col * r2;
				var y = dy + row * r2 * 0.9;
				if (row % 2 === 1) {
					x += r;
				}
				return "M" + hexBite(x, y, r, i).join("L") + "Z";
			});
			bite.attr('stroke', '#DDD');
			bite.attr('fill', '#FFF');
		}.bind(this));

		fn.sequence(0,6).map(function(i) {
			var bite = itemGroup.append('path');
			bite.attr('d', function(item, itemIndex) {
				var col = (itemIndex % numCols);
				var row = Math.floor(itemIndex / numCols);
				var x = dx + col * r2;
				var y = dy + row * r2 * 0.9;
				if (row % 2 === 1) {
					x += r;
				}

				var path;

				if (item.projects) {
					var areaR = 0;
					if (item.areaOfDigitalSocialInnovation.indexOf(this.DSIAreaTypes[i]) !== -1) {
						if (item.areaOfDigitalSocialInnovationCounted) {
							areaR = Math.min(r, 5 + 2 * item.areaOfDigitalSocialInnovationCounted[this.DSIAreaTypes[i]]);
						}
					}
					path = "M" + hexBite(x, y, areaR, i).join("L") + "Z";
				}
				else {
					var edgeR = 0;
					if (item.areaOfDigitalSocialInnovation.indexOf(this.DSIAreaTypes[i]) !== -1) {
						edgeR = r;
					}
					path = "M" + hexEdge(x, y, edgeR, i).join("L") + "Z";
				}

				return path;
			}.bind(this));
			bite.attr('fill', this.DSIAreaColors[i]);
			bite.attr('stroke', 'none');
		}.bind(this));

		itemGroup
			.on("mouseover", function(item) {
				VizConfig.tooltip.show();
				VizConfig.tooltip.html(item.label);
			})
			.on("mouseout", function() {
				VizConfig.tooltip.hide();
			})
			.on("click", function(item) {
				if (item.id.indexOf('/activity/') != -1) {
					var url = 'http://digitalsocial.eu/projects/' + item.id.substr(item.id.lastIndexOf('/')+1);
					window.location.href = url;
				}
				if (item.id.indexOf('/organization/') != -1) {
					var url = 'http://digitalsocial.eu/organisations/' + item.id.substr(item.id.lastIndexOf('/')+1);
					window.location.href = url;
				}
				//VizConfig.tooltip.hide();
			});
	}

	render.call(this, items);
	var filters = [];

	function rerenderFilteredItems() {
		var filteredItems = items.filter(function(item) {
			return filters.reduce(function(valid, filter) {
				var prop = item[filter.conceptName];
				var returnValue = false;

				if (prop) {
					returnValue = valid && prop.indexOf(filter.valueName) !== -1;
				}
				else if (item.projects) {
					var i;
					for(i=0; i<item.projects.length; i++) {
						prop = item.projects[i][filter.conceptName];
						if (prop && prop.indexOf(filter.valueName) !== -1) { returnValue = valid; }
					}
				}

				return returnValue;
			}, true);
		});

		render.call(this, filteredItems);
	}

  VizConfig.events.addEventListener('filter', function(e) {
		var conceptName = e.property;
		var valueName = e.id;

		var existingFilter = filters.filter(function(f) {
			return f.conceptName === conceptName && f.valueName === valueName;
		})[0];

		if (existingFilter) {
			filters.splice(filters.indexOf(existingFilter), 1);
		}
		else {
			filters.push({ conceptName: conceptName, valueName: valueName });
		}

		rerenderFilteredItems.call(this);
  }.bind(this));
};
