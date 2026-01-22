
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { User, UserRole, AdminActivityLog } from '../../types';
import { authService } from '../../services/authService';
import { storage } from '../../services/firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { User as UserIcon, Mail, School, BookOpen, Camera, Save, Loader2, Phone, MapPin, CheckCircle, AlertTriangle, Upload, Activity, Clock, Calendar, Zap, BarChart2 } from 'lucide-react';
import { ALL_DISTRICTS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
    educationLevels?: { REGULAR: string[], ADMISSION: string[] };
    adminLogs?: AdminActivityLog[]; // Optional prop for admins
}

const ProfileSettings: React.FC<Props> = ({ educationLevels, adminLogs = [] }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [studentType, setStudentType] = useState<'REGULAR' | 'ADMISSION'>('REGULAR');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    institute: '',
    avatar: '',
    phone: '',
    district: ''
  });

  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setStudentType(currentUser.studentType || 'REGULAR');
        setFormData({
            name: currentUser.name,
            class: currentUser.class || '',
            institute: currentUser.institute || '',
            avatar: currentUser.avatar || '',
            phone: currentUser.phone || '',
            district: currentUser.district || ''
        });
    }
    setLoading(false);
  }, []);

  // --- ADMIN PERFORMANCE CALCULATIONS ---
  const adminStats = useMemo(() => {
      if (!user || user.role !== UserRole.ADMIN) return null;

      const myLogs = adminLogs.filter(log => log.adminId === user.id);
      
      // Time calculations
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const last24h = myLogs.filter(log => new Date(log.timestamp) > oneDayAgo).length;
      const thisMonth = myLogs.filter(log => new Date(log.timestamp) > startOfMonth).length;
      const total = myLogs.length;

      // Estimated Time (Rough approximation: 5 mins per action)
      const activeMinutes = total * 5; 
      const activeHours = Math.floor(activeMinutes / 60);
      const activeMinsRemainder = activeMinutes % 60;

      // Chart Data (Daily for current month)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const chartData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const count = myLogs.filter(log => {
              const d = new Date(log.timestamp);
              return d.getMonth() === now.getMonth() && d.getDate() === day;
          }).length;
          return { day, count };
      });

      return { last24h, thisMonth, total, activeTime: `${activeHours}h ${activeMinsRemainder}m`, chartData, recentLogs: myLogs.slice(0, 5) };
  }, [user, adminLogs]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
        const updatedUser = await authService.updateProfile({
            ...user,
            ...formData,
            studentType: studentType
        });
        setUser(updatedUser);
        setMessageModal({
            isOpen: true,
            title: 'Success',
            message: 'Profile updated successfully!',
            type: 'SUCCESS'
        });
    } catch (error) {
        setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to update profile. Please try again.',
            type: 'ERROR'
        });
    } finally {
        setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }

      if (file.size > 2 * 1024 * 1024) {
          alert("File size must be less than 2MB");
          return;
      }

      setUploading(true);

      try {
          const storageRef = ref(storage, `profile_avatars/${user.id}_${Date.now()}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          
          setFormData(prev => ({ ...prev, avatar: downloadURL }));
      } catch (error: any) {
          console.error("Storage upload failed:", error);
          
          if (file.size < 500 * 1024) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  if (event.target?.result) {
                      setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
                  }
              };
              reader.readAsDataURL(file);
          } else {
              alert(`Upload failed: ${error.message}. Please check your connection or try a smaller image.`);
          }
      } finally {
          setUploading(false);
      }
  };

  const levels = educationLevels || { REGULAR: [], ADMISSION: [] };
  const isAdmin = user?.role === UserRole.ADMIN;

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!user) return <div className="text-center text-slate-500 py-10">User not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
       
       {/* ADMIN PERFORMANCE DASHBOARD (Only for Admins) */}
       {isAdmin && adminStats && (
           <div className="bg-gradient-to-r from-brand-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
               {/* Background Pattern */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
               
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                       <div>
                           <h2 className="text-2xl font-bold">Admin Performance Profile</h2>
                           <div className="flex items-center mt-2 space-x-4 text-sm opacity-90">
                               <div className="flex items-center"><Mail size={14} className="mr-2"/> {user.email}</div>
                               <div className="flex items-center"><Clock size={14} className="mr-2"/> Member since: {new Date(user.joinedDate).toLocaleDateString()}</div>
                           </div>
                       </div>
                       <Badge color="bg-white text-brand-700 font-bold px-3 py-1">ACTIVE</Badge>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                               <Zap size={12} className="mr-1" /> Last 24 Hours
                           </div>
                           <div className="text-2xl font-bold">{adminStats.last24h} <span className="text-sm font-normal opacity-70">actions</span></div>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                               <Calendar size={12} className="mr-1" /> This Month
                           </div>
                           <div className="text-2xl font-bold">{adminStats.thisMonth} <span className="text-sm font-normal opacity-70">actions</span></div>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                               <Activity size={12} className="mr-1" /> Lifetime Total
                           </div>
                           <div className="text-2xl font-bold">{adminStats.total}</div>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                               <Clock size={12} className="mr-1" /> Est. Active Time
                           </div>
                           <div className="text-2xl font-bold">{adminStats.activeTime}</div>
                       </div>
                   </div>

                   {/* Activity Chart */}
                   <div className="bg-white rounded-2xl p-4 text-slate-800">
                       <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center">
                           <BarChart2 size={16} className="mr-2 text-indigo-500" /> Monthly Work Intensity (Daily)
                       </h3>
                       <div className="h-40 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={adminStats.chartData}>
                                   <XAxis dataKey="day" hide />
                                   <Tooltip 
                                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                       cursor={{fill: '#f1f5f9'}}
                                   />
                                   <Bar dataKey="count" fill="#E2136E" radius={[2, 2, 0, 0]} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                       <div className="text-center text-xs text-slate-400 mt-2 font-medium">Days of Current Month</div>
                   </div>
               </div>
           </div>
       )}

       {/* SETTINGS FORM */}
       <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mt-8">
            <UserIcon className="text-slate-400" size={24} />
            <h2 className="text-xl font-bold text-slate-700">Account Settings</h2>
       </div>

       <form onSubmit={handleSubmit}>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar */}
            <div className="md:col-span-1">
                <Card className="text-center h-full flex flex-col items-center justify-center">
                    <div className="relative inline-block mb-4 group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden shadow-sm relative">
                            <img 
                                src={formData.avatar || "https://picsum.photos/200/200"} 
                                alt="Profile" 
                                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${uploading ? 'opacity-50' : ''}`}
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                                    <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                            )}
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        
                        <div 
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md border-2 border-white z-20"
                            title="Change Photo"
                        >
                            <Camera size={16} />
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                    <p className="text-slate-500 text-sm mb-2">{user.role}</p>
                    
                    {!isAdmin && (
                        <div className="flex justify-center gap-2 mb-4">
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                                {studentType === 'REGULAR' ? 'Regular/Job Prep' : 'Admission Candidate'}
                            </span>
                        </div>
                    )}
                    
                    <div className="mt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload New Photo'}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2">
                <Card className="space-y-6">
                    
                    {!isAdmin && (
                        <>
                            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Academic Information</h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => { setStudentType('REGULAR'); setFormData({...formData, class: ''}); }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${studentType === 'REGULAR' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                                >
                                    Regular / Job Prep
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStudentType('ADMISSION'); setFormData({...formData, class: ''}); }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${studentType === 'ADMISSION' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                                >
                                    Admission
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {studentType === 'REGULAR' ? 'Current Class / Sector' : 'Admission Category'}
                                    </label>
                                    <div className="relative">
                                        <BookOpen size={18} className="absolute left-3 top-3 text-slate-400" />
                                        <select 
                                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-shadow"
                                            value={formData.class}
                                            onChange={e => setFormData({...formData, class: e.target.value})}
                                        >
                                            <option value="">Select Option</option>
                                            {studentType === 'REGULAR' 
                                                ? levels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)
                                                : levels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Institute</label>
                                    <div className="relative">
                                        <School size={18} className="absolute left-3 top-3 text-slate-400" />
                                        <input 
                                            type="text"
                                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                            value={formData.institute}
                                            onChange={e => setFormData({...formData, institute: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <h3 className={`font-bold text-slate-800 border-b border-slate-100 pb-2 ${!isAdmin ? 'pt-2' : ''}`}>Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="text"
                                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="email"
                                    disabled
                                    className="w-full pl-10 p-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                                    value={user.email}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="tel"
                                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                                <select 
                                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-shadow"
                                    value={formData.district}
                                    onChange={e => setFormData({...formData, district: e.target.value})}
                                >
                                    <option value="">Select District</option>
                                    {ALL_DISTRICTS.sort().map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button type="submit" className="flex items-center min-w-[140px] justify-center" disabled={saving || uploading}>
                            {saving ? (
                                <Loader2 size={18} className="animate-spin mr-2" />
                            ) : (
                                <Save size={18} className="mr-2" />
                            )}
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </Card>
            </div>
         </div>
       </form>

       {/* Full Activity History List (Visible only to Admin) */}
       {isAdmin && adminStats && (
           <div className="mt-8">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                   <span>Full Activity History</span>
                   <Badge color="bg-slate-100 text-slate-500">{adminStats.total} records</Badge>
               </h3>
               <Card className="min-h-[200px]">
                   {adminStats.recentLogs.length === 0 ? (
                       <div className="text-center py-12 text-slate-400">No activity recorded yet.</div>
                   ) : (
                       <div className="divide-y divide-slate-100">
                           {adminLogs.filter(log => log.adminId === user.id).map(log => (
                               <div key={log.id} className="py-3 flex items-center justify-between">
                                   <div>
                                       <p className="font-bold text-sm text-slate-800">{log.action}</p>
                                       <p className="text-xs text-slate-500">{log.details}</p>
                                   </div>
                                   <div className="text-right">
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                           log.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                           log.type === 'DANGER' ? 'bg-red-50 text-red-600' :
                                           log.type === 'WARNING' ? 'bg-amber-50 text-amber-600' :
                                           'bg-blue-50 text-blue-600'
                                       }`}>
                                           {log.type}
                                       </span>
                                       <p className="text-[10px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </Card>
           </div>
       )}

       {/* Success/Error Message Modal */}
       <Modal isOpen={messageModal.isOpen} onClose={() => setMessageModal({ ...messageModal, isOpen: false })} title={messageModal.title}>
           <div className="space-y-4">
               <div className={`p-4 rounded-lg border flex items-start ${messageModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                   {messageModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
                   <p>{messageModal.message}</p>
               </div>
               <div className="flex justify-end pt-2">
                   <Button onClick={() => setMessageModal({ ...messageModal, isOpen: false })}>OK</Button>
               </div>
           </div>
       </Modal>

    </div>
  );
};

export default ProfileSettings;
