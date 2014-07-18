d3.chart("IntroHex", {
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
          .delay(function(d, di) { return 1000 + di * 100; }) //1000
          .duration(500)
          .attr("d", function(d, di) {
            var a = di/6 * 2 * Math.PI + Math.PI/3;
            var r = 2;
            var dx = r * Math.cos(a);
            var dy = r * Math.sin(a);
            return "M" + hexBite(chart.width()/2 + dx, chart.height()/2 + dy, chart.radius(), di).join("L") + "Z";
          })

          this.on("mouseover", function(d) {
            d3.select(this).style("opacity", 0.8);
            VizConfig.tooltip.show();
            VizConfig.tooltip.html(d.info);
          })
          .on("mouseout", function() {
            d3.select(this).style("opacity", 1);
            VizConfig.tooltip.hide();
          });
        },

        exit: function() {
          this.remove();
        }


      }
    });


    this.layer("lines", this.base.append("g"), {
      dataBind: function(data) {
        return this.selectAll(".labelLine").data(data);
      },

      insert: function() {
        return this.append("path")
        .style("stroke", function(d) { return d.color; })
        .style("fill", "none")
        .style("opacity", 0)
      },
      events: {
        enter: function() {
          var chart = this.chart();

          this.attr("d", function(d, di) {
            var onTheRight = labelAnchors[di] == "start";
            var points = [];
            var a = di/6 * 2 * Math.PI + Math.PI/3;
            var r = chart.radius() + 10;
            var x = chart.width()/2 + 0.7 * r * Math.cos(a);
            var y = chart.height()/2 + 0.7 * r * Math.sin(a);
            var x2 = chart.width()/2 + 1 * r * Math.cos(a);
            var y2 = chart.height()/2 + 1 * r * Math.sin(a);
            var x3 = onTheRight ? chart.width()/2 + r + 5 : chart.width()/2 - r - 5;
            var y3 = y2;
            points.push([x, y]);
            points.push([x2, y2]);
            points.push([x3, y3]);
            return "M" + points.join("L");
          })
          .transition()
          .delay(function(d, di) { return 1500 + di * 100; }) //1000
          .duration(500)
          .style("opacity", 1)
        },
        exit: function() {
          this.remove();
        }
      }
    });

    var labelAnchors = ["start", "end", "end", "end", "start", "start"];

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
            .attr("x", function() { return chart.width()/2; })
            .attr("y", function() { return chart.height()/2; })
            .attr("transform", function(d, di) {
              var onTheRight = labelAnchors[di] == "start";
              var a = di/6 * 2 * Math.PI + Math.PI/3;
              var r = chart.radius() + 10;
              var x = onTheRight ? chart.width()/2 + r + 15 : chart.width()/2 - r - 15;
              var y = chart.height()/2 + r * Math.sin(a);
              return "translate("+x+","+y+")";
            })
            .style("opacity", 0)
            .transition()
            .delay(function(d, di) { return 1500 + di * 100; }) //1000
            .duration(500)
            .style("opacity", 1)

          this.on("mouseover", function(d) {
            d3.select(this).style("opacity", 0.8);
            VizConfig.tooltip.show();
            VizConfig.tooltip.html(d.info);
          })
          .on("mouseout", function() {
            d3.select(this).style("opacity", 1);
            VizConfig.tooltip.hide();
          });

          var labelLines = this.selectAll(".labelLine")
            .data(function(d, di) {
              return d.labelMultiline.split('\n').map(function(line) {
                return {
                  text: line,
                  parentData: d,
                  parentIndex: di
                };
              });
          });

          labelLines.enter()
            .append("text")
            .text(function(d, di) {
              return d.text
            })
            .attr("dy", 4)
            .attr("font-size", 12)
            .attr("dy", function(d, di) {
              return di * 14;
            })
            .attr("text-anchor", function(d, di) {
              return labelAnchors[d.parentIndex];
            })
            .style("fill", function(d) {
              return '#FFF';
              return d.parentData.color;
            });
        },

        exit: function() {
          this.remove();
        }
      }
    });

  },

  radius: function(newRadius) {
    if (!newRadius) {
      return this._radius;
    }

    this._radius = newRadius;
    return this;
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
});