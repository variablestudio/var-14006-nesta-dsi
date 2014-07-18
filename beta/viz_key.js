function VizKey(open) {
  var vizKeyContainer = this.vizKeyContainer = $('<div id="vizKeyContainer"></div>');
  var sideBar = this.sideBar = $('<div id="vizKeySideBar"></div>');
  var thumb = this.thumb = $('<div id="vizKeyThumb"><span>Open Key</span></div>');
  vizKeyContainer.append(sideBar);
  vizKeyContainer.append(thumb);
  $('body').append(vizKeyContainer);

  if (open) vizKeyContainer.addClass('open');

  var organizationsTitle = 'Organisations';
  var projectsTitle = 'Projects';
  var dsiTitle = 'DSI Areas';
  var techTitle = 'Technology Focus';
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-org-new.png' + '" height="40"/><br>' + organizationsTitle + '</h3>'));
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-project-new.png' + '" height="14"/><br>' + projectsTitle + '</h3>'));
  sideBar.append($('<h3>' + dsiTitle + '</h3>'));

  this.activeFilters = [];
  var updateFilters = this.updateFilters.bind(this);

  VizConfig.dsiAreas.map(function(dsiArea, dsiAreaIndex) {
    var areaLink = $('<a class="filterLink ' + dsiArea.id + '"><span>' + dsiArea.title + '</span></a>');
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
    var technologyLink = $('<a class="filterLink ' + technologyFocus.id + '"><span>' + technologyFocus.title + '</span></a>');
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

  thumb.click(function() {
    if (vizKeyContainer.hasClass('open')) {
      this.close();
    }
    else {
      this.open();
    }
  }.bind(this));
}

VizKey.prototype.open = function() {
  this.vizKeyContainer.addClass('open');
  this.thumb.children('span').text('Hide Key');
}

VizKey.prototype.close = function() {
  this.vizKeyContainer.removeClass('open');
  this.thumb.children('span').text('Open Key');
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
