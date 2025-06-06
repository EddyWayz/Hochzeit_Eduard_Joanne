// js/includeTemplate.js
// Lädt Header und Footer und steuert das mobile Menü-Toggle
$(function() {
  // Header laden und danach Event-Handler setzen
  $('#header').load('html/templates/header.html', function() {
    // Öffnen/Schließen per Klick oder Touch auf das Burger-Icon
    $(document).on('click touchstart', '.menu-toggle', function(e) {
      e.stopPropagation(); // Verhindert sofortiges Schließen
      $('.nav-menu').toggleClass('open');
    });
    // Menü schließen, wenn ein Link angeklickt wird
    $(document).on('click touchstart', '.nav-menu a', function() {
      $('.nav-menu').removeClass('open');
    });
    // Schließen, wenn außerhalb des Menüs getippt/geclickt wird
    $(document).on('click touchstart', function(e) {
      var $nav = $('.nav-menu');
      if ($nav.hasClass('open') &&
          !$(e.target).closest('.nav-menu, .menu-toggle').length) {
        $nav.removeClass('open');
      }
    });
  });

  // Footer laden
  $('#footer').load('html/templates/footer.html');
});
