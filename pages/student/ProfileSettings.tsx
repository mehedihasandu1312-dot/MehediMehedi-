import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/UI';
import { User } from '../../types';
import { authService } from '../../services/authService';
import { User as UserIcon, Mail, School, BookOpen, Camera, Save, Loader2, Phone, MapPin, GraduationCap } from 'lucide-react';

const CLASSES_REGULAR = [
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
    "Class 11", "Class 12", 
    "Honours 1st Year", "Honours 2nd Year", "Honours 3rd Year", "Honours 4th Year", 
    "Masters"
];

const CLASSES_ADMISSION = [
    "University Admission (A Unit)", 
    "University Admission (B Unit)", 
    "University Admission (C Unit)", 
    "Medical Admission", 
    "Engineering Admission"
];

const DISTRICTS = [
    "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", 
    "Sylhet", "Rangpur", "Mymensingh", "Comilla", "Narayanganj"
];

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentType, setStudentType] = useState<'REGULAR' | 'ADMISSION'>('REGULAR');
  
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    institute: '',
    avatar: '',
    phone: '',
    district: ''
  });

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
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
                    <p className="text-slate-500 text-sm mb-2">{user.role}</p>
                    <div className="flex justify-center gap-2 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                            {studentType === 'REGULAR' ? 'Regular Student' : 'Admission Candidate'}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                        EduMaster Member since {new Date(user.joinedDate).getFullYear()}
                    </div>
                </Card>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-2">
                <Card className="space-y-6">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Academic Information</h3>
                    
                    {/* Student Type Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => { setStudentType('REGULAR'); setFormData({...formData, class: ''}); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${studentType === 'REGULAR' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                        >
                            Regular
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
                                {studentType === 'REGULAR' ? 'Current Class' : 'Admission Category'}
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
                                        ? CLASSES_REGULAR.map(c => <option key={c} value={c}>{c}</option>)
                                        : CLASSES_ADMISSION.map(c => <option key={c} value={c}>{c}</option>)
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

                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 pt-2">Personal Information</h3>

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
                                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
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