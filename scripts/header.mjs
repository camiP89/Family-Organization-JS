// scripts/header.mjs

// Import Firebase Authentication and the 'auth' instance
import { auth } from "../src/firebase.js"; // Corrected path to your firebase.js
import { signOut } from "firebase/auth"; // Import the signOut function

export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");
  const userName = localStorage.getItem("userName"); // Still rely on localStorage, which authCheck.mjs keeps updated

  // --- Detect environment ---
  const repoName = "Family-Organization-JS"; // your GitHub repo name
  let prefix = "."; // default local dev

  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = "..";
  }

  console.log("📂 Current path:", window.location.pathname);
  console.log("🌐 Hostname:", window.location.hostname);
  console.log("🔗 Using prefix:", prefix);
  console.log("👤 Logged in as:", userName ? userName : "No user");

  // --- Build nav ---
  if (navContainer) {
    navContainer.innerHTML = `
      <a href="${prefix}/index.html">Home</a>
      <a href="${prefix}/pages/shopping.html">Shopping List</a>
      <a href="${prefix}/pages/calendar.html">Calendar</a>
      <a href="${prefix}/pages/chores.html">Chores</a>
      <a href="${prefix}/pages/profile.html">Profile</a>
      <a href="${prefix}/pages/login.html" id="login-link">Login</a>
    `;
    // Note: classList.add will append, you might want to use classList.remove then add for clarity
    if (userName) {
      navContainer.classList.add("nav-logged-in");
      navContainer.classList.remove("nav-logged-out");
    } else {
      navContainer.classList.add("nav-logged-out");
      navContainer.classList.remove("nav-logged-in");
    }

    const loginLink = document.getElementById("login-link");
    if (userName && loginLink) loginLink.style.display = "none";
  }

  // --- User welcome & logout ---
  if (userName) {
    if (welcomeText) welcomeText.textContent = `Welcome, ${userName}!`;

    if (logoutButton) {
      logoutButton.style.display = "inline-block";
      // --- IMPORTANT CHANGE: Use Firebase signOut ---
      logoutButton.addEventListener("click", async () => {
        try {
          await signOut(auth); // Sign out the user from Firebase
          // No need to manually clear localStorage or redirect here,
          // as authCheck.mjs's onAuthStateChanged listener will catch the sign-out
          // event, clear localStorage.userName, and handle the redirection.
          alert("Logged out successfully!"); // Optional: brief message
        } catch (error) {
          console.error("Error signing out:", error);
          alert("Error logging out. Please try again.");
        }
      });
    }
  } else {
    if (logoutButton) logoutButton.style.display = "none";
  }

  console.log("✅ Header created successfully");
}

