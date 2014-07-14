/*global d3 */

function MainStats(dom) {
	this.domName = dom;
	this.DOM = {
		div: d3.select(dom)
	};

	this.stats = [
		{
			predicate: "ds:technologyMethod",
			name: "Technology Method",
			image: "assets/iconchart-triangle.png",
			imageSize: { width: 13, height: 14 },
			width: 124,
			margin: 4
		}
	];
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

MainStats.prototype.draw = function() {
// 'ds:organizationType');
// 'ds:activityType');
// 'ds:areaOfSociety');
// 'ds:technologyFocus');
//);
// 'ds:areaOfDigitalSocialInnovation');

	this.stats.forEach(function(stat) {
		this.getPredicate(stat.predicate).then(function(data) {
			this.drawSection(stat, data);
		}.bind(this));
	}.bind(this));


};

MainStats.prototype.drawSection = function(section, data) {
	var div = this.DOM.div
		.append("div")
		.attr("class", "section section-" + section.predicate.split(":")[1]);

	div.append("div")
		.attr("class", "title")
		.text(section.name);

	div.append("div")
		.attr("class", "subtitle")
		.text("Total: " + data.reduce(function(memo, d) {
			return memo + d.count;
		}, 0));

	var height = 0;
	var columnsPerRow = Math.floor($(this.domName).width() / (section.width + section.margin * 2));

	data.forEach(function(data, index) {
		if (index % columnsPerRow === 0) {
			height = this.estimateIconChartHeight(section.width, section.imageSize, data.count);
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
			.image(section.image)
			.imageSize(section.imageSize);

		chart.draw(fn.sequence(0, data.count));

		column.append("div")
			.attr("class", "count")
			.text(data.count);

		column.append("div")
			.attr("class", "name")
			.style("height", 60)
			.style("width", section.width)
			.text(data.value);

	}.bind(this));
};
