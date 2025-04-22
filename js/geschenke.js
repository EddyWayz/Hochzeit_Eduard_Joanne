// js/geschenke.js
const giftsUl     = document.getElementById('gifts');
const STORAGE_KEY = 'reservedGifts';
let myReserved    = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Live‑Updates von Firestore
db.collection('gifts').onSnapshot(snapshot => {
  giftsUl.innerHTML = '';
  snapshot.forEach(doc => {
    const data = doc.data();
    const id   = doc.id;

    const li       = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type  = 'checkbox';
    // Checkbox nur aktiv, wenn nicht von jemand anderem reserviert
    checkbox.disabled = data.reserved && !myReserved.includes(id);
    checkbox.checked  = myReserved.includes(id);

    checkbox.addEventListener('change', async () => {
      const willReserve = checkbox.checked;
      try {
        // Update reserved‑Flag in Firestore
        await db.collection('gifts').doc(id).update({ reserved: willReserve });
        // Lokal mergen oder entfernen
        if (willReserve) myReserved.push(id);
        else             myReserved = myReserved.filter(x => x !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(myReserved));
      } catch (err) {
        console.error(err);
        alert('Fehler beim Reservieren. Bitte versuche es später noch einmal.');
      }
    });

    // Label mit Name, Beschreibung und Link
    const label = document.createElement('label');
    label.textContent = `${data.name} – ${data.description}`;
    if (data.link) {
      const a = document.createElement('a');
      a.href   = data.link;
      a.textContent = ' (kaufen)';
      a.target      = '_blank';
      label.appendChild(a);
    }

    li.appendChild(checkbox);
    li.appendChild(label);
    giftsUl.appendChild(li);
  });
});