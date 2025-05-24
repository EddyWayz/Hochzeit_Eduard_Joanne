// js/gifts.js: Verwaltung der Geschenkeliste
$(document).ready(() => {
    const giftsUl   = document.getElementById('gifts');
    const modal     = document.getElementById('reservation-modal');
    const form      = document.getElementById('reservation-form');
    const emailIn   = document.getElementById('reserver-email');
    const cancelBtn = document.getElementById('cancel-btn');
    let   currentId = null;
    let   lastDocs  = [];
    let   imageCache = new Map(); // Cache für geladene Bilder
    const BATCH_SIZE = 9; // Anzahl der parallel zu ladenden Bilder
    const VISIBLE_BATCH_SIZE = 9; // Anzahl der Bilder mit hoher Priorität

    // Hilfsfunktion: Bild mit optimiertem Loading
    function createImageElement(data, imageId) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gift-img-container');
        
        const imgEl = document.createElement('img');
        imgEl.classList.add('gift-img');
        imgEl.alt = data.name;
        
        // Sofort die richtige Größe setzen
        imgEl.style.aspectRatio = '4 / 3';
        imgEl.style.width = '100%';
        imgEl.style.objectFit = 'contain';
        imgEl.style.objectPosition = 'center';
        imgEl.style.backgroundColor = '#ffffff';
        imgEl.style.borderRadius = 'var(--radius-sm)';
        imgEl.style.border = '1px solid #f0f0f0';
        imgEl.style.opacity = '0';
        imgEl.style.transition = 'opacity 0.2s ease-out';
        
        imgContainer.appendChild(imgEl);
        return { container: imgContainer, img: imgEl };
    }
    
    // Bild laden mit Preloading und Priorität
    function loadImage(imgElement, src, priority = false) {
        return new Promise((resolve, reject) => {
            // Prüfen ob Bild bereits im Cache ist
            if (imageCache.has(src)) {
                imgElement.src = imageCache.get(src);
                requestAnimationFrame(() => {
                    imgElement.style.opacity = '1';
                });
                resolve();
                return;
            }

            const tempImg = new Image();
            
            // Priorität setzen für schnelleres Laden
            if (priority) {
                tempImg.fetchPriority = 'high';
                tempImg.loading = 'eager';
                // Höchste Priorität für die ersten Bilder
                tempImg.decoding = 'sync';
            }
            
            tempImg.onload = function() {
                // Bild in Cache speichern
                imageCache.set(src, src);
                imgElement.src = src;
                requestAnimationFrame(() => {
                    imgElement.style.opacity = '1';
                });
                resolve();
            };
            
            tempImg.onerror = function() {
                console.error('Fehler beim Laden des Bildes:', src);
                setPlaceholderImage(imgElement, imgElement.alt);
                reject();
            };
            
            // Laden starten
            tempImg.src = src;
        });
    }
    
    // Platzhalter-Bild setzen (nur wenn wirklich kein Bild verfügbar)
    function setPlaceholderImage(imgElement, altText) {
        const placeholder = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" viewBox="0 0 300 225">
                <rect width="300" height="225" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
                <text x="150" y="100" text-anchor="middle" fill="#999999" font-family="Arial, sans-serif" font-size="14">
                    ${altText}
                </text>
                <text x="150" y="130" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">
                    Kein Bild verfügbar
                </text>
            </svg>
        `)}`;
        
        imgElement.src = placeholder;
        requestAnimationFrame(() => {
            imgElement.style.opacity = '1';
        });
    }

    // Liste rendern mit optimiertem Bildladen
    async function renderList(docs) {
        lastDocs = docs;
        giftsUl.innerHTML = '';
        
        // Erstelle zuerst alle Listenelemente ohne Bilder
        const listItems = docs.map((doc, index) => {
            const data = doc.data();
            const id   = doc.id;
            const imageId = `img_${index}_${id}`;
  
            const li = document.createElement('li');
            li.style.opacity = '0';
            li.style.transition = 'opacity 0.2s ease-out';
            
            // Bild-Container erstellen
            const { container: imgContainer, img: imgEl } = createImageElement(data, imageId);
            li.appendChild(imgContainer);
  
            // Name + Beschreibung
            const info = document.createElement('div');
            info.innerHTML = `
                <strong>${data.name}</strong> – ${data.description}
                ${data.link
                    ? `<a href="${data.link}" target="_blank" rel="noopener">(kaufen)</a>`
                    : ''}
            `;
            li.appendChild(info);
  
            // Reservieren‑Button
            const btn = document.createElement('button');
            btn.textContent = data.reserved
                ? `Reserviert von ${data.reserverEmail || 'jemandem'}`
                : 'Jetzt reservieren';
            btn.disabled   = data.reserved;
            btn.dataset.id = id;
            li.appendChild(btn);
  
            giftsUl.appendChild(li);
            requestAnimationFrame(() => {
                li.style.opacity = '1';
            });
            return { li, imgEl, data };
        });

        // Lade zuerst die sichtbaren Bilder
        const visibleItems = listItems.slice(0, VISIBLE_BATCH_SIZE);
        const visiblePromises = visibleItems.map(({ imgEl, data }, index) => {
            if (data.imgUrl) {
                const urlStr = data.imgUrl;
                return (async () => {
                    try {
                        const downloadUrl = urlStr.startsWith('gs://')
                            ? await storage.refFromURL(urlStr).getDownloadURL()
                            : urlStr;
                        await loadImage(imgEl, downloadUrl, true);
                    } catch (err) {
                        console.error('Fehler beim Laden des Bildes:', err);
                        setPlaceholderImage(imgEl, data.name);
                    }
                })();
            } else {
                setPlaceholderImage(imgEl, data.name);
                return Promise.resolve();
            }
        });

        // Warte auf das Laden der sichtbaren Bilder
        await Promise.all(visiblePromises);

        // Lade dann den Rest in Batches
        const remainingItems = listItems.slice(VISIBLE_BATCH_SIZE);
        for (let i = 0; i < remainingItems.length; i += BATCH_SIZE) {
            const batch = remainingItems.slice(i, i + BATCH_SIZE);
            const promises = batch.map(({ imgEl, data }) => {
                if (data.imgUrl) {
                    const urlStr = data.imgUrl;
                    return (async () => {
                        try {
                            const downloadUrl = urlStr.startsWith('gs://')
                                ? await storage.refFromURL(urlStr).getDownloadURL()
                                : urlStr;
                            await loadImage(imgEl, downloadUrl, false);
                        } catch (err) {
                            console.error('Fehler beim Laden des Bildes:', err);
                            setPlaceholderImage(imgEl, data.name);
                        }
                    })();
                } else {
                    setPlaceholderImage(imgEl, data.name);
                    return Promise.resolve();
                }
            });
            await Promise.all(promises);
        }
    }
  
    // Realtime-Listener
    db.collection('gifts')
      .onSnapshot(snapshot => {
        renderList(snapshot.docs);
      }, err => {
        console.error('Fehler beim Laden der Geschenke:', err);
      });
  
    // Button-Klick öffnet Modal
    giftsUl.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
        currentId = e.target.dataset.id;
        modal.style.display = 'flex';
      }
    });
  
    // Modal Abbrechen
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      emailIn.value = '';
      currentId = null;
    });
  
    // Formular abschicken
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