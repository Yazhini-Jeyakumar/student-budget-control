var firebaseConfig = {
  apiKey: "AIzaSyDll1pePqJPScE_QkrENxEdIZmmiGLGqTo",
  authDomain: "student-budget-app-738b3.firebaseapp.com",
  projectId: "student-budget-app-738b3",
  storageBucket: "student-budget-app-738b3.firebasestorage.app",
  messagingSenderId: "393340116534",
  appId: "1:393340116534:web:56ebb67101e2d947bf0297",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();