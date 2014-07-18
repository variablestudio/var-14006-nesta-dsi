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
          .delay(function(d, di) { return 0 + di * 100; }) //1000
          .duration(500)
          .attr("d", function(d, di) {
            var a = di/6 * 2 * Math.PI + Math.PI/3;
            var r = 2;
            var dx = r * Math.cos(a);
            var dy = r * Math.sin(a);
            return "M" + hexBite(chart.width()/2 + dx, chart.height()/2 + dy, chart.radius(), di).join("L") + "Z";
          })
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
            .attr("x", function() { return chart.width()/2; })
            .attr("y", function() { return chart.height()/2; })
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