/*global d3, SPARQLDataSource */

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

function Choropleth(dom, colorScale) {
	// will be filled after SPARQL query
	this.maxCount = 0;
	this.techNames = [];
	this.adsiNames = [];
	this.data = [];

	this.colorScale = colorScale || ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"];

	this.rect = { "width": 150, "height": 50 };
	this.margin = { "top": 50, "left": 150 };

	this.DOM = { "div": d3.select(dom) };
}

Choropleth.prototype.init = function() {
	var url = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(url);

	ds.query()
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
		.execute()
		.then(function(results) {
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

			// draw chart when data is ready;
			this.draw();
		}.bind(this));
};

Choropleth.prototype.draw = function() {
	var width = (this.techNames.length + 1) * this.rect.width + this.margin.left;
	var height = (this.adsiNames.length + 1) * this.rect.height + this.margin.top;

	var svg = this.DOM.div.append("svg")
		.attr("width", width)
		.attr("height", height);

	this.techNames.forEach(function(tech, techIndex) {
		this.drawTitle(svg, tech, "top", techIndex);
	}.bind(this));

	this.adsiNames.forEach(function(adsi, adsiIndex) {
		this.drawTitle(svg, adsi, "left", adsiIndex);
	}.bind(this));

	this.data.forEach(function(data) {
		var techIndex = this.techNames.indexOf(data.tech);
		var adsiIndex = this.adsiNames.indexOf(data.adsi);

		this.drawRect(svg, techIndex, adsiIndex, data.count);
	}.bind(this));
};

Choropleth.prototype.drawTitle = function(svg, name, orient, index) {
	svg
		.append("text")
		.text(name)
		.attr("text-anchor", function() {
			var anchor;
			if (orient === "top") {
				anchor = "middle";
			}
			else {
				anchor = "end";
			}
			return anchor;
		})
		.attr("x", function() {
			var pos = this.margin.left;

			if (orient === "top") {
				pos += (index + 1) * this.rect.width + this.rect.width / 2;
			}
			else {
				pos += this.rect.width - 12;
			}

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

			return pos;
		}.bind(this));
}

Choropleth.prototype.drawRect = function(svg, x, y, num) {
	var color = d3.scale.threshold()
		.domain([0.2, 0.4, 0.6, 0.8, 1.0])
		.range(this.colorScale);

	svg
		.append("rect")
		.attr("x", (x + 1) * this.rect.width + this.margin.left)
		.attr("y", y * this.rect.height + this.margin.top)
		.attr("width", this.rect.width)
		.attr("height", this.rect.height)
		.attr("fill", color(num / this.maxCount));
};
