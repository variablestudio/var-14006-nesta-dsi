/*global d3 */

var maxCount = 50; // TODO: should be calculated from data
var rectWidth = 150;
var rectHeight = 50;

var drawRect = function(x, y, num, techName, areaName) {
	var color = d3.scale.threshold()
		.domain([0.2, 0.4, 0.6, 0.8, 1.0])
		.range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

	d3.select("body")
		.select("svg")
		.append("rect")
		.attr("x", x * rectWidth)
		.attr("y", y * rectHeight)
		.attr("width", rectWidth)
		.attr("height", rectHeight)
		.attr("fill", color(num / maxCount));
};

var addTitle = function(orient, name, index) {
	d3.select("body")
		.select("svg")
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
			var pos;
			if (orient === "top") {
				pos = index * rectWidth + rectWidth / 2;
			}
			else {
				pos = rectWidth - 8;
			}
			return pos;
		})
		.attr("y", function() {
			var pos = rectHeight / 2;
			if (orient === "left") {
				pos += index * rectHeight;
			}
			return pos;
		});
};

var buildChart = function(data) {
	var techNames = data.reduce(function(memo, data) {
		var index = memo.indexOf(data.tech);
		if (index < 0 && data.tech.length > 0) { 
			memo.push(data.tech); 
		}
		return memo;
	}, []);

	var areaNames = [ "open democracy", "new ways of making", "awareness networks for sustainable change", "collaborative economy", "open access", "social innovation" ];

	console.log(techNames, areaNames);

	d3.select("body")
		.append("svg")
		.attr("width", rectWidth * (techNames.length + 1))
		.attr("height", rectHeight * (areaNames.length + 1));

	techNames.forEach(function(tech, techIndex) {
		addTitle("top", tech.replace("-", " "), techIndex + 1);
	});

	areaNames.forEach(function(area, areaIndex) {
		addTitle("left", area, areaIndex + 1);
	});

	techNames.forEach(function(tech, techIndex) {
		areaNames.forEach(function(area, areaIndex) {
			var num = data.reduce(function(memo, object) {
				if (+object[area] === 1 && object.tech === tech) { memo++; }
				return memo;
			}, 0);
			drawRect(techIndex + 1, areaIndex + 1, num, tech, area);
		});
	});
};

// sample data
// {
// 	"DSI Project": "OpenDataCommunities",
// 	"description": "Linked Open Data for the UK Department of Communities and Local Government. ",
// 	"tech": "open-data",
// 	"tags": "work-and-employment health-and-wellbeing education-and-skills finance-and-economy neighbourhood-regeneration",
// 	"url": "http://data.digitalsocial.eu/id/activity/7795ec63-2cec-dc77-f953-e176368bf0ff",
// 	"open democracy": "1",
// 	"new ways of making": "",
// 	"awareness networks for sustainable change": "",
// 	"collaborative economy": "",
// 	"open access": "1",
// 	"social innovation": ""
// }

d3.csv("data/new_schema_values_filled_clean.csv", buildChart);
