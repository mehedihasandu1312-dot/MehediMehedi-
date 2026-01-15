import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/UI';
import { User } from '../../types';
import { authService } from '../../services/authService';
import { User as UserIcon, Mail, School, BookOpen, Camera, Save, Loader2 } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    institute: '',
    avatar: ''
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setFormData({
            name: currentUser.name,
            class: currentUser.class || '',
            institute: currentUser.institute || '',
            avatar: currentUser.avatar || ''
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
            name: formData.name,
            class: formData.class,
            institute: formData.institute,
            avatar: formData.avatar
        });
        setUser(updatedUser);
        // Simulate a small delay for better UX
        setTimeout(() => {
            alert("Profile updated successfully!");
            setSaving(false);
        }, 500);
    } catch (error) {
        alert("Failed to update profile.");
        setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!user) return <div className="text-center text-slate-500 py-10">User not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
       {/* Header */}
       <h1 className="text-2xl font-bold text-slate-800 flex items-center">
         <UserIcon className="mr-3 text-indigo-600" size={28} />
         Profile Settings
       </h1>

       <form onSubmit={handleSubmit}>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar */}
            <div className="md:col-span-1">
                <Card className="text-center h-full">
                    <div className="relative inline-block mb-4 group">
                        <img 
                            src={formData.avatar || "https://picsum.photos/200/200"} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-slate-100 object-cover shadow-sm transition-transform group-hover:scale-105"
                        />
                        <button 
                            type="button"
                            className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md"
                            title="Change Photo"
                            onClick={() => {
                                const newUrl = prompt("Enter new avatar URL:", formData.avatar);
                                if(newUrl) setFormData({...formData, avatar: newUrl});
                            }}
                        >
                            <Camera size={16} />
                        </button>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                    <p className="text-slate-500 text-sm mb-4 bg-indigo-50 inline-block px-3 py-1 rounded-full text-indigo-700 font-medium">{user.role}</p>
                    <div className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                        EduMaster Member
                    </div>
                </Card>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2">
                <Card className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Personal Information</h3>
                    
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
                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Class/Year</label>
                            <div className="relative">
                                <BookOpen size={18} className="absolute left-3 top-3 text-slate-400" />
                                <select 
                                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white transition-shadow"
                                    value={formData.class}
                                    onChange={e => setFormData({...formData, class: e.target.value})}
                                >
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
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

                    <div className="pt-6 flex justify-end">
                        <Button type="submit" className="flex items-center min-w-[140px] justify-center" disabled={saving}>
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
    </div>
  );
};

export default ProfileSettings;