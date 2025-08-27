// app/firebase.ts

import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDYRS0a54proYD8tLGxh9GbMZgTpuW4A48",
  authDomain: "ai-quiz-builder-cc9a6.firebaseapp.com",
  projectId: "ai-quiz-builder-cc9a6",
  storageBucket: "ai-quiz-builder-cc9a6.firebasestorage.app",
  messagingSenderId: "646866182640",
  appId: "1:646866182640:web:41e4dc349daf3ec9b5fd35",
  measurementId: "G-PM02VL9Q65",
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ** IMPORTANT **
// Export a function that safely returns the messaging instance ONLY on the client
export const getMessagingInstance = () => {
  const isSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;
  if (isSupported) {
    return getMessaging(app);
  }
  return null;
};
