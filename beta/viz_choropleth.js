/*global $, d3, SPARQLDataSource, VizConfig */

var Choropleth = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

	function Choropleth(dom, settings) {
		settings = settings || {};

		this.isDesktopBrowser = settings.isDesktopBrowser;

		// will be filled after SPARQL query
		this.maxCount = 0;
		this.techNames = [];
		this.adsiNames = [];
		this.data = [];

		this.colorScale = settings.colorScale !== undefined  ? settings.colorScale : ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"];

		this.size = {
			"width": this.isDesktopBrowser ? 994 : 768
		};

		this.rect = {
			"width": this.isDesktopBrowser ? 150 : 100,
			"height": 50
		};

		this.margin = {
			"left": 150,
			"top": 50
		};

		this.DOM = { "div": d3.select(dom) };
	}

	Choropleth.prototype.runQuery = function(offset, limit, letter) {
		var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
		var ds = new SPARQLDataSource(url);

		offset = offset || 0;
    limit = limit || 0;

		return ds.query()
			.prefix("o:", "<http://www.w3.org/ns/org#>")
			.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
			.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
			.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
			.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
			.select("?label ?country ?adsi_label ?tech_label")
			.where("?org", "a", "o:Organization")
			.where("?am", "a", "ds:ActivityMembership")
			.where("?am", "ds:organization", "?org")
			.where("?am", "ds:activity", "?activity")
			.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
			.where("?activity", "ds:technologyFocus", "?tf")
			.where("?tf", "rdfs:label", "?tech_label")
			.where("?adsi", "rdfs:label", "?adsi_label")
			.where("?org", "rdfs:label", "?label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "o:siteAddress", "?org_address")
			.where("?org_address", "vcard:country-name", "?country")
			.filter(letter ? ('FILTER regex(?label, "^' + letter + '", "i")') : '')
			.limit(limit)
      .offset(offset)
			.execute(false)
	}

	Choropleth.prototype.runQueryInBatches = function() {
    var deferred = Q.defer();
    var allResults = [];
    var self = this;
    var page = 0;
    //var resultsPerPage = 100;
    var letters = ['[A-D]','[E-G]','[H-J]','[K-O]','[P-T]','[U]', '[V-Z]'];
    function getNextPage() {
      console.log('runQueryInBatches', 'page:', page, letters[page]);
      self.runQuery(0, 0, letters[page]).then(function(results) {
        allResults = allResults.concat(results);
        console.log('runQueryInBatches', 'results:', results.length, 'total:', allResults.length);
        if (page < letters.length - 1) {
          page++;
          setTimeout(getNextPage, 1);
        }
        else {
          deferred.resolve(allResults);
        }
      })
    }

    getNextPage();
    return deferred.promise;
  }

	Choropleth.prototype.init = function() {
		var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
		var ds = new SPARQLDataSource(url);

		this.runQueryInBatches().then(function(results) {
				this.data = results.reduce(function(memo, result) {
					var key = result.adsi_label.value + " " + result.tech_label.value;
					var keyIndex = indexOfProp(memo, "key", key);

					if (this.adsiNames.indexOf(result.adsi_label.value) < 0) {
						this.adsiNames.push(result.adsi_label.value);
					}

					if (this.techNames.indexOf(result.tech_label.value) < 0) {
						this.techNames.push(result.tech_label.value);
					}

					if (keyIndex < 0) {
						memo.push({
							"key": key,
							"adsi": result.adsi_label.value,
							"tech": result.tech_label.value,
							"count": 1
						});
					}
					else {
						memo[keyIndex].count++;
					}

					return memo;
				}.bind(this), []);

				this.maxCount = this.data.reduce(function(memo, object) {
					if (object.count > memo) { memo = object.count; }
					return memo;
				}, -Infinity);

				// get case studies and draw chart
				this.getCaseStudies(function() {
					this.draw();
				}.bind(this));
			}.bind(this));
	};

	Choropleth.prototype.getCaseStudies = function(callback) {
		var apiUrl = "http://content.digitalsocial.eu/api/get_page/?slug=case-studies&children=true";
		d3.json(apiUrl, function(caseStudiesData) {
			caseStudiesData = caseStudiesData.page.children.map(function(data) {
				var arrayFromCustomField = function(customField) {
					if (customField) {
						customField = customField[0];

						if (customField && customField.indexOf(",") >= 0) {
							customField = customField.split(",").map(function(value) { return value.replace(/^\s+|\s+$/g, ""); });
						}
						else {
							customField = [ customField ];
						}
					}
					else {
						customField = [];
					}

					return customField;
				};

				// prepare tech focus array
				var techFocus = arrayFromCustomField(data.custom_fields["tech-focus"]);
				var areaOfDSI = arrayFromCustomField(data.custom_fields["area-of-digital-social-innovation"]);

				// return parsed object
				return {
					"name": data.title,
					"url": data.url,
					"areaOfDSI": areaOfDSI,
					"techFocus": techFocus
				};
			});

			// merge case studies with this.data
			this.data = this.data.map(function(data) {
				var adsiKey = data.adsi.toLowerCase().replace(/\ /g, "-");
				var techKey = data.tech.toLowerCase().replace(/\ /g, "-");

				data.caseStudies = caseStudiesData.filter(function(caseStudy) {
					var dsiMatches = caseStudy.areaOfDSI.indexOf(adsiKey) >= 0;
					var techMatches = caseStudy.techFocus.indexOf(techKey) >= 0;

					return dsiMatches && techMatches;
				});

				return data;
			});

			callback();
		}.bind(this));
	};

	Choropleth.prototype.draw = function() {
		var height = (this.adsiNames.length + 1) * this.rect.height + this.margin.top;
		var width = this.width;

		var svg = this.DOM.div.append("svg")
			.attr("width", width)
			.attr("height", height);

		svg.append("rect")
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "#FFF")
			.on("click", function() {
				VizConfig.popup.close();
			});

		this.techNames.forEach(function(tech, techIndex) {
			this.drawTitle(svg, tech, "top", techIndex);
		}.bind(this));

		this.adsiNames.forEach(function(adsi, adsiIndex) {
			this.drawTitle(svg, adsi, "left", adsiIndex);
		}.bind(this));

		var data = this.data.map(function(data) {
			data.techIndex = this.techNames.indexOf(data.tech);
			data.adsiIndex = this.adsiNames.indexOf(data.adsi);

			return data;
		}.bind(this));

		var color = d3.scale.threshold()
			.domain([0.1, 0.4, 0.7, 1.0, 1.3])
			.range(this.colorScale);

		var rectGroups = svg.selectAll(".rect")
			.data(data)
			.enter()
			.append("g")
			.attr("class", "rect")
			.on("mouseover", function(d) {
				var html = "no case studies for this combination";

				if (d.caseStudies.length > 0) {
					html = d.caseStudies.length + " case studies for this combination";
					html += "<br><span>click to show them</span>";
				}

				VizConfig.tooltip.html(html);
				VizConfig.tooltip.show();
			})
			.on("mouseout", function() {
				VizConfig.tooltip.hide();
			})
			.on("click", function(d) {
				var popupContent;
				var windowOffset = $(svg[0]).offset();
				var rectOffset = {
					"x": (d.techIndex + 1.5) * this.rect.width + this.margin.left,
					"y": d.adsiIndex * this.rect.height + this.margin.top + this.rect.height * 0.25
				};

				if (d.caseStudies.length > 0) {
					popupContent = "<h4>Case Studies</h4>";
					popupContent += d.caseStudies.map(function(caseStudy) {
						return "<a href=\"" + caseStudy.url + "\">" + caseStudy.name + "</a>";
					}).join("");

					VizConfig.popup.html(popupContent);
					VizConfig.popup.open(rectOffset.x, rectOffset.y, windowOffset.left, windowOffset.top, { closeOnClick: true });
				}
			}.bind(this));

		rectGroups
			.append("rect")
			.attr("x", function(d) {
				return (d.techIndex + 1) * this.rect.width + this.margin.left;
			}.bind(this))
			.attr("y", function(d) {
				return d.adsiIndex * this.rect.height + this.margin.top;
			}.bind(this))
			.attr("width", this.rect.width)
			.attr("height", this.rect.height)
			.attr("fill", function(d) {
				return color(d.count / this.maxCount);
			}.bind(this));

		rectGroups
			.append("text")
			.attr("x", function(d) {
				return (d.techIndex + 1) * this.rect.width + this.margin.left + this.rect.width * 0.6;
			}.bind(this))
			.attr("y", function(d) {
				return d.adsiIndex * this.rect.height + this.margin.top + this.rect.height * 0.6;
			}.bind(this))
			.text(function(d) {
				return d.count;
			})
			.attr("text-anchor", "end");
	};

	Choropleth.prototype.drawTitle = function(svg, name, orient, index) {
		var anchor;
		if (orient === "top") {
			anchor = "middle";
		}
		else {
			anchor = "end";
		}

		var position = {};

		var text = svg
			.append("text")
			.attr("text-anchor", anchor)
			.attr("x", function() {
				var pos = this.margin.left;

				if (orient === "top") {
					pos += (index + 1) * this.rect.width + this.rect.width / 2;
				}
				else {
					pos += this.rect.width - 12;
				}

				position.x = pos;

				return pos;
			}.bind(this))
			.attr("y", function() {
				var pos = this.rect.height / 2 + 4;

				if (orient === "left") {
					pos += index * this.rect.height + this.margin.top;
				}
				else {
					pos += 4;
				}

				position.y = pos;

				return pos;
			}.bind(this));

		if (this.isDesktopBrowser) {
			text.text(name);
		}
		else {
			name = name.replace(" ", "\n");
			var names = name.split("\n");

			text
				.append("tspan")
				.attr("x", position.x)
				.text(names[0])
				.attr("dy", -10);

			text
				.append("tspan")
				.text(names[1])
				.attr("x", position.x)
				.attr("dy", 20);
		}
	};

	return Choropleth;
}());
