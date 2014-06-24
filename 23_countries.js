/*global d3 */

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

var buildChart = function(data) {
	var width = 120;
	var height = 160;

	data.forEach(function(data) {
		d3.json("/assets/countries/" + data.country_code + ".geo.json", function(geo) {
			var projection = d3.geo.mercator()
				.scale(1)
				.translate([ 0, 0 ]);

			// auto scale using path
			var path = d3.geo.path().projection(projection);
			var bounds = path.bounds(geo);
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
			var svg = d3.select("body")
				.append("svg")
				.attr("class", data.country_code)
				.attr("width", width)
				.attr("height", height);

			svg.append("path")
				.datum(geo)
				.attr("d", d3.geo.path().projection(projection));

			svg.append("text")
				.text(data.country);
		});
	});
};

var prepareData = function(data, callback) {
	d3.json("/assets/countries/all.json", function(countries) {
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

		data = data
			.map(function(object) {
				var index = indexOfProp(countries, "name", object.country);

				if (index > 0) {
					object.country_code = countries[index]["alpha-3"];
				}
				else {
					console.log("no coded for " + object.country);
				}

				return object;
			})
			.reduce(function(memo, object) {
				var index = indexOfProp(memo, "country", object.country);

				if (index < 0) {
					memo.push(object);
				}

				return memo;
			}, []);

		callback(data);
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


d3.json("03_data.json", function(data) {
	prepareData(data, buildChart);
});

