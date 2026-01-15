import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, User } from '../types';
import { authService } from '../services/authService';
import { ShieldCheck, Loader2, AlertTriangle, Copy } from 'lucide-react';

interface LoginProps {
  setUser: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{title: string, detail: string, domain?: string} | null>(null);
  const navigate = useNavigate();

  // Mock Admin Login
  const handleAdminLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await authService.login('admin@edumaster.com', UserRole.ADMIN);
      if (user) {
        setUser(user);
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      setErrorMsg({ title: "Login Failed", detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Google Student Login
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
      
      // Handle Specific Firebase Domain Error
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
          const currentDomain = window.location.hostname;
          setErrorMsg({
              title: "Firebase Setup Required",
              detail: "This preview domain is not authorized yet.",
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-3xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to EduMaster Pro</p>
        </div>

        {/* Error Display Area */}
        {errorMsg && (
            <div className={`mb-6 p-4 rounded-lg text-sm border ${errorMsg.domain ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <strong className="block mb-1">{errorMsg.title}</strong>
                        <p>{errorMsg.detail}</p>
                        
                        {errorMsg.domain && (
                            <div className="mt-3 bg-white p-2 rounded border border-amber-200">
                                <p className="text-xs text-slate-500 mb-1">Add this domain to Firebase Console:</p>
                                <div className="flex items-center justify-between font-mono bg-slate-100 p-1 rounded text-slate-700 font-bold select-all">
                                    {errorMsg.domain}
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(errorMsg.domain!)}
                                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                                        title="Copy Domain"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Go to: Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-4">
          {/* Student Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-50 transition-opacity"></div>
            <div className="bg-white p-2 rounded-full shadow-sm mr-4 z-10">
               {/* Google Icon SVG */}
               <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
            </div>
            <div className="text-left z-10">
              <h3 className="font-bold text-slate-800 group-hover:text-indigo-700">Student Login</h3>
              <p className="text-sm text-slate-500">Sign in with Gmail</p>
            </div>
          </button>

          <div className="relative flex py-2 items-center">
             <div className="flex-grow border-t border-slate-200"></div>
             <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Admin Access</span>
             <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Admin Login */}
          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full flex items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
          >
            <div className="bg-white p-2 rounded-full shadow-sm mr-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-emerald-600" size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 group-hover:text-emerald-700">Admin Login</h3>
              <p className="text-sm text-slate-500">System Management</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="mt-6 flex justify-center text-indigo-600">
            <Loader2 className="animate-spin" />
          </div>
        )}
        
        <div className="mt-8 text-center text-xs text-slate-400">
          Secure Authentication powered by Google Firebase
        </div>
      </div>
    </div>
  );
};

export default Login;