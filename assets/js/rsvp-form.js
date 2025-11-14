/**
 * RSVP Form Handler
 * Manages the main RSVP submission form
 */

// Wait for DOM and toast to be ready
document.addEventListener('DOMContentLoaded', function() {
  const guestsInput = document.getElementById('guests');
  const detailsContainer = document.getElementById('guest-details');
  const decreaseBtn = document.getElementById('decrease-guests');
  const increaseBtn = document.getElementById('increase-guests');

  // Initial render with 1 guest
  renderGuestFields(detailsContainer, parseInt(guestsInput.value));

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

  // Form Submit Handler
  document.querySelector('.rsvp-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate form
    const validation = validateForm(form, {
      familyName: {
        required: true,
        min: 2,
        message: 'Bitte gib einen gültigen Familiennamen ein (mindestens 2 Zeichen)'
      },
      email: {
        required: true,
        email: true
      },
      attending: {
        required: true,
        message: 'Bitte wähle eine Option aus'
      }
    });

    if (!validation.valid) {
      showFormErrors(form, validation.errors);
      toast.error('Bitte fülle alle Pflichtfelder korrekt aus');
      return;
    }

    // Clear any previous errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Wird gesendet...';

    try {
      const attending = form.attending.value;
      const guestCount = parseInt(guestsInput.value) || 1;
      const guestDetails = [];

      // Validate guest names only if attending
      if (attending === 'yes') {
        for (let i = 1; i <= guestCount; i++) {
          const nameField = form[`guestName_${i}`];
          const typeField = form[`guestType_${i}`];

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

      const data = {
        familyName:   form.familyName.value.trim(),
        email:        form.email.value.trim().toLowerCase(),
        attending:    attending,
        guests:       attending === 'yes' ? guestCount : 0,
        guestDetails: attending === 'yes' ? guestDetails : [],
        intolerances: attending === 'yes' ? form.intolerances.value.trim() : '',
        message:      form.message.value.trim(),
        timestamp:    firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('rsvps').add(data);

      const successMessage = attending === 'yes'
        ? 'Vielen Dank für deine Zusage! Du erhältst in Kürze eine Bestätigungs-E-Mail.'
        : 'Vielen Dank für deine Rückmeldung. Schade, dass du nicht dabei sein kannst!';

      toast.success(successMessage);

      // Reset form after short delay
      setTimeout(() => {
        form.reset();
        guestsInput.value = 1;
        renderGuestFields(detailsContainer, 1);
        toggleFormFields(false);
      }, 1000);

    } catch (error) {
      console.error('Fehler beim Absenden:', error);
      let errorMessage = 'Beim Absenden ist leider ein Fehler aufgetreten. Bitte versuche es später erneut.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Zugriff verweigert. Bitte überprüfe deine Eingaben und versuche es erneut.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Der Service ist momentan nicht erreichbar. Bitte versuche es später erneut.';
      }

      toast.error(errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}); // End DOMContentLoaded
