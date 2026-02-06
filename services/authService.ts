
import { User, UserRole, PaymentRequest, StoreOrder, AdminActivityLog } from '../types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";

export const authService = {
  // --- REAL ADMIN LOGIN (EMAIL/PASSWORD) ---
  loginAdmin: async (email: string, password: string): Promise<User> => {
    try {
        // 1. Authenticate with Firebase Auth (Checks Email & Password hash)
        const result = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;

        // 2. Fetch User Data from Firestore to verify ROLE
        const userRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = { id: userSnap.id, ...userSnap.data() } as User;
            
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
            
            // Log Login Action
            authService.logAdminAction(userData.id, userData.name, "Login", "Admin Portal Access", "INFO");
            
            return userData;
        } else {
            // Edge case: Auth exists (Password correct) but no DB record found.
            await signOut(auth);
            throw new Error("User record missing in database. Please contact support.");
        }
    } catch (error: any) {
        console.error("Admin Login Error:", error);
        // Clean up error messages
        let msg = error.message;
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') msg = "Invalid Email or Password.";
        if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
        if (error.code === 'auth/too-many-requests') msg = "Too many failed attempts. Please try again later.";
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
  },

  // --- ADMIN ACTIVITY LOGGER ---
  logAdminAction: async (adminId: string, adminName: string, action: string, details: string, type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS') => {
      try {
          const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const logData: AdminActivityLog = {
              id: logId,
              adminId,
              adminName,
              action,
              details,
              type,
              timestamp: new Date().toISOString()
          };
          // Save to 'admin_logs' collection
          await setDoc(doc(db, "admin_logs", logId), logData);
      } catch (e) {
          console.error("Failed to log admin action", e);
      }
  }
};
