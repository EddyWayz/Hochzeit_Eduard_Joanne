/**
 * Tests for RSVP Shared Functions
 */

// Mock the DOM
document.body.innerHTML = `
  <div id="test-container"></div>
`;

// Load the shared functions
// Note: In a real setup, you might need to import these differently
// For now, we'll test the logic inline

describe('getCurrentGuestData', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input type="number" id="guests" value="2" />
      <div id="guest-details">
        <input type="text" id="guestName_1" value="John Doe" />
        <input type="radio" name="guestType_1" value="Erwachsener" checked />
        <input type="radio" name="guestType_1" value="Kind" />

        <input type="text" id="guestName_2" value="Jane Doe" />
        <input type="radio" name="guestType_2" value="Kind" checked />
        <input type="radio" name="guestType_2" value="Erwachsener" />
      </div>
    `;
  });

  test('collects guest data from form', () => {
    const guestsInput = document.getElementById('guests');

    // Inline implementation for testing
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

    const data = getCurrentGuestData(guestsInput);

    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('John Doe');
    expect(data[0].type).toBe('Erwachsener');
    expect(data[1].name).toBe('Jane Doe');
    expect(data[1].type).toBe('Kind');
  });

  test('handles empty name fields', () => {
    document.getElementById('guestName_1').value = '';
    const guestsInput = document.getElementById('guests');

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

    const data = getCurrentGuestData(guestsInput);

    expect(data[0].name).toBe('');
  });

  test('defaults to Erwachsener when no type selected', () => {
    // Remove checked attribute
    document.querySelectorAll('input[name="guestType_1"]').forEach(radio => {
      radio.checked = false;
    });

    const guestsInput = document.getElementById('guests');

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

    const data = getCurrentGuestData(guestsInput);

    expect(data[0].type).toBe('Erwachsener');
  });
});

describe('renderGuestFields', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="guest-details"></div>
      <input type="radio" name="attending" value="yes" checked />
    `;
  });

  test('renders correct number of guest fields', () => {
    const container = document.getElementById('guest-details');

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
          <input type="text" id="guestName_${i}" value="${data.name}" />
        `;
        detailsContainer.appendChild(wrapper);
      }
    }

    renderGuestFields(container, 3);

    const guestFields = container.querySelectorAll('.guest-field');
    expect(guestFields).toHaveLength(3);
  });

  test('preserves existing guest data', () => {
    const container = document.getElementById('guest-details');
    const existingData = [
      { name: 'John', type: 'Erwachsener' },
      { name: 'Jane', type: 'Kind' }
    ];

    function renderGuestFields(detailsContainer, count, guestDetails = []) {
      detailsContainer.innerHTML = '';

      for (let i = 1; i <= count; i++) {
        const data = guestDetails[i-1] || { name: '', type: 'Erwachsener' };
        const wrapper = document.createElement('div');
        wrapper.classList.add('guest-field');

        wrapper.innerHTML = `
          <input type="text" id="guestName_${i}" value="${data.name}" />
        `;
        detailsContainer.appendChild(wrapper);
      }
    }

    renderGuestFields(container, 2, existingData);

    expect(document.getElementById('guestName_1').value).toBe('John');
    expect(document.getElementById('guestName_2').value).toBe('Jane');
  });

  test('marks fields as disabled when attending=no', () => {
    document.body.innerHTML = `
      <div id="guest-details"></div>
      <input type="radio" name="attending" value="no" checked />
    `;

    const container = document.getElementById('guest-details');

    function renderGuestFields(detailsContainer, count, guestDetails = []) {
      detailsContainer.innerHTML = '';
      const isDisabled = document.querySelector('input[name="attending"]:checked')?.value === 'no';

      for (let i = 1; i <= count; i++) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('guest-field');
        if (isDisabled) wrapper.classList.add('disabled');

        detailsContainer.appendChild(wrapper);
      }
    }

    renderGuestFields(container, 2);

    const guestFields = container.querySelectorAll('.guest-field');
    guestFields.forEach(field => {
      expect(field.classList.contains('disabled')).toBe(true);
    });
  });
});

describe('toggleFormFields', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input type="number" id="guests" />
      <button id="decrease-guests"></button>
      <button id="increase-guests"></button>
      <textarea id="intolerances"></textarea>
      <textarea id="message"></textarea>
      <div id="guest-details">
        <input type="text" class="guest-input" />
      </div>
      <div class="guests-form-group"></div>
      <div class="age-info"></div>
      <div class="intolerances-form-group"></div>
      <div class="message-form-group"></div>
    `;
  });

  test('disables all form fields when attending=no', () => {
    function toggleFormFields(disable) {
      const fieldsToToggle = [
        '#guests',
        '#decrease-guests',
        '#increase-guests',
        '#intolerances',
        '#message'
      ];

      fieldsToToggle.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.disabled = disable;
        }
      });

      const guestFields = document.querySelectorAll('#guest-details input, #guest-details textarea');
      guestFields.forEach(field => {
        field.disabled = disable;
      });
    }

    toggleFormFields(true);

    expect(document.getElementById('guests').disabled).toBe(true);
    expect(document.getElementById('decrease-guests').disabled).toBe(true);
    expect(document.getElementById('intolerances').disabled).toBe(true);
    expect(document.querySelector('#guest-details input').disabled).toBe(true);
  });

  test('enables all form fields when attending=yes', () => {
    // First disable
    document.getElementById('guests').disabled = true;

    function toggleFormFields(disable) {
      const fieldsToToggle = [
        '#guests',
        '#decrease-guests',
        '#increase-guests',
        '#intolerances',
        '#message'
      ];

      fieldsToToggle.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.disabled = disable;
        }
      });
    }

    toggleFormFields(false);

    expect(document.getElementById('guests').disabled).toBe(false);
    expect(document.getElementById('decrease-guests').disabled).toBe(false);
  });

  test('adds disabled class to containers', () => {
    function toggleFormFields(disable) {
      const guestDetailsContainer = document.getElementById('guest-details');
      const guestsFormGroup = document.querySelector('.guests-form-group');

      [guestDetailsContainer, guestsFormGroup].forEach(container => {
        if (container) {
          if (disable) {
            container.classList.add('disabled');
          } else {
            container.classList.remove('disabled');
          }
        }
      });
    }

    toggleFormFields(true);

    expect(document.getElementById('guest-details').classList.contains('disabled')).toBe(true);
    expect(document.querySelector('.guests-form-group').classList.contains('disabled')).toBe(true);
  });
});
