/*global $ */

var CAROUSEL_DATA = [];
var CAROUSEL_INDEX = 0;
var ITEM_WIDTH = 322 + 14; // 14px for margin

// cache jquery elements
var DOM = {
	"carouselWrapper": $("#carousel >.carousel-wrapper"),
	"buttonPrev": $("#carousel > .button-prev"),
	"buttonNext": $("#carousel > .button-next")
};

// creates single carousel item
var buildItem = function(data) {
	var carouselItem = "<div class=\"carousel-item\" style=\"position: absolute\">";

	// TODO: add case study image
	// carouselItem += "<img src=\"" +

	carouselItem += "<span>" + data.name + "</span>";
	carouselItem += "</div>";

	return carouselItem;
};

// builds initial carousel
var buildCarousel = function() {
	// add first three items to DOM
	CAROUSEL_DATA.slice(0, 3).forEach(function(object, index) {
		DOM.carouselWrapper.append(
			$(buildItem(object)).css({ "left": index * ITEM_WIDTH + "px" })
		);
	});
};

DOM.buttonPrev.on("click", function() {
	// adjust index
	var prependIndex = CAROUSEL_INDEX + 4;
	if (prependIndex > CAROUSEL_DATA.length - 1) { prependIndex = 0; }
	CAROUSEL_INDEX = prependIndex;

	// append element and animate
	DOM.carouselWrapper
		.append(buildItem(CAROUSEL_DATA[prependIndex]))
		.children().each(function(index, child) {
			$(child)
				.css({ "left": index * ITEM_WIDTH + "px" })
				.animate(
					{ "left": (index - 1) * ITEM_WIDTH + "px" },
					{ "complete": function() { if (index === 0) { $(child).remove(); } }} // remove invisible child after animations complete
				);
		});
});

DOM.buttonNext.on("click", function() {
	// adjust index
	var prependIndex = CAROUSEL_INDEX - 1;
	if (prependIndex < 0) { prependIndex = CAROUSEL_DATA.length - 1; }
	CAROUSEL_INDEX = prependIndex;

	// prepend element and animate
	DOM.carouselWrapper
		.prepend(buildItem(CAROUSEL_DATA[prependIndex]))
		.children().each(function(index, child) {
			$(child)
				.css({ "left": (index - 1) * ITEM_WIDTH + "px" })
				.animate(
					{ "left": index * ITEM_WIDTH + "px" },
					{ "complete": function() { if (index === 3) { $(child).remove(); } }} // remove invisible child after animations complete
				);
		});
});

// prepare data from WP API
var parseData = function(data) {
	return data.page.children.map(function(data) {
		var techFocus = data.custom_fields["tech-focus"];

		if (techFocus) {
			techFocus = techFocus[0];

			if (techFocus && techFocus.indexOf(",") >= 0) {
				techFocus = techFocus.split(",").map(function(value) {
					return value.replace(/^\s+|\s+$/g,''); // remove trailing/leading whitespace
				});
			}
			else {
				techFocus = [ techFocus ];
			}
		}
		else {
			techFocus = [];
		}

		return {
			"name": data.title,
			"url": data.url,
			"areaOfDSI": data.custom_fields["area-of-digital-social-innovation"][0],
			"techFocus": techFocus,
			"attachments": data.attachments
		};
	});
};

// fetch data
var API_URL = "http://content.digitalsocial.eu/api/get_page/?slug=case-studies&children=true";
$.getJSON(API_URL, function(data) {
	CAROUSEL_DATA = parseData(data);
	buildCarousel();
});