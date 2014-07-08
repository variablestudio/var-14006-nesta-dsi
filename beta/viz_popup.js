function VizPopup() {
  this.vizPopup = $('<div id="vizPopup"><div id="vizPopupPointer"></div></div>');
  this.content = $('<div id="vizPopupContent"></div>')
  this.vizPopup.append(this.content);
  $('body').append(this.vizPopup);
  this.content.text('');
}

VizPopup.prototype.open = function(x, y, dx, dy, zoom) {
  var scale = zoom ? zoom.scale() : 1;
  var translate = zoom ? zoom.translate() : [ 0, 0 ];

  setTimeout(function() {
    var nx = x * scale + dx + translate[0];
    var ny = y * scale + dy + translate[1];
    this.setPosition(nx, ny);
    this.vizPopup.show();
  }.bind(this), 10);

  if (zoom) {
    zoom.on('zoom.popup', function() {
      var nx = x * zoom.scale() + dx + zoom.translate()[0];
      var ny = y * zoom.scale() + dy + zoom.translate()[1];
      this.setPosition(nx, ny);
    }.bind(this));
  }
}

VizPopup.prototype.close = function() {
  this.vizPopup.hide();
}

VizPopup.prototype.html = function(content, textColor, bgColor) {
  textColor = textColor ? textColor : '';
  bgColor = bgColor ? bgColor : '';
  this.vizPopup.css('color', textColor);
  this.vizPopup.css('background', bgColor);
  this.content.html(content);
}

VizPopup.prototype.setPosition = function(x, y) {
  this.vizPopup.css('left', x - this.vizPopup.outerWidth()/2);
  this.vizPopup.css('top', y - this.vizPopup.outerHeight() - 15);
}

VizPopup.prototype.isOpen = function() {
  return this.vizPopup.is(':visible');
}
