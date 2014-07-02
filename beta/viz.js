(function() {
  var showIntro = !(document.location.hash == '#nointro');

  function init() {
    var url = window.location.href;
    var urlIsLocalhost = (url.match(/localhost/) !== null);
    var urlIsVariableIO = (url.match(/variable\.io/) !== null);
    var urlIsOrganisation = (url.match(/\/organisations\//) !== null);

    if (urlIsOrganisation) {
      var orgId = url.split("/").pop().replace(/\.html$/, "");
      initOrgStats(orgId);
    }
    else if (urlIsLocalhost || urlIsVariableIO) {
      if (document.location.pathname != '/' && document.location.pathname.indexOf('beta') == -1) {
        return;
      }
      var mainContainer = document.getElementById('main');
      mainContainer.removeChild(mainContainer.childNodes[0]);
      mainContainer.removeChild(mainContainer.childNodes[0]);

      var vizContainer = $('#viz');

      if (showIntro) {
        initIntroViz(vizContainer, initVisualizations);
      }
      else {
        initVisualizations();
      }

      initEvents();
    }
  }

  function initEvents() {
    VizConfig.events = EventDispatcher  .extend({

    });
  }

  function initVisualizations() {
    var vizContainer = $('#viz');

    initMainViz(vizContainer);
    initCaseStudies(vizContainer);
    initEUCountries(vizContainer);
    initChoropleth(vizContainer);
    initExplorer(vizContainer);
    initVizKey();
    initTooltip();
  }

  function initIntroViz(vizContainer, cb) {
    var introViz = $('<div id="introViz"></div>');
    vizContainer.append(introViz);
    var intro = new Intro(introViz, cb);
  }

  function initTooltip() {
    VizConfig.tooltip = new VizTooltip();
  }

  function initMainViz(vizContainer) {
    var mainViz = $('<div id="mainViz"></div>');
    vizContainer.append(mainViz);

    new MainMap("#mainViz");
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
    var euCountriesTitle = $('<h1 id="countriesVizTitle">EU Countries with the most DSI Projects <a href="#">(Show all)</a></h1>');
    vizContainer.append(euCountriesTitle);

    euCountriesTitle.select('a').click(function(e) {
      $('div.map').show();
      e.preventDefault();
      return false;
    })

    var countriesViz = $('<div id="countriesViz"></div>');
    vizContainer.append(countriesViz);

    var countries = new Countries("#countriesViz");
    countries.init();
  }

  function initChoropleth(vizContainer) {
    var choroplethTitle = $('<h1>Number of projects by technology focus and DSI area</h1>');
    vizContainer.append(choroplethTitle);

    var choroplethViz = $('<div id="choroplethViz"></div>');
    vizContainer.append(choroplethViz);

    var choroplethColors = ["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"];

    var choropleth = new Choropleth("#choroplethViz");
    choropleth.init();
  }

  function initExplorer(vizContainer) {
    var explorerTitle = $('<h1>Technology focus areas and methods</h1>');
    vizContainer.append(explorerTitle);

    var explorerViz = $('<div id="explorerViz"></div>');
    vizContainer.append(explorerViz);

    var explorer = new Explorer("#explorerViz");
    explorer.init();
  }

  function initVizKey() {
    var openOnInit = !showIntro;
    var vizKey = new VizKey(openOnInit);
  }

  function initOrgStats(orgId) {
    var divs = {
      "dsi": ".viz-1",
      "tech": ".viz-2",
      "collaborators": ".viz-3"
    };

    var stats = new Stats(divs, orgId);
    stats.init();
  }

  window.addEventListener('DOMContentLoaded', init);
})();

