/**
 * Edit RSVP Form Handler
 * Manages the RSVP editing form with data loading from Firestore
 */

/**
 * Helper function to get query parameters from URL
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value
 */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Wrap in async IIFE to allow return statements
(async function() {
  const rsvpId = getParam('id');
  const form = document.getElementById('edit-form');
  const guestsInput = document.getElementById('guests');
  const detailsContainer = document.getElementById('guest-details');
  const decreaseBtn = document.getElementById('decrease-guests');
  const increaseBtn = document.getElementById('increase-guests');

  // Event Listener for guest counter - decrease
  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(guestsInput.value);
    if (currentValue > 1) {
      // Save current data before re-rendering
      const currentData = getCurrentGuestData(guestsInput);
      guestsInput.value = currentValue - 1;
      renderGuestFields(detailsContainer, currentValue - 1, currentData);
    }
  });

  // Event Listener for guest counter - increase
  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(guestsInput.value);
    if (currentValue < 5) {
      // Save current data before re-rendering
      const currentData = getCurrentGuestData(guestsInput);
      guestsInput.value = currentValue + 1;
      renderGuestFields(detailsContainer, currentValue + 1, currentData);
    }
  });

  // Event Listener for attendance radio buttons
  document.querySelectorAll('input[name="attending"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const isNotAttending = this.value === 'no';
      toggleFormFields(isNotAttending);

      // Save current data and re-render fields
      const currentData = getCurrentGuestData(guestsInput);
      renderGuestFields(detailsContainer, parseInt(guestsInput.value), currentData);
    });
  });

  // Load data and populate form
  if (!rsvpId) {
    toast.error('Keine RSVP-ID gefunden. Bitte verwende den Link aus deiner E-Mail.');
    return;
  }

  db.collection('rsvps').doc(rsvpId).get().then(doc => {
    if (!doc.exists) {
      toast.error('RSVP nicht gefunden. Bitte überprüfe den Link aus deiner E-Mail.');
      return;
    }
    const data = doc.data();

    // Set basic form fields
    form.familyName.value   = data.familyName || '';
    form.email.value        = data.email || '';
    guestsInput.value       = data.guests || 1;
    form.intolerances.value = data.intolerances || '';
    form.message.value      = data.message || '';

    // Set radio button for attendance correctly (not with .value!)
    const attendingRadio = document.querySelector(`input[name="attending"][value="${data.attending}"]`);
    if (attendingRadio) {
      attendingRadio.checked = true;
    } else {
      console.warn('Attending radio button not found for value:', data.attending);
    }

    // After setting radio buttons, toggle fields
    const isNotAttending = data.attending === 'no';
    toggleFormFields(isNotAttending);

    // Then render guest fields with loaded data
    renderGuestFields(detailsContainer, data.guests || 1, data.guestDetails || []);

  }).catch(err => {
    console.error('Fehler beim Laden der RSVP-Daten:', err);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      rsvpId: rsvpId
    });

    let errorMessage = 'Fehler beim Laden der Daten. Bitte versuche es später erneut.';

    if (err.code === 'permission-denied') {
      errorMessage = 'Zugriff verweigert. Bitte überprüfe den Link aus deiner E-Mail.';
    } else if (err.code === 'not-found') {
      errorMessage = 'RSVP nicht gefunden. Bitte überprüfe den Link aus deiner E-Mail.';
    } else if (err.code === 'unavailable') {
      errorMessage = 'Der Service ist momentan nicht erreichbar. Bitte versuche es später erneut.';
    }

    toast.error(errorMessage);
  });

  // Submit: update in Firestore
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Read radio button correctly (not with .value!)
    const attendingChecked = document.querySelector('input[name="attending"]:checked');
    const attending = attendingChecked ? attendingChecked.value : 'yes';

    // Validation
    if (!e.target.familyName.value.trim() || e.target.familyName.value.trim().length < 2) {
      toast.error('Bitte gib einen gültigen Familiennamen ein (mindestens 2 Zeichen)');
      return;
    }

    if (!e.target.email.value.trim() || !e.target.email.value.includes('@')) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Wird gespeichert...';

    const guestCount = parseInt(guestsInput.value) || 1;
    const guestDetails = [];

    // Validate guest names only if attending === 'yes'
    if (attending === 'yes') {
      for (let i = 1; i <= guestCount; i++) {
        const nameField = e.target[`guestName_${i}`];
        const typeField = e.target[`guestType_${i}`];

        if (!nameField || !nameField.value.trim()) {
          toast.error(`Bitte gib einen Namen für Gast ${i} ein`);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        guestDetails.push({
          name: nameField.value.trim(),
          type: typeField.value
        });
      }
    }

    const updated = {
      familyName:   e.target.familyName.value.trim(),
      email:        e.target.email.value.trim().toLowerCase(),
      attending:    attending,
      guests:       attending === 'yes' ? guestCount : 0,
      guestDetails: attending === 'yes' ? guestDetails : [],
      intolerances: attending === 'yes' ? e.target.intolerances.value.trim() : '',
      message:      e.target.message.value.trim()
    };

    try {
      await db.collection('rsvps').doc(rsvpId).update(updated);
      toast.success('Deine RSVP wurde erfolgreich aktualisiert! ✓');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);

      let errorMessage = 'Fehler beim Speichern. Bitte versuche es später erneut.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Zugriff verweigert. Bitte überprüfe deine Eingaben und versuche es erneut.';
      } else if (error.code === 'not-found') {
        errorMessage = 'RSVP nicht gefunden. Bitte überprüfe den Link aus deiner E-Mail.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Der Service ist momentan nicht erreichbar. Bitte versuche es später erneut.';
      } else if (error.code === 'invalid-argument') {
        errorMessage = 'Ungültige Eingaben. Bitte überprüfe deine Daten.';
      }

      toast.error(errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Änderungen speichern';
    }
  });
})(); // End of async IIFE
