function VizKey() {
  console.log('VizKey')
  var vizKeyContainer = $('<div id="vizKeyContainer"></div>');
  var sideBar = $('<div id="vizKeySideBar"></div>');
  var thumb = $('<div id="vizKeyThumb"><span>Open Key</span></div>');
  vizKeyContainer.append(sideBar);
  vizKeyContainer.append(thumb);
  $('body').append(vizKeyContainer);

  var organizationsTitle = 'Organisations';
  var projectsTitle = 'Projects';
  var dsiTitle = 'DSI Area';
  var techTitle = 'Technology Focus';
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-org-solid.png' + '" height="40"/>' + organizationsTitle + '</h3>'));
  sideBar.append($('<h3><img src="' + VizConfig.assetsPath + '/key-project-solid.png' + '" height="40"/>' + projectsTitle + '</h3>'));
  sideBar.append($('<h3>' + dsiTitle + '</h3>'));

  VizConfig.dsiAreas.map(function(dsiArea, dsiAreaIndex) {
    sideBar.append($('<a style="color:' + dsiArea.color + '"><img src="' + dsiArea.icon + '" height="10"/><span>' + dsiArea.title + '</span></a>'));
  })

  sideBar.append($('<h3>' + techTitle + '</h3>'));

  VizConfig.technologyFocuses.map(function(technologyFocus, technologyFocusIndex) {
    sideBar.append($('<a><img src="' + technologyFocus.icon + '" height="12"/><span>' + technologyFocus.title + '</span></a>'));
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


  console.log(vizKeyContainer)
}