/*jslint todo: true */
/*global fn, $, VizConfig, SPARQLDataSource */

var Carousel = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

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
			this.getOrgData(this.parseData(data), function(data) {
				this.carousel.parsedData = data; // get parsed data
				this.filter(null); // filter(null) to display all, automatically redraws carousel
			}.bind(this));
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
		VizConfig.events.addEventListener("filter", function() {
			var showByDefault = false;
			var filters = VizConfig.vizKey.getActiveFilters();

			this.filter(function(data) {
				var shouldShow = filters.reduce(function(memo, filter) {
					if (memo) { memo = data[filter.property] ? data[filter.property].indexOf(filter.id) >= 0 : showByDefault; }
					return memo;
				}, true);

				return shouldShow;
			});

			this.updateCaseStudiesTitle();
		}.bind(this));
	}

	Carousel.prototype.getOrgData = function(data, callback) {
		var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
		var ds = new SPARQLDataSource(url);

		var orgs = data
			.filter(function(caseStudy) { return caseStudy.org; })
			.map(function(caseStudy) { return "\"" + caseStudy.org + "\""; })
			.join(", ");

		ds.query()
			.prefix("o:", "<http://www.w3.org/ns/org#>")
			.prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
			.prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
			.prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
			.prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
			.select("?org ?org_label ?activity_label ?org_type ?adsi ?tech_focus ?area_of_society ?lat ?long")
			.where("?org", "a", "o:Organization")
			.where('?org', 'ds:organizationType', '?org_type')
			.where("?am", "a", "ds:ActivityMembership")
			.where("?am", "ds:organization", "?org")
			.where("?am", "ds:activity", "?activity")
			.where("?activity", "rdfs:label", "?activity_label")
			.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi", { optional: true })
			.where("?activity", "ds:technologyFocus", "?tech_focus", { optional: true })
			.where("?activity", "ds:areaOfSociety", "?area_of_society", { optional: true })
			.where("?org", "rdfs:label", "?org_label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "geo:long", "?long")
			.where("?org_site", "geo:lat", "?lat")
			.where("FILTER (str(?org) IN (" + orgs + "))", "", "")
			.execute()
			.then(function(results) {
				var reduceOrgByProp = function(data, prop, newPropName) {
					return data.reduce(function(memo, org) {
						if (org[prop]) {
							org[prop] = org[prop].substr(org[prop].lastIndexOf('/') + 1);
						}

						var index = indexOfProp(memo, "org", org.org);

						if (index >= 0 && org[prop]) {
							if (memo[index][newPropName].indexOf(org[prop]) < 0) {
								memo[index][newPropName].push(org[prop]);
							}
						}
						else {
							if (org[prop]) {
								org[newPropName] = [ org[prop] ];
								delete org[prop];
							}

							memo.push(org);
						}

						return memo;
					}, []);
				};

				results = results.map(function(result) {
					var o = {};
					var prop;
					for (prop in result) {
						if (result.hasOwnProperty(prop)) {
							o[prop] = result[prop].value;
						}
					}
					return o;
				});

				results = reduceOrgByProp(results, "org_type", "organisationType");
				results = reduceOrgByProp(results, "adsi", "areaOfDigitalSocialInnovation");
				results = reduceOrgByProp(results, "area_of_society", "areaOfSociety");
				results = reduceOrgByProp(results, "tech_focus", "technologyFocus");

				// merge SPARQL results with wordpress custom fields data
				data = data.map(function(caseStudy) {
					var index = indexOfProp(results, "org", caseStudy.org);
					if (index >= 0) {
						[
							"organisationType",
							"areaOfDigitalSocialInnovation",
							"areaOfSociety",
							"technologyFocus",
							"lat",
							"long"
						].forEach(function(key) {
							var sparqlData = results[index][key];
							if (caseStudy[key]) {
								caseStudy[key] = caseStudy[key].concat(sparqlData);
							}
							else {
								caseStudy[key] = sparqlData;
							}
						});
					}
					return caseStudy;
				});

				callback(data);
			});
	};

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

				var arrayFromCustomField = function(customField) {
					if (customField) {
						customField = customField[0];

						if (customField && customField.indexOf(",") >= 0) {
							customField = customField.split(",").map(function(value) { return value.replace(/^\s+|\s+$/g, ""); });
						}
						else {
							customField = [ customField ];
						}
					}
					else {
						customField = [];
					}

					return customField;
				};

				// prepare tech focus array
				var techFocus = arrayFromCustomField(data.custom_fields["tech-focus"]);
				var areaOfDSI = arrayFromCustomField(data.custom_fields["area-of-digital-social-innovation"]);
				var organisationType = arrayFromCustomField(data.custom_fields["organisation-type"]);
				var areaOfSociety = arrayFromCustomField(data.custom_fields["area-of-society"]);

				// get url
				var orgUrl = data.custom_fields["main-org"] ? data.custom_fields["main-org"][0] : undefined;
				if (orgUrl) { orgUrl = "http://data.digitalsocial.eu/id/organization/" + orgUrl; }

				// return parsed object
				return {
					"org": orgUrl,
					"organisationType": organisationType,
					"areaOfDigitalSocialInnovation": areaOfDSI,
					"areaOfSociety": areaOfSociety,
					"technologyFocus": techFocus,
					"content": data.content,
					"coverImage": coverImage,
					"logoImage": logoImage,
					"name": data.title,
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
			return dsi.id === data.areaOfDigitalSocialInnovation[0];
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

	Carousel.prototype.updateCaseStudiesTitle = function() {
		var filters = VizConfig.vizKey.getActiveFilters();
		var title = VizConfig.text.caseStudiesTitle;

		var datasourceByProperty = {
			areaOfDigitalSocialInnovation: VizConfig.dsiAreasById,
			technologyFocus: VizConfig.technologyFocusesById,
			areaOfSociety: VizConfig.areaOfSocietyById,
			organisationType: VizConfig.organisationTypeById
		};

		if (filters.length > 0) {
			title += ' from ';
			title += filters.map(function(filter) {
				return datasourceByProperty[filter.property][filter.id].title.replace('<br/>', '');
			}).join(', ');

			$('#caseStudiesTitle').text(title);
		}
	};

	return Carousel;
}());
