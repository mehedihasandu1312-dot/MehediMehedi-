import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Simulated delay for mock admin login
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Existing mock login for Admin (keeps Admin easy to access for demo)
  login: async (email: string, role: UserRole): Promise<User | null> => {
    await delay(800);
    const user = MOCK_USERS.find(u => u.email === email && u.role === role);
    
    if (user) {
      if (user.status === 'BLOCKED') {
        throw new Error("Your account has been blocked. Please contact the administrator.");
      }
      // Use sessionStorage to keep sessions separate per tab
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  },

  // NEW: Google Login Logic
  loginWithGoogle: async (role: UserRole): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        
        // Security check: If trying to login as Student but account is Admin (or vice versa)
        // For simplicity in this app, we allow the login but warn if roles mismatch, 
        // OR we just update local storage with the cloud data.
        
        if (userData.status === 'BLOCKED') {
           throw new Error("This account is blocked.");
        }

        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        return userData;
      } else {
        // Create NEW User (Only for Students via Google Login usually)
        // If an Admin tries to login via Google and doesn't exist, we can default them to Student 
        // or reject. Here we create a new user based on the requested role.
        
        const newUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'New Student',
          email: fbUser.email || '',
          role: role, 
          profileCompleted: false, // Trigger profile setup
          status: 'ACTIVE',
          joinedDate: new Date().toISOString(),
          avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName}`,
          points: 0,
          rank: 0
        };

        await setDoc(userRef, newUser);
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        return newUser;
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      // IMPORTANT: Throw original error so UI can check error.code (e.g. auth/unauthorized-domain)
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    sessionStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const stored = sessionStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const stored = sessionStorage.getItem('currentUser');
    if (!stored) throw new Error("No user");
    
    const user = JSON.parse(stored);
    const updatedUser = { ...user, ...updates, profileCompleted: true };
    
    // Update Session
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update Cloud
    try {
        const userRef = doc(db, "users", user.id);
        await setDoc(userRef, updatedUser, { merge: true });
    } catch (e) {
        console.error("Failed to sync profile update to cloud", e);
    }

    return updatedUser;
  }
};