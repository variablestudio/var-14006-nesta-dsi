// DATA SOURCE: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/ - Admin 0 – Countries
// CONVERSION: ogr2ogr -f GeoJSON world.geo.json *.shp

var fs = require("fs");

var EUCountries = [ "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GIB", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA", "LIE", "LTU", "LUX", "MKD", "MLT", "MDA", "MCO", "NLD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "VAT", "RSB", "IMN", "XKX", "MNE" ];

var file = process.argv[2] || "world.geo.json";

fs.readFile(file, { "encoding": "utf8" }, function(error, data) {
	data = JSON.parse(data);

	data.features = data.features.filter(function(data) {
		return (EUCountries.indexOf(data.properties.ADM0_A3) >= 0);
	});

	fs.writeFile("eu.geo.json", JSON.stringify(data), { "encoding": "utf8" }, function() {
		console.log("SAVED!");
	});
});
