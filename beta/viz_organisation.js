/*global window, fn, d3, SPARQLDataSource, VizConfig */

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
		"Collaborative Economy": "#1DAEEC",
		"Open Access": "#f274c7",
		"Funding Acceleration and Incubation": "#f79735"
	};

	this.DSIAreas = Object.keys(this.DSIColors);
}

Stats.prototype.cleanResults = function(results) {
	var numericKeys = [ "lat", "long" ];
	var idForUrls = [ "activity", "org" ];

	return results.map(function(object) {
		var newObject = {};
		var key;
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				if (numericKeys.indexOf(key) >= 0) {
					newObject[key] = +object[key].value;
				}
				else {
					if (idForUrls.indexOf(key) >= 0) {
						newObject[key + "_url"] = object[key].value.split("/").pop();
					}
					else {
						newObject[key] = object[key].value;
					}
				}
			}
		}

		return newObject;
	});
};

Stats.prototype.init = function() {
	var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
	var ds = new SPARQLDataSource(url);

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("?org_label ?activity_label ?adsi_label ?tech_label ?lat ?long ?activity")
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
						"activity_url": object.activity_url,
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
	var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
	var ds = new SPARQLDataSource(url);

	// generate projects string for filter
	var projectsStr = projects.map(function(value) { return "\"" + value + "\""; }).join(", ");

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("DISTINCT ?org_label ?activity ?activity_label ?lat ?long ?org")
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
				memo.push({
					"name": label,
					"collaborators": object.collaborators,
					"count": 1,
					"values": [ { "name": object.activity_label, "url": object.activity_url } ],
				});
			}
			else {
				memo[index].count++;
				memo[index].values.push({ "name": object.activity_label, "url": object.activity_url });
			}
		});

		return memo;
	}, []);
};

Stats.prototype.drawDSIAreas = function() {
	var groupedData = this.countField("adsi_labels").filter(function(object) { return (object.count > 0); });

	var width = 228;
	var height = 40;
	var rectWidth = 30;
	var rectHeight = 15;
	var rectMargin = 4;

	var highlightOnActivityUrl = this.highlightOnActivityUrl;

	var svg = this.DOM.dsi
		.append("svg")
		.attr("width", width)
		.attr("height", height * (groupedData.length + 1))
		.attr("class", "dsi-areas");

	svg.selectAll(".title")
		.data(groupedData)
		.enter()
		.append("text")
		.attr("class", "title")
		.text(function(d) {
			return d.name;
		})
		.attr("y", function(d, i) {
			return (i + 1) * height;
		})
		.attr("fill", function(d) {
			return this.DSIColors[d.name];
		}.bind(this));

	var DSIColors = this.DSIColors;

	svg.selectAll(".dsi-rects")
		.data(groupedData)
		.enter()
		.append("g")
		.attr("class", "dsi-rects")
		.each(function(d, j) {
			var name = d.name;
			var selection = d3.select(this);

			selection.selectAll(".dsi-rect")
				.data(d.values)
				.enter()
				.append("rect")
				.attr("class", "dsi-rect")
				.attr("x", function(d, i) {
					return i * (rectWidth + rectMargin);
				})
				.attr("y", function(d) {
					return (j + 1) * height + rectMargin;
				})
				.attr("width", rectWidth)
				.attr("height", rectHeight)
				.attr("fill", DSIColors[name])
				.on("mouseover", function(d) {
					VizConfig.tooltip.show();
					VizConfig.tooltip.html(d.name, "#FFF", DSIColors[name]);

					highlightOnActivityUrl("over", d.url);
				})
				.on("mouseout", function() {
					VizConfig.tooltip.hide();

					highlightOnActivityUrl("out");
				})
				.on("click", function(d) {
					var url = "http://digitalsocial.eu/projects/" + d.url;
					window.open(url, "_blank");
				});
		});
};

Stats.prototype.drawTechnologyAreas = function() {
	var groupedData = this.countField("tech_focuses").filter(function(object) { return (object.count > 0); });
	var maxCount = groupedData.reduce(function(memo, object) {
		return memo > object.count ? memo : object.count;
	}, -Infinity);

	var width = 228;
	var height = 40;
	var rectHeight = 5;
	var rectMargin = 4;

	var highlightOnActivityUrl = this.highlightOnActivityUrl;

	var scale = d3.scale.linear()
		.domain([0, maxCount])
		.range([0, width]);

	var svg = this.DOM.tech
		.append("svg")
		.attr("width", width)
		.attr("height", height * (groupedData.length + 1))
		.attr("class", "tech-areas");

	svg.selectAll(".title")
		.data(groupedData)
		.enter()
		.append("text")
		.attr("class", "title")
		.text(function(d) {
			return d.name;
		})
		.attr("y", function(d, i) {
			return (i + 1) * height;
		});

	svg.selectAll(".tech-bar")
		.data(groupedData)
		.enter()
		.append("rect")
		.attr("class", "tech-bar")
		.attr("x", 0)
		.attr("y", function(d, i) {
			return (i + 1) * height + rectMargin;
		})
		.attr("width", function(d) {
			return scale(d.count);
		})
		.attr("height", rectHeight)
		.on("mouseover", function(d) {
			highlightOnActivityUrl("over", d.values.map(function(object) { return object.url; }));
		})
		.on("mouseout", function() {
			highlightOnActivityUrl("out");
		});
};

