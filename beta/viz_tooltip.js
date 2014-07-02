 function VizTooltip() {
  var vizTooltip = $('<div id="vizTooltip"></div>');
  $('body').append(vizTooltip);
  vizTooltip.text('');

  $(window).on('mousemove', function(e) {
    vizTooltip.css('left', e.pageX + 10);
    vizTooltip.css('top', e.pageY);
  });

  this.vizTooltip = vizTooltip;
}

VizTooltip.prototype.show = function() {
  this.vizTooltip.show();
}

VizTooltip.prototype.hide = function() {
  this.vizTooltip.hide();
}

VizTooltip.prototype.html = function(content, textColor, bgColor) {
  textColor = textColor ? textColor : '';
  bgColor = bgColor ? bgColor : '';
  this.vizTooltip.css('color', textColor);
  this.vizTooltip.css('background', bgColor);
  this.vizTooltip.html(content);
}