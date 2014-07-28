function VizTooltip() {
  var vizTooltip = $('<div id="vizTooltip"></div>');
  $('body').append(vizTooltip);
  vizTooltip.text('');

  $(window).on('mousemove', function(e) {
    var width = $(this.vizTooltip).width();
    var windowWidth = $(window).width();

    var x = e.pageX + 10;
    if ((x + width) > windowWidth) {
      x -= (width + 40);
    }

    vizTooltip.css('left', x);
    vizTooltip.css('top', e.pageY);
  }.bind(this));

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
  this.vizTooltip.find('span').css({ 'color': textColor, 'opacity': 0.5 });
}

VizTooltip.prototype.margin = function(top, left) {
  top = top || 0;
  left = left || 0;

  this.vizTooltip.css({ 'margin-top': top, 'margin-left': left });
}
