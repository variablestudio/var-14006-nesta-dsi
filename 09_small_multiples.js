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
var techFocuses = Object.keys(techColors);

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

var visForCountry = function(data, maxVal) {
	var div = d3.select("body").append("div")
		.attr("class", "group");

	div.append("div")
		.attr("class", "title")
		.text(data[0].country);

	var width = 220;
	var height = 100;
	var margin = 20;

	var svg = div.append("svg")
		.attr("width", width + margin)
		.attr("height", height);

	var scaleY = d3.scale.linear()
		.range([height, 0])
		.domain([0, maxVal]);

	var scaleX = d3.scale.ordinal()
		.rangeBands([0, width])
		.domain(techFocuses);

	var localData = data.reduce(function(memo, object) {
		var key, index;

		for (key in object.focus_count) {
			if (object.focus_count.hasOwnProperty(key)) {
				index = techFocuses.indexOf(key);
				memo[index] += object.focus_count[key];
			}
		}
	
		return memo;
	}, [0, 0, 0, 0]);

	svg.selectAll(".bar")
		.data(localData)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("fill", function(d, i) {
			return techColors[techFocuses[i]];
		})
		.attr("x", function(d, i) {
			return scaleX(techFocuses[i]);
		})
		.attr("y", function(d) {
			return scaleY(d);
		})
		.attr("width", scaleX.rangeBand())
		.attr("height", function(d) {
			return height - scaleY(d);
		});
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
		}, [])
		.sort(function(a, b) {
			var sorting = 0;

			if (a.activity_label.length > b.activity_label.length) {
				sorting = -1;
			}
			else if (a.activity_label.length < b.activity_label.length) {
				sorting = 1;
			}

			return sorting;
		});

	var groupedData = data.reduce(function(memo, object) {
		if (memo[object.country]) {
			memo[object.country].push(object);
		}
		else {
			memo[object.country] = [ object ];
		}

		return memo;
	}, {});

	var country, values;

	var findMax = function(data) {
		return data.reduce(function(memo, object) {
			var key, index;

			for (key in object.focus_count) {
				if (object.focus_count.hasOwnProperty(key)) {
					index = techFocuses.indexOf(key);
					memo[index] += object.focus_count[key];
				}
			}

			return memo;
		}, [0, 0, 0, 0]);
	};

	var maxVal = 0, sum;

	for (country in groupedData) {
		if (groupedData.hasOwnProperty(country)) {
			values = groupedData[country];
			sum = findMax(values).reduce(function(memo, val) {
				return memo > val ? memo : val;
			}, -Infinity);
			if (sum > maxVal) { maxVal = sum; }
		}
	}

	for (country in groupedData) {
		if (groupedData.hasOwnProperty(country)) {
			visForCountry(groupedData[country], maxVal);
		}
	}

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
