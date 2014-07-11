L.control.customButton = L.Control.extend({
	options: {
		position: 'topright',
		title: 'Custom Button',
		callback: null,
		className: 'custom-button'
	},

	onAdd: function (map) {
		var className = this.options.className;
		var container;

		container = L.DomUtil.create('div', 'leaflet-bar');

		this._createButton(this.options.title, className, container, this.callCallback.bind(this), map);

		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, context);

		return link;
	},

	callCallback: function () {
		if (this.options.callback) { this.options.callback(); }
	},
});
