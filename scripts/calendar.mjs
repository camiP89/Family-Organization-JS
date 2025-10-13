import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs";

document.addEventListener("DOMContentLoaded", () => {
  // Redirect if not logged in
  if (!protectPage("./login.html")) return;

  // Safe to create header and render calendar
  createHeader();

  const calendar = document.getElementById("calendar");
  const savedNotes = JSON.parse(localStorage.getItem("calendarNotes")) || {};
  let currentDate = new Date();

  renderCalendar(currentDate);

  function renderCalendar(date) {
    calendar.innerHTML = ""; // Clear previous month

    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Header (month title + arrows)
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
    calendar.appendChild(header);

    // Calendar grid
    const grid = document.createElement("div");
    grid.classList.add("calendar-grid");

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.classList.add("day-cell");

      const dayLabel = document.createElement("div");
      dayLabel.classList.add("day-number");
      dayLabel.textContent = day;

      const note = document.createElement("textarea");
      note.classList.add("day-note");
      note.placeholder = "Write here...";
      note.value = savedNotes[`${year}-${month}-${day}`] || "";

      note.addEventListener("input", () => {
        savedNotes[`${year}-${month}-${day}`] = note.value;
        localStorage.setItem("calendarNotes", JSON.stringify(savedNotes));
      });

      // Highlight today
      const today = new Date();
      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        cell.classList.add("today");
      }

      // Highlight weekends
      const dayOfWeek = new Date(year, month, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        cell.classList.add("weekend");
      }

      cell.append(dayLabel, note);
      grid.appendChild(cell);
    }

    calendar.appendChild(grid);
  }
});

