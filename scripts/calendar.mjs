// scripts/calendar.mjs

import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs";
import { auth, db } from "../src/firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  const isAuthenticated = await protectPage("./login.html");
  if (!isAuthenticated) return;

  createHeader();

  const calendarDiv = document.getElementById("calendar");
  const messageElement = document.createElement("p");
  messageElement.id = "calendar-message";
  messageElement.style.marginTop = "10px";
  calendarDiv.prepend(messageElement);

  let currentDate = new Date();
  let currentMonthEvents = {}; // Stores raw string notes from Firestore
  let unsubscribeSnapshot = null;

  renderCalendar(currentDate);

  async function saveCalendarNote(dateKey, noteText) {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated when trying to save note.");
      messageElement.textContent = "Error: Not authenticated to save note.";
      messageElement.style.color = "red";
      return;
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);

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
        { merge: true }
      );
      console.log("Note saved to Firestore for", dateKey);
      messageElement.textContent = "";
    } catch (error) {
      console.error("Error saving note to Firestore:", error);
      messageElement.textContent = `Error saving note: ${error.message}`;
      messageElement.style.color = "red";
    }
  }

  // --- NEW: Function to render the note string as bullet points ---
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

  // --- UPDATED: updateCalendarNoteDisplays function ---
  function updateCalendarNoteDisplays() {
    const dayCells = calendarDiv.querySelectorAll(".day-cell");
    dayCells.forEach((cell) => {
      const dateKey = cell.dataset.dateKey;
      if (dateKey) {
        const notesDisplayElement = cell.querySelector(".notes-display"); // The new display div
        const notesTextareaElement = cell.querySelector(".day-note-textarea"); // The textarea for editing
        const currentNoteContent = currentMonthEvents[dateKey] || "";

        if (notesDisplayElement && notesTextareaElement) {
          // Always update the display element with the latest bulleted view
          renderNotesDisplay(notesDisplayElement, currentNoteContent);

          // Always update the textarea's value (it's hidden unless editing)
          notesTextareaElement.value = currentNoteContent;

          // Ensure correct element is shown if not actively editing
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
      unsubscribeSnapshot();
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
        currentMonthEvents = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const firestoreDate = data.timestamp.toDate();
          const dateKey = `${firestoreDate.getFullYear()}-${
            firestoreDate.getMonth() + 1
          }-${firestoreDate.getDate()}`;
          currentMonthEvents[dateKey] = String(data.note || ""); // Ensure string, even if null/undefined
        });
        updateCalendarNoteDisplays();
        messageElement.textContent = "";
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
    calendarDiv.innerHTML = "";
    calendarDiv.prepend(messageElement);

    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    listenForMonthEvents(date);

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
      const dateKey = `${year}-${month + 1}-${day}`;
      cell.dataset.dateKey = dateKey; // Assign dateKey to the cell

      const dateObj = new Date(year, month, day);
      const weekdayName = dateObj.toLocaleString("default", {
        weekday: "short",
      });

      const dayLabel = document.createElement("div");
      dayLabel.classList.add("day-number");
      dayLabel.innerHTML = `<span class="day-num">${day}</span> <span class="weekday">${weekdayName}</span>`;

      // --- UI STRUCTURE FOR TOGGLING DISPLAY/EDIT ---
      const notesContainer = document.createElement("div");
      notesContainer.classList.add("day-notes-container"); // Wrapper for notes UI

      const notesDisplay = document.createElement("div");
      notesDisplay.classList.add("notes-display"); // This div shows the bulleted list
      notesDisplay.textContent = "Write here..."; // Initial placeholder (will be updated by JS)
      notesDisplay.classList.add("placeholder-text"); // Add class for styling placeholder
      notesDisplay.style.display = "block"; // Ensure display is visible by default

      const notesTextarea = document.createElement("textarea");
      notesTextarea.classList.add("day-note-textarea"); // The textarea for editing
      notesTextarea.placeholder = "Write your notes here (one per line)...";
      notesTextarea.style.display = "none"; // Hidden by default

      // Event listener to switch to edit mode (click the bulleted display)
      notesDisplay.addEventListener("click", () => {
        notesDisplay.style.display = "none";
        notesTextarea.style.display = "block";
        notesTextarea.focus();
        // notesTextarea.value is already kept up-to-date by updateCalendarNoteDisplays
      });

      // Event listener to switch back to display mode and save (blur the textarea)
      notesTextarea.addEventListener("blur", async () => {
        notesTextarea.style.display = "none";
        notesDisplay.style.display = "block"; // Ensure display is shown after blur
        const newNotesContent = notesTextarea.value.trim();

        // Only save if content has actually changed from what's currently in Firestore (currentMonthEvents)
        if (newNotesContent !== (currentMonthEvents[dateKey] || "")) {
          await saveCalendarNote(dateKey, newNotesContent);
          // The onSnapshot listener will handle updating currentMonthEvents and re-rendering
        } else {
          // If no change, or if cleared to empty, ensure display reflects currentMonthEvents
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
        cell.classList.add("weekend");
      }

      cell.append(dayLabel, notesContainer); // Append the notesContainer
      grid.appendChild(cell);
    }

    calendarDiv.appendChild(grid);

    // Initial update of notes after calendar structure is built and listener has potentially fired.
    updateCalendarNoteDisplays();
  }
});
