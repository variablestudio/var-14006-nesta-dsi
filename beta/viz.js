(function() {
  var showIntro = (document.location.hash !== '#nointro');
  var browser = "desktop";

  function init() {
    var url = window.location.href;
    var urlIsLocalhost = (url.match(/localhost/) !== null);
    var urlIsVariableIO = (url.match(/variable\.io/) !== null);
    var urlIsOrganisation = (url.match(/\/organisations\//) !== null);
    var urlIsBeta = (url.match(/\/beta/) !== null);

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      browser = ($(document).width() <= 480) ? "phone" : "tablet";
      $("body").addClass(browser);
    }

    if (urlIsOrganisation) {
      // get organisation id
      var orgId = url.split("/").pop().replace(/\.html$/, "");

      // draw organisation stats
      initOrgStats(orgId);
    }
    else if (urlIsLocalhost || urlIsVariableIO || urlIsBeta) {
      if (document.location.pathname != '/' && document.location.pathname.indexOf('beta') == -1) {
        return;
      }

      var mainContainer = document.getElementById('main');
      mainContainer.removeChild(mainContainer.childNodes[0]);
      mainContainer.removeChild(mainContainer.childNodes[0]);

      var vizContainer = $('#viz');

      initEvents();
      initVizKey();
      initPopup();
      initTooltip();

      if (showIntro) {
        initIntroViz(vizContainer);
      }

      initVisualizations(vizContainer);

      // FIXME: temporary solution, assets paths should be changed directly in css
      updateCSSAssetPaths();
    }
  }

  function initEvents() {
    if (browser !== "phone") {
      VizConfig.events = EventDispatcher.extend({});
    }
  }

  function initVisualizations(vizContainer) {
    if (browser === "desktop") {
      initMainViz(vizContainer);
    }

    if (browser !== "phone") {
      initCaseStudies(vizContainer);
      initEUCountries(vizContainer);
      initChoropleth(vizContainer);
      initExplorer(vizContainer);
      initMainStats(vizContainer, { timeout: 4000 });
    }
  }

  function initIntroViz(vizContainer, cb) {
    var introViz = $('<div id="introViz"></div>');
    vizContainer.append(introViz);

    $("#vizKeyContainer").hide();
    $(".map-fullscreen").hide();

    function onExplore() {
      $("#vizKeyContainer").fadeIn();
      $(".map-fullscreen").fadeIn();
      introViz.fadeOut("slow");
    }

    var intro = new Intro(introViz, {
      callback: onExplore,
      isDesktopBrowser: (browser === "desktop")
    });
  }

  function initTooltip() {
    VizConfig.tooltip = new VizTooltip();
  }

  function initPopup() {
    VizConfig.popup = new VizPopup();
  }

  function initMainViz(vizContainer) {
    var mainViz = $('<div id="mainViz"></div>');
    vizContainer.append(mainViz);

    new MainMap("#mainViz");
  }

  function initCaseStudies(vizContainer) {
    var caseStudiesTitle = $('<h1 id="caseStudiesTitle">Case Studies</h1>');
    vizContainer.append(caseStudiesTitle);

    var caseStudiesViz = $('<div id="caseStudiesViz"></div>');
    vizContainer.append(caseStudiesViz);

    var carouselDiv = $('<div id="carousel"></div>');
    var carouselFilters = $('<div class="filters"></div>');
    var carouselPrev = $('<div class="button button-prev"></div>');
    var carouselNext = $('<div class="button button-next"></div>');
    var carouselWrap = $('<div class="carousel-wrapper"></div>');
    carouselDiv.append(carouselPrev);
    carouselDiv.append(carouselNext);
    carouselDiv.append(carouselFilters);
    carouselDiv.append(carouselWrap);
    caseStudiesViz.append(carouselDiv);

    var carousel = new Carousel({
      "filters": $("#carousel > .filters"),
      "wrapper": $("#carousel >.carousel-wrapper"),
      "buttonPrev": $("#carousel > .button-prev"),
      "buttonNext": $("#carousel > .button-next")
    },
    {
      isDesktopBrowser: (browser === "desktop")
    });
  }

  function initEUCountries(vizContainer) {
    var euCountriesTitle = $('<h1 id="countriesVizTitle">EU Countries with the most DSI Projects <a href="#">(Show all)</a></h1>');
    vizContainer.append(euCountriesTitle);

    var numEuCountries = browser === "desktop" ? 8 : 6;

    euCountriesTitle.children('a').on("click touchstart", function(e) {
      e.preventDefault();
      e.stopPropagation();

      var hidden = $('div.map:hidden').length > 0;
      if (hidden) {
        $('div.map').show();
        $(this).text("(Show less)");
      }
      else {
        $('div.map').each(function(index) {
          if (index >= numEuCountries) { $(this).hide(); }
        });
        $(this).text("(Show all)");
      }
    });

    var countriesViz = $('<div id="countriesViz"></div>');
    vizContainer.append(countriesViz);

    var countries = new Countries("#countriesViz", { isDesktopBrowser: (browser === "desktop") });
    countries.init();
  }

  function initChoropleth(vizContainer) {
    var choroplethTitle = $('<h1>Number of projects by technology focus and DSI area</h1>');
    vizContainer.append(choroplethTitle);

    var choroplethViz = $('<div id="choroplethViz"></div>');
    vizContainer.append(choroplethViz);

    var choropleth = new Choropleth("#choroplethViz", { isDesktopBrowser: (browser === "desktop") });
    choropleth.init();
  }

  function initExplorer(vizContainer) {
    var explorerTitle = $('<h1>Technology focus areas and methods</h1>');
    vizContainer.append(explorerTitle);

    var explorerViz = $('<div id="explorerViz"></div>');
    vizContainer.append(explorerViz);

    var explorer = new Explorer("#explorerViz", { isDesktopBrowser: (browser === "desktop") });
    explorer.init();
  }

  function initMainStats(vizContainer, settings) {
    settings.timeout = settings.timeout || 0;

    var mainStatsTitle = $('<h1>Stats</h1>');
    vizContainer.append(mainStatsTitle);

    var mainStatsViz = $('<div id="mainStatsViz"></div>');
    vizContainer.append(mainStatsViz);

    setTimeout(function() {
      var mainStats = new MainStats("#mainStatsViz", { minValue: 10 });
      mainStats.init();
    }, settings.timeout);
  }

  function initVizKey() {
    VizConfig.vizKey = new VizKey({
      open: true,
      showMore: true,
      className: "main"
    });
  }

  function initOrgStats(orgId) {
    var divs = {
      "dsi": ".viz-1",
      "tech": ".viz-2",
      "collaborators": ".viz-3"
    };

    VizConfig.vizKey = new VizKey({
      open: false,
      showMore: false,
      className: "organisations"
    });

    var stats = new Stats(divs, orgId);
    stats.init();

    initPopup();
    initTooltip();
  }

  function updateCSSAssetPaths() {
    $("*").filter(function() {
      var background = $(this).css("background-image");
      if (background.indexOf("assets") > -1) {
        var asset = background.split("assets")[1].replace(")", "");
        var newAsset = VizConfig.assetsPath + asset;

        // console.log("updating asset path: " + background + " -> " + newAsset);

        $(this).css("background-image", "url(" + newAsset + ")");
      }
    });
  }

  window.addEventListener('DOMContentLoaded', init);
})();

