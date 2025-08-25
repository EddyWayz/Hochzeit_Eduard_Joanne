document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form form');
  if (!form) return;

  const statusEl = document.createElement('div');
  statusEl.id = 'form-status';
  statusEl.setAttribute('aria-live', 'polite');
  form.appendChild(statusEl);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Senden…';

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      if (response.ok) {
        statusEl.textContent = 'Danke für deine Nachricht!';
        form.reset();
      } else {
        statusEl.textContent = 'Es ist ein Fehler aufgetreten. Bitte später erneut versuchen.';
      }
    } catch (err) {
      statusEl.textContent = 'Netzwerkfehler. Bitte später erneut versuchen.';
    }
  });
});
