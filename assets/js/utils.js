// Utility Functions
// Gemeinsame Hilfsfunktionen für die gesamte Website

/**
 * Normalisiert Firebase Storage Download-URLs auf den richtigen Bucket
 * @param {string} url - Die zu normalisierende URL
 * @param {string} correctBucket - Der korrekte Bucket-Name
 * @returns {string} - Die normalisierte URL
 */
function normalizeStorageUrl(url, correctBucket) {
  if (!url) return url;

  try {
    const u = new URL(url);
    if (u.hostname !== 'firebasestorage.googleapis.com') return url;

    const parts = u.pathname.split('/');
    const bIndex = parts.indexOf('b');

    if (bIndex > -1 && parts[bIndex + 1] && correctBucket && parts[bIndex + 1] !== correctBucket) {
      parts[bIndex + 1] = correctBucket;
      u.pathname = parts.join('/');
      return u.toString();
    }
  } catch (e) {
    console.error('Error normalizing storage URL:', e);
  }

  return url;
}

/**
 * Konvertiert gs:// URLs zu Download-URLs
 * @param {string} gsUrl - Die gs:// URL
 * @param {Object} storage - Firebase Storage Instanz
 * @param {string} correctBucket - Der korrekte Bucket-Name
 * @returns {Promise<string>} - Die Download-URL
 */
async function gsUrlToDownloadUrl(gsUrl, storage, correctBucket) {
  if (!gsUrl || !gsUrl.startsWith('gs://')) {
    return gsUrl;
  }

  try {
    const normalizedGs = gsUrl.replace(/^gs:\/\/[^\/]+\//, `gs://${correctBucket}/`);
    const downloadUrl = await storage.refFromURL(normalizedGs).getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Error converting gs:// URL to download URL:', error);
    throw error;
  }
}

/**
 * Lädt ein Bild mit Fehlerbehandlung und gibt ein Promise zurück
 * @param {HTMLImageElement} imgElement - Das Image-Element
 * @param {string} src - Die Bild-URL
 * @param {boolean} priority - Hohe Priorität für das Laden
 * @returns {Promise<void>}
 */
function loadImage(imgElement, src, priority = false) {
  return new Promise((resolve, reject) => {
    const tempImg = new Image();

    if (priority) {
      tempImg.fetchPriority = 'high';
      tempImg.loading = 'eager';
    }

    tempImg.onload = function() {
      imgElement.src = src;
      requestAnimationFrame(() => {
        imgElement.style.opacity = '1';
      });
      resolve();
    };

    tempImg.onerror = function() {
      console.error('Error loading image:', src);
      reject(new Error(`Failed to load image: ${src}`));
    };

    tempImg.src = src;
  });
}

/**
 * Validiert eine E-Mail-Adresse
 * @param {string} email - Die zu validierende E-Mail
 * @returns {boolean} - true wenn gültig
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validiert ein Formular und zeigt Fehler an
 * @param {HTMLFormElement} form - Das zu validierende Formular
 * @param {Object} rules - Validierungsregeln
 * @returns {Object} - { valid: boolean, errors: Array }
 */
function validateForm(form, rules) {
  const errors = [];
  const formData = new FormData(form);

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData.get(field);

    if (rule.required && (!value || value.trim() === '')) {
      errors.push({ field, message: rule.message || `${field} ist erforderlich` });
    }

    if (rule.email && value && !validateEmail(value)) {
      errors.push({ field, message: 'Bitte gib eine gültige E-Mail-Adresse ein' });
    }

    if (rule.min && value && value.length < rule.min) {
      errors.push({ field, message: `${field} muss mindestens ${rule.min} Zeichen lang sein` });
    }

    if (rule.max && value && value.length > rule.max) {
      errors.push({ field, message: `${field} darf maximal ${rule.max} Zeichen lang sein` });
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors.push({ field, message: rule.message || `${field} hat ein ungültiges Format` });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Zeigt Validierungsfehler im Formular an
 * @param {HTMLFormElement} form - Das Formular
 * @param {Array} errors - Array von Fehler-Objekten
 */
function showFormErrors(form, errors) {
  // Clear previous errors
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

  errors.forEach(({ field, message }) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add('field-error');
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      errorEl.style.color = 'var(--color-error, #dc3545)';
      errorEl.style.fontSize = 'var(--fs-xs, 0.75rem)';
      errorEl.style.marginTop = 'var(--space-xxs, 0.25rem)';
      input.parentNode.insertBefore(errorEl, input.nextSibling);
    }
  });
}

/**
 * Debounce-Funktion für Event-Handler
 * @param {Function} func - Die zu debouncende Funktion
 * @param {number} wait - Wartezeit in Millisekunden
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle-Funktion für Event-Handler
 * @param {Function} func - Die zu throttlende Funktion
 * @param {number} limit - Limit in Millisekunden
 * @returns {Function} - Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Simple Rate Limiter für Client-seitige Rate-Limiting
 * @param {string} key - Eindeutiger Schlüssel für den Rate Limiter
 * @param {number} maxAttempts - Maximale Anzahl von Versuchen
 * @param {number} windowMs - Zeitfenster in Millisekunden
 * @returns {boolean} - true wenn innerhalb des Limits
 */
function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;

  let attempts = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      attempts = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading rate limit data:', e);
  }

  // Filter out old attempts
  attempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (attempts.length >= maxAttempts) {
    return false;
  }

  attempts.push(now);

  try {
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  } catch (e) {
    console.error('Error storing rate limit data:', e);
  }

  return true;
}

/**
 * Escape HTML um XSS zu verhindern
 * @param {string} text - Der zu escapende Text
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {Date|Timestamp} date - The date to format
 * @param {string} locale - Locale string (default: 'de-DE')
 * @returns {string} - Formatted date string
 */
function formatDate(date, locale = 'de-DE') {
  if (!date) return '—';

  try {
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      date = date.toDate();
    }

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '—';
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Export functions if module system is available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeStorageUrl,
    gsUrlToDownloadUrl,
    loadImage,
    validateEmail,
    validateForm,
    showFormErrors,
    debounce,
    throttle,
    checkRateLimit,
    escapeHtml,
    formatDate,
    copyToClipboard
  };
}
