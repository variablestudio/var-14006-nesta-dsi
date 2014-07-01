/*global fn, d3, SPARQLDataSource */

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

function Stats(divs, org, dsiColors) {
	this.data = []; // will be filled on SPARQL query

	// cache org url
	this.org = org;

	// cache selectors
	this.DOM = {
		"dsi": d3.select(divs.dsi),
		"tech": d3.select(divs.tech),
		"collaborators": d3.select(divs.collaborators)
	};

	// DSI colors and area names
	this.DSIColors = dsiColors || {
		"Open Democracy": "#F9EB40",
		"New Ways of Making": "#f53944",
		"Awareness Networks": "#31ac33",
		"Collaborative Economy": '#1DAEEC',
		"Open Access": "#f274c7",
		"Funding Acceleration and Incubation": "#f79735"
	};

	this.DSIAreas = Object.keys(this.DSIColors);
}

Stats.prototype.cleanResults = function(results) {
	var numericKeys = [ "lat", "long" ];

	return results.map(function(object) {
		var newObject = {};
		var key;
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				if (numericKeys.indexOf(key) >= 0) {
					newObject[key] = +object[key].value;
				}
				else {
					newObject[key] = object[key].value;
				}
			}
		}

		return newObject;
	});
};

Stats.prototype.init = function() {
	var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(url);

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("?org_label ?activity_label ?adsi_label ?tech_label ?lat ?long")
		.where("?org", "a", "o:Organization")
		.where("FILTER regex(str(?org), \"" + this.org + "\")", "", "")
		.where("?am", "a", "ds:ActivityMembership")
		.where("?am", "ds:organization", "?org")
		.where("?am", "ds:activity", "?activity")
		.where("?activity", "rdfs:label", "?activity_label")
		.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
		.where("?activity", "ds:technologyFocus", "?tf")
		.where("?tf", "rdfs:label", "?tech_label")
		.where("?adsi", "rdfs:label", "?adsi_label")
		.where("?org", "rdfs:label", "?org_label")
		.where("?org", "o:hasPrimarySite", "?org_site")
		.where("?org_site", "geo:long", "?long")
		.where("?org_site", "geo:lat", "?lat")
		.execute()
		.then(function(results) {
			this.data = this.cleanResults(results);

			var parentOrg = this.data[0].org_label;

			this.data = this.data.reduce(function(memo, object) {
				var index = indexOfProp(memo, "activity_label", object.activity_label);

				if (index < 0) {
					memo.push({
						"activity_label": object.activity_label,
						"adsi_labels": [ object.adsi_label ],
						"tech_focuses": [ object.tech_label ],
						"lat": object.lat,
						"long": object.long
					});
				}
				else {
					var memoObject = memo[index];

					if (memoObject.adsi_labels.indexOf(object.adsi_label) < 0) {
						memoObject.adsi_labels.push(object.adsi_label);
					}

					if (memoObject.tech_focuses.indexOf(object.tech_label) < 0) {
						memoObject.tech_focuses.push(object.tech_label);
					}

					memo[index] = memoObject;
				}

				return memo;
			}, []);

			var projects = this.data.map(function(object) {
				return object.activity_label;
			});

			this.queryCollaborators(projects, parentOrg, function() {
				this.draw();
			}.bind(this));
		}.bind(this));
};

// finds collaborators for given project names and parent organization, callbacks when finished
Stats.prototype.queryCollaborators = function(projects, parentOrg, callback) {
	var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(url);

	// generate projects string for filter
	var projectsStr = projects.map(function(value) { return "\"" + value + "\""; }).join(", ");

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("DISTINCT ?org_label ?activity_label ?lat ?long")
		.where("?org", "a", "o:Organization")
		.where("?org", "rdfs:label", "?org_label")
		.where("?am", "a", "ds:ActivityMembership")
		.where("?am", "ds:organization", "?org")
		.where("?am", "ds:activity", "?activity")
		.where("?activity", "rdfs:label", "?activity_label")
		.where("?org", "o:hasPrimarySite", "?org_site")
		.where("?org_site", "geo:long", "?long")
		.where("?org_site", "geo:lat", "?lat")
		.where("FILTER (?activity_label IN (" + projectsStr + "))", "", "")
		.where("FILTER (?org_label != \"" + parentOrg + "\")", "", "")
		.execute()
		.then(function(results) {
			var collabData = this.cleanResults(results);

			collabData.forEach(function(collab) {
				var index = indexOfProp(this.data, "activity_label", collab.activity_label);

				if (index >= 0) {
					var dataObject = this.data[index];

					if (dataObject.collaborators !== undefined) {
						dataObject.collaborators.push(collab);
					}
					else {
						dataObject.collaborators = [ collab ];
					}

					this.data[index] = dataObject;
				}
			}.bind(this));

			callback();
		}.bind(this));
};

