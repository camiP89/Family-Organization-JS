// scripts/calendar.mjs

import { createHeader } from "./header.mjs";
// import { protectPage } from "./authCheck.mjs"; // No longer directly calling protectPage
import { auth, db } from "../src/firebase.js";
import { onAuthStateChanged } from "firebase/auth"; // Ensure this is imported!
import {
  collection,
  query,
  where,
  onSnapshot, // Ensure this is imported!
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  // Helper function for prefix logic (for redirects)
  const getPrefix = () => {
    const repoName = "Family-Organization-JS";
    if (window.location.hostname.includes("github.io")) {
      return `/${repoName}`;
    }
    return ""; // For Netlify with Vite, direct root paths are typically used for absolute paths.
  };
  const prefix = getPrefix();

  const calendarDiv = document.getElementById("calendar");
  const messageElement = document.createElement("p");
  messageElement.id = "calendar-message";
  messageElement.style.marginTop = "10px";
  // Only prepend messageElement if calendarDiv exists
  if (calendarDiv) {
    calendarDiv.prepend(messageElement);
  } else {
    console.error("Calendar div not found on page.");
    // Potentially handle this error, e.g., redirect or show a basic message.
    return; // Exit if the main container is missing.
  }

  let currentDate = new Date();
  let currentMonthEvents = {}; // Stores raw string notes from Firestore
  let unsubscribeSnapshot = null; // Keeps track of the Firestore listener

  // --- CORE AUTHENTICATION LISTENER ---
  // This listener ensures we only render/fetch after auth state is known
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // --- USER IS LOGGED IN ---
      console.log("User is logged in:", user.email);

      // 1. Create/Update the header with the correct login state
      createHeader(); // This should now correctly show "Welcome, [User]" and Logout

      // 2. Render the calendar and set up Firestore listeners
      // This is moved inside here because it relies on an authenticated user
      // for Firestore data fetching.
      renderCalendar(currentDate);
    } else {
      // --- USER IS LOGGED OUT ---
      console.log("User is logged out.");

      // 1. Create/Update the header to show the "Login" button
      createHeader();

      // 2. Clear any active Firestore listeners
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null; // Reset the variable
      }

      // 3. Redirect to login page (use replace to prevent back button issues)
      window.location.replace(`${prefix}/pages/login.html`);
      return; // Stop further execution on this page as user is not authenticated
    }
  });
  // --- END CORE AUTHENTICATION LISTENER ---

  // --- Functions defined below are accessible within the onAuthStateChanged scope ---

  async function saveCalendarNote(dateKey, noteText) {
    // auth.currentUser will be valid at this point because saveCalendarNote is only
    // called after onAuthStateChanged has confirmed a user is logged in.
    const user = auth.currentUser;
    if (!user) {
      // Added a redundant check, just for safety, though user should be defined here
      console.error(
        "User not authenticated when trying to save note (should not happen here)."
      );
      messageElement.textContent = "Error: Not authenticated to save note.";
      messageElement.style.color = "red";
      return;
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day); // Month is 0-indexed for Date constructor

    const eventDocRef = doc(db, "calendarEvents", dateKey);

    try {
      await setDoc(
        eventDocRef,
        {
          timestamp: Timestamp.fromDate(eventDate),
          note: noteText, // Save the full string (including newlines)
          updatedBy: user.email,
          updatedById: user.uid,
          updatedAt: Timestamp.now(),
        },
        { merge: true } // Merge ensures other fields (if any) are not overwritten
      );
      console.log("Note saved to Firestore for", dateKey);
      messageElement.textContent = ""; // Clear any previous error messages
    } catch (error) {
      console.error("Error saving note to Firestore:", error);
      messageElement.textContent = `Error saving note: ${error.message}`;
      messageElement.style.color = "red";
    }
  }

  function renderNotesDisplay(displayElement, rawNoteString) {
    displayElement.innerHTML = ""; // Clear current content
    const lines = String(rawNoteString) // Ensure it's a string, even if null/undefined
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 0) {
      const ul = document.createElement("ul");
      ul.classList.add("calendar-notes-list"); // For CSS styling
      lines.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
      displayElement.appendChild(ul);
      displayElement.classList.remove("placeholder-text"); // Remove placeholder style if content exists
    } else {
      displayElement.textContent = "Write here..."; // Placeholder if no notes
      displayElement.classList.add("placeholder-text");
    }
  }

  function updateCalendarNoteDisplays() {
    // Ensure calendarDiv exists before querying it
    if (!calendarDiv) return;

    const dayCells = calendarDiv.querySelectorAll(".day-cell");
    dayCells.forEach((cell) => {
      const dateKey = cell.dataset.dateKey;
      if (dateKey) {
        const notesDisplayElement = cell.querySelector(".notes-display");
        const notesTextareaElement = cell.querySelector(".day-note-textarea");
        const currentNoteContent = currentMonthEvents[dateKey] || "";

        if (notesDisplayElement && notesTextareaElement) {
          renderNotesDisplay(notesDisplayElement, currentNoteContent);
          notesTextareaElement.value = currentNoteContent;

          if (document.activeElement !== notesTextareaElement) {
            notesDisplayElement.style.display = "block";
            notesTextareaElement.style.display = "none";
          }
        }
      }
    });
  }

  function listenForMonthEvents(date) {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot(); // Unsubscribe from previous month's listener
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const q = query(
      collection(db, "calendarEvents"),
      where("timestamp", ">=", Timestamp.fromDate(startOfMonth)),
      where("timestamp", "<=", Timestamp.fromDate(endOfMonth))
    );

    unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        currentMonthEvents = {}; // Reset events for the new month
        snapshot.forEach((doc) => {
          const data = doc.data();
          const firestoreDate = data.timestamp.toDate();
          const dateKey = `${firestoreDate.getFullYear()}-${
            firestoreDate.getMonth() + 1
          }-${firestoreDate.getDate()}`;
          currentMonthEvents[dateKey] = String(data.note || ""); // Ensure string, even if null/undefined
        });
        updateCalendarNoteDisplays(); // Update UI after new events are loaded
        messageElement.textContent = ""; // Clear any previous loading messages
      },
      (error) => {
        console.error("Error listening to calendar events:", error);
        messageElement.textContent = `Error loading calendar: ${error.message}`;
        messageElement.style.color = "red";
      }
    );
    console.log(`Listening for events in ${year}-${month + 1}`);
  }

  function renderCalendar(date) {
    // Clear existing calendar content, but keep messageElement at top
    const existingMessageElement =
      calendarDiv.querySelector("#calendar-message");
    calendarDiv.innerHTML = "";
    if (existingMessageElement) {
      calendarDiv.prepend(existingMessageElement);
    } else {
      calendarDiv.prepend(messageElement); // Ensure messageElement is always present
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    listenForMonthEvents(date); // Start listening for Firestore events for the current month

    const header = document.createElement("div");
    header.classList.add("calendar-header");

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "←";
    prevBtn.classList.add("nav-btn");
    prevBtn.addEventListener("click", () => {
      currentDate = new Date(year, month - 1, 1);
      renderCalendar(currentDate);
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "→";
    nextBtn.classList.add("nav-btn");
    nextBtn.addEventListener("click", () => {
      currentDate = new Date(year, month + 1, 1);
      renderCalendar(currentDate);
    });

    const title = document.createElement("h2");
    title.textContent = `${monthName} ${year}`;

    header.append(prevBtn, title, nextBtn);
    calendarDiv.appendChild(header);

    const grid = document.createElement("div");
    grid.classList.add("calendar-grid");

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.classList.add("day-cell");
      const dateKey = `${year}-${month + 1}-${day}`; // Format: YYYY-M-D
      cell.dataset.dateKey = dateKey;

      const dateObj = new Date(year, month, day);
      const weekdayName = dateObj.toLocaleString("default", {
        weekday: "short",
      });

      const dayLabel = document.createElement("div");
      dayLabel.classList.add("day-number");
      dayLabel.innerHTML = `<span class="day-num">${day}</span> <span class="weekday">${weekdayName}</span>`;

      // --- UI STRUCTURE FOR TOGGLING DISPLAY/EDIT ---
      const notesContainer = document.createElement("div");
      notesContainer.classList.add("day-notes-container");

      const notesDisplay = document.createElement("div");
      notesDisplay.classList.add("notes-display");
      notesDisplay.textContent = "Write here...";
      notesDisplay.classList.add("placeholder-text");
      notesDisplay.style.display = "block";

      const notesTextarea = document.createElement("textarea");
      notesTextarea.classList.add("day-note-textarea");
      notesTextarea.placeholder = "Write your notes here (one per line)...";
      notesTextarea.style.display = "none";

      // Event listener to switch to edit mode (click the bulleted display)
      notesDisplay.addEventListener("click", () => {
        notesDisplay.style.display = "none";
        notesTextarea.style.display = "block";
        notesTextarea.focus();
      });

      // Event listener to switch back to display mode and save (blur the textarea)
      notesTextarea.addEventListener("blur", async () => {
        notesTextarea.style.display = "none";
        notesDisplay.style.display = "block";
        const newNotesContent = notesTextarea.value.trim();

        // Only save if content has actually changed
        if (newNotesContent !== (currentMonthEvents[dateKey] || "")) {
          await saveCalendarNote(dateKey, newNotesContent);
        } else {
          // If no change, ensure display reflects current state (e.g., if a note was cleared)
          renderNotesDisplay(notesDisplay, currentMonthEvents[dateKey] || "");
        }
      });

      notesContainer.append(notesDisplay, notesTextarea);

      // --- END UI STRUCTURE ---

      const today = new Date();
      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add("today");
      }

      const dayOfWeekIndex = dateObj.getDay();
      if (dayOfWeekIndex === 0 || dayOfWeekIndex === 6) {
        // Sunday (0) and Saturday (6)
        cell.classList.add("weekend");
      }

      cell.append(dayLabel, notesContainer);
      grid.appendChild(cell);
    }

    calendarDiv.appendChild(grid);

    // Initial update of notes after calendar structure is built.
    // This will populate the display elements with data from currentMonthEvents.
    updateCalendarNoteDisplays();
  }

  window.addEventListener("beforeunload", () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    console.log("Firestore calendar listeners unsubscribed.");
  });
});
