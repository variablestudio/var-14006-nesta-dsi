/*global $ */

var DOM = {
	"carouselWrapper": $("#carousel >.carousel-wrapper"),
	"buttonPrev": $("#carousel > .button-prev"),
	"buttonNext": $("#carousel > .button-next")
};

var CAROUSEL_DATA = [];
var CAROUSEL_INDEX = 0;

var buildItem = function(data) {
	var carouselItem = "<div class=\"carousel-item\">";
	// carouselItem += "<img src=\"" +
	carouselItem += "<span>" + data.name + "</span>";
	carouselItem += "</div>";

	return carouselItem;
};

var buildCarousel = function() {
	// add first three items to DOM
	CAROUSEL_DATA.slice(0, 3).forEach(function(object, index) {
		DOM.carouselWrapper.append(
			$(buildItem(object)).css({
				"position": "absolute",
				"left": index * 322 + (index > 0 ? index * 14 : 0) + "px"
			})
		);
	});
};

DOM.buttonPrev.on("click", function() {
	var prependIndex = CAROUSEL_INDEX + 4;
	if (prependIndex > CAROUSEL_DATA.length - 1) { prependIndex = 0; }
	CAROUSEL_INDEX = prependIndex;

	DOM.carouselWrapper
		.append(buildItem(CAROUSEL_DATA[prependIndex]))
		.children().each(function(index, child) {
			$(child)
				.css({
					"position": "absolute",
					"left": index * 322 + (index > 0 ? index * 14 : 0) + "px"
				})
				.animate({
					"left": (index - 1) * 322 + (index >= 0 ? index * 14 : 0) + "px"
				},
				{
					"complete": function() {
						if (index === 0) { $(child).remove(); }
					}
				});
		});
});

DOM.buttonNext.on("click", function() {
	var prependIndex = CAROUSEL_INDEX - 1;
	if (prependIndex < 0) { prependIndex = CAROUSEL_DATA.length - 1; }
	CAROUSEL_INDEX = prependIndex;

	DOM.carouselWrapper
		.prepend(buildItem(CAROUSEL_DATA[prependIndex]))
		.children().each(function(index, child) {
			$(child)
				.css({
					"position": "absolute",
					"left": (index - 1) * 322 + (index >= 0 ? index * 14 : 0) + "px"
				})
				.animate({
					"left": index * 322 + (index > 0 ? index * 14 : 0) + "px"
				},
				{
					"complete": function() {
						if (index === 3) { $(child).remove(); }
					}
				});
		});
});

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
