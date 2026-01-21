
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { Youtube, Link as LinkIcon, Crown, Save, PlayCircle, Upload, FileVideo, CheckCircle2, X, Loader2 } from 'lucide-react';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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

  const [uploadMethod, setUploadMethod] = useState<'LINK' | 'FILE'>('LINK');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        folderId: initialData.folderId,
        body: initialData.body || '',
        videoUrl: initialData.videoUrl || '',
        isPremium: initialData.isPremium || false
      });
      // Auto-detect method based on URL
      if (initialData.videoUrl && initialData.videoUrl.includes('firebasestorage')) {
          setUploadMethod('FILE');
      }
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Size limit check (e.g., 100MB)
      if (file.size > 100 * 1024 * 1024) {
          alert("File is too large! Please upload videos smaller than 100MB.");
          return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const storageRef = ref(storage, `course_videos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
          (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
          }, 
          (error) => {
              console.error("Upload error:", error);
              alert("Upload failed. Please try again.");
              setIsUploading(false);
          }, 
          async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
              setIsUploading(false);
          }
      );
  };

  const removeUploadedVideo = () => {
      setFormData(prev => ({ ...prev, videoUrl: '' }));
      setUploadProgress(0);
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId || !formData.videoUrl) {
      alert("Please fill in Title, Folder, and provide a Video.");
      return;
    }
    onSubmit(formData);
    if (!initialData) {
        setFormData({ title: '', folderId: fixedFolderId || '', body: '', videoUrl: '', isPremium: false }); 
        setUploadMethod('LINK');
        setUploadProgress(0);
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
          {/* Source Selection */}
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Video Source</label>
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-4">
                  <button 
                    type="button"
                    onClick={() => setUploadMethod('LINK')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${uploadMethod === 'LINK' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
                  >
                      <LinkIcon size={14} className="mr-2"/> External Link
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUploadMethod('FILE')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${uploadMethod === 'FILE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                  >
                      <Upload size={14} className="mr-2"/> Upload File
                  </button>
              </div>

              {uploadMethod === 'LINK' ? (
                  <div>
                      <div className="flex items-center">
                          <div className="bg-red-50 p-3 rounded-l-lg border-y border-l border-red-200 text-red-600">
                              <Youtube size={20} />
                          </div>
                          <input
                            type="url"
                            className="w-full p-3 border border-red-200 rounded-r-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-700"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.videoUrl}
                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                          />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 ml-1">Paste URL from YouTube, Vimeo, Facebook, or Google Drive.</p>
                  </div>
              ) : (
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-6 text-center relative">
                      <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="video/*" 
                          className="hidden"
                          onChange={handleVideoUpload}
                      />
                      
                      {isUploading ? (
                          <div className="space-y-3">
                              <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
                              <p className="text-indigo-800 font-bold">Uploading Video... {Math.round(uploadProgress)}%</p>
                              <div className="w-full bg-indigo-200 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                                  <div className="bg-indigo-600 h-2 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                          </div>
                      ) : formData.videoUrl && uploadMethod === 'FILE' ? (
                          <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                  <CheckCircle2 size={24} />
                              </div>
                              <p className="text-emerald-800 font-bold mb-1">Video Uploaded Successfully</p>
                              <p className="text-xs text-slate-500 mb-4 break-all max-w-md">{formData.videoUrl}</p>
                              <Button type="button" size="sm" variant="danger" onClick={removeUploadedVideo} className="flex items-center">
                                  <X size={14} className="mr-1" /> Remove / Change
                              </Button>
                          </div>
                      ) : (
                          <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-sm">
                                  <FileVideo size={24} />
                              </div>
                              <p className="text-indigo-900 font-bold">Click to upload video</p>
                              <p className="text-xs text-indigo-600/70 mt-1">MP4, WebM, Ogg (Max 100MB)</p>
                          </div>
                      )}
                  </div>
              )}
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
          <Button type="submit" disabled={isUploading} className="w-full flex items-center justify-center py-3 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200">
              {isUploading ? <Loader2 size={20} className="animate-spin mr-2"/> : <PlayCircle size={20} className="mr-2" />} 
              {initialData ? 'Update Video' : 'Publish Video'}
          </Button>
      </div>
    </form>
  );
};

export default VideoContentForm;
