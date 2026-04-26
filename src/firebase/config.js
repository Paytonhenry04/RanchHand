// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE SETUP
// ─────────────────────────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g. "RanchHand")
// 3. Click "Add app" → Web (</>)
// 4. Copy the firebaseConfig object values into the placeholders below
// 5. In Firebase console → Build → Authentication → Sign-in method → Enable Email/Password
// 6. In Firebase console → Build → Firestore Database → Create database (start in test mode for dev)
// 7. In Firebase console → Build → Storage → Get started (for horse photos)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDaVNa6keaRN7sWaVm65U5zGOpq1bnZ98E",
  authDomain: "ranch-hand-c12f3.firebaseapp.com",
  projectId: "ranch-hand-c12f3",
  storageBucket: "ranch-hand-c12f3.firebasestorage.app",
  messagingSenderId: "336994596847",
  appId: "1:336994596847:web:40ef9ef54cb0e427bbe81a"
};

const app = initializeApp(firebaseConfig);

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);
export default app;
