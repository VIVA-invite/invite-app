// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYbB3_c5GEync02de8o98_DAR-UCXIrj0",
  authDomain: "invitation-app-cd62c.firebaseapp.com",
  projectId: "invitation-app-cd62c",
  storageBucket: "invitation-app-cd62c.firebasestorage.app",
  messagingSenderId: "908091091264",
  appId: "1:908091091264:web:4c7d0763552a83155d32a5",
  measurementId: "G-H4NCQ8JQX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getAnalytics(app);