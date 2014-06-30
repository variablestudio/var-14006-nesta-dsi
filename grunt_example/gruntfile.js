module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		concat: {
			js: {
				src: [
					"../lib/d3.v3.min.js",
					"../lib/q.min.js",
					"../js/SPARQL.js",
					"../24_countries_sparql.js"
				],
				dest: "dist.js"
			}
		},

		uglify: {
			dist: {
				files: {
					"dist.min.js": "dist.js"
				}
			}
		}
	});

	// load libs
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-uglify");

	// default task
	grunt.registerTask("default", [ "concat", "uglify" ]);
};
