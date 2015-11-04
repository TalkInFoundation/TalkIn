$(function(){

	var body = $(document);
	$('.panel').each(function(){

		var panel = $(this);
		var title = $('.panel_title', this);
		var content = $('.panel_content', this);
		var x, y;

		// draggable
		title.mousedown(function(e){
			var bounds = panel[0].getBoundingClientRect();
			x = e.clientX - bounds.left;
			y = e.clientY - bounds.top;
			body.css({
				'-moz-user-select': 'none',
				'-webkit-user-select': 'none'
			});
		});

		body.mouseup(function(){
			x = null;
			y = null;
			body.css({
				'-moz-user-select': '',
				'-webkit-user-select': ''
			});
		}).mousemove(function(e){
			if(!x || !y)
				return;
			panel.css({
				top: e.clientY - y,
				left: e.clientX - x
			});
		});

		// hiding
		var hidebutton = $('.hide_button', this);
		var hidden = false;
		hidebutton.click(function(e){
			if(hidden){
				hidebutton.html('&#xe80f;');
				content.slideDown();
				hidden = false;
			}
			else {
				hidebutton.html('&#xe810;');
				content.slideUp();
				hidden = true;
			}
		});

	});

});

var Widget = (function($, undefined){

	var $document = $(document);

	function Widget(name, params, socket){
		if( !(name in Widget.widgets) ){
			throw "Undefined widget: " + name;
		}

		Object.keys(Widget.widgets[name]).forEach(function(param){
			this[param] = Widget.widgets[name][param];
		}.bind(this));
        this.socket = socket || undefined;
		this.makeHTML(params);
		this.make(params);
	}

	Widget.prototype = {

		makeHTML: function(){

			this.$panel = $('<div></div>', {
				class: 'panel',
				css: {
					width: this.width,
					height: this.height,
					position: 'absolute',
					top: this.top,
					left: this.left
				}
			}).appendTo('body');

			this.$title = $('<div class="panel_title"></div>').appendTo(this.$panel);
			this.$buttons = $('<div class="panel_title_buttons"></div>').appendTo(this.$title);
			this.$title.append(this.title)
			this.$content = $('<div class="panel_content"></div>').appendTo(this.$panel);
            this.$hidden = $('<input type="hidden" class="panel_hidden_info"/>').appendTo(this.$panel);

			this.makeButtons();
			this.makeInteraction();

		},

		makeButtons: function(){

			if(this.collapsible){

				this.$collapseButton = this.makeButton('xe80f', function(){
					if(this.collapsed){
						this.$collapseButton.html('&#xe80f;');
						this.$content.slideDown();
						this.collapsed = false;
					}
					else {
						this.$collapseButton.html('&#xe810;');
						this.$content.slideUp();
						this.collapsed = true;
					}
				}.bind(this));

			}

		},

		makeButton: function(symbol, listener, className){

			var $button = $('<i class="icon">&#' + symbol + ';</i>', {
				class: className
			}).appendTo(this.$buttons);

			$button.click(listener);

			return $button;

		},

		makeInteraction: function(){

			if(this.draggable){

				var x, y;
				this.$title.mousedown(function(e){
					var bounds = this.$panel[0].getBoundingClientRect();
					x = e.clientX - bounds.left;
					y = e.clientY - bounds.top;

					document.body.style.MozUserSelect = 'none';
					document.body.style.WebkitUserSelect = 'none';
				}.bind(this));

				$document.mouseup(function(){
					x = null;
					y = null;

					document.body.style.MozUserSelect = '';
					document.body.style.WebkitUserSelect = '';
				}).mousemove(function(e){
					if(!x || !y)
						return;
					this.$panel.css({
						top: e.clientY - y,
						left: e.clientX - x
					});
				}.bind(this));
			}

		},

		collapsible: true,
		collapsed: false,
		draggable: true,
		resizable: true

	};
	Widget.widgets = {};

	return Widget;

})(jQuery);

/*
Examples:

Widget.widgets['Test'] = {
	title: 'Test',
	top: 50,
	left: 0,
	width: 200,
	//height: 200,
	make: function(params){
		this.$content.text(params.msg);
	}
};

var wid = new Widget('Test', { msg: 'test' });
 */