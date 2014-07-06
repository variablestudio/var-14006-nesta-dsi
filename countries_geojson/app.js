// DATA SOURCE: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/ - Admin 0 – Details
// CONVERSION: ogr2ogr -f GeoJSON world.geo.json ne_10m_admin_0_map_subunits.shp

var fs = require("fs");

var EUCountries = [ "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GIB", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA", "LIE", "LTU", "LUX", "MKD", "MLT", "MDA", "MCO", "NLD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "VAT", "RSB", "IMN", "XKX", "MNE" ];

fs.readFile("world.geo.json", { "encoding": "utf8" }, function(error, data) {
	data = JSON.parse(data);

	data.features = data.features.filter(function(data) {
		return (EUCountries.indexOf(data.properties.ISO_A3) >= 0) || (EUCountries.indexOf(data.properties.ADM0_A3) >= 0);
	});

	fs.writeFile("eu.geo.json", JSON.stringify(data), { "encoding": "utf8" }, function() {
		console.log("SAVED!");
	});
});
