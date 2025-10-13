export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");

  const userName = localStorage.getItem("userName");

  // Debugging info
  console.log("📂 Current path:", window.location.pathname);

  // 🔍 Detect whether the code is running locally or on GitHub Pages
  const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
  const repoName = "Family-Organization-JS";

  // ✅ If local, links are relative (./pages/)
  // ✅ If on GitHub Pages, links include the repo folder (/Family-Organization-JS/pages/)
  const prefix = isLocal ? "." : `/${repoName}`;

  const isInPages = window.location.pathname.includes("/pages/");
  console.log("🌐 Running locally:", isLocal);
  console.log("📁 Is in /pages/ folder:", isInPages);
  console.log("🔗 Using prefix:", prefix);
  console.log("👤 Logged in as:", userName ? userName : "No user");

  // --- Create Navigation ---
  if (navContainer) {
    navContainer.innerHTML = `
      <a href="${prefix}/index.html">Home</a>
      <a href="${prefix}/pages/shopping.html">Shopping List</a>
      <a href="${prefix}/pages/calendar.html">Calendar</a>
      <a href="${prefix}/pages/chores.html">Chores</a>
      <a href="${prefix}/pages/profile.html">Profile</a>
      <a href="${prefix}/pages/login.html" id="login-link">Login</a>
    `;

    navContainer.classList.add(userName ? "nav-logged-in" : "nav-logged-out");

    const loginLink = document.getElementById("login-link");
    if (userName && loginLink) loginLink.style.display = "none";
  }

  // --- User greeting & logout ---
  if (userName) {
    if (welcomeText) welcomeText.textContent = `Welcome, ${userName}!`;

    if (logoutButton) {
      logoutButton.style.display = "inline-block";
      logoutButton.addEventListener("click", () => {
        localStorage.clear();
        alert("You have logged out! Redirecting to login...");
        location.href = `${prefix}/pages/login.html`;
      });
    }
  } else {
    if (logoutButton) logoutButton.style.display = "none";
  }

  console.log("✅ Header created successfully");
}
