function Intro(introVizContainer, clickCb) {
  var w = window.innerWidth;
  var h = VizConfig.initialMapHeight;
  //h = Math.min(h, 600);
  //h = Math.max(300, h);

  var contentWidth = 994;
  introVizContainer.css('height', h);

  var learnTitle = 'Learn about DSI';
  var dsiTitle = '6 DSI AREAS:';
  var techTitle = '4 DSI TECHNOLOGY FOCUSES:';

  var numOrganizations = 516;
  var numProjects = 319;

  var dsiIntroText = [
    'We are setting up a network of organisations that use the Internet for the social good.',
    'Access to open data infrastructures, open knowledge platforms, open hardware, distributed sensor networks and social networking enable collective action at a large scale leading to the emergence of new DSI thematic areas.',
    'Explore NUM_ORG organisations with NUM_PROJECTS collaborative research and innovation projects.'
  ];

  dsiIntroText = dsiIntroText.map(function(line) {
    return line.replace('NUM_ORG', numOrganizations).replace('NUM_PROJECTS', numProjects);
  });

  var introVizContent = $('<div id="introVizContent"></div>');
  introVizContainer.append(introVizContent);

  var content1 = $('<div></div>');
  introVizContent.append(content1);
  content1.append($('<h1>' + dsiIntroText.join('<br/><br/>') + '</h1>'));

  var content2 = $('<div></div>');
  introVizContent.append(content2);

  content2.append($('<h2>' + learnTitle + '</h2>'));
  content2.append($('<h3>' + dsiTitle + '</h3>'));
  content2.append($('<h3>' + techTitle + '</h3>'));

  var areasContainer = $('<div class="col"></div>');
  content2.append(areasContainer);
  var technologiesContainer = $('<div class="col"></div>');
  content2.append(technologiesContainer);

  VizConfig.dsiAreas.map(function(dsiArea, dsiAreaIndex) {
    areasContainer.append($('<a style="color:' + dsiArea.color + '"><img src="' + dsiArea.icon + '" height="14"/><span>' + dsiArea.title + '</span></a>'));
  })

  VizConfig.technologyFocuses.map(function(technologyFocus, technologyFocusIndex) {
    technologiesContainer.append($('<a><img src="' + technologyFocus.icon + '" height="16"/><span>' + technologyFocus.title + '</span></a>'));
  });

  var mapBtn = $('<div id="introVizMapBtn"><img src="assets/intro-map.jpg"/></div>');
  content2.append(mapBtn);
  var exploreBtn = $('<div id="introVizExploreBtn"><img src="assets/intro-explore.jpg"/></div>');
  content2.append(exploreBtn);

  d3.select(content1.get(0))//.style('opacity', 0)
    .transition()
    .delay(1500)
    .duration(2000)
    .style('opacity', 0)

  d3.select(content2.get(0)).style('opacity', 0)
    .transition()
    .delay(1500+2000)
    .duration(2000)
    .style('opacity', 1)

  d3.select(content2.get(0)).selectAll('a')
    .style('opacity', 0)
    .transition()
    .delay(function(d, i) { return 1500 + 2000 + 200 * i})
    .duration(2000)
    .style('opacity', 1)

  d3.select(mapBtn.get(0)).selectAll('img')
  .style('opacity', 0)
  .transition()
    .delay(1500+2000+2000+500)
    .duration(2000)
    .style('opacity', 1)

  d3.select(exploreBtn.get(0)).selectAll('img')
  .style('opacity', 0)
  .transition()
    .delay(1500+2000+2000+1000)
    .duration(2000)
    .style('opacity', 1)

  function close(type) {
    d3.select(introVizContainer.get(0))
    .transition()
    .duration(2000)
    .style('opacity', 0);

    setTimeout(function() {
      $(introVizContainer).hide();
    }, 2000)

    if (clickCb) {
      clickCb(type);
    }
  }

  mapBtn.bind('click', close.bind(this, "map"));
  exploreBtn.bind('click', close.bind(this, "explore"));
}
