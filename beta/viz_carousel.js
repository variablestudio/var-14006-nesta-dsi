/*jslint todo: true */
/*global fn, $, VizConfig */

function Carousel(DOMElements, settings) {
	// create popup
	var popupStr = [
		"<div id=\"carousel-popup\">",
			"<div class=\"title\"></div>",
			"<div class=\"content-container\">",
				"<div class=\"content\"></div>",
			"</div>",
		"</div>"
	].join("");

	var popup = $(popupStr).hide().on("click", this.caseStudyHide.bind(this));
	$("body").append(popup);
	$("body").on("click", this.caseStudyHide.bind(this));

	this.DOM = {
		"wrapper": DOMElements.wrapper, // carousel wrapper
		"buttonNext": DOMElements.buttonNext,
		"buttonPrev": DOMElements.buttonPrev,
		"popup": popup
	};

	this.carousel = {
		"data": [],
		"parsedData": [],
		"numItems": 3,
		"index": 0
	};

	this.animating = {
		"next": false,
		"prev": false
	};

	this.width = settings ? settings.width : 322 + 14; // 14px margin
	var apiUrl = settings ? settings.url : "http://content.digitalsocial.eu/api/get_page/?slug=case-studies&children=true";

	// fetch data
	$.getJSON(apiUrl, function(data) {
		this.carousel.parsedData = this.parseData(data); // get parsed data
		this.filter(null); // filter(null) to display all, automatically redraws carousel
	}.bind(this));

	// setup button events
	this.DOM.buttonNext.on("click", function() {
		// don't do anything if currently animatin
		if (this.animating.next || this.animating.prev) { return; }

		// set as animating
		this.animating.next = true;

		// prepend after third element
		var appendIndex = (this.carousel.index + this.carousel.numItems) % this.carousel.data.length;

		// update index
		this.carousel.index = (this.carousel.index + 1) % this.carousel.data.length;

		// append element and animate
		this.DOM.wrapper
		.append(this.buildItem(this.carousel.data[appendIndex]))
		.children().each(function(index, child) {
			$(child)
			.css({ "left": index * this.width + "px" })
			.animate({
				"left": (index - 1) * this.width + "px"
			},
			{
				"complete": function() {
					if (index === 0) { $(child).remove(); }
					if (index === this.carousel.numItems) { this.animating.next = false; }
				}.bind(this)
			});
		}.bind(this));
	}.bind(this));

	this.DOM.buttonPrev.on("click", function() {
		// don't do anything if currently animatin
		if (this.animating.next || this.animating.prev) { return; }

		// set as animating
		this.animating.prev = true;

		// calculate prepend index
		var prependIndex = (this.carousel.index - 1) < 0 ? (this.carousel.data.length - 1) : (this.carousel.index - 1);

		// update carousel index
		this.carousel.index = prependIndex;

		// prepend element and animate
		this.DOM.wrapper
		.prepend(this.buildItem(this.carousel.data[prependIndex]))
		.children().each(function(index, child) {
			$(child)
			.css({ "left": (index - 1) * this.width + "px" })
			.animate({
				"left": index * this.width + "px"
			},
			{
				"complete": function() {
					if (index === this.carousel.numItems) {
						$(child).remove();
						this.animating.prev = false;
					}
				}.bind(this)
			});
		}.bind(this));
	}.bind(this));

	// build carousel with preloading gif on launch
	this.buildCarousel({ "preloading": true });

	// act on filter change
	VizConfig.events.addEventListener("filter", function(e) {
		this.filter(function(data) {
			var shouldDisplay = false;

			if (e.property === "technologyFocus") {
				shouldDisplay = (data.techFocus.indexOf(e.id) >= 0);
			}
			else if (e.property === "areaOfDigitalSocialInnovation") {
				shouldDisplay = data.areaOfDSI === e.id;
			}

			return shouldDisplay;
		});
	}.bind(this));
}

// filters data using callback, and redraws carousel
Carousel.prototype.filter = function(callback) {
	if (!callback) {
		// copy data from parsed
		this.carousel.data = this.carousel.parsedData.slice(0);
	}
	else {
		// filter using callback function
		this.carousel.data = this.carousel.parsedData.filter(callback);
	}

	// adjust index
	if (this.carousel.index > this.carousel.data.length) {
		this.carousel.index = 0;
	}

	// build carousel using filtered data
	this.buildCarousel();
};

