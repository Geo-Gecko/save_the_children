$(function () {
  $('.pop-button').popover({
    trigger: 'focus'
  });
});

$('.popover-header').click(function() {
	$('.pop-button').popover('hide');
});