// Website Configuration
// Zentrale Konfigurationsdatei für URLs und Einstellungen

const CONFIG = {
  // Firebase Configuration (öffentlich, aber durch Security Rules geschützt)
  firebase: {
    apiKey: "AIzaSyBghkLs0tkWZjdMQC9RvDT8DmC5J-uXpEc",
    authDomain: "hochzeiteduardjoanne.firebaseapp.com",
    projectId: "hochzeiteduardjoanne",
    storageBucket: "hochzeiteduardjoanne.firebasestorage.app",
    messagingSenderId: "209565556740",
    appId: "1:209565556740:web:1a227bfce08bf5dca2d551"
  },

  // Base URLs
  urls: {
    base: window.location.origin,
    functions: "https://us-central1-hochzeiteduardjoanne.cloudfunctions.net",
    githubPages: "https://eddywayz.github.io/Hochzeit_Eduard_Joanne"
  },

  // Feature Flags
  features: {
    newsletter: true,
    gifts: true,
    rsvp: true
  },

  // Limits
  limits: {
    maxGuests: 10,
    minGuests: 1,
    maxImageSize: 10 * 1024 * 1024, // 10MB in bytes
    maxUploadRetries: 3
  },

  // UI Settings
  ui: {
    toastDuration: 5000, // milliseconds
    imageLoadBatchSize: 9,
    modalAnimationDuration: 300 // milliseconds
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.firebase);
Object.freeze(CONFIG.urls);
Object.freeze(CONFIG.features);
Object.freeze(CONFIG.limits);
Object.freeze(CONFIG.ui);
