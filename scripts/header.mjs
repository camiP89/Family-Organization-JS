import { auth } from "../src/firebase.js";
import { signOut } from "firebase/auth";

export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const logoutButton = document.getElementById("logout-button");

  // --- Simplified prefix for Netlify/general static hosting ---
  // If your build output always places the 'pages' directory directly
  // under the site root, then an empty prefix, or even better,
  // paths starting with '/' will work reliably.
  let prefix = ""; // Or you can even remove this variable and hardcode "/" below

  // You can still keep your GitHub Pages logic if you plan to deploy there too,
  // but ensure it's specifically triggered. For Netlify, this usually won't match.
  const repoName = "Family-Organization-JS"; // Keep if still relevant for other deploys
  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  }
  // The '/pages/' check might not be needed if your base URLs are clean on Netlify
  // else if (window.location.pathname.includes("/pages/")) {
  //   prefix = ".."; // This might cause issues if not handled carefully
  // }


  // --- Build nav with absolute paths (relative to site root) ---
  if (navContainer) {
    navContainer.innerHTML = `
      <a href="${prefix}/index.html">Home</a>
      <a href="${prefix}/pages/shopping.html">Shopping List</a>
      <a href="${prefix}/pages/calendar.html">Calendar</a>
      <a href="${prefix}/pages/chores.html">Chores</a>
      <a href="${prefix}/pages/login.html" id="login-link">Login</a>
    `;
  }

  // ... (logout button logic remains the same) ...

  console.log("✅ Header (static parts and logout listener) created.");
}
