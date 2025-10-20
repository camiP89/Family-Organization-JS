// scripts/authCheck.mjs

// Import the auth instance from your firebase.js file
import { auth } from "../src/firebase.js";
// Import onAuthStateChanged for listening to authentication state changes
import { onAuthStateChanged } from "firebase/auth";

export function protectPage(redirectUrl = "./login.html") {
  // Return a Promise so that the calling code can await the auth state check
  return new Promise((resolve) => {
    // onAuthStateChanged is asynchronous and will run whenever the auth state changes
    // It also runs once immediately when the listener is attached.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // user will be null if no one is logged in, or a User object if someone is
      if (user) {
        // User is signed in.
        // Optionally, update localStorage with a display name for existing logic
        // or remove it if you fully transition to Firebase's user object.
        // For now, let's keep it to ensure broader compatibility with your existing code.
        localStorage.setItem("userName", user.displayName || user.email.split('@')[0]);
        unsubscribe(); // Stop listening once we've confirmed the state
        resolve(true); // User is authenticated
      } else {
        // No user is signed in.
        localStorage.removeItem("userName"); // Clear any stale userName from localStorage
        window.location.href = redirectUrl;
        unsubscribe(); // Stop listening
        resolve(false); // User is not authenticated
      }
    });
  });
}

// How to use it in your other pages (e.g., index.mjs, calendar.mjs)
// import { protectPage } from './authCheck.mjs';
//
// document.addEventListener('DOMContentLoaded', async () => {
//   const isAuthenticated = await protectPage();
//   if (isAuthenticated) {
//     // User is logged in, load the page content
//     console.log("User is authenticated, welcome!");
//   } else {
//     // Redirect has already happened, or user is not authenticated.
//     // The page won't load further if redirected.
//   }
// });
