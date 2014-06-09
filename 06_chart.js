/*global SPARQLDataSource, d3 */

// run query on sparql (true) or use local copy (false)?
var RUN_QUERY = false;

var indexOfProp = function(data, prop, val) {
	return data.map(function(o) { return o[prop]; }).indexOf(val);
};

var drawChart = function(data, xData, yData) {
	var width = 1200;
	var height = 700;
	var margin = 140;

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);

	data = data.reduce(function(memo, object) {
		var index = indexOfProp(memo, yData, object[yData]);

		if (index < 0) {
			object[xData] = [ object[xData] ];

			memo.push(object);
		}
		else {
			if (memo[index][xData].indexOf(object[xData]) < 0) {
				memo[index][xData].push(object[xData]);
			}
		}

		return memo;
	}, []);

	var counts = data.reduce(function(memo, object) {
		if (object[xData].length > memo.max) { memo.max = object[xData].length; }
		if (object[xData].length < memo.min) { memo.min = object[xData].length; }

		return memo;
	}, { "min": Infinity, "max": -Infinity });

	var labels = data
		.map(function(object) {
			return object[yData];
		})
		.reduce(function(memo, object) {
			if (memo.indexOf(object) < 0) { memo.push(object); }
			return memo;
		}, []);

	var scaleX = d3.scale.ordinal()
		.rangeBands([margin, width - margin])
		.domain(labels);

	var scaleY = d3.scale.linear()
		.range([height - margin, margin])
		.domain([counts.min, counts.max]);

	svg.selectAll(".point")
		.data(data)
		.enter()
		.append("circle")
		.attr("class", "point")
		.attr("r", 2)
		.attr("cx", function(d) {
			return scaleX(d[yData]) + 20;
		})
		.attr("cy", function(d) {
			return scaleY(d[xData].length);
		});

	var axisX = d3.svg.axis()
		.scale(scaleX)
		.orient("bottom");

	var axisY = d3.svg.axis()
		.scale(scaleY)
		.orient("left");

	svg.append("g")
		.attr("transform", "translate(" + margin + ",0)")
		.call(axisY);

	svg.append("g")
		.attr("transform", "translate(0," + (height - margin) + ")")
		.call(axisX)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-0.8em")
		.attr("dy", "0.1em")
		.attr("transform", "rotate(-90)");

	svg.append("text")
		.attr("class", "title")
		.attr("x", margin - 20)
		.attr("y", margin - 20)
		.text("count(" + xData + ") / " + yData);
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

	var fieldsX = [ "country", "city" ];
	var fieldsY = [ "activity_label", "tech_method" ];

	fieldsX.forEach(function(fieldX) {
		fieldsY.forEach(function(fieldY) {
			drawChart(data, fieldY, fieldX);
		});
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
