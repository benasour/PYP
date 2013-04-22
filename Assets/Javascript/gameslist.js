$(document).ready(function() {
  $('.game').click(function() {
    $('#' + $(this).text() + 'form').dialog({ modal: true, title: $(this).text() + " game form" });
  });
});
