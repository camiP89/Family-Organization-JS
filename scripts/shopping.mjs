// shopping.mjs

import { createHeader } from "./header.mjs";
import { protectPage } from "./authCheck.mjs";
import { auth, db } from "../src/firebase.js"; // Import auth and db
import {
  collection,
  query,
  orderBy, // No longer need 'where' for user-specific filtering
  onSnapshot, // For real-time updates
  addDoc, // For adding new items
  updateDoc, // For editing existing items
  deleteDoc, // For deleting items
  doc, // For creating document references
  Timestamp, // For server-side timestamps
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  createHeader();

  let prefix = ".";
  const repoName = "Family-Organization-JS"; // your repo name
  if (window.location.hostname.includes("github.io")) {
    prefix = `/${repoName}`;
  } else if (window.location.pathname.includes("/pages/")) {
    prefix = "..";
  }

  const isAuthenticated = await protectPage(`${prefix}/pages/login.html`);
  if (!isAuthenticated) return;

  const form = document.getElementById("shopping-form");
  const shoppingInput = document.getElementById("shopping-item");
  const shoppingListEl = document.querySelector(".shopping-list");

  if (!form || !shoppingInput || !shoppingListEl) {
    console.error(
      "Required shopping list elements not found (form, input, or list)."
    );
    return;
  }

  let unsubscribeShoppingList = null; // To manage the Firestore real-time listener

  // Function to render items from the current `items` array fetched from Firestore
  function renderItems(items) {
    shoppingListEl.innerHTML = ""; // Clear existing list items
    items.forEach((itemDoc) => {
      const li = document.createElement("li");
      li.dataset.docId = itemDoc.id;

      const span = document.createElement("span");
      span.textContent = itemDoc.item;

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.classList.add("edit-btn");
      editBtn.addEventListener("click", async () => {
        const newItemText = prompt("Edit item:", itemDoc.item);
        if (newItemText !== null && newItemText.trim() !== "") {
          const itemRef = doc(db, "shoppingItems", itemDoc.id);
          try {
            await updateDoc(itemRef, {
              item: newItemText.trim(),
              updatedAt: Timestamp.now(),
            });
            console.log("Item updated successfully in Firestore!");
          } catch (error) {
            console.error("Error updating item in Firestore:", error);
          }
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.classList.add("delete-btn");
      deleteBtn.addEventListener("click", async () => {
        const itemRef = doc(db, "shoppingItems", itemDoc.id);
        try {
          await deleteDoc(itemRef);
          console.log("Item deleted successfully from Firestore!");
        } catch (error) {
          console.error("Error deleting item from Firestore:", error);
        }
      });

      li.append(span, editBtn, deleteBtn);
      shoppingListEl.appendChild(li);
    });
  }

  // Set up the real-time listener for the shared shopping list from Firestore
  // This function no longer needs a userId argument
  function setupShoppingListListener() {
    if (unsubscribeShoppingList) {
      unsubscribeShoppingList();
    }

    // Query the 'shoppingItems' collection without filtering by userId
    const q = query(
      collection(db, "shoppingItems"),
      orderBy("createdAt", "asc") // Still good to order them for consistency
    );

    unsubscribeShoppingList = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        renderItems(items);
        console.log(
          "Shared shopping list updated from Firestore via onSnapshot."
        );
      },
      (error) => {
        console.error("Error listening to shopping list in Firestore:", error);
        // It's crucial here to inform the user about the index if this error happens again
        alert(
          "Error loading shopping list. This might require a Firestore index. Check the browser console for details."
        );
      }
    );
  }

  // After successful authentication, set up the shared listener
  // We no longer pass auth.currentUser.uid
  setupShoppingListListener();

  // Handle form submission to add new item to Firestore
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const item = shoppingInput.value.trim();
    if (!item) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Still check if someone is logged in to allow additions
      console.error("User not authenticated to add item.");
      return;
    }

    try {
      // Add a new document to the "shoppingItems" collection
      await addDoc(collection(db, "shoppingItems"), {
        item: item,
        // No 'userId' field needed for access control anymore, but you *could* keep it
        // if you want to track who added an item for display purposes, e.g., 'addedBy: currentUser.email'
        createdAt: Timestamp.now(),
      });
      console.log("Item added successfully to Firestore!");
      shoppingInput.value = "";
    } catch (error) {
      console.error("Error adding item to Firestore:", error);
    }
  });

  // Optional cleanup
});
