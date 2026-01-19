// scripts/login.mjs

import { auth } from "../src/firebase.js";
import {
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"; // Make sure sendPasswordResetEmail is imported

document.addEventListener("DOMContentLoaded", () => {
  const mainLoginFormContainer = document.getElementById(
    "mainLoginFormContainer"
  );
  const formContainer = document.getElementById("form-container");
  const messageElement = document.getElementById("message");
  let loginForm = document.getElementById("loginForm");

  const displayNameFormContainer = document.getElementById(
    "displayNameFormContainer"
  );
  const setDisplayNameForm = document.getElementById("setDisplayNameForm");
  const newDisplayNameInput = document.getElementById("newDisplayNameInput");
  const displayNameMessage = document.getElementById("displayNameMessage");

  let currentUserForDisplayNameUpdate = null;

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
    submitButton.id = "submitButton"; // Assign an ID to the login button for clarity

    // START: ADDING THE FORGOT PASSWORD BUTTON DYNAMICALLY
    const forgotPasswordButton = document.createElement("button");
    forgotPasswordButton.type = "button"; // Important: make it type="button" to prevent form submission
    forgotPasswordButton.id = "forgotPasswordButton";
    forgotPasswordButton.textContent = "Forgot Password?";
    forgotPasswordButton.classList.add("link-button"); // Add a class for styling
    // END: ADDING THE FORGOT PASSWORD BUTTON DYNAMICALLY

    // Append all elements to the form
    loginForm.append(
      emailInput,
      passwordInput,
      submitButton,
      forgotPasswordButton
    );

    if (mainLoginFormContainer) {
      mainLoginFormContainer.appendChild(loginForm);
    } else {
      formContainer.appendChild(loginForm);
    }
  } else if (!loginForm && !formContainer && !mainLoginFormContainer) {
    console.error("No login form or container found in login page.");
    return;
  }

  if (!messageElement) {
    console.error("Message element not found in login page.");
    return;
  }

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
        currentUserForDisplayNameUpdate = user;

        const genericDisplayName = email.split("@")[0];

        if (!user.displayName || user.displayName === genericDisplayName) {
          console.log("User needs to set a family name.");
          messageElement.textContent = "";
          if (mainLoginFormContainer)
            mainLoginFormContainer.style.display = "none";
          if (displayNameFormContainer) {
            displayNameFormContainer.style.display = "block";
            newDisplayNameInput.value = "";
          }
        } else {
          localStorage.setItem("userName", user.displayName);
          messageElement.textContent = `Welcome, ${user.displayName}! Redirecting...`;
          messageElement.style.color = "green";
          redirectToHome();
        }
      } catch (error) {
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

  // START: Event Listener for Forgot Password Button
  // We get the reference here, assuming it's been created by the dynamic logic above.
  const forgotPasswordButton = document.getElementById("forgotPasswordButton");
  if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async () => {
      const emailInput = loginForm.querySelector("#email");
      const email = emailInput.value.trim();

      if (!email) {
        messageElement.textContent =
          "Please enter your email to reset password.";
        messageElement.style.color = "orange";
        return;
      }

      messageElement.textContent = "Sending password reset email...";
      messageElement.style.color = "blue";

      try {
        await sendPasswordResetEmail(auth, email);
        messageElement.textContent =
          "Password reset email sent! Check your inbox.";
        messageElement.style.color = "green";
      } catch (error) {
        console.error(
          "Firebase Password Reset Error:",
          error.code,
          error.message
        );
        let errorMessage =
          "Failed to send password reset email. Please try again.";
        if (error.code === "auth/user-not-found") {
          errorMessage = "No account found with that email address.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Invalid email address format.";
        }
        messageElement.textContent = errorMessage;
        messageElement.style.color = "red";
      }
    });
  }
  // END: Event Listener for Forgot Password Button

  // Event Listener for Setting Display Name Form Submission
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
        currentUserForDisplayNameUpdate.displayName = newName;

        localStorage.setItem("userName", newName);
        displayNameMessage.textContent = `Name saved! Welcome, ${newName}! Redirecting...`;
        displayNameMessage.style.color = "green";
        redirectToHome();
      } catch (error) {
        console.error("Error setting display name:", error);
        displayNameMessage.textContent =
          "Failed to save name. Please try again.";
        displayNameMessage.style.color = "red";
      }
    });
  }
});
