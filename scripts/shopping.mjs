import { createHeader } from './header.mjs';
import { protectPage } from './authCheck.mjs';

document.addEventListener("DOMContentLoaded", () => {
  // --- Always create the header ---
  createHeader();

  // --- Detect prefix for consistent links ---
  let prefix = ".";
  const repoName = "Family-Organization-JS"; // your repo name
  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = "..";
  }

  // --- Protect the page ---
  // Redirect path should match header prefix logic
  if (!protectPage(`${prefix}/pages/login.html`)) return;

  // --- Page-specific code for shopping list ---
  const form = document.getElementById("shopping-form");
  const shoppingInput = document.getElementById("shopping-item");
  const shoppingListEl = document.querySelector(".shopping-list");

  if (!form || !shoppingInput || !shoppingListEl) return;

  // Load saved items from localStorage
  let savedItems = JSON.parse(localStorage.getItem("shoppingItems")) || [];

  // Save items to localStorage
  function saveItems() {
    localStorage.setItem("shoppingItems", JSON.stringify(savedItems));
  }

  // Render shopping list
  function renderItems() {
    shoppingListEl.innerHTML = "";
    savedItems.forEach((item, idx) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = item;

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.classList.add("edit-btn");
      editBtn.addEventListener("click", () => {
        const newItem = prompt("Edit item:", item);
        if (newItem !== null && newItem.trim() !== "") {
          savedItems[idx] = newItem.trim();
          saveItems();
          renderItems();
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.classList.add("delete-btn");
      deleteBtn.addEventListener("click", () => {
        savedItems.splice(idx, 1);
        saveItems();
        renderItems();
      });

      li.append(span, editBtn, deleteBtn);
      shoppingListEl.appendChild(li);
    });
  }

  // Initial render
  renderItems();

  // Handle form submission
  form.addEventListener("submit", e => {
    e.preventDefault();
    const item = shoppingInput.value.trim();
    if (!item) return;

    savedItems.push(item);
    saveItems();
    renderItems();

    shoppingInput.value = "";
  });
});

