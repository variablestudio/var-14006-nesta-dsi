function Intro(introVizContainer) {
  var h = window.innerHeight - 360;
  h = Math.min(h, 500);
  h = Math.max(300, h);
  introVizContainer.css('height', h);

  var learnTitle = 'Learn about DSI';
  var dsiTitle = '6 DSI AREAS';
  var techTitle = '4 DSI TECHNOLOGY FOCUS';

  var dsiAreas = [
    'Funding acceleration and incubation',
    'Collaborative economy',
    'Open democracy',
    'Awarness networks',
    'New ways of making',
    'Open access'
  ];

  var dsiAreaColors = [
    '#FDE302',
    '#A6CE39',
    '#F173AC',
    '#ED1A3B',
    '#F58220',
    '#7BAFDE'
  ];

  var dsiTechnologyFocus = [
    'Open Hardware',
    'Open Networks',
    'Open Knowledge',
    'Open Data'
  ]


  introVizContainer.append($('<h1>' + learnTitle + '</h1>'));
  introVizContainer.append($('<h2>' + dsiTitle + '</h2>'));
  introVizContainer.append($('<h2>' + techTitle + '</h2>'));
  dsiAreas.map(function(dsiArea) {
    introVizContainer.append($('<a>' + dsiArea + '</a>'));
  })

  dsiAreas.map(function(dsiArea) {
    introVizContainer.append($('<a>' + dsiArea + '</a>'));
  })
}