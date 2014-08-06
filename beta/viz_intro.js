function Intro(introVizContainer, settings) {
  this.draw(introVizContainer, settings, 0, 0);

  var introText = $('#introText').html().split('?');

  function pad3(s) {
    s = '' + s;
    if (s.length == 0) return '&nbsp;&nbsp;&nbsp;';
    if (s.length == 1) return '&nbsp;&nbsp;' + s;
    if (s.length == 2) return '&nbsp;' + s;
    else return s;
  }

  function updateText(orgCount, activityCount) {
    var str = introText[0] + pad3(orgCount) + introText[1] + pad3(activityCount) + introText[2];
    $('#introText').html(str);
  }

  updateText(0, 0);

  var orgs = 0;
  var activities = 0;
  var updateInterval = setInterval(function() {
    updateText(orgs++, activities++);
  }, 50);


  this.runOrgQuery().then(function(results) {
    var orgCount = results.length;
    this.runActivityQuery().then(function(results) {
      var activityCount = results.length;
      clearInterval(updateInterval);
      updateText(orgCount, activityCount)
    }.bind(this));
  }.bind(this));
}

Intro.prototype.runOrgQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?org_label')
    .where('?org', 'a', 'o:Organization')
    .where('?org', 'rdfs:label', '?org_label')
    .execute();
};

Intro.prototype.runActivityQuery = function() {
  var SPARQL_URL = 'http://data.digitalsocial.eu/sparql.json?utf8=✓&query=';
  var ds = new SPARQLDataSource(SPARQL_URL);

  return ds.query()
    .prefix('o:', '<http://www.w3.org/ns/org#>')
    .prefix('rdfs:', '<http://www.w3.org/2000/01/rdf-schema#>')
    .prefix('rdf:', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
    .prefix('ds:', '<http://data.digitalsocial.eu/def/ontology/>')
    .select('?activity_label')
    .where('?org', 'a', 'o:Organization')
    .where('?activity_membership', 'ds:organization', '?org')
    .where('?activity_membership', 'a', 'ds:ActivityMembership')
    .where('?activity_membership', 'ds:activity', '?activity')
    .where('?activity', 'rdfs:label', '?activity_label')
    .execute();
};

Intro.prototype.draw = function(introVizContainer, settings) {
  settings = settings || {};
  var isDesktopBrowser = settings.isDesktopBrowser !== undefined ? settings.isDesktopBrowser : true;

  var w = window.innerWidth;
  var h = VizConfig.initialMapHeight;

  var learnTitle = 'Learn about DSI';
  var dsiTitle = '6 DSI AREAS:';
  var techTitle = '4 DSI TECHNOLOGY FOCUSES:';

  var titleText = 'Learn about Digital Social Innovation';
  var exploreBtnText = isDesktopBrowser ? 'Explore the map' : 'Explore the map on desktop browser';

  var dsiIntroText = [
    'We are setting up a network of organisations that use the Internet for the social good.',
    'Explore <strong>?</strong> organisations with <strong>?</strong> collaborative research and innovation projects.',
    '<em>"Digital Social Innovation is a type of collaborative innovation in which innovators, users and communities co-create knowledge and solutions for a wide range of social needs exploiting the network effect of the Internet."</em>'
  ];

  var contentWidth = 994;
  if (isDesktopBrowser) {
    introVizContainer.addClass("desktop");
    introVizContainer.css('height', h);
  }

  var introVizContent = $('<div id="introVizContent"></div>');
  introVizContainer.append(introVizContent);

  var column1 = $('<div class="introColumn"></div>');
  introVizContent.append(column1);

  var column2 = $('<div class="introColumn"></div>');
  introVizContent.append(column2);

  var column3 = $('<div class="introColumn"></div>');
  introVizContent.append(column3);

  var content1 = $('<p id="introText">' + dsiIntroText.join('<br/><br/>') + '</p>');
  column1.append(content1);

  var exploreBtn = $('<div class="exploreBtn">' + exploreBtnText + '</div>');
  if (!isDesktopBrowser) { exploreBtn.addClass("disabled"); }
  column1.append(exploreBtn);

  var content2 = $('<div class="introColumnContent"></div>');
  column2.append(content2);

  content2.append($('<h1>' + titleText + '</h1>'));

  content2.append($('<div id="introHex"></div>'));

  if (isDesktopBrowser && settings.callback) {
    exploreBtn.click(settings.callback);
  }

  var mapBtn = $('<a class="mapBtn" href="http://digitalsocial.eu/organisations/build/new_user">Get on the Map</a>');
  column3.append($('<p><img src="' + VizConfig.assetsPath + '/map-shadow.png" width="322"/></p>'));
  column3.append(mapBtn);

  if (!isDesktopBrowser) {
    mapBtn.on("touchstart", function() { window.open("http://digitalsocial.eu/organisations/build/new_user"); });
  }

  var vizContainer = d3.select("#introHex");
  var chart = vizContainer
    .append("svg")
    .attr("width", 322)
    .attr("height", 220)
    .chart("IntroHex")
    .width(322)
    .height(220)
    .radius(50)

  chart.draw(VizConfig.dsiAreas);
};

