/*global SPARQLDataSource, d3 */

// run query on sparql (true) or use local copy (false)?
var RUN_QUERY = false;

// http://www.colourlovers.com/palette/953498/Headache
var techColors = {
	"Open Networks": "#655643",
	"Open Data": "#80BCA3",
	"Open Knowledge": "#E6AC27",
	"Open Hardware": "#BF4D28"
};

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

var sumInObject = function(object) {
	var sum = 0, key;

	for (key in object) {
		if (object.hasOwnProperty(key)) {
			sum += object[key];
		}
	}

	return sum;
};

var buildVis = function(organization, globalSum) {
	var width = 440;
	var height = 20;
	var margin = 200;

	var svg = d3.select("body").append("svg")
		.attr("width", width * 2 + margin)
		.attr("height", height);

	var maxCount = 0;
	var key;

	for (key in organization.focus_count) {
		if (organization.focus_count.hasOwnProperty(key)) {
			maxCount += organization.focus_count[key];
		}
	}

	var scaleLocal = d3.scale.linear()
		.domain([0, maxCount])
		.range([0, width]);

	var scaleGlobal = d3.scale.linear()
		.domain([0, globalSum])
		.range([0, width]);

	var buildChart = function(num, currentSum, scale, offset) {
		svg.append("rect")
			.attr("x", function() {
				return scale(currentSum) + offset + margin;
			})
			.attr("y", 0)
			.attr("width", function() {
				return scale(num);
			})
			.attr("height", height)
			.attr("fill", function() {
				return techColors[key];
			})
			.on("mouseover", function() {
				console.log("[" + organization.label + "]");
				console.log("  activity labels: " +  organization.activity_label);
				console.log("  tech focuses: " + JSON.stringify(organization.focus_count));
				console.log("  tech methods: " + organization.tech_method);
			});
	};

	var currentSum = 0, num;

	for (key in organization.focus_count) {
		if (organization.focus_count.hasOwnProperty(key)) {
			num = organization.focus_count[key];

			buildChart(num, currentSum, scaleLocal, 0);
			buildChart(num, currentSum, scaleGlobal, width + 20);

			currentSum += num;
		}
	}

	svg.append("text")
		.attr("class", "title")
		.text(organization.label + " [" + organization.activity_label.length  + "]")
		.attr("text-anchor", "end")
		.attr("x", margin - 10)
		.attr("y", 14);
};

var buildChart = function(data) {
	// nicer data access
	data = data
		.map(function(object) {
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

	data = data
		.reduce(function(memo, object) {
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

	var maxSum = data.reduce(function(memo, object) {
		var sum = sumInObject(object.focus_count);

		return sum > memo ? sum : memo;
	}, -Infinity);

	data
		.sort(function(a, b) {
			var sorting = 0;

			if (a.activity_label.length > b.activity_label.length) {
				sorting = -1;
			}
			else if (a.activity_label.length < b.activity_label.length) {
				sorting = 1;
			}

			return sorting;
		})
		.forEach(function(object) {
			buildVis(object, maxSum);
		});

	// sample data
	//
	// "org": "http://data.digitalsocial.eu/id/organization/faaefa6f-4696-1514-c54d-5d7f0499fb89",
	// "label": "Swirrl",
	// "long": -2.234564,
	// "lat": 53.481895,
	// "country": "United Kingdom",
	// "city": "Manchester",
	// "org_type": "http://data.digitalsocial.eu/def/concept/organization-type/business",
	// "activity_label": [ "Digital Social Innovation ", "OpenDataCommunities", "Hampshire Linked Data", "Smart Journey" ],
	// "tech_method": [ "big data", "open data", "crowdfunding", "crowdmapping", "crowdsourcing", "online learning models and MOOCS", "social networks", "3D printing", "open source", "social media" ],
	// "tech_focus": [ "Open Networks", "Open Data", "Open Knowledge", "Open Hardware" ]
};

if (RUN_QUERY) {
	var SPARQL_URL = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
	var ds = new SPARQLDataSource(SPARQL_URL);

	ds.query()
		.prefix("o:", "<http://www.w3.org/ns/org#>")
		.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
		.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
		.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
		.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
		.select("?org ?label ?long ?lat ?country ?city ?org_type ?activity_label ?tech_method ?tech_focus")
		.where("?org", "a", "o:Organization")
		.where("?org", "ds:organizationType", "?org_type")
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
		.where("?org_site", "geo:long", "?long")
		.where("?org_site", "geo:lat", "?lat")
		.where("?org_site", "o:siteAddress", "?org_address")
		.where("?org_address", "vcard:country-name", "?country")
		.where("?org_address", "vcard:locality", "?city")
		.execute()
		.then(buildChart);
}
else {
	d3.json("03_data.json", buildChart);
}
