
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { User, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { storage } from '../../services/firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { User as UserIcon, Mail, School, BookOpen, Camera, Save, Loader2, Phone, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { ALL_DISTRICTS } from '../../constants';

interface Props {
    educationLevels?: { REGULAR: string[], ADMISSION: string[] };
    adminLogs?: any[]; 
}

const ProfileSettings: React.FC<Props> = ({ educationLevels }) => {
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
          
          // Fallback to Base64 for demo/dev if storage fails
          if (file.size < 500 * 1024) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  if (event.target?.result) {
                      setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
                  }
              };
              reader.readAsDataURL(file);
          } else {
              alert(`Upload failed: ${error.message}`);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
       
       <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mt-4">
            <UserIcon className="text-slate-400" size={24} />
            <h2 className="text-xl font-bold text-slate-700">Profile Settings</h2>
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
                    <Badge color="bg-slate-100 text-slate-600 mt-1">{user.role}</Badge>
                    
                    <div className="mt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Change Photo'}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2">
                <Card className="space-y-6">
                    
                    {!isAdmin && (
                        <>
                            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Academic Info</h3>
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
                                        {studentType === 'REGULAR' ? 'Class / Sector' : 'Category'}
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

                    <h3 className={`font-bold text-slate-800 border-b border-slate-100 pb-2 ${!isAdmin ? 'pt-2' : ''}`}>Personal Info</h3>

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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
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
