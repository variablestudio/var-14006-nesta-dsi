function Carousel(DOMElements, settings) {
	this.DOM = {
		"wrapper": DOMElements.wrapper, // carousel wrapper
		"buttonNext": DOMElements.buttonNext,
		"buttonPrev": DOMElements.buttonPrev
	};

	this.carousel = {
		"data": [],
		"parsedData": [],
		"numItems": 4,
		"index": 0
	};

	this.animating = {
		"next": false,
		"prev": false
	};

	this.width = settings ? settings.width : 238 + 14; // 14px margin
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
	carouselItem += "<a href=\"" + data.url + "\" + alt=\"" + data.name + "\">";
	if (data.coverImage) carouselItem += "<img src=\"" + data.coverImage + "\">";
	//if (data.logoImage) carouselItem += "<img src=\"" + data.logoImage + "\">";
	carouselItem += "<span><img src='"+data.logoImage+"'/>" + data.name + "</span>";
	carouselItem += "</a>";
	carouselItem += "</div>";

	return carouselItem;
};

// builds initial carousel
Carousel.prototype.buildCarousel = function() {
	// empty wrapper
	this.DOM.wrapper.empty();

	// add first three items to DOM
	this.carousel.data.slice(0, this.carousel.numItems).forEach(function(object, index) {
		this.DOM.wrapper.append(
			$(this.buildItem(object)).css({ "left": index * this.width + "px" })
		);
	}.bind(this));
};

// prepare data from WP API
Carousel.prototype.parseData = function(data) {
	return data.page.children
		.map(function(data) {
			var coverImage = null;
			var logoImage = null;
			if (data.attachments.length > 0) {
				console.log(data.attachments)
				coverImage = data.attachments[0].images.medium.url;
				var logos = data.attachments.filter(function(img) {
					return img.images.full.width == 110 && img.images.full.height == 125;
				});
				if (logos.length > 0) {
					logoImage = logos[0].images.full.url;
				}
				console.log(logoImage);
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
				"name": data.title,
				"url": data.url,
				"areaOfDSI": data.custom_fields["area-of-digital-social-innovation"][0],
				"techFocus": techFocus,
				"coverImage": coverImage,
				"logoImage": logoImage
			};
		})
		/*
		.sort(function(a, b) {
			// sort using cover image
			var returnVal = 0;

			if (a.coverImage && !b.coverImage) { returnVal = -1; }
			if (!a.coverImage && b.coverImage) { returnVal = 1; }
			if (a.coverImage && b.coverImage) { returnVal = Math.random() > 0.5 ? 1 : -1; }

			return returnVal;
		});
		*/
};
