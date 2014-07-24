/*global document, window, fn, d3, SPARQLDataSource, VizConfig */

var Stats = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

	function Stats(divs, org) {
		this.data = []; // will be filled on SPARQL query

		// cache org url
		this.org = org;

		// cache selectors
		this.DOM = {
			"dsi": d3.select(divs.dsi),
			"tech": d3.select(divs.tech),
			"collaborators": d3.select(divs.collaborators)
		};

		this.setupDOM();
	}

	Stats.prototype.setupDOM = function() {
		$(this.DOM.dsi[0]).css({ width: 370 });
		$(this.DOM.tech[0]).css({ width: 570 });
		$(this.DOM.collaborators[0]).css({ width: 940 });
	};

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
				this.parentOrg = parentOrg;

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
			.select("DISTINCT ?org_label ?activity ?activity_label ?adsi_label ?lat ?long ?org")
			.where("?org", "a", "o:Organization")
			.where("?org", "rdfs:label", "?org_label")
			.where("?am", "a", "ds:ActivityMembership")
			.where("?am", "ds:organization", "?org")
			.where("?am", "ds:activity", "?activity")
			.where("?activity", "rdfs:label", "?activity_label")
			.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
			.where("?adsi", "rdfs:label", "?adsi_label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "geo:long", "?long")
			.where("?org_site", "geo:lat", "?lat")
			.where("FILTER (?activity_label IN (" + projectsStr + "))", "", "")
			.where("FILTER (?org_label != \"" + parentOrg + "\")", "", "")
			.execute()
			.then(function(results) {
				var collabData = this.cleanResults(results);

				collabData = collabData.reduce(function(memo, collab) {
					var index = indexOfProp(memo, "org_label", collab.org_label);

					if (index < 0) {
						collab.adsi_labels = [ { name: collab.adsi_label, count: 1 } ];
						collab.activity_urls = [ collab.activity_url ];
						collab.activity_labels = [ collab.activity_label ];

						delete collab.adsi_label;
						delete collab.activity_url;
						delete collab.activity_label;

						memo.push(collab);
					}
					else {
						var adsiIndex = indexOfProp(memo[index].adsi_labels, "name", memo[index].adsi_label);

						if (adsiIndex < 0) {
							memo[index].adsi_labels.push({ name: collab.adsi_label, count: 1 });
						}
						else {
							memo[index].adsi_labels[adsiIndex].count++;
						}

						if (memo[index].activity_urls.indexOf(collab.activity_url) < 0) {
							memo[index].activity_urls.push(collab.activity_url);
						}

						if (memo[index].activity_labels.indexOf(collab.activity_label) < 0) {
							memo[index].activity_labels.push(collab.activity_label);
						}
					}

					return memo;
				}, []);

				collabData.forEach(function(collab) {
					collab.activity_labels.forEach(function(activity_label) {
						var index = indexOfProp(this.data, "activity_label", activity_label);

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
				}.bind(this));

				callback();
			}.bind(this));
	};

	Stats.prototype.draw = function() {
		this.drawDSIAreas();
		this.drawTechnologyAreas();
		this.drawCollaborators();
	};

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
		var hexData = this.data.reduce(function(memo, data) {
			var url = data.activity_url.substr(data.activity_url.lastIndexOf("/") + 1);
			url = "http://digitalsocial.eu/projects/" + url;

			data.adsi_labels.forEach(function(adsi) {
				var name = VizConfig.dsiAreasByLabel[adsi].id;
				var index = indexOfProp(memo, "areaOfDSI", name);

				if (index < 0) {
					memo.push({
						areaOfDSI: name,
						color: VizConfig.dsiAreasByLabel[adsi].color,
						count: 1,
						projects: [ { name: data.activity_label, url: url } ]
					});
				}
				else {
					memo[index].count++;
					memo[index].projects.push({ name: data.activity_label, url: url });
				}
			});

			return memo;
		}, []);

		var width = 300;
		var height = 300;

		this.DOM.dsi
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("class", "dsi-areas")
			.append("g")
			.chart("BigHex")
			.width(width)
			.height(height)
			.draw(hexData);
	};

	Stats.prototype.drawTechnologyAreas = function() {
		var groupedData = this.countField("tech_focuses").filter(function(object) { return (object.count > 0); });
		var maxCount = groupedData.reduce(function(memo, object) {
			return memo > object.count ? memo : object.count;
		}, -Infinity);

		var width = 228 * 2 + 60;
		var height = 300;
		var size = 90;
		var margin = 40;
		var marginTop = 70;

		var scale = d3.scale.linear()
			.domain([0, maxCount])
			.range([0, size]);

		var svg = this.DOM.tech
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("class", "tech-areas")
			.append("g")
			.attr("transform", "translate(0, " + marginTop + ")");

		svg.selectAll(".tech-bar")
			.data(groupedData)
			.enter()
			.append("rect")
			.attr("class", "tech-bar")
			.attr("x", function(d, i) {
				return i * (size + margin);
			})
			.attr("y", function(d) {
				return size - scale(d.count);
			})
			.attr("height", function(d) {
				return scale(d.count);
			})
			.attr("width", size);

		svg.selectAll(".percent")
			.data(groupedData)
			.enter()
			.append("text")
			.attr("class", "percent")
			.text(function(d) {
				var percentage = (d.count / maxCount) * 100;
				return percentage.toFixed(0) + "%";
			})
			.attr("x", function(d, i) {
				return i * (size + margin);
			})
			.attr("y", size + margin + 20);

		svg.selectAll(".title")
			.data(groupedData)
			.enter()
			.append("text")
			.attr("class", "title")
			.text(function(d) {
				return d.name;
			})
			.attr("x", function(d, i) {
				return i * (size + margin);
			})
			.attr("y", size + margin + 45);
	};

	Stats.prototype.drawCollaborators = function() {
		var width = 940;
		var height = 300;
		var r = 20;

		var svg = this.DOM.collaborators
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		var linkGroup = svg.append("g");
		var nodeGroup = svg.append("g");

		var org = {
			label: this.parentOrg,
			x: width / 2,
			y: height * 0.9,
			projects: this.data,
			adsi: this.countField("adsi_labels")
		};

		var projects = this.data.map(function(data, index, array) {
			data.x = width / 2 + (index - Math.floor(array.length / 2) + 0.5) * 120 - 40;
			data.y = height * 0.5;

			return data;
		});

		var collaborators = this.data
			.filter(function(data) {
				return data.collaborators !== undefined;
			})
			.reduce(function(memo, data) {
				memo.push.apply(memo, data.collaborators);
				return memo;
			}, [])
			.reduce(function(memo, collaborator) {
				var index = indexOfProp(memo, "org_url", collaborator.org_url);
				if (index < 0) { memo.push(collaborator); }

				return memo;
			}, [])
			.map(function(collaborator, index, array) {
				collaborator.x = width / 2 + (index - array.length / 2) * (width - 30) / array.length + 15;
				collaborator.y = height * 0.15;
				collaborator.adsi = collaborator.adsi_labels;

				return collaborator;
			}.bind(this));

		var rootNode = nodeGroup
			.selectAll(".root")
			.data([ org ])
			.enter()
			.append("g")
			.attr("class", "root");

		this.makeHexes(rootNode, r);

		var projectNodes = nodeGroup
			.selectAll(".project")
			.data(projects)
			.enter()
			.append("g")
			.attr("class", "project");

		this.makeTriangles(projectNodes, r);

		var collaboratorNodes = nodeGroup
			.selectAll(".collaborator")
			.data(collaborators)
			.enter()
			.append("g")
			.attr("class", "collaborator");

		this.makeHexes(collaboratorNodes, r * 0.7);

		var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });
		var links = [];

		links.push.apply(links, projects.map(function(project) {
			return { source: project, target: org, project: project };
		}));

		links.push.apply(links, collaborators.reduce(function(memo, collaborator) {
			collaborator.activity_urls.forEach(function(url) {
				projects
					.filter(function(project) {
						return (project.activity_url === url);
					})
					.forEach(function(project) {
						memo.push({ source: project, target: collaborator, project: project });
					});
			});

			return memo;
		}, []));

		linkGroup
			.selectAll(".link")
			.data(links)
			.enter()
			.append("path")
			.attr("class", "link")
			.style("fill", "none")
			.style("stroke", "#DDD")
			.attr("d", diagonal);
	};

	Stats.prototype.makeHexes = function(nodes, r) {
		function hexBite(x, y, r, i) {
			var a = i/6 * Math.PI * 2 + Math.PI/6;
			var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
			return [
				[x, y],
				[x + r * Math.cos(a), y + r * Math.sin(a)],
				[x + r * Math.cos(na), y + r * Math.sin(na)]
			];
		}

		function hexBorder(x, y, r, i) {
			var a = i/6 * Math.PI * 2 + Math.PI/6;
			var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
			return [
				[x + r * Math.cos(a), y + r * Math.sin(a)],
				[x + r * Math.cos(a), y + r * Math.sin(a)],
				[x + r * Math.cos(na), y + r * Math.sin(na)]
			];
		}

		function hexEdge(x, y, r, i) {
			var a = i/6 * Math.PI * 2 + Math.PI/6;
			var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
			var r2 = r ? r - 5 : 0;
			return [
				[x + r2 * Math.cos(na), y + r2 * Math.sin(na)],
				[x + r2 * Math.cos(a), y + r2 * Math.sin(a)],
				[x + r * Math.cos(a), y + r * Math.sin(a)],
				[x + r * Math.cos(na), y + r * Math.sin(na)]
			];
		}

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var x = item.x;
					var y = item.y;
					return "M" + hexBite(x, y, r + 2, i).join("L") + "Z";
				})
				.attr("stroke", function(d) { return d.projects ? "#EEE" : "none"; })
				.attr("fill", "#FFF");
		});

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var x = item.x;
					var y = item.y;
					return "M" + hexBorder(x, y, r + 2, i).join("L") + "Z";
				})
				.attr("stroke", function(d) { return d.projects ? "#999" : "#999"; })
				.attr("fill", "none");
		});

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var x = item.x;
					var y = item.y;

					var path;
					var areaR = 0;

					var index = indexOfProp(item.adsi, "name", VizConfig.dsiAreas[i].label);
					if (index >= 0) {
						areaR = Math.min(r, 5 + 2 * item.adsi[index].count);
					}
					path = "M" + hexBite(x, y, areaR, i).join("L") + "Z";

					return path;
				})
				.attr("fill", VizConfig.dsiAreas[i].color)
				.attr("stroke", function(d) {
					return (!d.project) ? "#FFF" : "none";
				});
		});
	};

	Stats.prototype.makeTriangles = function(nodes, r) {
		function triangleBite(x, y, r, tr, i) {
			var a = Math.PI / 3;
			var trMod = tr;
			var yMod = y;
			var yMod2 = Math.sin(a) * r;
			x += tr * ((i % 2) - 1.5);

			if (i % 2 === 0) {
				trMod *= i / 2;
				trMod += tr / 2;
				yMod += Math.sin(a) * tr;
				yMod2 = -yMod2;
			}
			else {
				trMod *= Math.floor(i / 2);
			}

			return [
				[x + trMod, yMod],
				[x - r / 2 + trMod, yMod + yMod2],
				[x + r / 2 + trMod, yMod + yMod2],
			]
		}

		function triangleBorder(x, y, r, i) {
			var ret = triangleBite(x, y, r, r, i);

			if (i === 0 || i === 5) {
				if (i === 5) {
					ret = [ ret[1], ret[2], ret[0], ret[2] ];
				}
				else {
					ret = [ ret[0], ret[1], ret[2], ret[1] ];
				}
				return ret;
			}

			return [ ret[2], ret[1] ]
		}

		function triangleEdge(x, y, r, tr, i) {
			var a = Math.PI / 3;
			var trMod = tr;
			var yMod = y;
			var yMod2 = Math.sin(a) * r;
			var r2 = r ? r - 5 : 0;
			var yMod3 = Math.sin(a) * r2;
			x += tr * ((i % 2) - 1.5);

			if (i % 2 === 0) {
				trMod *= i / 2;
				trMod += tr / 2;
				yMod += Math.sin(a) * tr;
				yMod2 = -yMod2;
				yMod3 = -yMod3;
			}
			else {
				trMod *= Math.floor(i / 2);
			}

			return [
				[x - r2 / 2 + trMod, yMod + yMod3],
				[x + r2 / 2 + trMod, yMod + yMod3],
				[x + r / 2 + trMod, yMod + yMod2],
				[x - r / 2 + trMod, yMod + yMod2],
			]
		}

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var x = item.x;
					var y = item.y;
					return "M" + triangleBite(x, y, r + 2, r + 2, i).join("L") + "Z";
				})
				.attr("stroke", function(d) { return d.projects ? "#EEE" : "none"; })
				.attr("fill", "#FFF")
		});

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var x = item.x;
					var y = item.y;
					return "M" + triangleBorder(x, y, r + 2, i).join("L") + "Z";
				})
				.attr("stroke", function(d) { return d.projects ? "#999" : "#999"; })
				.attr("fill", "none");
		});

		fn.sequence(0,6).forEach(function(i) {
			nodes
				.append("path")
				.attr("d", function(item, itemIndex) {
					var path;
					var edgeR = 0;

					var x = item.x;
					var y = item.y;

					var index = item.adsi_labels.indexOf(VizConfig.dsiAreas[i].label);
					if (index >= 0) { edgeR = r + 2; }

					path = "M" + triangleBite(x, y, edgeR, r + 2, i).join("L") + "Z";

					return path;
				})
				.attr("fill", VizConfig.dsiAreas[i].color);
		});
	};

	Stats.prototype.drawCollaboratorsMap = function() {
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
				var dsiArea = VizConfig.dsiAreas[i].label;
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
					.attr("fill", VizConfig.dsiAreas[i].color);
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
			document.location.href = url;
		});
	};

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

	return Stats;
}());
