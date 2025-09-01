// js/includeTemplate.js (vanilla JS)
// Lädt Header und Footer und steuert das mobile Menü-Toggle ohne jQuery

document.addEventListener('DOMContentLoaded', () => {
  const loadInto = async (selector, url) => {
    const container = document.querySelector(selector);
    if (!container) return;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      container.innerHTML = html;

      // Wenn Header geladen: Event-Handler registrieren
      if (selector === '#header') {
        const navMenu = container.querySelector('.nav-menu');
        const toggle = container.querySelector('.menu-toggle');
        if (toggle && navMenu) {
          const toggleMenu = (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('open');
          };
          ['click', 'touchstart'].forEach((ev) => toggle.addEventListener(ev, toggleMenu));

          const maybeClose = (e) => {
            if (navMenu.classList.contains('open') && !e.target.closest('.nav-menu, .menu-toggle')) {
              navMenu.classList.remove('open');
            }
          };
          document.addEventListener('click', maybeClose);
          document.addEventListener('touchstart', maybeClose);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden von', url, err);
    }
  };

  loadInto('#header', 'includes/header.html');
  loadInto('#footer', 'includes/footer.html');
});
