import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs";
import { showSpinner, hideSpinner } from "./loadingSpinner.mjs";

document.addEventListener("DOMContentLoaded", () => {
  showSpinner();
  if (!protectPage("./login.html")) return;
  createHeader();

  const form = document.getElementById("chore-form");
  const personSelect = document.getElementById("person-select");
  const choreInput = document.getElementById("chore-input");

  const family = ["Daddy", "Mummy", "Lily", "Scarlet", "Ollie"];

  // Load saved chores
  let chores = JSON.parse(localStorage.getItem("chores")) || {};
  let completed = JSON.parse(localStorage.getItem("completedChores")) || {};

  family.forEach(name => {
    if (!chores[name]) chores[name] = [];
    if (!completed[name]) completed[name] = [];
  });

  function saveData() {
    localStorage.setItem("chores", JSON.stringify(chores));
    localStorage.setItem("completedChores", JSON.stringify(completed));
  }

  function renderAll() {
    family.forEach(name => {
      const card = document.getElementById(name);
      const list = card.querySelector(".chore-list");
      list.innerHTML = "";

      chores[name].forEach((task, idx) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = task;

        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✅";
        completeBtn.classList.add("complete-btn");
        completeBtn.addEventListener("click", () => {
          completed[name].push(task);
          chores[name].splice(idx, 1);
          saveData();
          renderAll();
          renderCompleted();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => {
          chores[name].splice(idx, 1);
          saveData();
          renderAll();
        });

        li.append(span, completeBtn, deleteBtn);
        list.appendChild(li);
      });
    });
  }

  function renderCompleted() {
    const completedContainer = document.getElementById("completed-container");
    completedContainer.innerHTML = "";

    Object.keys(completed).forEach(name => {
      if (completed[name].length === 0) return;

      const section = document.createElement("div");
      section.classList.add("completed-section");

      const title = document.createElement("h3");
      title.textContent = `${name}'s Completed Chores`;
      section.appendChild(title);

      const ul = document.createElement("ul");

      completed[name].forEach((task, idx) => {
        const li = document.createElement("li");
        li.textContent = task;

        const userName = localStorage.getItem("userName");
        if (userName === "Mummy" || userName === "Daddy") {
          const removeBtn = document.createElement("button");
          removeBtn.textContent = "🗑️";
          removeBtn.classList.add("delete-btn");
          removeBtn.addEventListener("click", () => {
            completed[name].splice(idx, 1);
            saveData();
            renderCompleted();
          });
          li.appendChild(removeBtn);
        }

        ul.appendChild(li);
      });

      section.appendChild(ul);
      completedContainer.appendChild(section);
    });
  }

  renderAll();
  renderCompleted();
  hideSpinner();

  form.addEventListener("submit", e => {
    e.preventDefault();

    const person = personSelect.value;
    const task = choreInput.value.trim();

    if (!person) return alert("Please select a person");
    if (!task) return;

    chores[person].push(task);
    saveData();
    renderAll();

    choreInput.value = "";
    personSelect.value = "";
  });
});
