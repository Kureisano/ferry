import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8pm62tPW-iBYM_mD806UKRWVWm0TnR70",
  authDomain: "annular-point-2gtt6.firebaseapp.com",
  projectId: "annular-point-2gtt6",
  storageBucket: "annular-point-2gtt6.firebasestorage.app",
  messagingSenderId: "686747362770",
  appId: "1:686747362770:web:2e67abb65ef8be3fc2540b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with our specific custom database ID
const db = initializeFirestore(app, {}, "ai-studio-signagestudiotv-66725bd5-438b-47af-b8ee-b722a8f48b72");

export { db };
