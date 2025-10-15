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
  let currentMonthEvents = {};
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
          date: Timestamp.fromDate(eventDate),
          note: noteText,
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

  // NEW FUNCTION: Updates the note textareas on the calendar
  function updateCalendarNoteDisplays() {
    // Loop through all day-note textareas and update their values based on currentMonthEvents
    const noteElements = calendarDiv.querySelectorAll(".day-note");
    noteElements.forEach((noteElement) => {
      const dateKey = noteElement.dataset.dateKey; // Get the dateKey from the data attribute
      if (
        dateKey &&
        currentMonthEvents[dateKey] !== undefined &&
        noteElement.value !== currentMonthEvents[dateKey]
      ) {
        noteElement.value = currentMonthEvents[dateKey];
      } else if (
        dateKey &&
        currentMonthEvents[dateKey] === undefined &&
        noteElement.value !== ""
      ) {
        noteElement.value = ""; // Clear if event was removed
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
      where("date", ">=", Timestamp.fromDate(startOfMonth)),
      where("date", "<=", Timestamp.fromDate(endOfMonth))
    );

    unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        currentMonthEvents = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const firestoreDate = data.date.toDate();
          const dateKey = `${firestoreDate.getFullYear()}-${
            firestoreDate.getMonth() + 1
          }-${firestoreDate.getDate()}`;
          currentMonthEvents[dateKey] = data.note;
        });
        // --- FIX: Call the new update function instead of re-rendering the whole calendar ---
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
    calendarDiv.prepend(messageElement); // Keep message element at top

    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // The listener is initialized *once* when the calendar for a new month is rendered
    listenForMonthEvents(date);

    const header = document.createElement("div");
    header.classList.add("calendar-header");

    // ... (prevBtn and nextBtn logic remains the same) ...
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "←";
    prevBtn.classList.add("nav-btn");
    prevBtn.addEventListener("click", () => {
      currentDate = new Date(year, month - 1, 1);
      renderCalendar(currentDate); // This correctly triggers a re-render for a new month
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "→";
    nextBtn.classList.add("nav-btn");
    nextBtn.addEventListener("click", () => {
      currentDate = new Date(year, month + 1, 1);
      renderCalendar(currentDate); // This correctly triggers a re-render for a new month
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

      const dateObj = new Date(year, month, day);
      const weekdayName = dateObj.toLocaleString("default", {
        weekday: "short",
      });

      const dayLabel = document.createElement("div");
      dayLabel.classList.add("day-number");
      dayLabel.innerHTML = `<span class="day-num">${day}</span> <span class="weekday">${weekdayName}</span>`;

      const note = document.createElement("textarea");
      note.classList.add("day-note");
      note.placeholder = "Write here...";
      const dateKey = `${year}-${month + 1}-${day}`;
      // --- IMPORTANT: Add a data attribute to easily find this textarea later ---
      note.dataset.dateKey = dateKey;
      note.value = currentMonthEvents[dateKey] || ""; // Initial value set here

      note.addEventListener("input", () => {
        saveCalendarNote(dateKey, note.value);
      });

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

      cell.append(dayLabel, note);
      grid.appendChild(cell);
    }

    calendarDiv.appendChild(grid);

    // Initial update of notes after calendar structure is built and listener has potentially fired.
    // This ensures any initial data from Firestore is reflected right away.
    updateCalendarNoteDisplays();
  }
});
