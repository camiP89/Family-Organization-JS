// chores.mjs

import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs";
import { showSpinner, hideSpinner } from "./loadingSpinner.mjs";
import { auth, db } from "../src/firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  showSpinner();

  let prefix = ".";
  const repoName = "Family-Organization-JS";
  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = "..";
  }

  const isAuthenticated = await protectPage(`${prefix}/pages/login.html`);
  if (!isAuthenticated) {
    hideSpinner();
    return;
  }

  createHeader();

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

  let unsubscribeActiveChores = null;
  let unsubscribeCompletedChores = null;

  let initialActiveChoresLoaded = false;
  let initialCompletedChoresLoaded = false;
  let isAdminUser = false; // Initialize isAdminUser flag

  // --- IMPORTANT: Determine if the current user is an admin ---
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      // Force refresh of the ID token to ensure custom claims are up-to-date
      const tokenResult = await currentUser.getIdTokenResult(true);
      isAdminUser = tokenResult.claims.admin === true;
      console.log(`User ${currentUser.email} is admin: ${isAdminUser}`);
    } catch (error) {
      console.error("Error getting user custom claims:", error);
      isAdminUser = false; // Fallback: If there's an error, assume not admin
    }
  }
  // --- END IMPORTANT ---

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

  function setupFirestoreListeners() {
    if (unsubscribeActiveChores) unsubscribeActiveChores();
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

  setupFirestoreListeners();

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
