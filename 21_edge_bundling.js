/*global d3 */

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

var buildChart = function(data) {
	data = data.map(function(object) {
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

	data = data.reduce(function(memo, object) {
		var index = indexOfProp(memo, "label", object.label);

		if (index < 0) {
			var focusCount = {};
			focusCount[object.tech_focus] = 1;

			delete object.tech_focus;
			object.focus_count = focusCount;
			object.activity_label = [ object.activity_label ];
			object.tech_method = [ object.tech_method ];

			memo.push(object);
		}
		else {
			var targetObject = memo[index];

			// only count focus_count using distinct! tech_method
			if (targetObject.focus_count[object.tech_focus]) {
				targetObject.focus_count[object.tech_focus]++;
			}
			else {
				targetObject.focus_count[object.tech_focus] = 1;
			}

			if (targetObject.activity_label.indexOf(object.activity_label) < 0) {
				targetObject.activity_label.push(object.activity_label);
			}

			if (targetObject.tech_method.indexOf(object.tech_method) < 0) {
				targetObject.tech_method.push(object.tech_method);
			}

			memo[index] = targetObject;
		}

		return memo;
	}, []);

	// cluster by country
	data = data.reduce(function(memo, object) {
		var index = indexOfProp(memo, "name", object.label);
		var prepareActivityLabel = function(activities) {
			return activities.map(function(name) {
				return { "name" : name };
			}) || [];
		};

		if (index < 0) {
			memo.push({
				"name": object.label,
				"data": object
			});
		}

		return memo;
	}, []);

	data = { "name": "root", "children": data };

	var width = 1280;
	var height = 960;
	var rx = width / 2;
	var ry = height / 2;

	var nodes = d3.layout.cluster()
		.size([360, ry / 2])
		.nodes(data);

	var createLinks = function(data) {
		var links = data.reduce(function(memo, object, objectIndex) {
			if (object.name === "root") { return memo; }

			if (object.data.activity_label) {
				object.data.activity_label.map(function(activityName) {
					var indexes = data.reduce(function(memo, dataObject, index) {
						if (dataObject.data && dataObject.data.activity_label.indexOf(activityName) > 0) {
							memo.push(index);
						}
						return memo;
					}, []);

					indexes = indexes.filter(function(index) {
						return index !== objectIndex;
					}).map(function(index) {
						return { "source": data[index], "target": object };
					});

					memo.push.apply(memo, indexes);
				});
			}

			return memo;
		}, []);

		return links;
	};

	var bundle = d3.layout.bundle();

	var line = d3.svg.line.radial()
		.interpolate("bundle")
		.tension(0.8)
		.radius(function(d) { return d.y; })
		.angle(function(d) { return d.x / 180 * Math.PI; });

	var svg = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
    .attr("transform", "translate(" + rx + "," + ry + ")");

	var links = createLinks(nodes);
	var splines = bundle(links);

	svg.selectAll(".link")
		.data(links)
		.enter()
		.append("path")
		.attr("class", "link")
		.attr("d", function(d, i) {
			return line(splines[i]);
		});

	svg.selectAll(".node")
		.data(nodes.filter(function(n) {
			return !n.children
		}))
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("transform", function(d) { 
			return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
		})
		.append("text")
		.attr("dx", function(d) { 
			return d.x < 180 ? 8 : -8; 
		})
		.attr("dy", ".31em")
		.attr("text-anchor", function(d) { 
			return d.x < 180 ? "start" : "end"; 
		})
		.attr("transform", function(d) { 
			return d.x < 180 ? null : "rotate(180)"; 
		})
		.text(function(d) { 
			return d.name; 
		});
};

// example data
// "org": "http://data.digitalsocial.eu/id/organization/faaefa6f-4696-1514-c54d-5d7f0499fb89",
// "label": "Swirrl",
// "long": -2.234564,
// "lat": 53.481895,
// "country": "United Kingdom",
// "city": "Manchester",
// "org_type": "http://data.digitalsocial.eu/def/concept/organization-type/business",
// "activity_label": [
// 	"Digital Social Innovation ",
// 	"OpenDataCommunities",
// 	"Hampshire Linked Data",
// 	"Smart Journey"
// ],
// "tech_method": [
// 	"big data",
// 	"open data",
// 	"crowdfunding",
// 	"crowdmapping",
// 	"crowdsourcing",
// 	"online learning models and MOOCS",
// 	"social networks",
// 	"3D printing",
// 	"open source",
// 	"social media"
// ],
// "focus_count": {
// 	"Open Networks": 8,
// 	"Open Data": 17,
// 	"Open Knowledge": 12,
// 	"Open Hardware": 8
// }


d3.json("03_data.json", buildChart);

