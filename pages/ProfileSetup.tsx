import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Card, Button } from '../components/UI';

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    class: '',
    institute: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.updateProfile(formData);
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
        <p className="text-slate-500 mb-6">We need a few details before you can start learning.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class/Year</label>
            <select 
              required
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.class}
              onChange={(e) => setFormData({...formData, class: e.target.value})}
            >
              <option value="">Select Class</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Institute Name</label>
            <input 
              required
              type="text"
              placeholder="e.g. Dhaka College"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.institute}
              onChange={(e) => setFormData({...formData, institute: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">Save & Continue</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSetup;