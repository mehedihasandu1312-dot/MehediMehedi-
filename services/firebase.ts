
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
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

// Initialize Firestore with robust settings for unstable networks
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Forces HTTP polling to bypass websocket timeouts
  localCache: memoryLocalCache() // Uses RAM instead of disk to prevent IndexedDB errors
});

const storage = getStorage(app); 
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
