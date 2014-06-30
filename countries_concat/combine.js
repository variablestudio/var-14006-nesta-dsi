var fs = require("fs");
var async = require("async");

var EUCountries = [ "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GIB", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA", "LIE", "LTU", "LUX", "MKD", "MLT", "MDA", "MCO", "NLD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE", "CHE", "UKR", "GBR", "VAT", "RSB", "IMN", "XKX", "MNE" ];

fs.readFile("./countries/all.json", { "encoding": "utf8" }, function(error, data) {
	data = JSON.parse(data);

	async.map(
		data,
		function(country, callback) {
			fs.readFile("./countries/" + country["alpha-3"] + ".geo.json", { "encoding": "utf8" }, function(error, data) {
				if (EUCountries.indexOf(country["alpha-3"]) >= 0) {
					callback(null, { "name": country.name, "alpha-3": country["alpha-3"], "geo": data });
				}
				else {
					callback(null, null);
				}
			});
		},
		function(error, results) {
			results = results.filter(function(object) {
				return (object !== null);
			});

			fs.writeFile("./all_countries.json", JSON.stringify(results), { "encoding": "utf8"}, function() {
				console.log("all countries concated!");
			});
		}
	);
});
