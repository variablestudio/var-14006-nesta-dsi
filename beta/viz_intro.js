function Intro(introVizContainer) {
  var h = window.innerHeight - 360;
  h = Math.min(h, 500);
  h = Math.max(300, h);
  introVizContainer.css('height', h);
}