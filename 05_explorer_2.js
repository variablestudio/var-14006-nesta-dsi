/*global SPARQLDataSource, d3 */

// run query on sparql (true) or use local copy (false)?
var RUN_QUERY = false;

// grouping reducer
var groupByField = function(data, field) {
	return data.reduce(function(memo, object) {
		if (memo[object[field]] !== undefined) {
			memo[object[field]].push(object);
		}
		else {
			memo[object[field]] = [ object ];
		}
		return memo;
	}, {});
};

var fieldsProgression = [ "tech_focus", "tech_method", "activity_label" ];

var buildChooser = function(data, prop) {
	console.log("chooser", prop, data);

	var div = d3.select("body").append("div").attr("class", "chooser");

	var values = data.reduce(function(memo, object) {
		object[prop].forEach(function(key) {
			if (memo[key] !== undefined) {
				memo[key]++;
			}
			else {
				memo[key] = 1;
			}
		});

		return memo;
	}, {});

	var min = Infinity, max = -Infinity;
	var key;

	for (key in values) {
		if (values.hasOwnProperty(key)) {
			if (values[key] < min) { min = values[key]; }
			if (values[key] > max) { max = values[key]; }
		}
	}

	var scale = d3.scale.linear()
		.domain([min, max])
		.range([10, 30]);

	var createDiv = function(key, value) {
		div.append("div")
			.attr("class", "grouping")
			.style("font-size", function() {
				return scale(value) + "px";
			})
			.text(key)
			.on("click", function() {
				console.log(key);

				var filteredData = data.filter(function(object) {
					return (object[prop].indexOf(key) > 0);
				});

				var fieldIndex = fieldsProgression.indexOf(prop);
				if (fieldIndex < fieldsProgression.length) {
					fieldIndex++;
					buildChooser(filteredData, fieldsProgression[fieldIndex]);
				}
			});
	};

	for (key in values) {
		if (values.hasOwnProperty(key)) {
			createDiv(key, values[key]);
		}
	}
};

var buildChart = function(data) {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

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
		})
		.reduce(function(memo, object) {
			var index = indexOfProp(memo, "label", object.label);

			if (index < 0) {
				object.activity_label = [ object.activity_label ];
				object.tech_method = [ object.tech_method ];
				object.tech_focus = [ object.tech_focus ];

				memo.push(object);
			}
			else {
				var targetObject = memo[index];

				if (targetObject.activity_label.indexOf(object.activity_label) < 0) {
					targetObject.activity_label.push(object.activity_label);
				}
				if (targetObject.tech_method.indexOf(object.tech_method) < 0) {
					targetObject.tech_method.push(object.tech_method);
				}
				if (targetObject.tech_focus.indexOf(object.tech_focus) < 0) {
					targetObject.tech_focus.push(object.tech_focus);
				}
			}

			return memo;
		}, []);

	buildChooser(data, fieldsProgression[0]);

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
