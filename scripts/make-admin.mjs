/**
 * scripts/make-admin.mjs
 * Script to elevate user profiles to the "admin" role in Firestore.
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

const serviceAccountPath = resolve(process.cwd(), "./firebase-service-account.json");
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
} catch (err) {
  console.error("❌ Error reading service account file:", err.message);
  console.error("Please make sure firebase-service-account.json exists in the project root.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Get UIDs from CLI arguments, or default to the ones you provided
let uids = process.argv.slice(2);
if (uids.length === 0) {
  uids = ["mjCg1ROvBkOtPaybv9fkYtSv24Z2", "zceFOnj22vaBM9Og5sqnZaVv28b2"];
}

async function makeAdmin() {
  console.log("⚡ Starting Exopilot Admin Elevation...");
  
  for (const uid of uids) {
    const docRef = db.collection("profiles").doc(uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      // Update existing profile
      await docRef.update({
        role: "admin",
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Success: Updated profile for UID ${uid} to admin!`);
    } else {
      // Create a default admin profile
      await docRef.set({
        company_name: uid === "mjCg1ROvBkOtPaybv9fkYtSv24Z2" ? "Tana Minahasa Export" : "Demo Enterprise",
        main_commodity: "Nutmeg",
        phone_number: "",
        legal_entity_type: "PT",
        role: "admin",
        disabled: false,
        photo_url: "",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Success: Created new admin profile for UID ${uid}!`);
    }
  }
  
  console.log("🎉 All specified accounts are now Admins!");
}

makeAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Process failed:", err);
    process.exit(1);
  });