Stats.prototype.draw = function() {
	this.drawDSIAreas();
	this.drawTechnologyAreas();
	this.drawCollaborators();
};

// counts fields in data that are arrays, used for dsi and technology area charts
Stats.prototype.countField = function(field) {
	return this.data.reduce(function(memo, object) {
		object[field].forEach(function(label) {
			var index = indexOfProp(memo, "name", label);

			if (index < 0) {
				memo.push({ "name": label, "count": 1 });
			}
			else {
				memo[index].count++;
			}
		});

		return memo;
	}, []);
};

Stats.prototype.drawDSIAreas = function() {
	var groupedData = this.countField("adsi_labels").filter(function(object) { return (object.count > 0); });

	var width = 322;
	var height = 40;
	var rectWidth = 30;
	var rectHeight = 15;
	var rectMargin = 4;

	var svg = this.DOM.dsi
		.append("svg")
		.attr("width", width)
		.attr("height", height * (groupedData.length + 1))
		.attr("class", "dsi-areas");

	groupedData.forEach(function(group, index) {
		svg.append("text")
			.attr("class", "title")
			.text(group.name)
			.attr("y", (index + 1) * height)
			.attr("fill", this.DSIColors[group.name]);

		fn.sequence(0, group.count).forEach(function(projectIndex) {
			var rect = svg.append("rect")
				.attr("class", "dsiAreaProject")
				.attr("x", projectIndex * (rectWidth + rectMargin))
				.attr("y", (index + 1) * height + rectMargin)
				.attr("width", rectWidth)
				.attr("height", rectHeight)
				.attr("fill", this.DSIColors[group.name]);
			this.highlightProject(svg, rect, group.name, projectIndex);
		}.bind(this));
	}.bind(this));
};

Stats.prototype.highlightProject = function(svg, rect, groupName, projectIndex) {
	rect.on("mouseover", function() {
		svg.selectAll(".dsiAreaProject").transition().duration(200).style("opacity", "0.25")
		rect.transition().duration(0).style("opacity", "1");

		var projects = this.data.filter(function(p) { return p.adsi_labels.indexOf(groupName) != -1; });
		var project = projects[projectIndex];

		var techFocuses = this.countField("tech_focuses").filter(function(object) { return (object.count > 0); });

		d3.selectAll('.techFocusBar')
			.style('opacity', function(d, i) {
				if (project.tech_focuses.indexOf(techFocuses[i].name) != -1) {
					return 1;
				}
				else {
					return 0.2;
				}
			})

		d3.selectAll('.collaborator').style('opacity', 0.1);
	}.bind(this));
	rect.on("mouseout", function() {
		svg.selectAll(".dsiAreaProject").style("opacity", "1");
		d3.selectAll('.techFocusBar').style('opacity', 1)
		d3.selectAll('.collaborator').style('opacity', 1);
	}.bind(this))
}

Stats.prototype.drawTechnologyAreas = function() {
	var groupedData = this.countField("tech_focuses").filter(function(object) { return (object.count > 0); });
	var maxCount = groupedData.reduce(function(memo, object) {
		return memo > object.count ? memo : object.count;
	}, -Infinity);

	var width = 322;
	var height = 40;
	var rectHeight = 5;
	var rectMargin = 4;

	var scale = d3.scale.linear()
		.domain([0, maxCount])
		.range([0, width]);

	var svg = this.DOM.tech
		.append("svg")
		.attr("width", width)
		.attr("height", height * (groupedData.length + 1))
		.attr("class", "tech-areas");

	groupedData.forEach(function(group, index) {
		svg.append("text")
			.attr("class", "title")
			.text(group.name)
			.attr("y", (index + 1) * height);

		svg.append("rect")
			.attr("class", "techFocusBar")
			.attr("x", 0)
			.attr("y", (index + 1) * height + rectMargin)
			.attr("width", scale(group.count))
			.attr("height", rectHeight);
	});
};

