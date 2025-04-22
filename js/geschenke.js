const giftsUl     = document.getElementById('gifts');
const STORAGE_KEY = 'reservedGifts';
let myReserved    = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/**
 * Zeichnet die Liste neu, basierend auf Firestore‑Docs und lokalem State.
 * @param {firebase.firestore.QueryDocumentSnapshot[]} docs
 */
function renderList(docs) {
  giftsUl.innerHTML = '';

  docs.forEach(doc => {
    const data = doc.data();
    const id   = doc.id;

    const li       = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type  = 'checkbox';

    // Checkbox disabled, wenn bereits von anderem reserviert ist
    checkbox.disabled = data.reserved && !myReserved.includes(id);
    // Checkbox checked, wenn ich es in meinem lokalen Array habe
    checkbox.checked  = myReserved.includes(id);

    // Change‑Handler mit optimistischem Update
    checkbox.addEventListener('change', async () => {
      const willReserve = checkbox.checked;

      // 1. Optimistisches UI‑Update: re-enable checkbox (lokal)
      checkbox.disabled = false;

      // 2. Lokaler State aktualisieren und speichern
      if (willReserve) {
        if (!myReserved.includes(id)) myReserved.push(id);
      } else {
        myReserved = myReserved.filter(x => x !== id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(myReserved));

      // 3. Firestore‑Update
      try {
        await db.collection('gifts').doc(id).update({ reserved: willReserve });
        // Kein manuelles Re-Render nötig – Firestore liefert neuen Snapshot
      } catch (err) {
        console.error(err);
        alert('Fehler beim Reservieren. Bitte versuche es später noch einmal.');
        // optional: lokalen State rollbacken und neu rendern
        willReserve
          ? myReserved = myReserved.filter(x => x !== id)
          : myReserved.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(myReserved));
        renderList(docs);
      }
    });

    // Label mit Name, Beschreibung und ggf. Link
    const label = document.createElement('label');
    label.textContent = `${data.name} – ${data.description}`;
    if (data.link) {
      const a = document.createElement('a');
      a.href        = data.link;
      a.textContent = ' (kaufen)';
      a.target      = '_blank';
      label.appendChild(a);
    }

    li.appendChild(checkbox);
    li.appendChild(label);
    giftsUl.appendChild(li);
  });
}

// Live‑Updates von Firestore mit Metadata‑Änderungen
db.collection('gifts')
  .onSnapshot({ includeMetadataChanges: true }, snapshot => {
    // snapshot.docs ist ein Array von QueryDocumentSnapshots
    renderList(snapshot.docs);
  });