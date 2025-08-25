// js/includeTemplate.js
// Lädt Header und Footer und steuert das mobile Menü-Toggle

document.addEventListener('DOMContentLoaded', () => {
  // Header laden und danach Event-Handler setzen
  fetch('html/templates/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      document.getElementById('header').innerHTML = html;
      initMenuToggle();
    })
    .catch(err => {
      console.error('Fehler beim Laden des Headers:', err);
      const headerEl = document.getElementById('header');
      if (headerEl) {
        headerEl.innerHTML = '<p>Header konnte nicht geladen werden.</p>';
      }
    });

  // Footer laden
  fetch('html/templates/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      document.getElementById('footer').innerHTML = html;
    })
    .catch(err => {
      console.error('Fehler beim Laden des Footers:', err);
      const footerEl = document.getElementById('footer');
      if (footerEl) {
        footerEl.innerHTML = '<p>Footer konnte nicht geladen werden.</p>';
      }
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
