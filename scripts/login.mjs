import { createHeader } from "./header.mjs";

document.addEventListener("DOMContentLoaded", () => {
  createHeader();

  const formContainer = document.getElementById("form-container");
  const messageElement = document.getElementById("message");

  if (!formContainer || !messageElement) return;

  const loginForm = document.createElement("form");
  loginForm.id = "loginForm";

  // Username
  const usernameInput = document.createElement("input");
  usernameInput.id = "username";
  usernameInput.name = "username";
  usernameInput.placeholder = "Username";
  usernameInput.required = true;

  // Password
  const passwordInput = document.createElement("input");
  passwordInput.id = "password";
  passwordInput.name = "password";
  passwordInput.type = "password";
  passwordInput.placeholder = "Password";
  passwordInput.required = true;

  // Submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Login";

  loginForm.append(usernameInput, passwordInput, submitButton);
  formContainer.appendChild(loginForm);

  const users = [
    { username: "Mummy", password: "1234" },
    { username: "Daddy", password: "1234" },
    { username: "Lily", password: "abcd" },
    { username: "Scarlet", password: "abcd" },
  ];

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem("userName", user.username);
      messageElement.textContent = `Welcome, ${user.username}! Redirecting...`;
      messageElement.style.color = "green";
      setTimeout(() => window.location.href = "../index.html", 1000);
    } else {
      messageElement.textContent = "Invalid username or password.";
      messageElement.style.color = "red";
    }
  });
});

