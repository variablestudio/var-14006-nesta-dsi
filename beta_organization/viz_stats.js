/*global fn, d3, SPARQLDataSource */

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

function Stats(div, org, dsiColors) {
	this.data = []; // will be filled on SPARQL query

	this.org = org;
	this.DOM = { "div": d3.select(div) };

	this.DSIColors = dsiColors || {
		"Open Democracy": "#F9EB40",
		"New Ways of Making": "#f53944",
		"Awareness Networks": "#31ac33",
		"Collaborative Economy": '#1DAEEC',
		"Open Access": "#f274c7",
		"Funding Acceleration and Incubation": "#f79735"
	};
}

Stats.prototype.init = function() {
	var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(url);

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("?org_label ?activity_label ?adsi_label ?tech_label")
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
		.execute()
		.then(function(results) {
			this.data = results.map(function(object) {
				var newObject = {};
				var key;
				for (key in object) {
					if (object.hasOwnProperty(key)) {
						if (key === "lat" || key === "long") {
							newObject[key] = +object[key].value;
						}
						else {
							newObject[key] = object[key].value;
						}
					}
				}

				return newObject;
			});

			this.data = this.data.reduce(function(memo, object) {
				var index = indexOfProp(memo, "activity_label", object.activity_label);

				if (index < 0) {
					memo.push({
						"activity_label": object.activity_label,
						"adsi_labels": [ object.adsi_label ],
						"tech_focuses": [ object.tech_label ],
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

			this.draw();
		}.bind(this));
};

Stats.prototype.draw = function() {
	this.drawDSIAreas();
};

Stats.prototype.drawDSIAreas = function() {
	var groupedData = this.data
		.reduce(function(memo, object) {
			object.adsi_labels.forEach(function(label) {
				var index = indexOfProp(memo, "name", label);

				if (index < 0) {
					memo.push({ "name": label, "count": 1 });
				}
				else {
					memo[index].count++;
				}
			});

			return memo;
		}, [])
		.filter(function(object) {
			return (object.count > 0);
		});

	var width = 322;
	var height = 40;
	var rectWidth = 30;
	var rectHeight = 15;
	var rectMargin = 4;

	var svg = this.DOM.div
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

		fn.sequence(0, group.count).map(function(projectIndex) {
			svg.append("rect")
				.attr("x", projectIndex * (rectWidth + rectMargin))
				.attr("y", (index + 1) * height + rectMargin)
				.attr("width", rectWidth)
				.attr("height", rectHeight)
				.attr("fill", this.DSIColors[group.name]);
		}.bind(this));
	}.bind(this));
};

