/* jQuery Overlay Plugin
	Made for TalkIn
	Author: Dmitriy Miroshnichenko aka Keyten
	License: MIT */

(function(global, $, undefined){

	$.fn.overlay = function(){

		var $this = $(this),
			$body = $(global.document.body),
			overlay, image;

		$this.click(function(){

			overlay = $('<div>').css({
				position: 'fixed',
				top: 0,
				left: 0,
				height: $body.height(),
				width: $body.width(),
				background: 'black',
				opacity: 0.5,
				display: 'none'
			});
			overlay.appendTo(global.document.body);
			overlay.fadeIn();

			image = $('<img>', {
				src: $this.attr('src')
			}).css('display', 'none');
			image.appendTo(global.document.body);
			image.fadeIn();

			image.on('load', function(){
				var w = image.width(),
					h = image.height(),
					winh = $(window).height();
				image.css({
					position: 'absolute',
					top: 10,
					left: $body.width() / 2 - w / 2,
				});
			});

			image.click(destroy);
			overlay.click(destroy);

		});

		function destroy(){
			image.fadeOut();
			overlay.fadeOut(function(){
				overlay.remove();
				image.remove();
			});
		}

		return this;

	};

})(this, this.jQuery);