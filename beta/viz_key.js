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
      VizConfig.events.fire('filter', { property: 'areaOfDigitalSocialInnovation', id: dsiArea.id })
    });
    sideBar.append(areaLink);
  })

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
      VizConfig.events.fire('filter', { property: 'technologyFocus', id: technologyFocus.id })
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