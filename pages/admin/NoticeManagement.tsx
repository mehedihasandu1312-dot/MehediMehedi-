import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { Notice } from '../../types';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface Props {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
}

const NoticeManagement: React.FC<Props> = ({ notices, setNotices }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotice: Notice = {
      id: `notice_${Date.now()}`,
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      date: new Date().toISOString()
    };
    setNotices([newNotice, ...notices]);
    setFormData({ title: '', content: '', priority: 'LOW' });
    alert("Notice posted successfully!");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this notice?")) {
      setNotices(notices.filter(n => n.id !== id));
    }
  };

  const getPriorityColor = (p: string) => {
      if(p === 'HIGH') return 'bg-red-100 text-red-700';
      if(p === 'MEDIUM') return 'bg-amber-100 text-amber-700';
      return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Notice Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-indigo-600" /> Post New Notice
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Notice Headline" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                  <option value="LOW">Low - General Info</option>
                  <option value="MEDIUM">Medium - Important</option>
                  <option value="HIGH">High - Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={4}
                  value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Details..." />
              </div>
              <Button type="submit" className="w-full">Post Notice</Button>
            </form>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {notices.length === 0 && <Card className="text-center py-10 text-slate-400">No notices active.</Card>}
          {notices.map(notice => (
            <Card key={notice.id} className={`flex flex-col border-l-4 ${notice.priority === 'HIGH' ? 'border-l-red-500' : 'border-l-slate-200'}`}>
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{notice.title}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge color={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                    <button onClick={() => handleDelete(notice.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
               </div>
               <p className="text-xs text-slate-400 mb-3 flex items-center">
                 <Calendar size={12} className="mr-1" /> {new Date(notice.date).toLocaleDateString()}
               </p>
               <p className="text-slate-600 text-sm">{notice.content}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoticeManagement;