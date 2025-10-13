import { createHeader } from './header.mjs';
import { protectPage } from './authCheck.mjs';

document.addEventListener("DOMContentLoaded", () => {
  // Protect the page first
  if (!protectPage("../login.html")) return;

  // Create the header
  createHeader();

  // --- Page-specific code for shopping list ---
  const form = document.getElementById("shopping-form");
  const shoppingInput = document.getElementById("shopping-item");
  const shoppingListEl = document.querySelector(".shopping-list");

  // Load saved items
  let savedItems = JSON.parse(localStorage.getItem("shoppingItems")) || [];

  function saveItems() {
    localStorage.setItem("shoppingItems", JSON.stringify(savedItems));
  }

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

  renderItems();

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

