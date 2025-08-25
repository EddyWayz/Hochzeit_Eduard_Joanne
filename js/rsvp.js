const guestsInput = document.getElementById('guests');
const detailsContainer = document.getElementById('guest-details');
const decreaseBtn = document.getElementById('decrease-guests');
const increaseBtn = document.getElementById('increase-guests');

function renderGuestFields(count) {
  detailsContainer.innerHTML = '';
  const isDisabled = document.querySelector('input[name="attending"]:checked')?.value === 'no';
  
  for (let i = 1; i <= count; i++) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('guest-field');
    if (isDisabled) wrapper.classList.add('disabled');
    
    wrapper.innerHTML = `
      <div class="guest-header">
        <h3>Gast ${i}</h3>
      </div>
      <div class="guest-content">
        <div class="form-group">
          <label for="guestName_${i}">Vorname</label>
          <input type="text" id="guestName_${i}" name="guestName_${i}" 
                 placeholder="Vorname Gast ${i}" required ${isDisabled ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label>Alterskategorie</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Erwachsener" 
                     checked ${isDisabled ? 'disabled' : ''}>
              <span>Erwachsener</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Kind" 
                     ${isDisabled ? 'disabled' : ''}>
              <span>Kind</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Kleinkind" 
                     ${isDisabled ? 'disabled' : ''}>
              <span>Kleinkind</span>
            </label>
          </div>
        </div>
      </div>
    `;
    detailsContainer.appendChild(wrapper);
  }
}

// Funktion zum Aktivieren/Deaktivieren der Formularfelder
function toggleFormFields(disable) {
  const fieldsToToggle = [
    '#guests',
    '#decrease-guests',
    '#increase-guests',
    '#intolerances',
    '#message'
  ];
  
  // Hauptfelder togglen
  fieldsToToggle.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.disabled = disable;
    }
  });
  
  // Gast-Detail-Felder togglen
  const guestFields = document.querySelectorAll('#guest-details input, #guest-details textarea');
  guestFields.forEach(field => {
    field.disabled = disable;
  });
  
  // Container-Klasse für visuelles Styling
  const guestDetailsContainer = document.getElementById('guest-details');
  const guestsFormGroup = document.querySelector('.guests-form-group');
  const ageInfoGroup = document.querySelector('.age-info');
  const intolerancesGroup = document.querySelector('.intolerances-form-group');
  const messageGroup = document.querySelector('.message-form-group');
  
  [guestDetailsContainer, guestsFormGroup, ageInfoGroup, intolerancesGroup, messageGroup].forEach(container => {
    if (container) {
      if (disable) {
        container.classList.add('disabled');
      } else {
        container.classList.remove('disabled');
      }
    }
  });
}

// Initial render mit 1 Gast
renderGuestFields(parseInt(guestsInput.value));

// Event Listener für Teilnahme Radio Buttons
document.querySelectorAll('input[name="attending"]').forEach(radio => {
  radio.addEventListener('change', function() {
    const isNotAttending = this.value === 'no';
    toggleFormFields(isNotAttending);
    
    // Gast-Felder neu rendern um disabled state zu berücksichtigen
    renderGuestFields(parseInt(guestsInput.value));
  });
});

// Event Listener für Guest Counter
decreaseBtn.addEventListener('click', () => {
  const currentValue = parseInt(guestsInput.value);
  if (currentValue > 1) {
    guestsInput.value = currentValue - 1;
    renderGuestFields(currentValue - 1);
  }
});

increaseBtn.addEventListener('click', () => {
  const currentValue = parseInt(guestsInput.value);
  if (currentValue < 5) {
    guestsInput.value = currentValue + 1;
    renderGuestFields(currentValue + 1);
  }
});

// Form Submit Handler
document.querySelector('.rsvp-form').addEventListener('submit', async e => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird gesendet...';

  const guestCount = parseInt(guestsInput.value) || 1;
  const guestDetails = [];
  for (let i = 1; i <= guestCount; i++) {
    const nameField = e.target[`guestName_${i}`];
    const typeField = e.target[`guestType_${i}`];
    guestDetails.push({
      name: nameField.value.trim(),
      type: typeField.value
    });
  }

  const data = {
    familyName:   e.target.familyName.value.trim(),
    email:        e.target.email.value.trim(),
    attending:    e.target.attending.value,
    guests:       guestCount,
    guestDetails: guestDetails,
    intolerances: e.target.intolerances.value.trim(),
    message:      e.target.message.value.trim(),
    timestamp:    firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('rsvps').add(data);
    alert('Vielen Dank für deine Zusage!');
    e.target.reset();
    guestsInput.value = 1;
    renderGuestFields(1);
    // Reset disabled states
    toggleFormFields(false);
  } catch (error) {
    console.error('Fehler beim Absenden:', error);
    alert('Beim Absenden ist leider ein Fehler aufgetreten. Bitte versuche es später erneut.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Absenden';
  }
});

