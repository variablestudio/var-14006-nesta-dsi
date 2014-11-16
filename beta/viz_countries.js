/*global $, d3, SPARQLDataSource, VizConfig */

var Countries = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

	function Countries(div, settings) {
		settings = settings || {};
		this.isDesktopBrowser = settings.isDesktopBrowser !== undefined ? settings.isDesktopBrowser : true;

		this.ADSILabels = [];  // will be filled on SPARQL query
		this.ADSIMaxCount = 0; // will be filled on SPARQL query

		this.data = []; // will be filled on SPARQL query

		// cache DOM elements
		this.DOM = { "div": d3.select(div) };

		this.GEO_ASSET = VizConfig.assetsPath + "/world-countries-hires.geo.json";
		// this.GEO_ASSET = VizConfig.assetsPath + "/eu.geo.json";
		// this.GEO_ASSET = VizConfig.assetsPath + "/all_countries.json";
	}

	// runs query, calls this.draw() when finished
	Countries.prototype.init = function() {
		var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
		var ds = new SPARQLDataSource(url);

		ds.query()
			.prefix("o:", "<http://www.w3.org/ns/org#>")
			.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
			.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
			.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
			.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
			.prefix("reach:", "<http://data.digitalsocial.eu/def/ontology/reach/>")
			.select("DISTINCT ?country")
			.where("?org", "a", "o:Organization")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "o:siteAddress", "?org_address")
			.where("?org_address", "vcard:country-name", "?country")
			.execute()
			.then(function(results) {
				var countries = results.map(function(result) {
					return result.country.value;
				});

				var countriesWithData = countries.reduce(function(memo, country) {
					memo[country] = {
						data: null,
						loaded: false
					};
					return memo;
				}, {});

				var checkIfLoaded = function() {
					var loaded = true;
					var key;

					for (key in countriesWithData) {
						if (countriesWithData.hasOwnProperty(key)) {
							loaded = loaded && countriesWithData[key].loaded;
						}
					}

					if (loaded) {
						var data = [];

						for (key in countriesWithData) {
							if (countriesWithData.hasOwnProperty(key)) {
								if (countriesWithData[key].data) {
									data.push(countriesWithData[key].data);
								}
							}
						}

						// gather all possible labels
						this.ADSILabels = data.reduce(function(memo, data) {
							var label;
							for (label in data.adsi_labels) {
								if (data.adsi_labels.hasOwnProperty(label)) {
									if (memo.indexOf(label) < 0) { memo.push(label); }
								}
							}

							return memo;
						}, []);

						data.sort(function(a, b) {
							return -(a.projects_count - b.projects_count);
						});

						// add empty labels
						data = data.map(function(object) {
							this.ADSILabels.forEach(function(adsiLabel) {
								if (object.adsi_labels.hasOwnProperty(adsiLabel)) {
									// find max count for bar chart scaling
									if (object.adsi_labels[adsiLabel] > this.ADSIMaxCount) {
										this.ADSIMaxCount = object.adsi_labels[adsiLabel];
									}
								}
								else {
									// insert 0 for empty labels in object
									object.adsi_labels[adsiLabel] = 0;
								}
							}.bind(this));

							return object;
						}.bind(this));

						// add geography to data, and callback when finished
						if (this.GEO_ASSET.indexOf("all_countries.json") > -1) {
							$.getJSON(this.GEO_ASSET, function(countries) {
								data = data
									.map(function(object) {
										var index = indexOfProp(countries, "name", object.country);

										if (index > 0) {
											object.country_code = countries[index]["alpha-3"];
											object.geo = JSON.parse(countries[index].geo);
										}
										else {
											// remove countries that are not all_countries.json file
											object = null;
										}

										return object;
									})
									.filter(function(object) {
										return (object !== null);
									});

								// save data
								this.data = data;

								// draw when done
								this.draw();
							}.bind(this));
						}

						else if (this.GEO_ASSET.indexOf("eu.geo.json") > -1 || this.GEO_ASSET.indexOf("world-countries-hires.geo.json") > -1) {
							$.getJSON(this.GEO_ASSET, function(countries) {
								countries.features.forEach(function(country) {
									var name = country.properties.NAME;
									var index = indexOfProp(data, "country", name);

									if (index >= 0) {
										data[index].geo = country;
									}
								});

								// remove countries not in geojson
								data = data.filter(function(data) {
									return data.geo;
								});

								// save data
								this.data = data;

								// draw when done
								this.draw();
							}.bind(this));
						}

						else {
							console.error("no transform for asset: " + this.GEO_ASSET);
						}
					}
				}.bind(this);

				countries.forEach(function(country) {
					this.getCountryData(country, function(data) {
						countriesWithData[country] = {
							data: data,
							country: country,
							loaded: true
						};

						checkIfLoaded();
					});
				}.bind(this));
			}.bind(this));
	};

	Countries.prototype.draw = function() {
		VizConfig.events.fire("countries");

		var numCountries = this.isDesktopBrowser ? 8 : 6;

		this.data.forEach(function(data, dataIndex) {
			var div = this.DOM.div.append("div").attr("class", "map " + data.country_code);

			var barChartDiv = div.append("div").attr("class", "area-chart");
			this.drawBarChart(barChartDiv, data);

			var projectCountDiv = div.append("div").attr("class", "project-count");
			this.drawProjectCount(projectCountDiv, data);

			var countryNameDiv = div.append("div").attr("class", "country-name");
			this.drawCountryName(countryNameDiv, data);

			var mapDiv = div.append("div").attr("class", "country");
			this.drawMap(mapDiv, data);

			if (dataIndex >= numCountries) { $(div[0]).hide(); }
		}.bind(this));
	};

	Countries.prototype.getCountryData = function(country, callback) {
		var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
		var ds = new SPARQLDataSource(url);

		ds.query()
			.prefix("o:", "<http://www.w3.org/ns/org#>")
			.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
			.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
			.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
			.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
			.prefix("reach:", "<http://data.digitalsocial.eu/def/ontology/reach/>")
			.select("?label ?adsi_label ?country")
			.where("?org", "a", "o:Organization")
			.where("?am", "a", "ds:ActivityMembership")
			.where("?am", "ds:organization", "?org")
			.where("?am", "ds:activity", "?activity")
			.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
			.where("?adsi", "rdfs:label", "?adsi_label")
			.where("?org", "rdfs:label", "?label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "o:siteAddress", "?org_address")
			.where("?org_address", "vcard:country-name", "?country")
			.where("FILTER regex(str(?country), \"" + country + "\")", "", "")
			.execute()
			.then(function(results) {
				// easier key acces
				var data = results.map(function(object) {
					var newObject = {};
					var key;
					for (key in object) {
						if (object.hasOwnProperty(key)) { newObject[key] = object[key].value; }
					}

					return newObject;
				});

				// prepare data
				data = data.reduce(function(memo, object) {
					var index = indexOfProp(memo, "country", object.country);

					if (index < 0) {
						object.adsi_labels = {};
						object.adsi_labels[object.adsi_label] = 1;
						object.projects_count = 1;
						delete object.adsi_label;
						delete object.label;
						object.funds_invested = object.funds_invested || 0;

						memo.push(object);
					}
					else {
						if (memo[index].adsi_labels[object.adsi_label]) {
							memo[index].adsi_labels[object.adsi_label]++;
						}
						else {
							memo[index].adsi_labels[object.adsi_label] = 1;
						}

						memo[index].funds_invested += object.funds_invested || 0;
						memo[index].projects_count++;
					}

					return memo;
				}, []);

				callback(data[0]);
			});
	};

	Countries.prototype.drawBarChart = function(div, data) {
		//(8*14+14)*8-14
		var width = 100; //8*14
		var height = 80;
		var barWidth = 12;

		var scaleX = d3.scale.ordinal()
			.domain(this.ADSILabels)
			.rangeBands([0, width]);

		var scaleY = d3.scale.linear()
			.domain([0, this.ADSIMaxCount])
			.range([height, 0]);

		var rectData = [];
		var adsiLabel;
		for (adsiLabel in data.adsi_labels) {
			if (data.adsi_labels.hasOwnProperty(adsiLabel)) {
				rectData.push({ "name": adsiLabel, "count": data.adsi_labels[adsiLabel] });
			}
		}

		var svg = div.append("svg")
			.attr("width", width)
			.attr("height", height);

		svg.selectAll(".rect")
			.data(rectData)
			.enter()
			.append("rect")
			.attr("x", function(d) {
				return scaleX(d.name);
			})
			.attr("y", function(d) {
				return scaleY(d.count);
			})
			.attr("width", barWidth)
			.attr("height", function(d) {
				return height - scaleY(d.count);
			})
			.attr("fill", function(d) {
				return VizConfig.dsiAreasByLabel[d.name].color;
			}.bind(this))
			.on('mouseover', function(d) {
				VizConfig.tooltip.show();
				VizConfig.tooltip.html(d.name + ' : ' + d.count, '#FFF', VizConfig.dsiAreasByLabel[d.name].color);
			})
			.on('mouseout', function() {
				VizConfig.tooltip.hide();
			});
	};

	Countries.prototype.drawProjectCount = function(div, data) {
		div.append("div")
			.attr("class", "title")
			.text("PROJECTS");

		div.append("div")
			.attr("class", "count")
			.text(data.projects_count);
	};

	Countries.prototype.drawCountryName = function(div, data) {
		div.text(data.country);
	};

	Countries.prototype.drawMap = function(div, data) {
			var width = 100;
			var height = 100;

			// initial projection
			var projection = d3.geo.mercator().scale(1).translate([ 0, 0 ]);

			// auto scale using path
			var path = d3.geo.path().projection(projection);
			var bounds = path.bounds(data.geo);
			var scale = 0.98 / Math.max(
				(bounds[1][0] - bounds[0][0]) / width,
				(bounds[1][1] - bounds[0][1]) / height
			);
			var translate = [
				(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
				(height - scale * (bounds[1][1] + bounds[0][1])) / 2
			];

			// update projection
			projection.scale(scale).translate(translate);

			// draw map
			var svg = div
				.append("svg")
				.attr("width", width)
				.attr("height", height);

			svg.append("path")
				.datum(data.geo)
				.attr("d", d3.geo.path().projection(projection));
	};

	return Countries;
}());
