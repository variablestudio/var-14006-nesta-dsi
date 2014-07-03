function MainHexes(mainVizContainer) {
  this.DOM = {};
  this.mainVizContainer = mainVizContainer;
  this.init();
}

MainHexes.prototype.initSVG = function() {
  this.w = window.innerWidth;
  this.h = window.innerHeight - 360;
  this.h = Math.min(this.h, 500);
  this.h = Math.max(300, this.h);
  this.svg = d3.select(this.mainVizContainer)
    .append('svg')
    .attr('width', this.w)
    .attr('height', this.h);

  this.svg.append('rect')
    .attr('fill', '#FF8080')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', this.w)
    .attr('height', this.h);
}

MainHexes.prototype.init = function() {
  this.initSVG();

  this.preloader = $('<img id="vizPreloader" src="'+VizConfig.assetsPath+'/preloader.gif"/>');
  $(this.mainVizContainer).append(this.preloader);

  this.getOrganisations().then(function(organisations) {

    this.organisations = organisations;
    this.buildViz(organisations);
    this.hijackSearch();

     //pre cache
    this.getCollaborations().then(function(collaborations) {
      this.getProjectsInfo(collaborations).then(function() {
        this.preloader.fadeOut('slow')
      }.bind(this));
    }.bind(this));
  }.bind(this));
}