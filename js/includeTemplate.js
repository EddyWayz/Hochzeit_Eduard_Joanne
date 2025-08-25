// js/includeTemplate.js
// Lädt Header und Footer und steuert das mobile Menü-Toggle

document.addEventListener('DOMContentLoaded', () => {
  // Header laden und danach Event-Handler setzen
  fetch('html/templates/header.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
      initMenuToggle();
    });

  // Footer laden
  fetch('html/templates/footer.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('footer').innerHTML = html;
    });
});

// Event-Handler für das mobile Menü
function initMenuToggle() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!menuToggle || !navMenu) return;

  // Öffnen/Schließen per Klick auf das Burger-Icon
  menuToggle.addEventListener('click', e => {
    e.stopPropagation();
    navMenu.classList.toggle('open');
  });

  // Schließen, wenn außerhalb des Menüs geklickt wird
  document.addEventListener('click', e => {
    if (navMenu.classList.contains('open') &&
        !e.target.closest('.nav-menu') &&
        !e.target.closest('.menu-toggle')) {
      navMenu.classList.remove('open');
    }
  });
}
