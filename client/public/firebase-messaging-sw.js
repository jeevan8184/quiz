// Import the Firebase SDK scripts using the required importScripts() function
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYRS0a54proYD8tLGxh9GbMZgTpuW4A48",
  authDomain: "ai-quiz-builder-cc9a6.firebaseapp.com",
  projectId: "ai-quiz-builder-cc9a6",
  storageBucket: "ai-quiz-builder-cc9a6.firebasestorage.app",
  messagingSenderId: "646866182640",
  appId: "1:646866182640:web:41e4dc349daf3ec9b5fd35",
  measurementId: "G-PM02VL9Q65",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo1.png", // You can use any icon from your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