Stats.prototype.drawCollaborators = function() {
	var width = 322;
	var height = 322;
	var hexR = 25;
	var smallHexR = 15;

	// initial d3 selection passed to lines and hexes
	var selection = this.DOM.collaborators
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// prepare proper data for main hex
	var hexData = this.data.reduce(function(memo, object) {
		object.adsi_labels.forEach(function(label) {
			if (memo[label] !== undefined) {
				memo[label]++;
			}
			else {
				memo[label] = 1;
			}
		});

		return memo;
	}, {});

	// filter collaborators
	var collaborators = this.data.reduce(function(memo, data) {
		if (data.collaborators) {
			data.collaborators.forEach(function(collaborator) {
				if (indexOfProp(memo, "org_label", collaborator.org_label) < 0) {
					memo.push(collaborator);
				}
			});
		}

		return memo;
	}, []);

	// initial projection
	var projection = d3.geo.mercator().scale(1).translate([ 0, 0 ]);

	// create path
	var path = d3.geo.path().projection(projection);

	// proper object for calculating bounds
	var multiPoints = {
		"type": "MultiPoint",
		"coordinates": collaborators.map(function(object) {
			return [ object.lat, object.long ];
		})
	};

	// add parent lat long to multipoints
	multiPoints.coordinates.push([ this.data[0].lat, this.data[0].long ]);

	// calculate bounds, scale and translation
	var bounds = path.bounds(multiPoints);
	var scale = 0.8 / Math.max(
		(bounds[1][0] - bounds[0][0]) / width,
		(bounds[1][1] - bounds[0][1]) / height
	);
	var translate = [
		(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
		(height - scale * (bounds[1][1] + bounds[0][1])) / 2
	];

	// update projection
	projection.scale(scale).translate(translate);

	// get position for parent company
	var orgPos = projection([ this.data[0].lat, this.data[0].long ]);

	// draw all connecting lines
	collaborators.forEach(function(collaborator) {
		var pos = projection([ collaborator.lat, collaborator.long ]);
		this.drawLine(selection, orgPos[0], orgPos[1], pos[0], pos[1]);
	}.bind(this));

	// draw all collaborators
	collaborators.forEach(function(collaborator) {
		var pos = projection([ collaborator.lat, collaborator.long ]);
		this.drawHex(selection, pos[0], pos[1], smallHexR, null);
	}.bind(this));

	// draw main company
	this.drawHex(selection, orgPos[0], orgPos[1], hexR, hexData);
};

Stats.prototype.drawLine = function(selection, x1, y1, x2, y2) {
	selection
		.append("line")
		.attr("x1", x1)
		.attr("x2", x2)
		.attr("y1", y1)
		.attr("y2", y2)
		.attr("stroke", "#DDD")
		.attr("fill", "none");
};

Stats.prototype.drawHex = function(selection, x, y, r, data) {
	var hexBite = function(x, y, r, i) {
		var a = i/6 * Math.PI * 2 + Math.PI/6;
		var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
		return [
			[x, y],
			[x + r * Math.cos(a), y + r * Math.sin(a)],
			[x + r * Math.cos(na), y + r * Math.sin(na)]
		];
	}

	fn.sequence(0, 6).forEach(function(i) {
		var bite = selection.append("path");
		if (!data) bite.attr('class', 'collaborator');

		bite
			.attr("d", function(org, orgIndex) {
				return "M" + hexBite(x, y, r, i).join("L") + "Z";
			})
			.attr("stroke", "#666")
			.attr("fill", "#FFF");
	}.bind(this));

	// fill hex only if data is passed
	if (data) {
		fn.sequence(0, 6).forEach(function(i) {
			var dsiArea = this.DSIAreas[i];
			var bite = selection.append("path");

			bite
				.attr("d", function(org, orgIndex) {
					return "M" + hexBite(x, y, 5 + Math.min(r - 5, Math.pow(data[dsiArea], 0.6)) || 1, i).join("L") + "Z";
				})
				.attr('fill', this.DSIColors[this.DSIAreas[i]]);
		}.bind(this));
	}
};
