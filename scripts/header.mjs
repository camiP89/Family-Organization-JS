// scripts/header.mjs

import { auth } from "../src/firebase.js";
import { signOut } from "firebase/auth";

export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const logoutButton = document.getElementById("logout-button"); // Element to listen to

  // --- Detect environment (as you had it) ---
  const repoName = "Family-Organization-JS";
  let prefix = ".";

  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = "..";
  }

  // --- Build nav (static links) ---
  if (navContainer) {
    navContainer.innerHTML = `
      <a href="${prefix}/index.html">Home</a>
      <a href="${prefix}/pages/shopping.html">Shopping List</a>
      <a href="${prefix}/pages/calendar.html">Calendar</a>
      <a href="${prefix}/pages/chores.html">Chores</a>
      <a href="${prefix}/pages/login.html" id="login-link">Login</a>
    `;
  }

  // --- Setup Logout Button Listener ---
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("Logged out successfully!");
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Error logging out. Please try again.");
      }
    });
  }

  console.log("✅ Header (static parts and logout listener) created.");
}
