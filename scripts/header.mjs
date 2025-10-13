export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");
  const userName = localStorage.getItem("userName");

  const repoName = "Family-Organization-JS"; // Change to your GitHub repo name
  const currentPath = window.location.pathname;
  let prefix = "";

  // Detect environment and set prefix for links
  if (window.location.hostname.includes("github.io")) {
    // GitHub Pages
    prefix = `/${repoName}`;
  } else if (currentPath.includes("/pages/")) {
    // Local dev inside /pages/
    prefix = "..";
  } else {
    // Local dev at root folder
    prefix = ".";
  }

  console.log("📂 Current path:", currentPath);
  console.log("🌐 Hostname:", window.location.hostname);
  console.log("🔗 Using prefix:", prefix);
  console.log("👤 Logged in as:", userName ? userName : "No user");

  // Build nav
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

  // Show welcome and logout
  if (userName) {
    if (welcomeText) welcomeText.textContent = `Welcome, ${userName}!`;
    if (logoutButton) {
      logoutButton.style.display = "inline-block";
      logoutButton.addEventListener("click", () => {
        localStorage.clear();
        alert("Logged out! Redirecting...");
        location.href = `${prefix}/pages/login.html`;
      });
    }
  } else {
    if (logoutButton) logoutButton.style.display = "none";
  }

  console.log("✅ Header created successfully");
}

