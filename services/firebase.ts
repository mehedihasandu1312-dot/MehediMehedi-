
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

// Initialize Firestore with settings to prevent timeouts
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Fixes "Backend didn't respond" errors by using HTTP long-polling
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const storage = getStorage(app); // Storage initialized
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
