	/*global d3, $, fn, Q, SPARQLDataSource, VizConfig */

function MainStats(dom, settings) {
	this.domName = dom;
	this.DOM = {
		div: d3.select(dom)
	};

	this.settings = {
		minValue: settings.minValue || 0
	};

	this.stats = [
		{
			predicate: "ds:technologyMethod",
			name: "Technology Method",
			image: VizConfig.assetsPath + "/iconchart-techmethod.png",
			imageSize: { width: 85/4, height: 69/4 },
			width: 124,
			margin: 4
		},

		{
			predicate: "ds:technologyFocus",
			name: "Technology Focus",
			image: {
				"Open Knowledge": VizConfig.assetsPath + "/iconchart-triangle.png",
				"Open Data": VizConfig.assetsPath + "/iconchart-circle.png",
				"Open Networks": VizConfig.assetsPath + "/iconchart-star.png",
				"Open Hardware": VizConfig.assetsPath + "/iconchart-rect.png"
			},
			imageSize: { width: 55/4, height: 55/4 },
			width: 124,
			margin: 4
		},

		{
			predicate: "ds:organizationType",
			name: "Organization Type",
			image: VizConfig.assetsPath + "/iconchart-hex.png",
			imageSize: { width: 58/4, height: 66/4 },
			width: 124,
			margin: 4,
			layout: "hex"
		},

		{
			predicate: "ds:activityType",
			name: "Project Type",
			image: VizConfig.assetsPath + "/iconchart-hex-empty.png",
			imageSize: { width: 55/4, height: 65/4 },
			width: 124,
			margin: 4,
			layout: "hex"
		},

		{
			predicate: "ds:areaOfSociety",
			name: "Areas of Society",
			image: VizConfig.assetsPath + "/iconchart-asterix.png",
			imageSize: { width: 56/4, height: 56/4 },
			width: 124,
			margin: 4
		}
	];

	// unfortunately cities need to be separate
	this.statsCities = {
		name: "Cities",
		image: VizConfig.assetsPath + "/iconchart-city.png",
		imageSize: { width: 50/4, height: 50/4 },
		width: 124,
		margin: 4
	};
}

MainStats.prototype.estimateIconChartHeight = function(width, imageSize, count) {
	var height = 0;
	var numPerRow = Math.floor(width / imageSize.width);
	var numRows = Math.ceil(count / numPerRow);

	height = numRows * imageSize.height;

	return height;
};

MainStats.prototype.getPredicate = function(predicate) {
	var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(SPARQL_URL);

	return ds.predicateValues(predicate);
};

MainStats.prototype.getCities = function() {
	var deferred = Q.defer();

	var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
	var ds = new SPARQLDataSource(SPARQL_URL);

	ds.query()
		.prefix('o:', '<http://www.w3.org/ns/org#>')
		.prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
		.prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
		.prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
		.prefix('vcard:', '<http://www.w3.org/2006/vcard/ns#>')
		.select('?org_label ?org_country ?org_locality')
		.where('?org', 'a', 'o:Organization')
		.where('?org', 'rdfs:label', '?org_label')
		.where('?org', 'o:hasPrimarySite', '?org_site')
		.where('?org_site', 'o:siteAddress', '?org_address')
		.where('?org_address', 'vcard:country-name', '?org_country')
		.where('?org_address', 'vcard:locality', '?org_locality')
		.execute().then(function(results) {
			var data = results.reduce(function(memo, result) {
				var index = memo.map(function(o) { return o.value; }).indexOf(result.org_locality.value);
				if (index >= 0) {
					memo[index].count++;
				}
				else {
					memo.push({
						value: result.org_locality.value,
						count: 1
					});
				}
				return memo;
			}, []);

			this.drawSection(this.statsCities, data);

			deferred.resolve();
		}.bind(this));

	return deferred.promise;
};

MainStats.prototype.init = function() {
	var statsToDo = this.stats.map(function(s) { return s; });

	var loadNext = function() {
		if (statsToDo.length > 0) {
			var stat = statsToDo.shift();
			this.getPredicate(stat.predicate).then(function(data) {
				this.drawSection(stat, data);
				setTimeout(loadNext, 1);
			}.bind(this));
		}
	}.bind(this);

	// unfortunately cities need to be separate...
	this.getCities().then(function() {
		loadNext();
	}.bind(this));
};

MainStats.prototype.drawSection = function(section, data) {
	var className = "";
	if (section.predicate) {
		className = "section-" + section.predicate.split(":")[1];
	}

	var div = this.DOM.div
		.append("div")
		.attr("class", "section " + className);

	div.append("div")
		.attr("class", "title")
		.text(section.name);

	div.append("div")
		.attr("class", "subtitle")
		.text("Total: " + data.reduce(function(memo, d) {
			return memo + d.count;
		}, 0));

	var height = 0, image;
	var columnsPerRow = Math.floor($(this.domName).width() / (section.width + section.margin * 2));

	data
		.filter(function(data) {
			return data.count >= this.settings.minValue;
		}.bind(this))
		.forEach(function(data, index) {
			if (index % columnsPerRow === 0) {
				height = this.estimateIconChartHeight(section.width, section.imageSize, data.count);
			}

			// check if section.image is hash-map
			if (typeof section.image === "object" && !(section.image instanceof Array)) {
				if (section.image.hasOwnProperty(data.value)) {
					image = section.image[data.value];
				}
			}
			else {
				image = section.image;
			}

			var column = div.append("div")
				.attr("class", "column");

			var chart = column
				.append("svg")
				.attr("width", section.width + section.margin * 2)
				.attr("height", height)
				.chart("IconChart")
				.width(section.width)
				.height(height)
				.image(image)
				.imageSize(section.imageSize)
				.layout(section.layout || "default");

			chart.draw(fn.sequence(0, data.count));

			column.append("div")
				.attr("class", "count")
				.text(data.count);

			var name = column.append("div")
				.attr("class", "name")
				.style("width", section.width)
				.text(data.value);

			// strangely setting this with d3 doesn't work...
			$(name[0]).css({ "width": section.width });
		}.bind(this));
};
