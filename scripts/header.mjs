export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");
  const userName = localStorage.getItem("userName");

  // Detect environment
  let prefix = "."; // default for local files
  const repoName = "Family-Organization-JS"; // GitHub repo name

  if (
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    // GitHub Pages
    prefix = `/${repoName}`;
  } else {
    // Local development
    const pathParts = window.location.pathname.split("/");
    if (pathParts.includes("pages")) prefix = ".."; // if inside pages folder
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
