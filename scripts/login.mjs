// scripts/login.mjs

// Import Firebase Authentication methods and your initialized 'auth' instance
import { auth } from "../src/firebase.js"; // Corrected path to your firebase.js
import { signInWithEmailAndPassword } from "firebase/auth"; // Import the specific Firebase sign-in function

import { createHeader } from "./header.mjs";

document.addEventListener("DOMContentLoaded", () => {
  createHeader();

  const formContainer = document.getElementById("form-container");
  const messageElement = document.getElementById("message");

  if (!formContainer || !messageElement) return;

  const loginForm = document.createElement("form");
  loginForm.id = "loginForm";
  loginForm.classList.add("form");

  // --- IMPORTANT CHANGE: Use Email for Firebase Authentication ---
  const emailInput = document.createElement("input"); // Changed from usernameInput
  emailInput.id = "email"; // Changed ID to email
  emailInput.name = "email";
  emailInput.type = "email"; // Set type to email for better input handling
  emailInput.placeholder = "Email"; // Changed placeholder
  emailInput.required = true;

  // Password (remains the same)
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
  submitButton.classList.add("button");
  submitButton.id = "button";

  // Append email and password inputs to the form
  loginForm.append(emailInput, passwordInput, submitButton); // Use emailInput
  formContainer.appendChild(loginForm);

  // --- IMPORTANT CHANGE: Replace static 'users' array with Firebase Auth logic ---
  loginForm.addEventListener("submit", async (e) => {
    // Made the event listener async
    e.preventDefault();

    const email = emailInput.value.trim(); // Get email from the input
    const password = passwordInput.value.trim();

    messageElement.textContent = "Attempting login...";
    messageElement.style.color = "blue";

    try {
      // Use Firebase's signInWithEmailAndPassword to authenticate
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // Get the user object from the successful login

      // Firebase automatically manages the user session securely.
      // Update localStorage for compatibility with your existing userName logic,
      // but ideally, you'll eventually use the `user` object directly from Firebase Auth.
      localStorage.setItem(
        "userName",
        user.displayName || user.email.split("@")[0]
      ); // Fallback to email prefix if no displayName

      messageElement.textContent = `Welcome, ${localStorage.getItem(
        "userName"
      )}! Redirecting...`;
      messageElement.style.color = "green";
      setTimeout(() => (window.location.href = "../index.html"), 1000);
    } catch (error) {
      // Handle errors from Firebase Authentication
      console.error("Firebase Login Error:", error.code, error.message);
      messageElement.textContent = `Login failed: ${error.message}`;
      messageElement.style.color = "red";
    }
  });
});
