// js/geschenke.js
$(document).ready(() => {
    const giftsUl   = document.getElementById('gifts');
    const modal     = document.getElementById('reservation-modal');
    const form      = document.getElementById('reservation-form');
    const emailIn   = document.getElementById('reserver-email');
    const cancelBtn = document.getElementById('cancel-btn');
    let   currentId = null;
    let   lastDocs  = [];
  
    // 1) Liste rendern
    function renderList(docs) {
        lastDocs = docs;
        giftsUl.innerHTML = '';
      
        docs.forEach(doc => {
          const data = doc.data();
          const id   = doc.id;
      
          // <li> mit Name, Beschreibung, optional Link und Button
          const li = document.createElement('li');
      
          // 1) Name + Beschreibung
          const info = document.createElement('div');
          info.innerHTML = `
            <strong>${data.name}</strong> – ${data.description}
            ${data.link
              ? `<a href="${data.link}" target="_blank" rel="noopener">(kaufen)</a>`
              : ''}
          `;
          li.appendChild(info);
      
          // 2) Reservieren‑Button
          const btn = document.createElement('button');
          btn.textContent = data.reserved
            ? `Reserviert von ${data.reserverEmail || 'jemandem'}`
            : 'Jetzt reservieren';
          btn.disabled   = data.reserved;
          btn.dataset.id = id;
          li.appendChild(btn);
      
          giftsUl.appendChild(li);
        });
      }
  
    // 2) Realtime-Listener
    db.collection('gifts')
      .onSnapshot(snapshot => {
        renderList(snapshot.docs);
      }, err => {
        console.error('Fehler beim Laden der Geschenke:', err);
      });
  
    // 3) Button-Klick öffnet Modal
    giftsUl.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
        currentId = e.target.dataset.id;
        modal.style.display = 'flex';
      }
    });
  
    // 4) Modal Abbrechen
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      emailIn.value = '';
      currentId = null;
    });
  
    // 5) Formular abschicken
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = emailIn.value.trim();
      if (!currentId || !email) return;
  
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Reservieren…';
  
      try {
        await db.collection('gifts').doc(currentId).update({
          reserved: true,
          reserverEmail: email,
          reservedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // UI wird automatisch durch onSnapshot aktualisiert
        modal.style.display = 'none';
        emailIn.value = '';
        currentId = null;
      } catch (err) {
        console.error('Reservierung fehlgeschlagen:', err);
        alert('Reservierung fehlgeschlagen. Bitte versuche es erneut.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bestätigen';
      }
    });
  });