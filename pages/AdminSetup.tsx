import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Card, Button } from '../components/UI';
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2, Key, ArrowLeft, LogIn, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';

// --- SECURITY CONFIGURATION ---
const MASTER_SECURITY_KEY = "PRO_ADMIN_2025"; 

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  // Toggle between Create and Reset modes
  const [mode, setMode] = useState<'CREATE' | 'RESET'>('CREATE');

  const navigate = useNavigate();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // --- SECURITY CHECK ---
    if (masterKey !== MASTER_SECURITY_KEY) {
        setStatus({
            type: 'error',
            msg: "Access Denied: Invalid Master Security Key!"
        });
        setLoading(false);
        return;
    }

    try {
      if (mode === 'CREATE') {
          // 1. Create Authentication User
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // 2. Prepare Admin Data Object
          const adminData = {
            email: user.email,
            role: UserRole.ADMIN,
            isSuperAdmin: true, // MASTER ADMIN FLAG
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
            msg: `Success! Master Admin created. You can now login.`
          });
      } else {
          // RESET PASSWORD MODE
          await sendPasswordResetEmail(auth, email);
          setStatus({
            type: 'success',
            msg: `Password reset email sent to ${email}. Check your inbox!`
          });
      }
      
      // Clear sensitive fields
      setPassword('');
      setMasterKey('');

    } catch (error: any) {
      console.error("Setup Error:", error);
      let errorMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
          errorMsg = "Account already exists! Try the 'Reset Password' tab instead.";
      }
      setStatus({
        type: 'error',
        msg: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Secure Admin Setup</h1>
          <p className="text-slate-500 text-sm">Protected by Master Key</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
                onClick={() => { setMode('CREATE'); setStatus(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'CREATE' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
            >
                Create New
            </button>
            <button 
                onClick={() => { setMode('RESET'); setStatus(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'RESET' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
            >
                Reset Password
            </button>
        </div>

        {status && (
          <div className={`p-4 rounded-lg mb-6 text-sm flex flex-col ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-start">
                {status.type === 'success' ? <CheckCircle size={18} className="mr-2 shrink-0" /> : <AlertTriangle size={18} className="mr-2 shrink-0" />}
                {status.msg}
            </div>
            {status.type === 'success' && mode === 'CREATE' && (
                <Button onClick={() => navigate('/login')} size="sm" className="mt-3 bg-emerald-700 hover:bg-emerald-800 self-end flex items-center">
                    <LogIn size={14} className="mr-1" /> Go to Login
                </Button>
            )}
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-4">
          
          {/* Security Key Input */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Master Security Key</label>
              <div className="relative">
                  <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-9 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Enter Security Code"
                    value={masterKey}
                    onChange={e => setMasterKey(e.target.value)}
                  />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Required to authorize action.</p>
          </div>

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

          <Button type="submit" className={`w-full py-3 ${mode === 'CREATE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (mode === 'CREATE' ? "Authorize & Create Admin" : "Send Reset Link")}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSetup;