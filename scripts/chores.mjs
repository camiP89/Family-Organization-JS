// chores.mjs

import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs"; // protectPage might still be useful for initial hard redirects
import { showSpinner, hideSpinner } from "./loadingSpinner.mjs";
import { auth, db } from "../src/firebase.js";
import { onAuthStateChanged } from "firebase/auth"; // <-- Ensure this is imported!
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot, // <-- Ensure this is imported!
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  showSpinner(); // Show spinner immediately when page starts loading

  // Helper function for prefix logic (for redirects)
  const getPrefix = () => {
    const repoName = "Family-Organization-JS";
    if (window.location.hostname.includes("github.io")) {
      return `/${repoName}`;
    }
    // For Netlify with Vite, direct root paths are typically used for absolute paths.
    // So, if login.html is at /pages/login.html, prefix remains empty for redirects.
    return "";
  };
  const prefix = getPrefix();

  let unsubscribeActiveChores = null;
  let unsubscribeCompletedChores = null;

  // These flags ensure the spinner is only hidden once all initial data has loaded
  let initialActiveChoresLoaded = false;
  let initialCompletedChoresLoaded = false;

  // isAdminUser needs to be declared here to be accessible within various functions
  let isAdminUser = false;

  // --- CORE AUTHENTICATION LISTENER ---
  // This listener ensures we only render/fetch after auth state is known
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // --- USER IS LOGGED IN ---
      console.log("User is logged in:", user.email);

      // 1. Create/Update the header with the correct login state
      createHeader(); // This should now correctly show "Welcome, [User]" and Logout

      // 2. Determine if the current user is an admin (needs to be done after user is confirmed)
      try {
        // Force refresh of the ID token to ensure custom claims are up-to-date
        const tokenResult = await user.getIdTokenResult(true);
        isAdminUser = tokenResult.claims.admin === true;
        console.log(`User ${user.email} is admin: ${isAdminUser}`);
      } catch (error) {
        console.error("Error getting user custom claims:", error);
        isAdminUser = false; // Fallback: If there's an error, assume not admin
      }

      // 3. Setup Firestore listeners and other auth-dependent content
      // Now that auth state and isAdminUser are known, we can safely set up data listeners.
      setupFirestoreListeners();

      // IMPORTANT: No longer calling protectPage directly here.
      // The redirect if not authenticated is now handled in the 'else' block below.
    } else {
      // --- USER IS LOGGED OUT ---
      console.log("User is logged out.");

      // 1. Create/Update the header to show the "Login" button
      createHeader();

      // 2. Redirect to login page
      // Use window.location.replace to prevent going back to chores page via history
      window.location.replace(`${prefix}/pages/login.html`);

      // Clear any Firestore listeners if user logs out (prevent memory leaks)
      if (unsubscribeActiveChores) unsubscribeActiveChores();
      if (unsubscribeCompletedChores) unsubscribeCompletedChores();

      hideSpinner(); // Hide spinner as we are redirecting
      return; // Stop further execution on this page as user is not authenticated
    }
    // Note: The main hideSpinner call happens in tryHideSpinner after Firestore data has loaded.
  });
  // --- END CORE AUTHENTICATION LISTENER ---

  // --- These parts can be set up immediately as they don't depend on auth state for creation ---
  const form = document.getElementById("chore-form");
  const personSelect = document.getElementById("person-select");
  const choreInput = document.getElementById("chore-input");
  const completedContainer = document.getElementById("completed-container");

  const family = ["Daddy", "Mummy", "Lily", "Scarlet", "Ollie"];
  family.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    personSelect.appendChild(option);
  });
  // --- END static setup ---

  // Helper function to hide spinner once both active and completed chores are loaded
  function tryHideSpinner() {
    if (initialActiveChoresLoaded && initialCompletedChoresLoaded) {
      hideSpinner();
    }
  }

  function renderActiveChores(activeChoresData) {
    family.forEach((name) => {
      const card = document.getElementById(name);
      if (!card) {
        console.warn(`Card element not found for ${name}. Skipping rendering.`);
        return;
      }
      const list = card.querySelector(".chore-list");
      list.innerHTML = "";

      const personsChores = activeChoresData.filter(
        (chore) => chore.person === name
      );

      personsChores.forEach((choreDoc) => {
        const li = document.createElement("li");
        li.dataset.choreId = choreDoc.id;

        const span = document.createElement("span");
        span.textContent = choreDoc.task;

        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✅";
        completeBtn.classList.add("complete-btn");
        completeBtn.addEventListener("click", async () => {
          const choreRef = doc(db, "chores", choreDoc.id);
          try {
            await updateDoc(choreRef, {
              isCompleted: true,
              completedAt: Timestamp.now(),
              completedBy: auth.currentUser.email || auth.currentUser.uid,
            });
            console.log(`Chore '${choreDoc.task}' marked as complete!`);
          } catch (error) {
            console.error("Error marking chore complete:", error);
          }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", async () => {
          // This delete is for active chores. With the current rules, any authenticated user can delete active chores.
          const choreRef = doc(db, "chores", choreDoc.id);
          try {
            await deleteDoc(choreRef);
            console.log(`Chore '${choreDoc.task}' deleted!`);
          } catch (error) {
            console.error("Error deleting chore:", error);
            alert("Failed to delete chore. Please try again.");
          }
        });

        li.append(span, completeBtn, deleteBtn);
        list.appendChild(li);
      });
    });
    initialActiveChoresLoaded = true;
    tryHideSpinner();
  }

  function renderCompletedChores(completedChoresData) {
    completedContainer.innerHTML = "";

    const completedByPerson = {};
    completedChoresData.forEach((chore) => {
      if (!completedByPerson[chore.person]) {
        completedByPerson[chore.person] = [];
      }
      completedByPerson[chore.person].push(chore);
    });

    Object.keys(completedByPerson).forEach((name) => {
      if (completedByPerson[name].length === 0) return;

      const section = document.createElement("div");
      section.classList.add("completed-section");

      const title = document.createElement("h3");
      title.textContent = `${name}'s Completed Chores`;
      section.appendChild(title);

      const ul = document.createElement("ul");

      completedByPerson[name].forEach((choreDoc) => {
        const li = document.createElement("li");
        li.textContent = choreDoc.task;
        if (choreDoc.completedBy) {
          li.textContent += ` (Completed by ${
            choreDoc.completedBy.split("@")[0]
          }`;
          if (choreDoc.completedAt) {
            li.textContent += ` on ${choreDoc.completedAt
              .toDate()
              .toLocaleDateString()})`;
          } else {
            li.textContent += `)`;
          }
        }

        // --- IMPORTANT: Only render the remove button if the current user is an admin ---
        // isAdminUser is now defined in the outer scope and correctly set by onAuthStateChanged
        if (isAdminUser) {
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "🗑️";
          removeBtn.classList.add("delete-btn");
          removeBtn.addEventListener("click", async () => {
            const choreRef = doc(db, "chores", choreDoc.id);
            try {
              await deleteDoc(choreRef);
              console.log(`Completed chore '${choreDoc.task}' removed!`);
            } catch (error) {
              console.error("Error removing completed chore:", error);
              // Inform the user why it failed (due to security rules)
              alert(
                "Failed to remove completed chore. Only designated family admins can remove these."
              );
            }
          });
          li.appendChild(removeBtn);
        }
        // --- END IMPORTANT ---

        ul.appendChild(li);
      });

      section.appendChild(ul);
      completedContainer.appendChild(section);
    });
    initialCompletedChoresLoaded = true;
    tryHideSpinner();
  }

  // setupFirestoreListeners no longer needs isAdminUser as argument because isAdminUser is now in a higher scope.
  function setupFirestoreListeners() {
    if (unsubscribeActiveChores) unsubscribeActiveChoores();
    if (unsubscribeCompletedChores) unsubscribeCompletedChores();

    const activeChoresQuery = query(
      collection(db, "chores"),
      where("isCompleted", "==", false),
      orderBy("createdAt", "asc")
    );
    unsubscribeActiveChores = onSnapshot(
      activeChoresQuery,
      (snapshot) => {
        const activeChores = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        renderActiveChores(activeChores);
      },
      (error) => {
        console.error("Error listening to active chores:", error);
        alert(
          "Error loading active chores. Check console for details (e.g., missing index)."
        );
      }
    );

    const completedChoresQuery = query(
      collection(db, "chores"),
      where("isCompleted", "==", true),
      orderBy("completedAt", "desc")
    );
    unsubscribeCompletedChores = onSnapshot(
      completedChoresQuery,
      (snapshot) => {
        const completedChores = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // isAdminUser is accessible here from the outer onAuthStateChanged scope
        renderCompletedChores(completedChores);
      },
      (error) => {
        console.error("Error listening to completed chores:", error);
        alert(
          "Error loading completed chores. Check console for details (e.g., missing index)."
        );
      }
    );
  }

  // The form event listener can stay outside, but must check auth.currentUser on submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const person = personSelect.value;
      const task = choreInput.value.trim();

      if (!person) {
        alert("Please select a person");
        return;
      }
      if (!task) {
        return;
      }

      const currentAuthedUser = auth.currentUser;
      if (!currentAuthedUser) {
        console.error("User not authenticated to add chore.");
        alert("You must be logged in to add a chore.");
        return;
      }

      try {
        await addDoc(collection(db, "chores"), {
          person: person,
          task: task,
          isCompleted: false,
          createdAt: Timestamp.now(),
          assignedBy: currentAuthedUser.email || currentAuthedUser.uid,
        });
        console.log("Chore added successfully to Firestore!");
        choreInput.value = "";
        personSelect.value = "";
      } catch (error) {
        console.error("Error adding chore to Firestore:", error);
        alert("Failed to add chore. Please try again.");
      }
    });
  }

  window.addEventListener("beforeunload", () => {
    if (unsubscribeActiveChores) unsubscribeActiveChores();
    if (unsubscribeCompletedChores) unsubscribeCompletedChores();
    console.log("Firestore chore listeners unsubscribed.");
  });
});
