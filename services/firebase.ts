import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBfVlidDcUygDZN51Syg7KdEQIQRO7bhzY",
  authDomain: "mehediedu-17027.firebaseapp.com",
  projectId: "mehediedu-17027",
  storageBucket: "mehediedu-17027.firebasestorage.app",
  messagingSenderId: "143840177896",
  appId: "1:143840177896:web:283fa3afae50c65003e35d",
  measurementId: "G-HCZGGDZC5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Storage initialized
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };