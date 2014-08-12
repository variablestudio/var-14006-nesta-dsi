/*global $, d3, VizConfig */

function VizKey(settings) {
  settings = settings || {};

  var shouldStartOpen = !!settings.open;
  var shouldDisplayMoreFilters = !!settings.showMore;
  var className = this.className = settings.className || "main";
  var thumbTitle = className === "main" ? "More Filters" : "Close Key";

  var updateFilters = this.updateFilters.bind(this);
  this.activeFilters = [];

  var vizKeyContainer = this.vizKeyContainer = $('<div id="vizKeyContainer" class="' + className + '"></div>');
  var sideBar = this.sideBar = $('<div id="vizKeySideBar"></div>');
  var thumb = this.thumb = $('<div id="vizKeyThumb"><span>' + thumbTitle + '</span></div>');

  vizKeyContainer.append(sideBar);
  vizKeyContainer.append(thumb);
  $('body').append(vizKeyContainer);

  var organizationsTitle = 'Organisations';
  var projectsTitle = 'Projects';
  var dsiTitle = 'DSI Areas';
  var techTitle = 'Technology Focus';
  var areaTitle = 'Area of Society';
  var orgTitle = 'Organisation type';

  var rowLeft = $('<div class="row left"></div>');
  var rowRight = $('<div class="row right"></div>');

  var orgSection = $('<div class="section organisations"></div>');
  orgSection.append($('<h3><img src="' + VizConfig.assetsPath + '/key-org-new.png' + '" height="40"/><br>' + organizationsTitle + '</h3>'));
  rowLeft.append(orgSection);

  if (className !== "main") {
    var projectSection = $('<div class="section projects"></div>');
    projectSection.append($('<h3><img src="' + VizConfig.assetsPath + '/key-project-new.png' + '" height="14"/><br>' + projectsTitle + '</h3>'));
    rowLeft.append(projectSection);
  }

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
        filter.active = active;

        d3.select(this).classed('active', active);
        VizConfig.events.fire('filter', filter);
      });

      section.append(link);
    });

    sidebarSection.parent.append(section);
  });

  sideBar.append(rowLeft);
  sideBar.append(rowRight);

  this.row = {
    'left': rowLeft,
    'right': rowRight
  };

  thumb.on('click', function() {
    if (this.className === "main") {
      this.toggleMore();
    }
    else {
      if (vizKeyContainer.hasClass('open')) {
        this.close();
      }
      else {
        this.open();
      }
    }
  }.bind(this));

  if (shouldStartOpen) {
    this.open();
  }
  else {
    this.close();
  }
}

VizKey.prototype.open = function() {
  var thumbTitle = this.className === "main" ? "More Filters" : "Close Key";

  this.vizKeyContainer.addClass('open');
  this.thumb.children('span').text(thumbTitle);
  this.vizKeyContainer.animate({ left: 0 });
};

VizKey.prototype.close = function() {
  this.vizKeyContainer.removeClass('open');
  this.thumb.children('span').text('Open Key');

  this.thumb.animate({ left: "-64px" });
  this.vizKeyContainer.animate({ left: "-220px" });
};

VizKey.prototype.toggleMore = function(settings) {
  var shouldClose = settings ? settings.close : false;

  if (this.row.right.width() > 0 || shouldClose) {
    this.row.right.animate({ width: 0 });
    this.thumb.animate({ left: "-17px" });
    this.thumb.children("span").text("More Filters");
  }
  else {
    this.row.right.animate({ width: "220px"});
    this.thumb.animate({ left: "203px" });
    this.thumb.children("span").text("Less Filters");
  }
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
