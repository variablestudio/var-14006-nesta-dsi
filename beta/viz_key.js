/*global $, d3, VizConfig */

function VizKey(open) {
  var updateFilters = this.updateFilters.bind(this);
  this.activeFilters = [];

  var vizKeyContainer = this.vizKeyContainer = $('<div id="vizKeyContainer"></div>');
  var sideBar = this.sideBar = $('<div id="vizKeySideBar"></div>');
  var thumb = this.thumb = $('<div id="vizKeyThumb"><span>Open Key</span></div>');

  vizKeyContainer.append(sideBar);
  vizKeyContainer.append(thumb);
  $('body').append(vizKeyContainer);

  if (open) {
    vizKeyContainer.addClass('open');
    thumb.children('span').text('Hide Key');
  }

  var organizationsTitle = 'Organisations';
  var projectsTitle = 'Projects';
  var dsiTitle = 'DSI Areas';
  var techTitle = 'Technology Focus';
  var areaTitle = 'Area of Society';
  var orgTitle = 'Organisation type';

  var rowLeft = $('<div class="row left"></div>');
  var rowRight = $('<div class="row right"></div>');

  var sectionTitle = $('<div class="section"></div>');
  sectionTitle.append($('<h3><img src="' + VizConfig.assetsPath + '/key-org-new.png' + '" height="40"/><br>' + organizationsTitle + '</h3>'));
  sectionTitle.append($('<h3><img src="' + VizConfig.assetsPath + '/key-project-new.png' + '" height="14"/><br>' + projectsTitle + '</h3>'));

  rowLeft.append(sectionTitle);

  [
    { "table": VizConfig.dsiAreas, "property": 'areaOfDigitalSocialInnovation', "title": dsiTitle, "parent": rowLeft },
    { "table": VizConfig.technologyFocuses, "property": 'technologyFocus', "title": techTitle, "parent": rowLeft },
    { "table": VizConfig.areaOfSociety, "property": 'areaOfSociety', "title": areaTitle, "parent": rowRight },
    { "table": VizConfig.organisationType, "property": 'organisationType', "title": orgTitle, "parent": rowRight }
  ].forEach(function(sidebarSection) {
    var section = $('<div class="section ' + sidebarSection.property + '"></div>');

    section.append($('<h3>' + sidebarSection.title + '</h3>'));

    sidebarSection.table.forEach(function(object) {
      var link = $('<a class="filterLink ' + object.id + '"><span>' + object.title + '</span></a>');

      link.on('mouseover', function() {
        var html = '<h4>' + object.title + '</h4>';
        if (object.info) { html += object.info; }

        VizConfig.tooltip.html(html);
        VizConfig.tooltip.show();
      });

      link.on('mouseout', function() {
        VizConfig.tooltip.hide();
      });

      link.click(function() {
        var filter = { property: sidebarSection.property, id: object.id };
        var active = updateFilters(filter);

        d3.select(this).classed('active', active);

        VizConfig.events.fire('filter', filter);
      });

      section.append(link);
    });

    sidebarSection.parent.append(section);
  });

  sideBar.append(rowLeft);
  sideBar.append(rowRight);

  thumb.click(function() {
    if (vizKeyContainer.hasClass('open')) { this.close(); }
    else { this.open(); }
  }.bind(this));
}

VizKey.prototype.open = function() {
  this.vizKeyContainer.addClass('open');
  this.thumb.children('span').text('Hide Key');
};

VizKey.prototype.close = function() {
  this.vizKeyContainer.removeClass('open');
  this.thumb.children('span').text('Open Key');
};

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
