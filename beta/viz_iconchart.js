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
						.attr("xlink:href", function(d, i) {
							var image = chart.image();

							// if passed image array, cycle through each image
							if (image instanceof Array) {
								image = image[i % image.length];
							}

							return image;
						})
						.attr("width", chart.imageSize().width)
						.attr("height", chart.imageSize().height)
						.attr("x", function(d, i) {
							var x = i % numPerRow * chart.imageSize().width;

							// special hex layout
							if (chart.layout() === "hex") {
								if (Math.floor(i / numPerRow) % 2 === 0) {
									x += chart.imageSize().width / 2;
								}
							}

							return x;
						})
						.attr("y", function(d, i) {
							var y = Math.floor(i / numPerRow) + 1;

							// special hex layout
							if (chart.layout() === "hex") {
								y *= Math.ceil(chart.imageSize().height / 2) + 3;
								y += chart.imageSize().height / 2;
							}
							else {
								y *= chart.imageSize().height;
							}

							return chart.height() - y;
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
	},

	layout: function(newLayout) {
		if (!newLayout) {
			return this._layout;
		}

		this._layout = newLayout;
		return this;
	}
});
