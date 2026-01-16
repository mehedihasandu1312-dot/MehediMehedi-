import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Card, Button } from '../components/UI';
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { UserRole } from '../types';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Prepare Admin Data Object (Automatically adds all required fields)
      const adminData = {
        email: user.email,
        role: UserRole.ADMIN, // Crucial: Sets role to ADMIN
        name: 'Super Admin',
        status: 'ACTIVE',
        profileCompleted: true,
        joinedDate: new Date().toISOString(),
        points: 0,
        rank: 0,
        avatar: `https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff`
      };

      // 3. Write to Firestore using the Auth UID as the Document ID
      await setDoc(doc(db, "users", user.uid), adminData);

      setStatus({
        type: 'success',
        msg: `Success! Admin created with UID: ${user.uid}. You can now go to /login.`
      });
      
      // Clear form
      setEmail('');
      setPassword('');

    } catch (error: any) {
      console.error("Setup Error:", error);
      setStatus({
        type: 'error',
        msg: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-t-4 border-t-emerald-600">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Generator</h1>
          <p className="text-slate-500 text-sm">Create a master admin account automatically.</p>
        </div>

        {status && (
          <div className={`p-4 rounded-lg mb-6 text-sm flex items-start ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {status.type === 'success' ? <CheckCircle size={18} className="mr-2 shrink-0" /> : <AlertTriangle size={18} className="mr-2 shrink-0" />}
            {status.msg}
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
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

          <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 border border-amber-200">
            <strong>Warning:</strong> This page is for initial setup only. Please remove the route from <code>App.tsx</code> after creating your admin account for security.
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-3" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Create Admin Account"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSetup;