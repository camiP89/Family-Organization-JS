export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");
  const userName = localStorage.getItem("userName");

  // Repo name for GitHub Pages
  const repoName = "Family-Organization-JS";

  // Determine prefix for paths
  let prefix = ".";
  if (window.location.hostname.includes("github.io")) {
    // GitHub Pages project pages
    prefix = `/${repoName}`;
  } else {
    // Local dev
    const pathParts = window.location.pathname.split("/");
    if (pathParts.includes("pages")) prefix = "..";
  }

  console.log("📂 Current path:", window.location.pathname);
  console.log("🌐 Hostname:", window.location.hostname);
  console.log("🔗 Using prefix:", prefix);
  console.log("👤 Logged in as:", userName ? userName : "No user");

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

  if (userName) {
    if (welcomeText) welcomeText.textContent = `Welcome, ${userName}!`;

    if (logoutButton) {
      logoutButton.style.display = "inline-block";
      logoutButton.addEventListener("click", () => {
        // Only remove the user key instead of clearing everything
        localStorage.removeItem("userName");
        alert("You have logged out! Redirecting to login...");
        location.href = `${prefix}/pages/login.html`;
      });
    }
  } else {
    if (logoutButton) logoutButton.style.display = "none";
  }

  console.log("✅ Header created successfully");
}