// creates single carousel item
Carousel.prototype.buildItem = function(data) {
	var carouselItem = "<div class=\"carousel-item\" style=\"position: absolute\">";
	if (data !== null) {
		if (data.coverImage) { carouselItem += "<img src=\"" + data.coverImage + "\">"; }
		carouselItem += "<span>";
		if (data.logoImage) { carouselItem += "<img src=\"" + data.logoImage + "\"/>"; }
		carouselItem += "<span class=\"name\">" + data.name + "</span>";
		carouselItem += "</span>";
	}
	else {
		// data === null -> preloading
		carouselItem += "<img class=\"preloading\" src=\"" + VizConfig.assetsPath + "/preloader.gif\"/>";
	}
	carouselItem += "</div>";

	// crate jquery object from item
	carouselItem = $(carouselItem);

	// add event handler if item has data
	if (data) {
		carouselItem.on("click", function(e) {
			e.preventDefault();
			e.stopPropagation();

			this.caseStudyShow(data);
		}.bind(this));
	}

	return carouselItem;
};

// builds initial carousel
Carousel.prototype.buildCarousel = function(settings) {
	var isPreloading = settings ? settings.preloading : false;

	// empty wrapper
	this.DOM.wrapper.empty();

	if (isPreloading) {
		fn.sequence(0, this.carousel.numItems).forEach(function(index) {
			this.DOM.wrapper.append(
				this.buildItem(null).css({ "left": index * this.width + "px" })
			);
		}.bind(this));
	}
	else {
		// add first three items to DOM
		this.carousel.data.slice(0, this.carousel.numItems).forEach(function(object, index) {
			this.DOM.wrapper.append(
				this.buildItem(object).css({ "left": index * this.width + "px" })
			);
		}.bind(this));
	}
};

// prepare data from WP API
Carousel.prototype.parseData = function(data) {
	return data.page.children
		.map(function(data) {
			var coverImage = null;
			var logoImage = null;

			if (data.attachments.length > 0) {
				var bigImages = data.attachments.filter(function(img) {
					return img.images.full.width > 110 && img.images.full.height > 125;
				});

				if (bigImages.length > 0) {
					coverImage = bigImages[0].images.medium.url;
				}

				var logos = data.attachments.filter(function(img) {
					return img.images.full.width === 110 && img.images.full.height === 125;
				});

				if (logos.length > 0) {
					logoImage = logos[0].images.full.url;
				}
			}

			// prepare tech focus array
			var techFocus = data.custom_fields["tech-focus"];

			if (techFocus) {
				techFocus = techFocus[0];

				if (techFocus && techFocus.indexOf(",") >= 0) {
					techFocus = techFocus.split(",").map(function(value) { return value.replace(/^\s+|\s+$/g, ""); });
				}
				else {
					techFocus = [ techFocus ];
				}
			}
			else {
				techFocus = [];
			}

			// return parsed object
			return {
				"areaOfDSI": data.custom_fields["area-of-digital-social-innovation"][0],
				"content": data.content,
				"coverImage": coverImage,
				"logoImage": logoImage,
				"name": data.title,
				"techFocus": techFocus,
				"url": data.url
			};
		})
		// TODO: temporarily skip case studies with missing images
		.filter(function(caseStudy) {
			return caseStudy.coverImage && caseStudy.logoImage;
		})
		.sort(function(a, b) {
			// sort using cover image
			var returnVal = 0;

			if (a.coverImage && !b.coverImage) { returnVal = -1; }
			if (!a.coverImage && b.coverImage) { returnVal = 1; }
			if (a.coverImage && b.coverImage) { returnVal = Math.random() > 0.5 ? 1 : -1; } //randomize a bit

			return returnVal;
		});
};

// display popup
Carousel.prototype.caseStudyShow = function(data) {
	// get color from config
	var color = VizConfig.dsiAreas.filter(function(dsi) {
		return dsi.id === data.areaOfDSI;
	})[0].color;

	// build content for popup
	var html = "<img class=\"cover\" src=\"" + data.coverImage + "\"/>";
	if (data.content.length > 0) {
		html += data.content;
	}
	else {
		html += "No content yet...";
	}

	// update popup elements
	this.DOM.popup.find(".title").html(data.name).css({ "color": color, "border-top": "4px solid " + color });
	this.DOM.popup.find(".content").html(html);

	// finally show poppup
	this.DOM.popup.show();
};

Carousel.prototype.caseStudyHide = function() {
	this.DOM.popup.hide();
};
