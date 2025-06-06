// js/firebase-init.js
// Gemeinsame Initialisierung von Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBghkLs0tkWZjdMQC9RvDT8DmC5J-uXpEc",
  authDomain: "hochzeiteduardjoanne.firebaseapp.com",
  projectId: "hochzeiteduardjoanne",
  storageBucket: "hochzeiteduardjoanne.firebasestorage.app",
  messagingSenderId: "209565556740",
  appId: "1:209565556740:web:1a227bfce08bf5dca2d551"
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
