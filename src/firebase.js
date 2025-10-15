// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <--- Add this for Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDK40shBDVE0Q76CLzGo-UGBTDLSveuBnc",
  authDomain: "family-oraganizer-2025.firebaseapp.com",
  projectId: "family-oraganizer-2025",
  storageBucket: "family-oraganizer-2025.firebasestorage.app",
  messagingSenderId: "493373455775",
  appId: "1:493373455775:web:384bd512b4c7aa992a51aa",
  measurementId: "G-GBH84QLLS2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services that you want to use
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); // <--- Initialize Firestore here

// Export the initialized services so you can use them in other files
export { app, analytics, auth, db }; // <--- Export 'db'