Stats.prototype.drawCollaborators = function() {
	var width = 352;
	var height = width;
	var hexR = 25;
	var smallHexR = 15;

	// prepare counts for main organisation hex
	var orgData = {
		"pos": [],
		"r": hexR,
		"counts": this.data.reduce(function(memo, object) {
			object.adsi_labels.forEach(function(label) {
				if (memo[label] !== undefined) { memo[label]++; }
				else { memo[label] = 1; }
			});

			return memo;
		}, {})
	};

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
			return [ object.long, object.lat ];
		})
	};

	// add parent lat long to multipoints
	multiPoints.coordinates.push([ this.data[0].long, this.data[0].lat ]);

	// calculate bounds, scale and translation
	var bounds = path.bounds(multiPoints);
	var scale = 0.65 / Math.max(
		(bounds[1][0] - bounds[0][0]) / width,
		(bounds[1][1] - bounds[0][1]) / height
	);

	// fix for situation where organisation doesn"t have collaborators
	if (scale === Infinity) { scale = 1.0; }

	var translate = [
		(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
		(height - scale * (bounds[1][1] + bounds[0][1])) / 2
	];

	// update projection
	projection.scale(scale).translate(translate);

	// get position for parent company
	orgData.pos = projection([ this.data[0].long, this.data[0].lat ]);

	// project positions
	collaborators = collaborators.map(function(collaborator) {
		var pos = projection([ collaborator.long, collaborator.lat ]);

		var vec = [ pos[0] - orgData.pos[0], pos[1] - orgData.pos[1] ];
		var length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
		vec[0] /= length;
		vec[1] /= length;

		pos[0] += vec[0] * (hexR + smallHexR) * 1.05;
		pos[1] += vec[1] * (hexR + smallHexR) * 1.05;

		collaborator.pos = pos;
		return collaborator;
	});

	// cache drawing function
	var drawHex = this.drawHex.bind(this);

	// initial d3 selection passed to lines and hexes
	var selection = this.DOM.collaborators
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	selection
		.selectAll(".connection")
		.data(collaborators)
		.enter()
		.append("line")
		.attr("class", "connection")
		.attr("x1", function(d) { return d.pos[0]; })
		.attr("y1", function(d) { return d.pos[1]; })
		.attr("x2", orgData.pos[0])
		.attr("y2", orgData.pos[1])
		.attr("stroke", "#666")
		.attr("fill", "none");

	selection
		.selectAll(".collaborator")
		.data(collaborators)
		.enter()
		.append("g")
		.attr("class", "collaborator")
		.each(function(d) {
			d.r = smallHexR;
			drawHex(d3.select(this), d);
		});

	selection
		.selectAll(".organisation")
		.data([ orgData ])
		.enter()
		.append("g")
		.attr("class", "organisation")
		.each(function(d) {
			drawHex(d3.select(this), d);
		});
};

Stats.prototype.drawHex = function(selection, data) {
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
				return "M" + hexBite(data.pos[0], data.pos[1], data.r, i).join("L") + "Z";
			})
			.attr("stroke", "#666")
			.attr("fill", "#FFF");
	}.bind(this));

	// fill hex only if data is passed
	if (data.counts) {
		fn.sequence(0, 6).forEach(function(i) {
			var dsiArea = this.DSIAreas[i];
			var bite = hex.append("path");

			bite
				.attr("d", function() {
					return "M" + hexBite(
						data.pos[0],
						data.pos[1],
						5 + Math.min(data.r - 5, Math.pow(data.counts[dsiArea], 0.6)) || 1,
						i
					).join("L") + "Z";
				})
				.attr("fill", this.DSIColors[this.DSIAreas[i]]);
		}.bind(this));
	}

	var highlightOnActivityUrl = this.highlightOnActivityUrl;

	hex.on("mouseover", function(d) {
		VizConfig.tooltip.show();
		VizConfig.tooltip.html(d.org_label, "#FFF", "#666");

		highlightOnActivityUrl("over", d.activity_url);
	});

	hex.on("mouseout", function() {
		VizConfig.tooltip.hide();

		highlightOnActivityUrl("out");
	});

	hex.on("click", function(d) {
		var url = "http://digitalsocial.eu/organisations/" + d.org_url;
		window.open(url, "_blank");
	});
};

// highlight using state (over/out), and single, or list of activity urls
Stats.prototype.highlightOnActivityUrl = function(state, urls) {
	state = (state === "over") ? "over" : "out";
	urls = (urls instanceof Array) ? urls : [ urls ];

	if (state === "over") {
		// handle opacity for visualizations with simple accesors
		[ { "query": ".dsi-rect", "accesor": "url" },
			{ "query": ".collaborator", "accesor": "activity_url" },
			{ "query": ".connection", "accesor": "activity_url" } ].forEach(function(object) {
				d3.selectAll(object.query)
					.transition()
					.duration(200)
					.style("opacity", function(d) {
						return (urls.indexOf(d[object.accesor]) >= 0) ? 1.0 : 0.2;
					});
			});

			// more complicated technology bar opacity transition
			d3.selectAll(".tech-bar")
				.transition()
				.duration(200)
				.style("opacity", function(d) {
					var urlMatches = urls.reduce(function(memo, url) {
						if (!memo) { memo = (indexOfProp(d.values, "url", url) >= 0); }
						return memo;
					}, false);

					return urlMatches ? 1.0 : 0.2;
				});
	}
	else {
		// transition everything back to 1.0
		[ ".dsi-rect", ".tech-bar", ".connection", ".collaborator" ].forEach(function(query) {
			d3.selectAll(query).transition().duration(200).style("opacity", 1.0);
		});
	}
};
