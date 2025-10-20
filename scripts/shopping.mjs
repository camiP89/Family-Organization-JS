// shopping.mjs

import { createHeader } from "./header.mjs";
// import { protectPage } from "./authCheck.mjs"; // No longer directly calling protectPage
import { auth, db } from "../src/firebase.js"; // Import auth and db
import { onAuthStateChanged } from "firebase/auth"; // <--- ENSURE THIS IS IMPORTED!
import {
  collection,
  query,
  orderBy,
  onSnapshot, // For real-time updates
  addDoc, // For adding new items
  updateDoc, // For editing existing items
  deleteDoc, // For deleting items
  doc, // For creating document references
  Timestamp, // For server-side timestamps
} from "firebase/firestore";

document.addEventListener("DOMContentLoaded", async () => {
  // Helper function for prefix logic (for redirects)
  const getPrefix = () => {
    const repoName = "Family-Organization-JS"; // your repo name
    if (window.location.hostname.includes("github.io")) {
      return `/${repoName}`;
    }
    return ""; // For Netlify with Vite, direct root paths are typically used for absolute paths.
  };
  const prefix = getPrefix();

  const form = document.getElementById("shopping-form");
  const shoppingInput = document.getElementById("shopping-item");
  const shoppingListEl = document.querySelector(".shopping-list");

  // Basic check for required elements on the page
  if (!form || !shoppingInput || !shoppingListEl) {
    console.error(
      "Required shopping list elements not found (form, input, or list)."
    );
    // You might want to display a user-friendly message or redirect here
    return;
  }

  let unsubscribeShoppingList = null; // To manage the Firestore real-time listener

  // --- CORE AUTHENTICATION LISTENER ---
  // This listener ensures we only render/fetch after auth state is known
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // --- USER IS LOGGED IN ---
      console.log("User is logged in:", user.email);

      // 1. Create/Update the header with the correct login state
      createHeader(); // This should now correctly show "Welcome, [User]" and Logout

      // 2. Setup Firestore listeners and enable form submission
      // Now that auth state is known, we can safely set up data listeners and enable interaction.
      setupShoppingListListener();
      form.style.display = "block"; // Assuming your form is hidden by default for logged out users
    } else {
      // --- USER IS LOGGED OUT ---
      console.log("User is logged out.");

      // 1. Create/Update the header to show the "Login" button
      createHeader();

      // 2. Clear any active Firestore listeners
      if (unsubscribeShoppingList) {
        unsubscribeShoppingList();
        unsubscribeShoppingList = null; // Reset the variable
      }

      // 3. Redirect to login page (use replace to prevent back button issues)
      window.location.replace(`${prefix}/pages/login.html`);
      return; // Stop further execution on this page as user is not authenticated
    }
  });
  // --- END CORE AUTHENTICATION LISTENER ---

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
  function setupShoppingListListener() {
    if (unsubscribeShoppingList) {
      unsubscribeShoppingList();
    }

    const q = query(
      collection(db, "shoppingItems"),
      orderBy("createdAt", "asc")
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
        alert(
          "Error loading shopping list. This might require a Firestore index. Check the browser console for details."
        );
      }
    );
  }

  // Handle form submission to add new item to Firestore
  // This listener can stay outside but should always check auth.currentUser
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const item = shoppingInput.value.trim();
    if (!item) return;

    const currentUser = auth.currentUser; // Check currentUser at the moment of submission
    if (!currentUser) {
      console.error("User not authenticated to add item.");
      alert("You must be logged in to add an item."); // User-friendly alert
      return;
    }

    try {
      await addDoc(collection(db, "shoppingItems"), {
        item: item,
        createdAt: Timestamp.now(),
      });
      console.log("Item added successfully to Firestore!");
      shoppingInput.value = "";
    } catch (error) {
      console.error("Error adding item to Firestore:", error);
      alert("Failed to add item. Please try again.");
    }
  });

  // Optional cleanup: unsubscribe when the page is unloaded
  window.addEventListener("beforeunload", () => {
    if (unsubscribeShoppingList) unsubscribeShoppingList();
    console.log("Firestore shopping list listener unsubscribed.");
  });
});
