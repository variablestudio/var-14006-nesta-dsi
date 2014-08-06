/*jslint todo: true */
/*global fn, $, VizConfig, SPARQLDataSource */

var Carousel = (function() {
	var indexOfProp = function(data, prop, val) {
		return data.map(function(o) { return o[prop]; }).indexOf(val);
	};

	function Carousel(DOMElements, settings) {
		settings = settings || {};
		this.isDesktopBrowser = settings.isDesktopBrowser;

		// create popup
		var popupStr = [
			"<div id=\"carousel-popup\">",
				"<div class=\"arrowbutton button-prev\"></div>",
				"<div class=\"arrowbutton button-next\"></div>",
				"<div class=\"title\"></div>",
				"<div class=\"content-container\">",
					"<div class=\"images\"></div>",
					"<div class=\"content\"></div>",
				"</div>",
			"</div>"
		].join("");

		var popup = $(popupStr)
			.hide()
			.on("click", this.caseStudyHide.bind(this))
			.on("touchstart", function(e) {
				e.preventDefault();
				e.stopPropagation();
			});

		$("body").append(popup);
		$("body").on("click touchstart", this.caseStudyHide.bind(this));

		this.DOM = {
			"filters": DOMElements.filters,
			"wrapper": DOMElements.wrapper,
			"buttonNext": DOMElements.buttonNext,
			"buttonPrev": DOMElements.buttonPrev,
			"popup": popup,
			"popupButtonPrev": popup.find(".button-prev"),
			"popupButtonNext": popup.find(".button-next")
		};

		this.popup = {
			"images": 0,
			"index": 0
		};

		this.carousel = {
			"data": [],
			"parsedData": [],
			"numItems": settings.isDesktopBrowser ? 3 : 2,
			"index": 0
		};

		this.animating = {
			"next": false,
			"prev": false
		};

		var margin = 14;
		this.width = settings.width || 322 + margin;
		var apiUrl = settings.url || "http://content.digitalsocial.eu/api/get_page/?slug=case-studies&children=true";

		this.DOM.wrapper.width(this.width * this.carousel.numItems - margin);

		// fetch data
		$.getJSON(apiUrl, function(data) {
			this.getOrgData(this.parseData(data), function(data) {
				this.carousel.parsedData = data; // get parsed data
				this.filter(null); // filter(null) to display all, automatically redraws carousel

				VizConfig.events.fire('casestudies', this.carousel.data);
			}.bind(this));
		}.bind(this));

		// setup button events
		this.DOM.buttonNext.on("click touchstart", function() {
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

		this.DOM.buttonPrev.on("click touchstart", function() {
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

		this.DOM.popupButtonPrev.on("click touchstart", function(e) {
			e.preventDefault();
			e.stopPropagation();

			this.popup.index = (this.popup.index - 1) < 0 ? (this.popup.images.length - 1) : (this.popup.index - 1);
			this.updateImage();
		}.bind(this));

		this.DOM.popupButtonNext.on("click touchstart", function(e) {
			e.preventDefault();
			e.stopPropagation();

			this.popup.index = (this.popup.index + 1) % this.popup.images.length;
			this.updateImage();
		}.bind(this));

		// build carousel with preloading gif on launch
		this.buildCarousel({ "preloading": true });

		this.updateFiltersText();

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

			VizConfig.events.fire('casestudies', this.carousel.data);

			this.updateFiltersText();
		}.bind(this));

		// show case study popup from event
		VizConfig.events.addEventListener("casestudypopup", function(org) {
			var index = indexOfProp(this.carousel.parsedData, "org", org);
			if (index >= 0) {
				var data = this.carousel.parsedData[index];
				this.caseStudyShow(data);
			}
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
			.where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
			.where("?activity", "ds:technologyFocus", "?tech_focus")
			.where("?activity", "ds:areaOfSociety", "?area_of_society", { optional: true })
			.where("?org", "rdfs:label", "?org_label")
			.where("?org", "o:hasPrimarySite", "?org_site")
			.where("?org_site", "geo:long", "?long")
			.where("?org_site", "geo:lat", "?lat")
			.where("FILTER (str(?org) IN (" + orgs + "))", "", "")
			.execute()
			.then(function(results) {
				var reduceOrgByProps = function(data, props) {
					return data.reduce(function(memo, org) {
						props.forEach(function(p) {
							if (org[p.old]) { org[p.old] = org[p.old].substr(org[p.old].lastIndexOf('/') + 1); }
						});

						var index = indexOfProp(memo, "org", org.org);

						if (index >= 0) {
							props.forEach(function(p) {
								if (org[p.old] && memo[index][p.new].indexOf(org[p.old]) < 0) {
									memo[index][p.new].push(org[p.old]);
								}
							});
						}
						else {
							props.forEach(function(p) {
								if (org[p.old]) {
									org[p.new] = [ org[p.old] ];
									delete org[p.old];
								}
							});

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

				results = reduceOrgByProps(results, [
					{ old: "org_type", new: "organisationType" },
					{ old: "adsi", new: "areaOfDigitalSocialInnovation" },
					{ old: "area_of_society", new: "areaOfSociety" },
					{ old: "tech_focus", new: "technologyFocus" }
				]);

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
			carouselItem.on("click touchstart", function(e) {
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
			// add first numItems items to DOM
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
						return img.images.full.width > 200 && img.images.full.height > 200;
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

				// get images
				var minImgWidth = 400;
				var popupImages = data.attachments
					.map(function(img) { return img.images.full; })
					.filter(function(img) { return img.width > minImgWidth; });

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
					"popupImages": popupImages,
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
		// disable page scroll
		$("body").css({ overflow: "hidden" });

		if (this.isDesktopBrowser) {
			this.DOM.buttonNext.hide();
			this.DOM.buttonPrev.hide();
		}

		// get color from config
		var color = VizConfig.dsiAreas.filter(function(dsi) {
			return dsi.id === data.areaOfDigitalSocialInnovation[0];
		})[0].color;

		// build content for popup
		var html;
		if (data.content.length > 0) {
			html = data.content;
		}
		else {
			html = "No content yet...";
		}

		// get url to link to
		var url;
		if (data.org) {
			url = data.org.substr(data.org.lastIndexOf("/") + 1);
			url = "http://digitalsocial.eu/organisations/" + url;
		}
		else {
			url = data.url;
		}

		var popupTitleHtml = $("<a href=\"" + url  + "\">" + data.name + "</a>").css({ "color": color });

		// update popup images
		this.popup.images = data.popupImages;
		this.popup.index = 0;

		if (this.popup.images.length === 1) {
			this.DOM.popupButtonNext.hide();
			this.DOM.popupButtonPrev.hide();

			this.updateImage();
		}
		else if (this.popup.images.length > 0) {
			this.DOM.popupButtonNext.show();
			this.DOM.popupButtonPrev.show();

			this.updateImage();
		}
		else {
			this.DOM.popupButtonNext.hide();
			this.DOM.popupButtonPrev.hide();

			if (this.popup.images.length > 0) {
				this.updateImage();
			}
			else {
				this.DOM.popup.find(".images").html("");
			}
		}

		// update popup elements
		this.DOM.popup.find(".title").html(popupTitleHtml).css({ "border-top": "4px solid " + color });
		this.DOM.popup.find(".content").html(html);

		this.DOM.popup.fadeIn();
	};

	Carousel.prototype.caseStudyHide = function() {
		$("body").css({ overflow: "scroll" }); // enable page scroll

		if (this.isDesktopBrowser) {
			this.DOM.buttonNext.show();
			this.DOM.buttonPrev.show();
		}

		this.DOM.popup.fadeOut();
	};

	Carousel.prototype.updateImage = function() {
		var imageIndex = this.popup.index;
		var img = "<img src=\"" + this.popup.images[imageIndex].url + "\"/>";

		this.DOM.popup.find(".images").html(img);
	};

	Carousel.prototype.updateFiltersText = function() {
		var filters = VizConfig.vizKey.getActiveFilters();

		var datasourceByProperty = {
			areaOfDigitalSocialInnovation: VizConfig.dsiAreasById,
			technologyFocus: VizConfig.technologyFocusesById,
			areaOfSociety: VizConfig.areaOfSocietyById,
			organisationType: VizConfig.organisationTypeById
		};

		var text = "&nbsp;";
		if (filters.length > 0) {
			text = filters.map(function(filter) {
				return datasourceByProperty[filter.property][filter.id].title.replace('<br/>', '');
			}).join(', ');
		}

		this.DOM.filters.html(text);
	};

	return Carousel;
}());
