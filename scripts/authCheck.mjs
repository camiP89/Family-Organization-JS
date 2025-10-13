// authCheck.mjs
export function protectPage(redirectUrl = "./login.html") {
  const userName = localStorage.getItem("userName");
  if (!userName) {
    window.location.href = redirectUrl;
    return false; // stop further script execution
  }
  return true;
}
