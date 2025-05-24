// js/gifts.js: Verwaltung der Geschenkeliste mit Ladebalken
$(document).ready(() => {
    const giftsUl   = document.getElementById('gifts');
    const modal     = document.getElementById('reservation-modal');
    const form      = document.getElementById('reservation-form');
    const emailIn   = document.getElementById('reserver-email');
    const cancelBtn = document.getElementById('cancel-btn');
    let   currentId = null;
    let   lastDocs  = [];
    let   loadingImages = new Set(); // Tracking der ladenden Bilder
    let   totalImages = 0;
    let   loadedImages = 0;
  
    // Ladebalken erstellen und anzeigen
    function showLoadingScreen() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>Geschenkeliste wird geladen...</h3>
                <div class="loading-bar">
                    <div class="loading-progress" id="loading-progress"></div>
                </div>
                <p id="loading-text">0 von 0 Bilder geladen</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
        
        // Geschenkeliste verstecken
        document.querySelector('.gift-list').style.display = 'none';
    }
    
    // Ladebalken verstecken
    function hideLoadingScreen() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
                document.querySelector('.gift-list').style.display = 'block';
                // Sanftes Einblenden der Geschenkeliste
                document.querySelector('.gift-list').style.opacity = '0';
                setTimeout(() => {
                    document.querySelector('.gift-list').style.opacity = '1';
                }, 50);
            }, 300);
        }
    }
    
    // Ladefortschritt aktualisieren
    function updateLoadingProgress() {
        const progressBar = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        if (progressBar && loadingText) {
            const percentage = totalImages > 0 ? (loadedImages / totalImages) * 100 : 0;
            progressBar.style.width = percentage + '%';
            loadingText.textContent = `${loadedImages} von ${totalImages} Bilder geladen`;
            
            // Alle Bilder geladen - Ladescreen ausblenden
            if (loadedImages >= totalImages && totalImages > 0) {
                setTimeout(() => {
                    hideLoadingScreen();
                }, 500); // Kurz warten für bessere UX
            }
        }
    }

    // Hilfsfunktion: Bild mit Platzhalter und optimiertem Loading
    function createImageElement(data, imageId) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('gift-img-container');
        
        const imgEl = document.createElement('img');
        imgEl.classList.add('gift-img');
        imgEl.alt = data.name;
        
        // Sofort die richtige Größe setzen mit weißem Hintergrund
        imgEl.style.aspectRatio = '4 / 3';
        imgEl.style.width = '100%';
        imgEl.style.objectFit = 'contain';
        imgEl.style.objectPosition = 'center';
        imgEl.style.backgroundColor = '#ffffff'; // Weißer Hintergrund
        imgEl.style.borderRadius = 'var(--radius-sm)';
        imgEl.style.border = '1px solid #f0f0f0';
        
        if (data.imgUrl) {
            const urlStr = data.imgUrl;
            loadingImages.add(imageId);
            
            if (urlStr.startsWith('gs://')) {
                // Storage-URI in HTTP-URL umwandeln
                storage.refFromURL(urlStr)
                    .getDownloadURL()
                    .then(downloadUrl => {
                        loadImageWithProgress(imgEl, downloadUrl, imageId);
                    })
                    .catch(err => {
                        console.error('Fehler beim Laden des Bildes:', err);
                        setPlaceholderImage(imgEl, data.name);
                        markImageLoaded(imageId);
                    });
            } else {
                // Bereits eine HTTP-URL
                loadImageWithProgress(imgEl, urlStr, imageId);
            }
        } else {
            // Kein Bild vorhanden - Platzhalter setzen (ohne Loading-Tracking)
            setPlaceholderImage(imgEl, data.name);
            // WICHTIG: Hier wird NICHT markImageLoaded() aufgerufen, 
            // da es nicht als zu ladendes Bild gezählt wurde
        }
        
        imgContainer.appendChild(imgEl);
        return imgContainer;
    }
    
    // Bild mit Fortschritts-Tracking laden
    function loadImageWithProgress(imgElement, src, imageId) {
        const tempImg = new Image();
        
        tempImg.onload = function() {
            imgElement.src = src;
            imgElement.style.opacity = '1';
            markImageLoaded(imageId);
        };
        
        tempImg.onerror = function() {
            console.error('Fehler beim Laden des Bildes:', src);
            setPlaceholderImage(imgElement, imgElement.alt);
            markImageLoaded(imageId);
        };
        
        // Laden starten
        tempImg.src = src;
    }
    
    // Bild als geladen markieren
    function markImageLoaded(imageId) {
        if (loadingImages.has(imageId)) {
            loadingImages.delete(imageId);
            loadedImages++;
            updateLoadingProgress();
        }
    }
    
    // Platzhalter-Bild setzen (mit weißem Hintergrund)
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
        imgElement.style.opacity = '1';
    }

    // Liste rendern
    function renderList(docs) {
        lastDocs = docs;
        giftsUl.innerHTML = '';
        
        // Zähler zurücksetzen
        loadingImages.clear();
        totalImages = 0;
        loadedImages = 0;
        
        // NUR Bilder zählen, die tatsächlich eine imgUrl haben
        docs.forEach(doc => {
            const data = doc.data();
            if (data.imgUrl && data.imgUrl.trim() !== '') {
                totalImages++;
            }
        });
        
        // Ladescreen nur anzeigen wenn tatsächlich Bilder zu laden sind
        if (totalImages > 0) {
            showLoadingScreen();
        }
        
        docs.forEach((doc, index) => {
            const data = doc.data();
            const id   = doc.id;
            const imageId = `img_${index}_${id}`;
      
            // <li> mit Name, Beschreibung, optional Link und Button
            const li = document.createElement('li');
            
            // Optimiertes Bild-Element hinzufügen
            const imgContainer = createImageElement(data, imageId);
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
        });
        
        // Falls keine Bilder zu laden sind, sofort anzeigen
        if (totalImages === 0) {
            document.querySelector('.gift-list').style.display = 'block';
        }
    }
  
    // Realtime-Listener
    db.collection('gifts')
      .onSnapshot(snapshot => {
        renderList(snapshot.docs);
      }, err => {
        console.error('Fehler beim Laden der Geschenke:', err);
        hideLoadingScreen(); // Bei Fehler Ladescreen verstecken
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