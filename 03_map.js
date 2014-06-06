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

var drawMap = function(data, name) {
	console.log("drawing: " + name);

	var width = 600;
	var height = 400;
	var scale = 200.0;
	var center = [0.0, 0.0];

	var projection = d3.geo.mercator()
		.center(center)
		.scale(scale)
		.translate([width / 2, height / 2]);

	data = data.map(function(object) {
		var position = projection([object.lat, object.long]);

		if (!isNaN(position[0]) && !isNaN(position[1])) {
			object.position = position;
		}

		return object;
	}).filter(function(object) {
		return (object.position !== undefined);
	});

	var tmpLabelGroups = groupByField(data, "activity_label");
	// var tmpLabelGroups = groupByField(data, "tech_method");
	var labelGroups = [];
	var group, objects;

	for (group in tmpLabelGroups) {
		if (tmpLabelGroups.hasOwnProperty(group)) {
			objects = tmpLabelGroups[group];
			if (objects.length > 1) {
				labelGroups.push(objects);
			}
		}
	}

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);

	svg.selectAll(".point")
		.data(data)
		.enter()
		.append("circle")
		.attr("transform", function(d) {
			return "translate(" + d.position + ")";
		})
		.attr("r", 4)
		.attr("fill", "#777777");

	var line = d3.svg.line()
		.x(function(d) { return d.position[0]; })
		.y(function(d) { return d.position[1]; });

	labelGroups.forEach(function(group) {
		svg.append("path")
			.datum(group)
			.attr("class", "line")
			.attr("d", line);
	});

  svg.append("text")
    .attr("fill", "#000000")
    .attr("class", "title")
    .attr("x", 20)
    .attr("y", 30)
    .text(name);
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

	var grouped = groupByField(data, "tech_focus");
	var group;

	for (group in grouped) {
		if (grouped.hasOwnProperty(group)) {
			drawMap(grouped[group], group);
		}
	}
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
