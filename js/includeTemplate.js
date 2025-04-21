$(function() {
    // Header und Footer in alle Seiten einfügen
    $('#header').load('html/templates/header.html');
    $('#footer').load('html/templates/footer.html');
});

$(document).on('click', '.menu-toggle', function() {
  $('.nav-menu').toggleClass('open');
});
