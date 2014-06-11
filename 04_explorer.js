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

var fieldProgression = [ "tech_focus", "tech_method", "activity_label", "country" ];

var drawChooser = function(data, name, depth) {
	depth = depth || 0;
	var width = 900;
	var height = 200 - 40 * depth;

	for(var i=depth; i<fieldProgression.length; i++) {
		d3.select("." + fieldProgression[i]).remove();
	}

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)

	svg.attr("class", "" + fieldProgression[depth]);


	var group, groupedData = [];
	for (group in data) {
		if (data.hasOwnProperty(group)) {
			groupedData.push(data[group]);
		}
	}

	var totalNum = groupedData.reduce(function(memo, data) { return memo + data.length; }, 0);
	var x = d3.scale.linear()
		.domain([0, totalNum])
		.range([0, width]);

	var color = d3.scale.category20c();

	groupedData.forEach(function(data, index, array) {
		var currentSum = array.slice(0, index).reduce(function(memo, data) { return memo + data.length; }, 0);
		var text = null;
		svg.append("rect")
			.attr("class", "grouping")
			.attr("x", function() {
				return x(currentSum);
			})
			.attr("y", 0)
			.attr("width", function() {
				return x(data.length);
			})
			.attr("height", height)
			.attr("fill", color(index + depth * groupedData.length))
			.on("mouseover", function() {
				console.log("hover: "  + data[0][name] + " [" + name  + "]");
			})
			.on("click", function() {
				d3.selectAll("." + fieldProgression[depth] + " text").style("fill", "#FFFFFF");
				text.style("fill", "#333");

				var currentFieldIndex = fieldProgression.indexOf(name);
				var nextField = fieldProgression[currentFieldIndex + 1];
				if (nextField !== undefined) {
					drawChooser(groupByField(data, nextField), nextField, depth + 1);
				}
			});

		text = svg.append("text")
			.attr("x", function() {
				return x(currentSum) + 20;
			})
			.attr("y", 20)
			.attr("class", "title")
			.text(data[0][name]);
	});
};

var buildChart = function(data) {
	// nicer data access
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

	// sample data
	//
	// "org": "http://data.digitalsocial.eu/id/organization/faaefa6f-4696-1514-c54d-5d7f0499fb89",
	// "label": "Swirrl",
	// "long": -2.234564,
	// "lat": 53.481895,
	// "country": "United Kingdom",
	// "city": "Manchester",
	// "org_type": "http://data.digitalsocial.eu/def/concept/organization-type/business",
	// "activity_label": "Digital Social Innovation ",
	// "tech_method": "big data",
	// "tech_focus": "Open Networks"

	drawChooser(groupByField(data, "tech_focus"), "tech_focus");
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
