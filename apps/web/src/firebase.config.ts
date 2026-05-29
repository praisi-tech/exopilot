// Firebase Configuration for Next.js Frontend
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-build-time",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-for-build-time",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id-for-build-time",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket-for-build-time",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id-for-build-time",
};

// Lazy init: only initialize on client side, and only once
function getAppClient() {
  if (typeof window === "undefined") {
    // Return a dummy for SSR — will never be used for auth calls
    return null;
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

const app = getAppClient();

// These are safe to call on server — they just return uninitialized instances;
// actual auth/firestore calls are guarded in AuthContext and firebase.ts
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
