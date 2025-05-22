// includeTemplate.js: Lädt Header und Footer Templates und steuert das mobile Menü-Toggle
$(function() {
  // Header in alle Seiten einfügen und danach Event-Handler setzen
  $('#header').load('html/templates/header.html', function() {
    // Öffnen/Schließen per Klick auf das Burger-Icon
    $(document).on('click', '.menu-toggle', function(e) {
      e.stopPropagation(); // Verhindert, dass der folgende Document-Click-Handler sofort schließt
      $('.nav-menu').toggleClass('open');
    });
    // Schließen, wenn außerhalb des Menüs geklickt wird
    $(document).on('click', function(e) {
      var $nav = $('.nav-menu');
      // Nur schließen, wenn geöffnet und Klick weder auf das Menü noch auf das Toggle-Icon
      if ($nav.hasClass('open') &&
          !$(e.target).closest('.nav-menu').length &&
          !$(e.target).closest('.menu-toggle').length) {
        $nav.removeClass('open');
      }
    });
  });

  // Footer in alle Seiten einfügen
  $('#footer').load('html/templates/footer.html');
});
