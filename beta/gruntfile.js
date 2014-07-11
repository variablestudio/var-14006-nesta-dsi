module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      js: {
        src: [
          "../lib/d3.v3.min.js",
          "../lib/topojson.v1.min.js",
          "../lib/q.min.js",
          "../js/SPARQL.js",
          "../js/fn.js",
          '../js/EventDispatcher.js',
          'viz_leaflet_addons.js',
          'viz_carousel.js',
          'viz_countries.js',
          'viz_intro.js',
          'viz_choropleth.js',
          'viz_explorer.js',
          'data/new_schema_list_min.js',
          'viz_tooltip.js',
          'viz_popup.js',
          'viz_key.js',
          'viz_main_map.js',
          'viz_main_hexes.js',
          "viz_organisation.js",
          'viz_config.js',
          "viz.js"
        ],
        dest: "viz.dist.js"
      }
    },

    uglify: {
      dist: {
        files: {
          "viz.dist.min.js": "viz.dist.js"
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
