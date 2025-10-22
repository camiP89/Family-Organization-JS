// scripts/index.mjs

// --- 1. Core Imports ---
// Import Firebase services (auth and db) from your src/firebase.js
import { auth, db } from "../src/firebase.js";

// Import Firebase Auth functions
import { onAuthStateChanged } from "firebase/auth"; // <-- THIS IS CRITICAL

// Import Firebase Firestore functions
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

// Import Header Logic
import { createHeader } from "./header.mjs";

// Import Auth Check Logic (if it performs any other necessary initialization or checks)
// If protectPage's only function was redirecting based on initial auth,
// it's now superseded by the onAuthStateChanged in each page.
// However, if it sets up localStorage or other global states, keep it.
// For now, assuming it's not needed for the core auth flow orchestration here.
// import "./authCheck.mjs"; // Consider if this line is still needed for index.html

// --- 2. DOMContentLoaded Listener: Ensures HTML elements are ready ---
document.addEventListener("DOMContentLoaded", () => {
  // --- 2.1. Get DOM Elements ---
  // Only get elements that index.mjs directly manipulates, NOT header elements
  const currentDateElement = document.getElementById("current-date");
  const todayCalendarEventsElement = document.getElementById(
    "today-calendar-events"
  );
  const todoListElement = document.getElementById("todo-list");
  const rememberListElement = document.getElementById("remember-list");
  const myActiveChoresElement = document.getElementById("today-chores");
  const shoppingListStatusElement = document.getElementById(
    "shopping-list-status"
  );

  // Add Item Forms
  const addTodoForm = document.getElementById("add-todo-form");
  const addTodoInput = document.getElementById("add-todo-input");
  const addRememberForm = document.getElementById("add-remember-form");
  const addRememberInput = document.getElementById("add-remember-input");

  // --- Helper functions ---

  // Helper function to derive a "family name" from the user object
  function getUserFamilyName(user) {
    if (!user || !user.displayName) {
      console.warn(
        "User displayName is not set, cannot determine family name for chores."
      );
      return null;
    }
    return user.displayName;
  }

  // Helper Function to Display Error if Elements are Missing
  const ensureElementExists = (element, id) => {
    if (!element) {
      console.error(`Error: Element with ID '${id}' not found in the DOM.`);
      return false;
    }
    return true;
  };

  // Current Date Display (Does NOT depend on user login)
  function renderCurrentDate() {
    if (!ensureElementExists(currentDateElement, "current-date")) return;
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    currentDateElement.textContent = today.toLocaleDateString(
      undefined,
      options
    );
  }

  // Today's Calendar Events
  function fetchAndRenderTodayCalendarEvents(user) {
    if (
      !ensureElementExists(todayCalendarEventsElement, "today-calendar-events")
    )
      return;
    if (!user) {
      todayCalendarEventsElement.innerHTML =
        "<p>Please log in to see calendar events.</p>";
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const calendarRef = collection(db, "calendarEvents");
    const q = query(
      calendarRef,
      where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
      where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("timestamp")
    );

    onSnapshot(
      q,
      (querySnapshot) => {
        const events = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        todayCalendarEventsElement.innerHTML = "";

        if (events.length === 0) {
          todayCalendarEventsElement.innerHTML =
            "<p>No calendar events for today!</p>";
        } else {
          const mainEventList = document.createElement("ul");
          mainEventList.classList.add("today-main-events-list");

          events.forEach((event) => {
            const eventGroupItem = document.createElement("li");
            eventGroupItem.classList.add("calendar-event-group");

            const lines = String(event.note || "")
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0);

            if (lines.length > 0) {
              const bulletedNoteList = document.createElement("ul");
              bulletedNoteList.classList.add("today-bulleted-notes");

              lines.forEach((line) => {
                const li = document.createElement("li");
                li.textContent = line;
                bulletedNoteList.appendChild(li);
              });
              eventGroupItem.appendChild(bulletedNoteList);
              mainEventList.appendChild(eventGroupItem);
            }
          });

          if (mainEventList.children.length > 0) {
            todayCalendarEventsElement.appendChild(mainEventList);
          } else {
            todayCalendarEventsElement.innerHTML =
              "<p>No calendar events for today!</p>";
          }
        }
      },
      (error) => {
        console.error("Error fetching calendar events:", error);
        todayCalendarEventsElement.innerHTML =
          "<p>Error loading calendar events.</p>";
      }
    );
  }

  // Personal To-Do List
  function fetchAndRenderUserTodoItems(user) {
    if (!ensureElementExists(todoListElement, "todo-list")) return;
    if (!user) {
      todoListElement.innerHTML =
        "<li>Please log in to see your To-Do list.</li>";
      return;
    }

    const todoCollectionRef = collection(db, "todoItems");
    const q = query(
      todoCollectionRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    onSnapshot(
      q,
      (querySnapshot) => {
        const todoItems = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("My personal To-Do items:", todoItems);

        todoListElement.innerHTML = "";

        if (todoItems.length === 0) {
          todoListElement.innerHTML = "<li>No To-Do items! Add one below.</li>";
        } else {
          todoItems.forEach((item) => {
            const li = document.createElement("li");
            li.className = item.isCompleted
              ? "todo-item completed"
              : "todo-item";
            li.innerHTML = `
            <input type="checkbox" data-id="${item.id}" ${
              item.isCompleted ? "checked" : ""
            }>
            <span>${item.text}</span>
            <button class="delete-btn" data-id="${
              item.id
            }"><i class="fa-solid fa-trash"></i></button>
          `;
            todoListElement.appendChild(li);
          });
          todoListElement.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", (e) =>
              deleteTodoItem(e.currentTarget.dataset.id)
            );
          });
          todoListElement
            .querySelectorAll('input[type="checkbox"]')
            .forEach((checkbox) => {
              checkbox.addEventListener("change", (e) =>
                toggleTodoComplete(
                  e.currentTarget.dataset.id,
                  e.currentTarget.checked
                )
              );
            });
        }
      },
      (error) => {
        console.error("Error fetching To-Do items:", error);
        todoListElement.innerHTML = "<li>Error loading To-Do items.</li>";
      }
    );
  }

  // Add To-Do Item
  async function addTodoItem(text, userId) {
    if (!text.trim()) return;
    try {
      await addDoc(collection(db, "todoItems"), {
        text: text.trim(),
        userId: userId,
        isCompleted: false,
        createdAt: new Date(),
      });
      console.log("To-Do item added!");
      if (addTodoInput) addTodoInput.value = "";
    } catch (error) {
      console.error("Error adding To-Do item:", error);
      alert("Could not add To-Do item.");
    }
  }

  // Delete To-Do Item
  async function deleteTodoItem(id) {
    if (confirm("Are you sure you want to delete this To-Do item?")) {
      try {
        await deleteDoc(doc(db, "todoItems", id));
        console.log("To-Do item deleted!");
      } catch (error) {
        console.error("Error deleting To-Do item:", error);
        alert("Could not delete To-Do item.");
      }
    }
  }

  // Toggle To-Do Item Completion
  async function toggleTodoComplete(id, isCompleted) {
    try {
      await updateDoc(doc(db, "todoItems", id), {
        isCompleted: isCompleted,
      });
      console.log(`To-Do item ${isCompleted ? "completed" : "uncompleted"}!`);
    } catch (error) {
      console.error("Error updating To-Do item:", error);
      alert("Could not update To-Do item status.");
    }
  }

  // Personal Remember List
  function fetchAndRenderUserRememberItems(user) {
    if (!ensureElementExists(rememberListElement, "remember-list")) return;
    if (!user) {
      rememberListElement.innerHTML =
        "<li>Please log in to see your Remember list.</li>";
      return;
    }

    const rememberCollectionRef = collection(db, "rememberItems");
    const q = query(
      rememberCollectionRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    onSnapshot(
      q,
      (querySnapshot) => {
        const rememberItems = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("My personal Remember items:", rememberItems);

        rememberListElement.innerHTML = "";

        if (rememberItems.length === 0) {
          rememberListElement.innerHTML =
            "<li>No reminders! Add one below.</li>";
        } else {
          rememberItems.forEach((item) => {
            const li = document.createElement("li");
            li.className = "remember-item";
            li.innerHTML = `
            <span>${item.text}</span>
            <button class="delete-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          `;
            rememberListElement.appendChild(li);
          });
          rememberListElement
            .querySelectorAll(".delete-btn")
            .forEach((button) => {
              button.addEventListener("click", (e) =>
                deleteRememberItem(e.currentTarget.dataset.id)
              );
            });
        }
      },
      (error) => {
        console.error("Error fetching Remember items:", error);
        rememberListElement.innerHTML = "<li>Error loading Reminders.</li>";
      }
    );
  }

  // Add Remember Item
  async function addRememberItem(text, userId) {
    if (!text.trim()) return;
    try {
      await addDoc(collection(db, "rememberItems"), {
        text: text.trim(),
        userId: userId,
        createdAt: new Date(),
      });
      console.log("Remember item added!");
      if (addRememberInput) addRememberInput.value = "";
    } catch (error) {
      console.error("Error adding Remember item:", error);
      alert("Could not add Remember item.");
    }
  }

  // Delete Remember Item
  async function deleteRememberItem(id) {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await deleteDoc(doc(db, "rememberItems", id));
        console.log("Remember item deleted!");
      } catch (error) {
        console.error("Error deleting Remember item:", error);
        alert("Could not delete reminder.");
      }
    }
  }

  // My Active Chores
  function fetchAndRenderMyActiveChores(user) {
    if (!ensureElementExists(myActiveChoresElement, "today-chores")) return;
    if (!user) {
      myActiveChoresElement.innerHTML =
        "<p>Please log in to see your active chores.</p>";
      return;
    }

    const userFamilyName = getUserFamilyName(user);
    if (!userFamilyName) {
      myActiveChoresElement.innerHTML =
        "<p>Your user profile (displayName) is not set up to match a family member for chores.</p>";
      return;
    }

    const choresRef = collection(db, "chores");
    const q = query(
      choresRef,
      where("isCompleted", "==", false),
      where("person", "==", userFamilyName),
      orderBy("createdAt", "asc")
    );

    onSnapshot(
      q,
      (querySnapshot) => {
        const chores = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        myActiveChoresElement.innerHTML = "";
        if (chores.length === 0) {
          myActiveChoresElement.innerHTML = `<p>No active chores assigned to ${userFamilyName}!</p>`;
        } else {
          chores.forEach((chore) => {
            const choreDiv = document.createElement("div");
            choreDiv.className = "chore-item";
            choreDiv.innerHTML = `<strong>${chore.task}</strong>`;
            myActiveChoresElement.appendChild(choreDiv);
          });
        }
      },
      (error) => {
        console.error("Error fetching active chores:", error);
        myActiveChoresElement.innerHTML = "<p>Error loading active chores.</p>";
      }
    );
  }

  // Shopping List Status
  function fetchAndRenderShoppingListStatus(user) {
    if (!ensureElementExists(shoppingListStatusElement, "shopping-list-status"))
      return;
    if (!user) {
      shoppingListStatusElement.textContent =
        "Please log in to see shopping list status.";
      shoppingListStatusElement.style.color = "gray";
      return;
    }

    const shoppingRef = collection(db, "shoppingItems");
    onSnapshot(
      shoppingRef,
      (querySnapshot) => {
        if (querySnapshot.size === 0) {
          shoppingListStatusElement.textContent = "Shopping Done!";
          shoppingListStatusElement.style.color = "green";
        } else {
          shoppingListStatusElement.textContent = `You have ${querySnapshot.size} items on your shopping list.`;
          shoppingListStatusElement.style.color = "red";
        }
      },
      (error) => {
        console.error("Error fetching shopping list status:", error);
        shoppingListStatusElement.textContent =
          "Error loading shopping list status.";
        shoppingListStatusElement.style.color = "red";
      }
    );
  }

  // --- Auth State Change Listener (The Orchestrator) ---
  onAuthStateChanged(auth, async (user) => {
    // Call createHeader() here to set up the dynamic header
    createHeader();

    // Always render current date (doesn't depend on auth state, but can be here for consistent flow)
    renderCurrentDate();

    if (user) {
      // --- USER IS LOGGED IN ---
      console.log("👤 User is logged in:", user.displayName || user.email);

      // Force refresh of the ID token to ensure custom claims and displayName are up-to-date
      // This is important if displayName was just set on another page (e.g., login.html)
      await user.getIdTokenResult(true);

      // Call all fetch/render functions that depend on authentication
      fetchAndRenderTodayCalendarEvents(user);
      fetchAndRenderUserTodoItems(user);
      fetchAndRenderUserRememberItems(user);
      fetchAndRenderMyActiveChores(user);
      fetchAndRenderShoppingListStatus(user);

      // Show/hide add forms based on login status
      if (addTodoForm) addTodoForm.style.display = "flex";
      if (addRememberForm) addRememberForm.style.display = "flex";
    } else {
      // --- USER IS LOGGED OUT ---
      console.log("👤 No user logged in.");

      // Clear or hide user-specific content
      if (todayCalendarEventsElement)
        todayCalendarEventsElement.innerHTML =
          "<p>Please log in to see calendar events.</p>";
      if (todoListElement)
        todoListElement.innerHTML =
          "<li>Please log in to see your To-Do list.</li>";
      if (rememberListElement)
        rememberListElement.innerHTML =
          "<li>Please log in to see your Remember list.</li>";
      if (myActiveChoresElement)
        myActiveChoresElement.innerHTML =
          "<p>Please log in to see your active chores.</p>";
      if (shoppingListStatusElement)
        shoppingListStatusElement.textContent =
          "Please log in to see shopping list status.";

      // Hide add forms
      if (addTodoForm) addTodoForm.style.display = "none";
      if (addRememberForm) addRememberForm.style.display = "none";
    }
  });

  // --- Attach Event Listeners for Adding Items (moved here to always be active) ---
  // Ensure these forms check for `auth.currentUser` on submission, which they already do.
  if (addTodoForm) {
    addTodoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = auth.currentUser; // Check auth.currentUser at the moment of submission
      if (user && addTodoInput && addTodoInput.value) {
        addTodoItem(addTodoInput.value, user.uid);
      } else if (!user) {
        alert("Please log in to add a To-Do item.");
      }
    });
  }

  if (addRememberForm) {
    addRememberForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = auth.currentUser; // Check auth.currentUser at the moment of submission
      if (user && addRememberInput && addRememberInput.value) {
        addRememberItem(addRememberInput.value, user.uid);
      } else if (!user) {
        alert("Please log in to add a reminder.");
      }
    });
  }

  console.log("✅ All main DOM listeners and auth watcher initialized.");
});
