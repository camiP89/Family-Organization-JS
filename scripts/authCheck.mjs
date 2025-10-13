// authCheck.mjs
import { createHeader } from "./header.mjs";

export function protectPage(redirectPath = "./login.html") {
  const userName = localStorage.getItem("userName");
  if (!userName) {
    alert("Please log in first!");
    window.location.href = redirectPath;
    return false;
  }

  // Create the header
  createHeader();
  console.log(`👤 User is logged in as ${userName}`);
  return true;
}
