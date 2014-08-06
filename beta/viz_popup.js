function VizPopup() {
  this.vizPopup = $('<div id="vizPopup"><div id="vizPopupPointer"></div></div>');
  this.content = $('<div id="vizPopupContent"></div>')
  this.vizPopup.append(this.content);
  $('body').append(this.vizPopup);
  this.vizPopup.hide()
  this.content.text('');
}

VizPopup.prototype.open = function(x, y, dx, dy, settings) {
  settings = settings || {};
  var closeOnClick = !!settings.closeOnClick;

  setTimeout(function() {
    var nx = x + dx;
    var ny = y + dy;
    this.setPosition(nx, ny);
    this.vizPopup.fadeIn();

    if (closeOnClick) {
      this.vizPopup.one("click", function() { this.close(); }.bind(this));
    }
  }.bind(this), 10);
}

VizPopup.prototype.close = function() {
  this.vizPopup.fadeOut();
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
