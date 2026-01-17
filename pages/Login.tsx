import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, User } from '../types';
import { authService } from '../services/authService';
import { ShieldCheck, Loader2, AlertTriangle, Copy, Lock, Mail } from 'lucide-react';

interface LoginProps {
  setUser: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{title: string, detail: string, domain?: string} | null>(null);
  
  // State for Admin Login Credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);

  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!adminEmail || !adminPassword) {
        setErrorMsg({ title: "Input Error", detail: "Please enter both email and password." });
        return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await authService.loginAdmin(adminEmail, adminPassword);
      if (user) {
        setUser(user);
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      setErrorMsg({ title: "Admin Access Denied", detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await authService.loginWithGoogle(UserRole.STUDENT);
      if (user) {
        setUser(user);
        if (user.role === UserRole.ADMIN) {
            navigate('/admin/dashboard');
        } else {
            if (!user.profileCompleted) {
                navigate('/complete-profile');
            } else {
                navigate('/student/dashboard');
            }
        }
      }
    } catch (error: any) {
      console.error("Full Login Error:", error);
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
          const currentDomain = window.location.hostname;
          setErrorMsg({
              title: "Firebase Configuration Issue",
              detail: "This domain is not authorized in Firebase Console.",
              domain: currentDomain
          });
      } else {
          setErrorMsg({ title: "Login Failed", detail: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50 transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-300 relative z-10 border border-white/50 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-brand-200 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-white font-extrabold text-4xl">E</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edu<span className="text-brand-600">Master</span> Pro</h1>
          <p className="text-slate-500 mt-2 font-medium">Your Gateway to Knowledge</p>
        </div>

        {errorMsg && (
            <div className={`mb-6 p-4 rounded-xl text-sm border ${errorMsg.domain ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <strong className="block mb-1 font-bold">{errorMsg.title}</strong>
                        <p>{errorMsg.detail}</p>
                        {errorMsg.domain && (
                            <div className="mt-3 bg-white p-2 rounded border border-amber-200">
                                <p className="text-xs text-slate-500 mb-1">Add to Firebase:</p>
                                <div className="flex items-center justify-between font-mono bg-slate-100 p-1 rounded text-slate-700 font-bold select-all">
                                    {errorMsg.domain}
                                    <button onClick={() => navigator.clipboard.writeText(errorMsg.domain!)} className="ml-2 text-brand-600 hover:text-brand-800"><Copy size={14} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-4">
          {!showAdminForm && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-600 hover:bg-brand-50 transition-all group relative overflow-hidden bg-white"
              >
                <div className="bg-white p-2 rounded-full shadow-sm mr-4 z-10">
                   <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                   </svg>
                </div>
                <div className="text-left z-10">
                  <h3 className="font-bold text-slate-800 group-hover:text-brand-700 text-lg">Student Login</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">With Google</p>
                </div>
              </button>
          )}

          {!showAdminForm && (
              <div className="relative flex py-4 items-center">
                 <div className="flex-grow border-t border-slate-200"></div>
                 <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Admin Access</span>
                 <div className="flex-grow border-t border-slate-200"></div>
              </div>
          )}

          {showAdminForm ? (
              <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
                  <div className="text-left mb-4 bg-brand-50 p-4 rounded-xl border border-brand-100">
                      <h3 className="text-lg font-bold text-brand-800 flex items-center">
                          <ShieldCheck className="mr-2 text-brand-600" size={20} /> Admin Portal
                      </h3>
                      <p className="text-xs text-brand-600 mt-1">Authorized personnel only.</p>
                  </div>

                  <div className="space-y-4">
                      <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                          <input type="email" required placeholder="Admin Email" className="w-full pl-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:outline-none transition-all font-medium" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                      </div>
                      <div className="relative">
                          <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                          <input type="password" required placeholder="Password" className="w-full pl-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 focus:outline-none transition-all font-medium" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                      </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setShowAdminForm(false); setErrorMsg(null); }} className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 font-bold shadow-lg shadow-brand-200 flex justify-center items-center transition-all hover:scale-[1.02] active:scale-95">
                          {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
                      </button>
                  </div>
              </form>
          ) : (
              <button
                onClick={() => setShowAdminForm(true)}
                className="w-full flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50 transition-all group text-slate-400 hover:text-brand-600"
              >
                <ShieldCheck size={18} className="mr-2" />
                <span className="font-bold text-sm">Login as Admin</span>
              </button>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          Protected by Google Firebase Security
        </div>
      </div>
    </div>
  );
};

export default Login;