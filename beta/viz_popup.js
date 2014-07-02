function VizPopup() {
  this.vizPopup = $('<div id="vizPopup"><div id="vizPopupPointer"></div></div>');
  this.content = $('<div id="vizPopupContent"></div>')
  this.vizPopup.append(this.content);
  $('body').append(this.vizPopup);
  this.content.text('');
}

VizPopup.prototype.open = function(x, y, zoom) {
  setTimeout(function() {
    this.setPosition(x/zoom.scale() + zoom.translate()[0], y/zoom.scale() + zoom.translate()[1]);
    this.vizPopup.show();
  }.bind(this), 10);

  zoom.on('zoom.popup', function() {
    this.setPosition(x/zoom.scale() + zoom.translate()[0], y/zoom.scale() + zoom.translate()[1]);
  }.bind(this));
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