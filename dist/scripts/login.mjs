// scripts/login.mjs

import { auth } from "../src/firebase.js";
import { signInWithEmailAndPassword, updateProfile } from "firebase/auth";

document.addEventListener("DOMContentLoaded", () => {
  const mainLoginFormContainer = document.getElementById(
    "mainLoginFormContainer"
  ); // New reference
  const formContainer = document.getElementById("form-container"); // Your existing dynamic form container
  const messageElement = document.getElementById("message");
  let loginForm = document.getElementById("loginForm");

  // NEW: References for the display name form
  const displayNameFormContainer = document.getElementById(
    "displayNameFormContainer"
  );
  const setDisplayNameForm = document.getElementById("setDisplayNameForm");
  const newDisplayNameInput = document.getElementById("newDisplayNameInput");
  const displayNameMessage = document.getElementById("displayNameMessage");

  let currentUserForDisplayNameUpdate = null; // To hold the user object after login

  // If loginForm isn't found statically, assume it needs to be created dynamically
  // (Keeping your dynamic form creation logic)
  if (!loginForm && formContainer) {
    loginForm = document.createElement("form");
    loginForm.id = "loginForm";
    loginForm.classList.add("form");

    const emailInput = document.createElement("input");
    emailInput.id = "email";
    emailInput.name = "email";
    emailInput.type = "email";
    emailInput.placeholder = "Email";
    emailInput.required = true;

    const passwordInput = document.createElement("input");
    passwordInput.id = "password";
    passwordInput.name = "password";
    passwordInput.type = "password";
    passwordInput.placeholder = "Password";
    passwordInput.required = true;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Login";
    submitButton.classList.add("button");
    submitButton.id = "button";

    loginForm.append(emailInput, passwordInput, submitButton);
    // Assuming formContainer is where mainLoginFormContainer would be
    if (mainLoginFormContainer) {
      mainLoginFormContainer.appendChild(loginForm);
    } else {
      formContainer.appendChild(loginForm); // Fallback if mainLoginFormContainer is not used
    }
  } else if (!loginForm && !formContainer && !mainLoginFormContainer) {
    console.error("No login form or container found in login page.");
    return;
  }

  // Ensure messageElement exists
  if (!messageElement) {
    console.error("Message element not found in login page.");
    return;
  }

  // Helper function to redirect after a delay
  const redirectToHome = (delay = 1000) => {
    setTimeout(() => (window.location.href = "../index.html"), delay);
  };

  // Event Listener for Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = loginForm.querySelector("#email");
      const passwordInput = loginForm.querySelector("#password");

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      messageElement.textContent = "Attempting login...";
      messageElement.style.color = "blue";

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        currentUserForDisplayNameUpdate = user; // Store user for potential display name update

        // Define what a "generic" display name looks like (e.g., unset or just the email prefix)
        const genericDisplayName = email.split("@")[0];

        if (!user.displayName || user.displayName === genericDisplayName) {
          // User's displayName is not set or is still the generic email prefix
          console.log("User needs to set a family name.");
          messageElement.textContent = ""; // Clear login message
          if (mainLoginFormContainer)
            mainLoginFormContainer.style.display = "none"; // Hide login form
          if (displayNameFormContainer) {
            displayNameFormContainer.style.display = "block"; // Show the display name form
            newDisplayNameInput.value = ""; // Clear any default placeholder for user input
          }
        } else {
          // Display name is already set to something meaningful, proceed to home
          localStorage.setItem("userName", user.displayName); // Update localStorage with the proper name
          messageElement.textContent = `Welcome, ${user.displayName}! Redirecting...`;
          messageElement.style.color = "green";
          redirectToHome();
        }
      } catch (error) {
        // Handle errors from Firebase Authentication
        console.error("Firebase Login Error:", error.code, error.message);
        let errorMessage = "Login failed. Please check your credentials.";
        if (error.code === "auth/invalid-email") {
          errorMessage = "Invalid email address.";
        } else if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          errorMessage = "Incorrect email or password.";
        }
        messageElement.textContent = errorMessage;
        messageElement.style.color = "red";
      }
    });
  }

  // NEW: Event Listener for Setting Display Name Form Submission
  if (setDisplayNameForm) {
    setDisplayNameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUserForDisplayNameUpdate) {
        displayNameMessage.textContent = "Error: No user logged in.";
        return;
      }

      const newName = newDisplayNameInput.value.trim();
      if (!newName) {
        displayNameMessage.textContent = "Please enter a name.";
        displayNameMessage.style.color = "red";
        return;
      }

      displayNameMessage.textContent = "Saving name...";
      displayNameMessage.style.color = "blue";

      try {
        await updateProfile(currentUserForDisplayNameUpdate, {
          displayName: newName,
        });
        // Update the user object locally for immediate use
        currentUserForDisplayNameUpdate.displayName = newName;

        localStorage.setItem("userName", newName); // Update localStorage
        displayNameMessage.textContent = `Name saved! Welcome, ${newName}! Redirecting...`;
        displayNameMessage.style.color = "green";
        redirectToHome(); // Redirect to home page
      } catch (error) {
        console.error("Error setting display name:", error);
        displayNameMessage.textContent =
          "Failed to save name. Please try again.";
        displayNameMessage.style.color = "red";
      }
    });
  }
});
