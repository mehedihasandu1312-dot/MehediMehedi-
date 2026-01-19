
import React, { useState, useEffect } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { Youtube, Link as LinkIcon, Crown, Save, PlayCircle } from 'lucide-react';

interface VideoContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; videoUrl: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; videoUrl: string; isPremium: boolean }) => void;
}

const VideoContentForm: React.FC<VideoContentFormProps> = ({ folders, fixedFolderId, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    folderId: fixedFolderId || '',
    body: '', // Used as description
    videoUrl: '',
    isPremium: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        folderId: initialData.folderId,
        body: initialData.body || '',
        videoUrl: initialData.videoUrl || '',
        isPremium: initialData.isPremium || false
      });
    } else {
      setFormData({
        title: '',
        folderId: fixedFolderId || '',
        body: '',
        videoUrl: '',
        isPremium: false
      });
    }
  }, [initialData, fixedFolderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId || !formData.videoUrl) {
      alert("Please fill in Title, Folder, and Video URL.");
      return;
    }
    onSubmit(formData);
    if (!initialData) {
        setFormData({ title: '', folderId: fixedFolderId || '', body: '', videoUrl: '', isPremium: false }); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in flex flex-col h-[70vh]">
      {/* Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Video Title</label>
          <input
            type="text"
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            placeholder="e.g. Physics Chapter 1: Motion (Part 1)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Save In Folder</label>
          {fixedFolderId ? (
              <div className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 truncate">
                  {folders.find(f => f.id === fixedFolderId)?.name || 'Selected Folder'}
              </div>
          ) : (
              <select
                required
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                value={formData.folderId}
                onChange={e => setFormData({ ...formData, folderId: e.target.value })}
              >
                <option value="">Choose a folder...</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6">
          {/* Video URL Input */}
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <LinkIcon size={16} className="mr-2" /> Video Link (YouTube / Vimeo)
              </label>
              <div className="flex items-center">
                  <div className="bg-red-50 p-3 rounded-l-lg border-y border-l border-red-200 text-red-600">
                      <Youtube size={20} />
                  </div>
                  <input
                    type="url"
                    required
                    className="w-full p-3 border border-red-200 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-700"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-1">Paste the full URL. We will automatically embed it.</p>
          </div>

          {/* Description */}
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description / Notes</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none h-32 resize-none"
                placeholder="Add a short description or summary about this video..."
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
              />
          </div>

          {/* Premium Toggle */}
          <div>
            <label className={`w-full flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.isPremium ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${formData.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Crown size={20} fill={formData.isPremium ? "currentColor" : "none"} />
                    </div>
                    <div>
                        <span className={`block font-bold ${formData.isPremium ? 'text-amber-800' : 'text-slate-600'}`}>
                            Premium Video
                        </span>
                        <span className="text-xs text-slate-500">Only accessible to paid subscribers</span>
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    className="w-6 h-6 text-amber-600 rounded focus:ring-amber-500"
                    checked={formData.isPremium}
                    onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                />
            </label>
          </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
          <Button type="submit" className="w-full flex items-center justify-center py-3 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200">
              <PlayCircle size={20} className="mr-2" /> {initialData ? 'Update Video' : 'Publish Video'}
          </Button>
      </div>
    </form>
  );
};

export default VideoContentForm;
