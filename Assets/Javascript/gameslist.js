$(document).ready(function() {
  $('.game').click(function() {
    $('#horseform').dialog({ modal: true, title: $(this).text() + " game form" });
  });
});
