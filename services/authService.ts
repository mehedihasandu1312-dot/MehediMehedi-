
import { User, UserRole, PaymentRequest, StoreOrder } from '../types';
import { MOCK_USERS, MASTER_ADMIN_EMAIL } from '../constants';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const authService = {
  // --- REAL ADMIN LOGIN (EMAIL/PASSWORD) ---
  loginAdmin: async (email: string, password: string): Promise<User> => {
    try {
        // 1. Authenticate with Firebase Auth
        const result = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;

        // 2. Fetch User Data from Firestore to verify ROLE
        const userRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // FIX: Manually merge the Document ID with the data
            const userData = { id: userSnap.id, ...userSnap.data() } as User;
            
            // --- AUTO SUPER ADMIN FIX ---
            // If the email matches the hardcoded master email, grant super admin even if DB misses it
            if (userData.email === MASTER_ADMIN_EMAIL) {
                userData.isSuperAdmin = true;
                userData.role = UserRole.ADMIN; // Ensure they are admin
            }

            // SECURITY CHECK: Verify Role
            if (userData.role !== UserRole.ADMIN) {
                await signOut(auth); // Log them out immediately
                throw new Error("Access Denied: You do not have Admin privileges.");
            }

            if (userData.status === 'BLOCKED') {
                await signOut(auth);
                throw new Error("Account Blocked. Contact support.");
            }

            sessionStorage.setItem('currentUser', JSON.stringify(userData));
            return userData;
        } else {
            // Edge case: Auth exists but no DB record. Treat as unauthorized.
            await signOut(auth);
            throw new Error("User record not found in database.");
        }
    } catch (error: any) {
        console.error("Admin Login Error:", error);
        // Clean up error messages
        let msg = error.message;
        if (error.code === 'auth/invalid-credential') msg = "Invalid Email or Password.";
        if (error.code === 'auth/user-not-found') msg = "No admin account found with this email.";
        if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
        throw new Error(msg);
    }
  },

  // --- GOOGLE LOGIN (For Students, or Admins using Google) ---
  loginWithGoogle: async (role: UserRole): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = { id: userSnap.id, ...userSnap.data() } as User;
        
        // --- AUTO SUPER ADMIN FIX ---
        if (userData.email === MASTER_ADMIN_EMAIL) {
            userData.isSuperAdmin = true;
            userData.role = UserRole.ADMIN;
        }

        if (userData.status === 'BLOCKED') {
           throw new Error("This account is blocked.");
        }

        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        return userData;
      } else {
        // Create NEW User (Default to Student)
        const newUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'New User',
          email: fbUser.email || '',
          role: UserRole.STUDENT, // Always default to STUDENT for new Google Signups
          profileCompleted: false,
          status: 'ACTIVE',
          joinedDate: new Date().toISOString(),
          avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName}`,
          points: 0,
          rank: 0
        };

        // If new user is Master Admin by email, auto-promote
        if (newUser.email === MASTER_ADMIN_EMAIL) {
            newUser.role = UserRole.ADMIN;
            newUser.isSuperAdmin = true;
        }

        await setDoc(userRef, newUser);
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        return newUser;
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    sessionStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
        const user = JSON.parse(stored);
        // Clean check for subscription expiration
        if (user.subscription && user.subscription.status === 'ACTIVE') {
            const expiry = new Date(user.subscription.expiryDate);
            if (expiry < new Date()) {
                user.subscription.status = 'EXPIRED';
                // Update session quietly
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }
        }
        return user;
    }
    return null;
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
  },

  // NEW: Submit Payment Request (Student Side)
  submitPaymentRequest: async (request: PaymentRequest): Promise<void> => {
      try {
          await setDoc(doc(db, "payment_requests", request.id), request);
      } catch (e) {
          console.error("Failed to submit payment request", e);
          throw e;
      }
  },

  // NEW: Approve Payment & Upgrade (Admin Side)
  approvePayment: async (request: PaymentRequest): Promise<void> => {
      const now = new Date();
      const expiry = new Date();
      
      if (request.plan === 'MONTHLY') {
          expiry.setMonth(expiry.getMonth() + 1);
      } else {
          expiry.setFullYear(expiry.getFullYear() + 1);
      }

      const subscription = {
          plan: request.plan,
          status: 'ACTIVE',
          startedAt: now.toISOString(),
          expiryDate: expiry.toISOString()
      };

      // 1. Update User Record
      const userRef = doc(db, "users", request.userId);
      await setDoc(userRef, { subscription }, { merge: true });

      // 2. Update Request Status
      const requestRef = doc(db, "payment_requests", request.id);
      await setDoc(requestRef, { status: 'APPROVED' }, { merge: true });
  },

  // NEW: Submit Store Order
  submitStoreOrder: async (order: StoreOrder): Promise<void> => {
      try {
          await setDoc(doc(db, "store_orders", order.id), order);
      } catch (e) {
          console.error("Failed to submit store order", e);
          throw e;
      }
  }
};
