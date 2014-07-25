d3.chart("BigHex", {
  initialize: function() {
    function hexBite(x, y, r, i) {
      var a = i/6 * Math.PI * 2 + Math.PI/6;
      var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
      return [
        [x, y],
        [x + r * Math.cos(a), y + r * Math.sin(a)],
        [x + r * Math.cos(na), y + r * Math.sin(na)]
      ];
    }

    function hexBitePart(x, y, r1, r2, i) {
      var a = i/6 * Math.PI * 2 + Math.PI/6;
      var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
      return [
        [x + r1 * Math.cos(a), y + r1 * Math.sin(a)],
        [x + r2 * Math.cos(a), y + r2 * Math.sin(a)],
        [x + r2 * Math.cos(na), y + r2 * Math.sin(na)],
        [x + r1 * Math.cos(na), y + r1 * Math.sin(na)]
      ];
    }

    function hex(x, y, r) {
      var points = [];
      for(var i=0; i<6; i++) {
        var a = i/6 * Math.PI * 2 + Math.PI/6;
        points.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
      }
      return points;
    }

    this.layer("bg", this.base.append("g"), {
      dataBind: function(data) {
        return this.selectAll(".bg").data([{}]);
      },
      insert: function() {
        var chart = this.chart();
        return this.append("path")
          .attr("d", "M" + hex(chart.width()/2, chart.height()/2, chart.radius()).join("L") + "Z")
          .style("fill", "#FFFFFF")
          .style("fill-opacity", 0.5)
          .style("stroke", "#000000");
      }
    });

    this.layer("triangles", this.base.append("g"), {
      dataBind: function(data) {
        return this.selectAll(".triangle").data(data);
      },

      insert: function() {
        return this.append("path");
      },
      events: {
        enter: function() {
          var chart = this.chart();
          this.attr("d", function(d, di) {
            return "M" + hexBite(chart.width()/2, chart.height()/2, 0, di).join("L") + "Z";
          })
          .style("fill", function(d) { return d.color; })
          .transition()
          .delay(function(d, di) { return di * 100; })
          .duration(500)
          .attr("d", function(d, di) {
            var a = di/6 * 2 * Math.PI + Math.PI/3;
            var r = 2;
            var dx = r * Math.cos(a);
            var dy = r * Math.sin(a);
            return "M" + hexBite(chart.width()/2 + dx, chart.height()/2 + dy, chart.radiusFromCount(d.count), di).join("L") + "Z";
          })
        },

        exit: function() {
          this.remove();
        }
      }
    });

    this.layer("projects", this.base.append("g"), {
      dataBind: function(data) {
        return this.selectAll(".projectGroup").data(data);
      },

      insert: function() {
        return this.append("g");
      },
      events: {
        enter: function() {
          var chart = this.chart();

          var projects = this.selectAll(".project")
            .data(function(d) { return d.projects; });

          projects.enter()
            .append("path")
            .attr("d", function(d, di) {
              var r1 = chart.radiusFromCount(di);
              var r2 = chart.radiusFromCount(di + 1);
              //ugly hack
              var parentIndex = Array.prototype.indexOf.call(this.parentNode.parentNode.childNodes, this.parentNode);
              var a = parentIndex/6 * 2 * Math.PI + Math.PI/3;
              var r = 2;
              var dx = r * Math.cos(a);
              var dy = r * Math.sin(a);
              return "M" + hexBitePart(chart.width()/2 + dx, chart.height()/2 + dy, r1, r2, parentIndex).join("L") + "Z";
            })
            .style("fill", function(d) { return "rgba(255,255,255,0)"; })
            .on("mouseover", function(d) {
              d3.select(this).style("fill", function(d) { return "rgba(255,255,255,0.5)"; })
              var parentIndex = Array.prototype.indexOf.call(this.parentNode.parentNode.childNodes, this.parentNode);
              var parentData = d3.select(this.parentNode).datum();
              VizConfig.tooltip.show();
              VizConfig.tooltip.html(VizConfig.dsiAreasById[parentData.areaOfDSI].label + ' Project ' + d.name + '<br><span>click to open project page</span>', "#FFF", VizConfig.dsiAreasById[parentData.areaOfDSI].color);

              if (chart._mouseoverCallback) { chart._mouseoverCallback(d); }
            })
            .on("mouseout", function(d) {
              d3.select(this).style("fill", function(d) { return "rgba(255,255,255,0)"; })
              VizConfig.tooltip.hide();

              if (chart._mouseoutCallback) { chart._mouseoutCallback(d); }
            })
            .on("click", function(d) {
              d3.event.preventDefault();
              d3.event.stopPropagation();

              if (d.url) {
                // window.open(d.url, "_blank");
                window.location.href = d.url;
              }
            });

          projects.exit()
            .remove();
        },

        exit: function() {
          this.remove();
        }
      }
    });

    this.layer("labels", this.base.append("g"), {
      dataBind: function(data) {
        return this.selectAll(".label").data(data);
      },

      insert: function() {
        return this.append("g")
      },
      events: {
        enter: function() {
          var chart = this.chart();
          this
            .attr("x", function() { return chart.x(); })
            .attr("y", function() { return chart.y(); })
            .attr("transform", function(d, di) {
              var a = di/6 * 2 * Math.PI + Math.PI/3;
              var r = chart.radius() - 40;
              var x = chart.width()/2 + r * Math.cos(a);
              var y = chart.height()/2 + r * Math.sin(a);
              //x = y = chart.width()/2;
              return "translate("+x+","+y+")";
            })
          var text = this.append("text")
            .text(function(d) { return d.count + " project" + (d.count > 1 ? "s" : ""); })
            .attr("dy", 4)
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .attr("transform", function(d, di) {
              var a = di * 60 + 150;
              if (di == 0 || di == 1) a -= 180;
              return "rotate("+a+")";
            })
            .style("fill", function(d) { return d.color; });
        },

        exit: function() {
          this.remove();
        }
      }
    });

  },

  radius: function() {
    return Math.min(this.width(), this.height())/2;
  },

  radiusFromCount: function(count, maxCount) {
    maxCount = maxCount || 10;
    var r = this.radius() - 40;
    return r * count / maxCount;
  },

  width: function(newWidth) {
    if (!newWidth) {
      return this._width;
    }

    this._width = newWidth;
    return this;
  },

  height: function(newHeight) {
    if (!newHeight) {
      return this._height;
    }

    this._height = newHeight;
    return this;
  },

  x: function(newX) {
    if (!newX) {
      return this._x || this._height / 2;
    }

    this._x = newX;
    return this;
  },

  y: function(newY) {
    if (!newY) {
      return this._y || this._width / 2;
    }

    this._y = newY;
    return this;
  },

  mouseoverCallback: function(newCallback) {
    if (!newCallback) {
      return this._mouseoverCallback;
    }

    this._mouseoverCallback = newCallback;
    return this;
  },

  mouseoutCallback: function(newCallback) {
    if (!newCallback) {
      return this._mouseoutCallback;
    }

    this._mouseoutCallback = newCallback;
    return this;
  }
});
