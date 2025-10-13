export function createHeader() {
  const navContainer = document.getElementById("nav-container");
  const welcomeText = document.getElementById("welcome-text");
  const logoutButton = document.getElementById("logout-button");

  const userName = localStorage.getItem("userName");

  if (navContainer) {
    navContainer.innerHTML = `
      <a href="/index.html">Home</a>
      <a href="/shopping.html">Shopping List</a>
      <a href="/calendar.html">Calendar</a>
      <a href="/chores.html">Chores</a>
      <a href="/profile.html">Profile</a>
      <a href="/login.html" id="login-link">Login</a>
    `;

    navContainer.classList.add(userName ? "nav-logged-in" : "nav-logged-out");

    // Hide the login link if the user is logged in
    const loginLink = document.getElementById("login-link");
    if (userName && loginLink) {
      loginLink.style.display = "none";
    }
  }

  if (userName) {
    if (welcomeText) welcomeText.textContent = `Welcome, ${userName}!`;

    if (logoutButton) {
      logoutButton.style.display = "inline-block";
      logoutButton.addEventListener("click", () => {
        localStorage.clear();
        alert("You have logged out! Redirecting to login...");
        location.href = "/pages/login.html";
      });
    }
  } else {
    if (logoutButton) logoutButton.style.display = "none";
  }
}
