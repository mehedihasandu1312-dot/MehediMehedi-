import React, { useState, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Notice } from '../../types';
import { Plus, Trash2, Calendar, Image as ImageIcon, X, Upload, AlertTriangle } from 'lucide-react';

interface Props {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
}

const NoticeManagement: React.FC<Props> = ({ notices, setNotices }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    priority: 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW'
  });
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotice: Notice = {
      id: `notice_${Date.now()}`,
      title: formData.title,
      content: formData.content,
      image: formData.image || undefined,
      priority: formData.priority,
      date: new Date().toISOString()
    };
    setNotices([newNotice, ...notices]);
    setFormData({ title: '', content: '', image: '', priority: 'LOW' });
    alert("Notice posted successfully!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setFormData(prev => ({ ...prev, image: event.target?.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const initiateDelete = (id: string) => {
      setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          setNotices(notices.filter(n => n.id !== deleteModal.id));
          setDeleteModal({ isOpen: false, id: null });
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

              {/* Image Upload Section */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      accept="image/*"
                  />
                  <div className="flex flex-col gap-2">
                      <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center w-full"
                      >
                          <Upload size={16} className="mr-2" /> Upload Image
                      </Button>
                      
                      {formData.image && (
                          <div className="relative group rounded-lg overflow-hidden border border-slate-200">
                              <img src={formData.image} alt="Preview" className="w-full h-32 object-cover" />
                              <button 
                                  type="button" 
                                  onClick={() => setFormData(prev => ({...prev, image: ''}))}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                              >
                                  <X size={14} />
                              </button>
                          </div>
                      )}
                  </div>
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
                    <button onClick={() => initiateDelete(notice.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
               </div>
               <p className="text-xs text-slate-400 mb-3 flex items-center">
                 <Calendar size={12} className="mr-1" /> {new Date(notice.date).toLocaleDateString()}
               </p>
               <p className="text-slate-600 text-sm mb-2">{notice.content}</p>
               
               {/* Image Preview in Admin List */}
               {notice.image && (
                   <div className="mt-2 relative inline-block">
                       <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center">
                           <ImageIcon size={12} className="mr-1" /> Attached Image
                       </div>
                       <img src={notice.image} alt="Notice Attachment" className="h-20 w-auto rounded border border-slate-200" />
                   </div>
               )}
            </Card>
          ))}
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Permanently delete this notice?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, id: null })}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default NoticeManagement;