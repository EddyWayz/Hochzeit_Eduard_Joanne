/**
 * Shared RSVP Form Functions
 * Used by both rsvp.html and edit-rsvp.html for consistent behavior
 */

/**
 * Collects current guest data from the form
 * @param {HTMLInputElement} guestsInput - The guests count input element
 * @returns {Array<{name: string, type: string}>} Array of guest data objects
 */
function getCurrentGuestData(guestsInput) {
  const currentCount = parseInt(guestsInput.value);
  const guestData = [];

  for (let i = 1; i <= currentCount; i++) {
    const nameField = document.getElementById(`guestName_${i}`);
    const typeField = document.querySelector(`input[name="guestType_${i}"]:checked`);

    if (nameField) {
      guestData.push({
        name: nameField.value || '',
        type: typeField ? typeField.value : 'Erwachsener'
      });
    }
  }

  return guestData;
}

/**
 * Renders guest input fields dynamically
 * @param {HTMLElement} detailsContainer - Container element for guest fields
 * @param {number} count - Number of guests to render
 * @param {Array<{name: string, type: string}>} guestDetails - Previous guest data to preserve
 */
function renderGuestFields(detailsContainer, count, guestDetails = []) {
  detailsContainer.innerHTML = '';
  const isDisabled = document.querySelector('input[name="attending"]:checked')?.value === 'no';

  for (let i = 1; i <= count; i++) {
    const data = guestDetails[i-1] || { name: '', type: 'Erwachsener' };
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
                 placeholder="Vorname Gast ${i}" value="${data.name}" required ${isDisabled ? 'disabled' : ''}>
        </div>
        <div class="form-group">
          <label>Alterskategorie</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Erwachsener"
                     ${data.type==='Erwachsener'? 'checked':''} ${isDisabled ? 'disabled' : ''}>
              <span>Erwachsener</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Kind"
                     ${data.type==='Kind'? 'checked':''} ${isDisabled ? 'disabled' : ''}>
              <span>Kind</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="guestType_${i}" value="Kleinkind"
                     ${data.type==='Kleinkind'? 'checked':''} ${isDisabled ? 'disabled' : ''}>
              <span>Kleinkind</span>
            </label>
          </div>
        </div>
      </div>
    `;
    detailsContainer.appendChild(wrapper);
  }
}

/**
 * Toggles form fields based on attendance status
 * @param {boolean} disable - Whether to disable the fields
 */
function toggleFormFields(disable) {
  const fieldsToToggle = [
    '#guests',
    '#decrease-guests',
    '#increase-guests',
    '#intolerances',
    '#message'
  ];

  // Toggle main fields
  fieldsToToggle.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.disabled = disable;
    }
  });

  // Toggle guest detail fields
  const guestFields = document.querySelectorAll('#guest-details input, #guest-details textarea');
  guestFields.forEach(field => {
    field.disabled = disable;
  });

  // Toggle container classes for visual styling
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
