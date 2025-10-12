import { createHeader } from "./header.mjs";

createHeader();

document.addEventListener("DOMContentLoaded", () => {
  const calendar = document.getElementById("calendar");

  const savedNotes = JSON.parse(localStorage.getItem("calendarNotes")) || {};

  // Current date tracking
  let currentDate = new Date();
  renderCalendar(currentDate);

  function renderCalendar(date) {
    calendar.innerHTML = ""; // Clear existing content

    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString("default", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Title + Navigation
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

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    calendar.appendChild(header);

    // Grid
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

      // Highlight today's date
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

      cell.appendChild(dayLabel);
      cell.appendChild(note);
      grid.appendChild(cell);
    }

    calendar.appendChild(grid);
  }
});
