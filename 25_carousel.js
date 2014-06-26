/*global $ */

var parseData = function(data) {
	data = data.page.children.map(function(data) {
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

	console.log(data);
};

// fetch data
var API_URL = "http://content.digitalsocial.eu/api/get_page/?slug=case-studies&children=true";
$.getJSON(API_URL, parseData);
