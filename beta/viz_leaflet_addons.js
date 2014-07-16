/*global L */

L.control.customButton = L.Control.extend({
	options: {
		position: 'topright',
		title: 'Custom Button',
		click: null,
		mouseover: null,
		mouseout: null,
		className: 'custom-button'
	},

	onAdd: function(map) {
		var className = this.options.className;
		var container;

		container = L.DomUtil.create('div', 'leaflet-bar');

		this.createButton(
			this.options.title,
			className,
			container,
			{
				"click": this.callback.bind(this, "click"),
				"mouseover": this.callback.bind(this, "mouseover"),
				"mouseout": this.callback.bind(this, "mouseout")
			},
			map
		);

		return container;
	},

	createButton: function(title, className, container, events, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		var event;
		for (event in events) {
			if (events.hasOwnProperty(event)) {
				L.DomEvent
					.addListener(link, event, L.DomEvent.stopPropagation)
					.addListener(link, event, L.DomEvent.preventDefault)
					.addListener(link, event, events[event], context);
			}
		}

		return link;
	},

	callback: function(fnName) {
		if (this.options[fnName]) { this.options[fnName](); }
	},
});
