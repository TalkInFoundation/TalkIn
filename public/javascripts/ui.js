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