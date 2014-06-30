(function() {
  function init() {
    var mainContainer = document.getElementById('main');
    mainContainer.removeChild(mainContainer.childNodes[0]);
    mainContainer.removeChild(mainContainer.childNodes[0]);

    var vizContainer = $('#viz');

    //initIntroViz(vizContainer);
    initMainViz(vizContainer);
    initCaseStudies(vizContainer);
    initEUCountries(vizContainer);
    initChoropleth(vizContainer);
  }

  function initIntroViz(vizContainer) {
    var introViz = $('<div id="introViz"></div>');
    vizContainer.append(introViz);
    var intro = new Intro(introViz);
  }

  function initMainViz(vizContainer) {
    var mainViz = $('<div id="mainViz"></div>');
    vizContainer.append(mainViz);

    mainVizInit();
  }

  function initCaseStudies(vizContainer) {
    var caseStudiesTitle = $('<h1>Case Studies</h1>');
    vizContainer.append(caseStudiesTitle);

    var caseStudiesViz = $('<div id="caseStudiesViz"></div>');
    vizContainer.append(caseStudiesViz);

    var carouselDiv = $('<div id="carousel"></div>');
    var carouselPrev = $('<div class="button button-prev">&lang;</div>');
    var carouselNext = $('<div class="button button-next">&rang;</div>');
    var carouselWrap = $('<div class="carousel-wrapper"></div>');
    carouselDiv.append(carouselPrev);
    carouselDiv.append(carouselNext);
    carouselDiv.append(carouselWrap);
    caseStudiesViz.append(carouselDiv);

    var carousel = new Carousel({
      "wrapper": $("#carousel >.carousel-wrapper"),
      "buttonPrev": $("#carousel > .button-prev"),
      "buttonNext": $("#carousel > .button-next")
    });
  }

  function initEUCountries(vizContainer) {
    var euCountriesTitle = $('<h1>Projects by EU Country</h1>');
    vizContainer.append(euCountriesTitle);

    var countriesViz = $('<div id="countriesViz"></div>');
    vizContainer.append(countriesViz);

		var countries = new Countries("#countriesViz");
		countries.init();
	}

	function initChoropleth(vizContainer) {
		var choroplethTitle = $('<h1>Projects by tech focus and method</h1>');
		vizContainer.append(choroplethTitle);

		var choroplethViz = $('<div id="choroplethViz"></div>');
		vizContainer.append(choroplethViz);

		var choroplethColors = ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"];

		var choropleth = new Choropleth("#choroplethViz");
		choropleth.init();
	}

	window.addEventListener('DOMContentLoaded', init);
})();

