// scripts/header.mjs

import { auth } from "../src/firebase.js";
import { signOut } from "firebase/auth";

export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const authInfoDisplay = document.getElementById("auth-info-display"); // NEW: Get the dedicated auth info div

  // Ensure both containers exist
  if (!navContainer) {
    console.warn(
      "Navigation container (id='nav-container') not found. Header will not be fully created."
    );
    return;
  }
  if (!authInfoDisplay) {
    // NEW: Check for auth-info-display
    console.warn(
      "Auth info display container (id='auth-info-display') not found. Auth status will not be shown."
    );
    // We can still proceed to build the main nav links if only authInfoDisplay is missing
  }

  // Clear existing content in case createHeader is called multiple times (e.g., onAuthStateChanged)
  navContainer.innerHTML = "";
  if (authInfoDisplay) {
    // NEW: Clear authInfoDisplay as well
    authInfoDisplay.innerHTML = "";
  }

  const currentUser = auth.currentUser; // Get the current user from Firebase Auth

  // --- Build the main navigation links into navContainer ---
  navContainer.innerHTML = `
    <a href="/">Home</a>
    <a href="/pages/shopping.html">Shopping List</a>
    <a href="/pages/calendar.html">Calendar</a>
    <a href="/pages/chores.html">Chores</a>
    <!-- The login/logout links will go into auth-info-display -->
  `;

  // --- Populate auth-info-display based on authentication state ---
  if (authInfoDisplay) {
    // Only proceed if the element exists
    if (currentUser) {
      // User is logged in
      const displayName =
        currentUser.displayName || currentUser.email || "User";
      authInfoDisplay.innerHTML = `
          <span class="welcome-message">Welcome, ${displayName}!</span>
          <a href="#" id="logout-button">Logout</a>
        `;
    } else {
      // If no user is logged in, show the Login link
      authInfoDisplay.innerHTML = `
          <a href="/pages/login.html" id="login-link">Login</a>
        `;
    }
  }

  // --- Setup Logout Button Listener ---
  // This listener is added only if the logout button is currently rendered within authInfoDisplay
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async (e) => {
      e.preventDefault(); // Prevent default link behavior (e.g., page reload)
      try {
        await signOut(auth);
        alert("Logged out successfully!");
        // After logout, redirect to the home page or login page
        window.location.replace("/"); // Use replace to prevent back button from going to logged-in state
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Error logging out. Please try again.");
      }
    });
  }

  console.log("✅ Header (dynamic parts and logout listener) created/updated.");
}
