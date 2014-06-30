var fs = require("fs");
var async = require("async")

fs.readFile("./countries/all.json", { "encoding": "utf8" }, function(error, data) {
	data = JSON.parse(data);

	async.map(
		data,
		function(country, callback) {
			fs.readFile("./countries/" + country["alpha-3"] + ".geo.json", { "encoding": "utf8" }, function(error, data) {
				callback(null, { "name": country.name, "alpha-3": country["alpha-3"], "geo": data });
			});
		},
		function(error, results) {
			fs.writeFile("./all_countries.json", JSON.stringify(results), { "encoding": "utf8"}, function() {
				console.log("all countries concated!");
			});
		}
	);
});
