module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      js: {
        src: [
          "../lib/d3.v3.min.js",
          "../lib/d3.chart.min.js",
          "../lib/topojson.v1.min.js",
          "../lib/q.min.js",
          "../js/SPARQL.js",
          "../js/fn.js",
          '../js/EventDispatcher.js',
          'viz_bighex.js', //big hex component for map and org page
          'viz_iconchart.js', //icon chart component for stats
          'viz_leaflet_addons.js',
          'viz_carousel.js', //case studies
          'viz_countries.js', //eu countries
          'viz_intro.js', //intro splash screen
          'viz_introhex.js', //small hex in the middle of the splash intro screen
          'viz_choropleth.js', //technology focus and dsi are matrix
          'viz_stats.js', //values stats
          'data/new_schema_list_min.js',
          'viz_tooltip.js', //tooltip code
          'viz_popup.js', //popup code
          'viz_key.js', //key filters sidebar
          'viz_main_map.js', //main map with connections
          "viz_organisation.js", //organisation page visualizations
          "viz_org_list.js", // organisations and projects list data-driven icons
          'viz_config.js',
          "viz.js" //main
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
