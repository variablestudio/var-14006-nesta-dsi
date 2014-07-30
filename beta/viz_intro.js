function Intro(introVizContainer, settings) {
  settings = settings || {};
  var isDesktopBrowser = settings.isDesktopBrowser !== undefined ? settings.isDesktopBrowser : true;

  var w = window.innerWidth;
  var h = VizConfig.initialMapHeight;

  var learnTitle = 'Learn about DSI';
  var dsiTitle = '6 DSI AREAS:';
  var techTitle = '4 DSI TECHNOLOGY FOCUSES:';

  var titleText = 'Learn about Digital Social Innovation';
  var exploreBtnText = isDesktopBrowser ? 'Explore the map' : 'Explore the map on desktop browser';

  var numOrganizations = 516;
  var numProjects = 319;

  var dsiIntroText = [
    'We are setting up a network of organisations that use the Internet for the social good.',
    'Explore <strong>NUM_ORG</strong> organisations with <strong>NUM_PROJECTS</strong> collaborative research and innovation projects.',
    '<em>"Digital Social Innovation is a type of collaborative innovation in which innovators, users and communities co-create knowledge and solutions for a wide range of social needs exploiting the network effect of the Internet."</em>'
  ];

  var contentWidth = 994;
  if (settings.isDesktopBrowser) {
    introVizContainer.addClass("desktop");
    introVizContainer.css('height', h);
  }

  dsiIntroText = dsiIntroText.map(function(line) {
    return line.replace('NUM_ORG', numOrganizations).replace('NUM_PROJECTS', numProjects);
  });

  var introVizContent = $('<div id="introVizContent"></div>');
  introVizContainer.append(introVizContent);

  var column1 = $('<div class="introColumn"></div>');
  introVizContent.append(column1);

  var column2 = $('<div class="introColumn"></div>');
  introVizContent.append(column2);

  var column3 = $('<div class="introColumn"></div>');
  introVizContent.append(column3);

  column1.append($('<p>' + dsiIntroText.join('<br/><br/>') + '</p>'));

  var content2 = $('<div class="introColumnContent"></div>');
  column2.append(content2);

  content2.append($('<h1>' + titleText + '</h1>'));

  content2.append($('<div id="introHex"></div>'));

  var exploreBtn = $('<div class="exploreBtn">' + exploreBtnText + '</div>');
  if (!isDesktopBrowser) { exploreBtn.addClass("disabled"); }
  content2.append(exploreBtn);

  if (isDesktopBrowser && settings.callback) {
    exploreBtn.click(settings.callback);
  }

  column3.append($('<p><a href="http://digitalsocial.eu/organisations/build/new_user"><img src="assets/WorldMap.png" width="322"/></a></p>'));

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
}
