/*global d3 */

d3.chart("IconChart", {
	initialize: function() {
		this.layer("icons", this.base.append("g"), {
			dataBind: function(data) {
				return this.selectAll(".icon").data(data);
			},

			insert: function() {
				return this.append("svg:image");
			},

			events: {
				enter: function() {
					var chart = this.chart();
					var numPerRow = Math.floor(chart.width() / chart.imageSize().width);

					this
						.attr("class", "icon")
						.attr("xlink:href", chart.image())
						.attr("width", chart.imageSize().width)
						.attr("height", chart.imageSize().height)
						.attr("x", function(d, i) {
							return i % numPerRow * chart.imageSize().width;
						})
						.attr("y", function(d, i) {
							return chart.height() - (Math.floor(i / numPerRow) + 1) * chart.imageSize().height;
						});
				},

				exit: function() {
					this.remove();
				}
			}
		});
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

	image: function(newImage) {
		if (!newImage) {
			return this._image;
		}

		this._image = newImage;
		return this;
	},

	imageSize: function(newImageSize) {
		if (!newImageSize) {
			return this._imageSize;
		}

		this._imageSize = newImageSize;
		return this;
	}
});
