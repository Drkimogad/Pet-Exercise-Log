// firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyBAi8vwwz1hsKmYxTrGUL7EGrjuOMpQ23M",
  authDomain: "pet-exercise-log.firebaseapp.com",
  projectId: "pet-exercise-log",
  storageBucket: "pet-exercise-log.firebasestorage.app",
  messagingSenderId: "416160815211",
  appId: "1:416160815211:web:77bbfe7e8781567e31b92e",
  measurementId: "G-JEZF51VMHF"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Test if Firebase is working
console.log('Firebase initialized successfully!');
console.log('Auth:', auth);
console.log('Firestore:', db);

