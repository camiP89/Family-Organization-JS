// makeAdmin.js (This file runs locally with Node.js, NOT in your browser)
const admin = require("firebase-admin");

// Make sure 'serviceAccountKey.json' is in the SAME folder as this script.
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// === VERY IMPORTANT: Add ALL the User UIDs you want to make admin here ===
const adminUids = [
  "WHPTPiLYhsVlWC9EMMxEYZMezhi2", // First admin user
  "PFOD8aB0MyRj18VVZIewbxMs0cX2", // Second admin user
  // Add any other admin UIDs here if needed
];

async function setAdminClaim(uid) {
  try {
    // Set the 'admin: true' custom claim for the specified user
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Successfully set admin: true claim for user ${uid}`);

    // This step forces the user's existing ID token to expire.
    // This means the user MUST log out and log back in (or force a token refresh)
    // in your web app to get a new ID token that includes the 'admin: true' claim.
    await admin.auth().revokeRefreshTokens(uid);
    console.log(
      `🚨 Revoked refresh tokens for user ${uid}. User will need to re-authenticate to get updated claims.`
    );
  } catch (error) {
    console.error("❌ Error setting custom claim for user", uid, ":", error);
  }
}

// Iterate through the list of UIDs and set the admin claim for each
async function processAdminUids() {
  console.log(`Attempting to set admin claim for ${adminUids.length} users...`);
  for (const uid of adminUids) {
    await setAdminClaim(uid);
  }
  console.log("Admin claim processing complete for all specified users.");
}

// Execute the function that processes all admin UIDs
processAdminUids();
