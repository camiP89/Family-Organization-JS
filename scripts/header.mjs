export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");
  const userName = localStorage.getItem("userName");

  // Detect environment
  const repoName = "Family-Organization-JS"; // your GitHub repo name
  let prefix = "."; // default local dev
  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = ".."; // inside pages folder
  }

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
}
