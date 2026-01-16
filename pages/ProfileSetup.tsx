import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Card, Button } from '../components/UI';
import { User, School, MapPin, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { ALL_DISTRICTS } from '../constants';

interface Props {
    educationLevels?: { REGULAR: string[], ADMISSION: string[] };
}

const ProfileSetup: React.FC<Props> = ({ educationLevels }) => {
  const navigate = useNavigate();
  const [studentType, setStudentType] = useState<'REGULAR' | 'ADMISSION'>('REGULAR');
  const [formData, setFormData] = useState({
    class: '',
    institute: '',
    phone: '',
    district: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.updateProfile({
        ...formData,
        studentType: studentType
    });
    navigate('/student/dashboard');
  };

  const levels = educationLevels || { REGULAR: [], ADMISSION: [] };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                <User size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Complete Your Profile</h2>
            <p className="text-slate-500 text-sm">Help us personalize your learning experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Student Type Selection */}
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setStudentType('REGULAR'); setFormData({...formData, class: ''}); }}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center ${
                        studentType === 'REGULAR' 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                      <School size={20} className="mb-1" />
                      Regular / Job Prep
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStudentType('ADMISSION'); setFormData({...formData, class: ''}); }}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center ${
                        studentType === 'ADMISSION' 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                      <GraduationCap size={20} className="mb-1" />
                      Admission Candidate
                  </button>
              </div>
          </div>

          {/* Class / Category Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {studentType === 'REGULAR' ? 'Select Class / Job Sector' : 'Select Admission Category'}
            </label>
            <div className="relative">
                <BookOpen size={18} className="absolute left-3 top-3 text-slate-400" />
                <select 
                required
                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={formData.class}
                onChange={(e) => setFormData({...formData, class: e.target.value})}
                >
                <option value="">Select Option</option>
                {studentType === 'REGULAR' 
                    ? levels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)
                    : levels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)
                }
                </select>
            </div>
          </div>

          {/* Institute */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Institute Name</label>
            <div className="relative">
                <School size={18} className="absolute left-3 top-3 text-slate-400" />
                <input 
                required
                type="text"
                placeholder="e.g. Dhaka College"
                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.institute}
                onChange={(e) => setFormData({...formData, institute: e.target.value})}
                />
            </div>
          </div>

          {/* Phone & District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                        required
                        type="tel"
                        placeholder="017..."
                        className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                    <select 
                        required
                        className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                    >
                        <option value="">Select District</option>
                        {ALL_DISTRICTS.sort().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
              </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full py-3">Save & Start Learning</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSetup;