// js/firebase-init.js
// Gemeinsame Initialisierung von Firebase
const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__"
};

firebase.initializeApp(firebaseConfig);
// Optionale Handles, falls bestimmte SDKs geladen sind
if (firebase.firestore) {
  window.db = firebase.firestore();
}
if (firebase.storage) {
  window.storage = firebase.storage();
}
if (firebase.auth) {
  window.auth = firebase.auth();
}
