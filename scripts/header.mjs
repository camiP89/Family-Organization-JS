// scripts/header.mjs

import { auth } from "../src/firebase.js";
import { signOut } from "firebase/auth";

export function createHeader() {
  const navContainer = document.getElementById("nav-container");

  // Only proceed if the navContainer exists
  if (!navContainer) {
    console.warn(
      "Navigation container (id='nav-container') not found. Header will not be created."
    );
    return;
  }

  // Clear existing content in case createHeader is called multiple times (e.g., onAuthStateChanged)
  navContainer.innerHTML = "";

  const currentUser = auth.currentUser; // Get the current user from Firebase Auth

  // --- Dynamic content based on authentication state ---
  let authLinks = "";
  if (currentUser) {
    // If a user is logged in, show their display name and a Logout button
    const displayName = currentUser.displayName || currentUser.email || "User";
    authLinks = `
      <span class="welcome-message">Welcome, ${displayName}!</span>
      <a href="#" id="logout-button">Logout</a>
    `;
  } else {
    // If no user is logged in, show the Login link
    // Note: The /pages/login.html link will now be part of the nav, not a separate user-info div.
    authLinks = `
      <a href="/pages/login.html" id="login-link">Login</a>
    `;
  }

  // --- Build the full navigation bar (including dynamic auth links) ---
  // Using absolute paths for robustness with Vite/Netlify deployment
  navContainer.innerHTML = `
    <a href="/">Home</a>
    <a href="/pages/shopping.html">Shopping List</a>
    <a href="/pages/calendar.html">Calendar</a>
    <a href="/pages/chores.html">Chores</a>
    ${authLinks} <!-- Insert the dynamically generated authentication links directly into the nav -->
  `;

  // --- Setup Logout Button Listener ---
  // This listener is added only if the logout button is currently rendered within navContainer
  const logoutButton = document.getElementById("logout-button"); // Look for the one we just created
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
