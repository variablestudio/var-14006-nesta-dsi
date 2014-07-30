/*global VizConfig, SPARQLDataSource, d3 */

var Explorer = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

	function Explorer(dom, settings) {
		settings = settings || {};
		this.data = []; // will be filled on SPARQL query

		this.fieldProgression = [ "tech_focuses", "tech_methods", "country", "activity_label" ];
		this.fieldIndex = 0;

		this.size = {
			"width": settings.isDesktopBrowser ? 994 : 740,
			"height": 100
		};

		this.DOM = { "div": d3.select(dom) };
	}

	Explorer.prototype.init = function() {
		var SPARQL_URL = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
		var ds = new SPARQLDataSource(SPARQL_URL);

		ds.query()
			.prefix("o:", "<http://www.w3.org/ns/org#>")
			.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
			.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
			.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
			.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
			.select("?label ?country ?activity_label ?tech_method ?tech_focus")
			.where("?org", "a", "o:Organization")
			.where("?am", "a", "ds:ActivityMembership")
			.where("?am", "ds:organization", "?org")
			.where("?am", "ds:activity", "?activity")
			.where("?activity", "rdfs:label", "?activity_label")
			.where("?activity", "ds:technologyMethod", "?tm")
			.where("?activity", "ds:technologyFocus", "?tf")
			.where("?tm", "rdfs:label", "?tech_method")
			.where("?tf", "rdfs:label", "?tech_focus")
			.where("?org", "rdfs:label", "?label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "o:siteAddress", "?org_address")
			.where("?org_address", "vcard:country-name", "?country")
			.execute()
			.then(function(results) {
				this.data = results
					.map(function(object) {
						var newObject = {};
						var key;

						for (key in object) {
							if (object.hasOwnProperty(key)) {
								newObject[key] = object[key].value;
							}
						}

						return newObject;
					})
					.reduce(function(memo, object) {
						var activityIndex = indexOfProp(memo, "activity_label", object.activity_label);

						if (activityIndex < 0) {
							memo.push({
								"activity_label": object.activity_label,
								"country": object.country,
								"city": object.city,
								"tech_methods": [ object.tech_method ],
								"tech_focuses": [ object.tech_focus ]
							});
						}
						else {
							var memoObject = memo[activityIndex];

							if (memoObject.tech_methods.indexOf(object.tech_method) < 0) {
								memoObject.tech_methods.push(object.tech_method);
							}

							if (memoObject.tech_focuses.indexOf(object.tech_focus) < 0) {
								memoObject.tech_focuses.push(object.tech_focus);
							}

							memo[activityIndex] = memoObject;
						}

						return memo;
					}, []);

			// draw on finished query
			this.draw(this.data);
		}.bind(this));
	};

	Explorer.prototype.groupByField = function(data, field) {
		var updateMemo = function(memo, value, object) {
			if (memo[value] !== undefined) {
				memo[value].push(object);
			}
			else {
				memo[value] = [ object ];
			}
		};

		return data.reduce(function(memo, object) {
			if (object[field] !== undefined) {

				if (object[field] instanceof Array) {

					object[field].forEach(function(value) {
						updateMemo(memo, value, object);
					});

				}
				else {
					updateMemo(memo, object[field], object);
				}
			}

			return memo;
		}, {});
	};

	Explorer.prototype.draw = function(data) {
		data = this.groupByField(data, this.fieldProgression[this.fieldIndex]);
		// console.log(data, this.fieldProgression[this.fieldIndex]);

		var svg = this.DOM.div.append("svg")
			.attr("width", this.size.width)
			.attr("height", this.size.height)
			.attr("class", "depth-" + this.fieldIndex);

		var totalNum = 0;
		var key;
		for (key in data) {
			if (data.hasOwnProperty(key)) {
				totalNum += data[key].length;
			}
		}

		var scale = d3.scale.linear()
			.domain([0, totalNum])
			.range([0, this.size.width]);

		var color = d3.scale.category20c();

		var currentSum = 0;
		var index = 0;
		var localData;

		var drawNextBar = function(name, depth) {
			depth += 1;

			// clear previous depths
			if (depth <= this.fieldIndex) {
				for (index = depth; index <= this.fieldIndex; index++) {
					this.DOM.div.selectAll(".depth-" + index).remove();
				}
			}

			// update field index
			this.fieldIndex = depth;

			// draw next depth
			if (this.fieldIndex < this.fieldProgression.length) {
				this.draw(data[name]);
			}
		};

		for (key in data) {
			if (data.hasOwnProperty(key)) {
				localData = data[key];

				this.drawBar(svg, currentSum, localData.length, index, scale, color, key, this.fieldIndex, drawNextBar.bind(this));

				currentSum += data[key].length;
				index++;
			}
		}
	};

	Explorer.prototype.drawBar = function(svg, currentSum, count, index, scale, color, title, depth, callback) {
		var text = null;
		var fillColor = color(index);

		svg.append("rect")
			.attr("class", "grouping")
			.attr("x", function() {
				return scale(currentSum);
			})
			.attr("y", 0)
			.attr("width", function() {
				return scale(count);
			})
			.attr("height", this.size.height)
			.attr("fill", fillColor)
			.on("click", function() {
				text.style("fill", "#333");

				callback(title, depth);
			}.bind(this))
			.on("mouseover", function() {
				VizConfig.tooltip.show();
				VizConfig.tooltip.html(title + " : " + count + "<br><span>click to expand</span>", "#FFF", fillColor);
			})
			.on("mouseout", function() {
				VizConfig.tooltip.hide();
			});

		text = svg.append("text")
			.attr("x", function() {
				return scale(currentSum) + 20;
			})
			.attr("y", 40)
			.attr("class", "title")
			.text(title);
	};

	return Explorer;
}());
