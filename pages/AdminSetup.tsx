
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Card, Button } from '../components/UI';
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { UserRole } from '../types';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [mode, setMode] = useState<'CREATE' | 'RESET'>('CREATE');

  const navigate = useNavigate();

  // Check if ANY Admin exists on load
  useEffect(() => {
      const checkAdminExistence = async () => {
          try {
              const q = query(collection(db, "users"), where("role", "==", "ADMIN"));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                  setAdminExists(true);
                  setMode('RESET'); // Force to reset mode if admin exists
              }
          } catch (e) {
              console.error("Error checking admins", e);
          } finally {
              setChecking(false);
          }
      };
      checkAdminExistence();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      if (mode === 'CREATE') {
          // SECURITY CHECK: Double check before creation
          if (adminExists) {
              throw new Error("Admin already exists. Cannot create another Master Admin publicly.");
          }

          // 1. Create Authentication User
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // 2. Prepare Admin Data Object
          const adminData = {
            email: user.email,
            role: UserRole.ADMIN,
            isSuperAdmin: true,
            name: 'Super Admin',
            status: 'ACTIVE',
            profileCompleted: true,
            joinedDate: new Date().toISOString(),
            points: 0,
            rank: 0,
            avatar: `https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff`
          };

          // 3. Write to Firestore
          await setDoc(doc(db, "users", user.uid), adminData);

          setStatus({
            type: 'success',
            msg: `Success! Admin account created. Proceed to Login.`
          });
          setAdminExists(true); // Now admin exists
      } else {
          // RESET PASSWORD MODE
          await sendPasswordResetEmail(auth, email);
          setStatus({
            type: 'success',
            msg: `Password reset email sent to ${email}. Check your inbox!`
          });
      }
      
      setPassword('');

    } catch (error: any) {
      console.error("Setup Error:", error);
      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
          errorMsg = "This email is already registered. Please use 'Reset Password'.";
      }
      setStatus({
        type: 'error',
        msg: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-400" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-t-4 border-t-emerald-600 relative">
        
        {/* Back Button */}
        <button 
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            title="Back to Login"
        >
            <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Recovery</h1>
          <p className="text-slate-500 text-sm">Secure System Setup</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
                onClick={() => { if(!adminExists) setMode('CREATE'); setStatus(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    mode === 'CREATE' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'
                } ${adminExists ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={adminExists}
            >
                {adminExists ? <span className="flex items-center justify-center"><Lock size={12} className="mr-1"/> Setup Locked</span> : "Create First Admin"}
            </button>
            <button 
                onClick={() => { setMode('RESET'); setStatus(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'RESET' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
            >
                Reset Password
            </button>
        </div>

        {adminExists && mode === 'CREATE' && (
            <div className="mb-4 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex items-start border border-amber-200">
                <AlertTriangle size={16} className="mr-2 shrink-0 mt-0.5" />
                <p>System is already initialized. For security, you cannot create new admins here. Use <strong>Reset Password</strong> if you are locked out.</p>
            </div>
        )}

        {status && (
          <div className={`p-4 rounded-lg mb-6 text-sm flex flex-col ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-start">
                {status.type === 'success' ? <CheckCircle size={18} className="mr-2 shrink-0" /> : <AlertTriangle size={18} className="mr-2 shrink-0" />}
                {status.msg}
            </div>
            {status.type === 'success' && (
                <Button onClick={() => navigate('/login')} size="sm" className="mt-3 bg-emerald-700 hover:bg-emerald-800 self-end flex items-center">
                    <LogIn size={14} className="mr-1" /> Go to Login
                </Button>
            )}
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
            <input 
              type="email" 
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="admin@edumaster.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {mode === 'CREATE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="******"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
          )}

          <Button type="submit" className={`w-full py-3 ${mode === 'CREATE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={loading || (mode === 'CREATE' && adminExists)}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (mode === 'CREATE' ? "Initialize System" : "Send Reset Link")}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSetup;
