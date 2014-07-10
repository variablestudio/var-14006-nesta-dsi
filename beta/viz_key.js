function VizKey(open) {
  var vizKeyContainer = $('<div id="vizKeyContainer"></div>');
  var sideBar = $('<div id="vizKeySideBar"></div>');
  var thumb = $('<div id="vizKeyThumb"><span>Open Key</span></div>');
  vizKeyContainer.append(sideBar);
  vizKeyContainer.append(thumb);
  $('body').append(vizKeyContainer);

  if (open) vizKeyContainer.addClass('open');

  var organizationsTitle = 'Organisations';
  var projectsTitle = 'Projects';
  var dsiTitle = 'DSI Area';
  var techTitle = 'Technology Focus';
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-org-solid.png' + '" height="40"/>' + organizationsTitle + '</h3>'));
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-project-solid.png' + '" height="40"/>' + projectsTitle + '</h3>'));
  sideBar.append($('<h3>' + dsiTitle + '</h3>'));

  this.activeFilters = [];
  var updateFilters = this.updateFilters.bind(this);

  VizConfig.dsiAreas.map(function(dsiArea, dsiAreaIndex) {
    var areaLink = $('<a style="color2:' + dsiArea.color + '"><img src="' + dsiArea.icon + '" height="10"/><span>' + dsiArea.title + '</span></a>');
    areaLink.on('mouseover', function() {
      VizConfig.tooltip.show();
      VizConfig.tooltip.html('<h4>' + dsiArea.title +'</h4>' + dsiArea.info);
    })
    areaLink.on('mouseout', function() {
      VizConfig.tooltip.hide();
    })
    areaLink.click(function() {
      var filter = { property: 'areaOfDigitalSocialInnovation', id: dsiArea.id };
      var active = updateFilters(filter);

      d3.select(this).classed("active", active);

      VizConfig.events.fire('filter', filter);
    });
    sideBar.append(areaLink);
  });

  sideBar.append($('<h3>' + techTitle + '</h3>'));

  VizConfig.technologyFocuses.map(function(technologyFocus, technologyFocusIndex) {
    var technologyLink = $('<a><img src="' + technologyFocus.icon + '" height="12"/><span>' + technologyFocus.title + '</span></a>');
    technologyLink.on('mouseover', function() {
      VizConfig.tooltip.show();
      VizConfig.tooltip.html('<h4>' + technologyFocus.title +'</h4>' + technologyFocus.info);
    })
    technologyLink.on('mouseout', function() {
      VizConfig.tooltip.hide();
    });
    technologyLink.click(function() {
      var filter = { property: 'technologyFocus', id: technologyFocus.id };
      var active = updateFilters(filter);

      d3.select(this).classed("active", active);

      VizConfig.events.fire('filter', filter);
    });
    sideBar.append(technologyLink);
  });

  var open = false;

  thumb.click(function() {
    if (vizKeyContainer.hasClass('open')) {
      vizKeyContainer.removeClass('open');
      thumb.children('span').text('Open Key');
    }
    else {
      vizKeyContainer.addClass('open');
      thumb.children('span').text('Hide Key');
    }
  });
}

VizKey.prototype.updateFilters = function(filter) {
  var wasFilterActive = this.activeFilters.reduce(function(memo, memoFilter) {
    if (!memo) {
      memo = (memoFilter.id === filter.id) && (memoFilter.property === filter.property);
    }
    return memo;
  }, false);

  if (wasFilterActive) {
    this.activeFilters = this.activeFilters.filter(function(activeFilter) {
      return !((activeFilter.id === filter.id) && (activeFilter.property === filter.property));
    });
  }
  else {
    this.activeFilters.push(filter);
  }

  return !wasFilterActive;
};

VizKey.prototype.getActiveFilters = function() {
  return this.activeFilters;
};
