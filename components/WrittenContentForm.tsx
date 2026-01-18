import React, { useState, useEffect } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { 
  Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, 
  Link as LinkIcon, Image as ImageIcon, Type, Save, FileText, ChevronDown, Crown
} from 'lucide-react';

interface WrittenContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; isPremium: boolean }) => void;
}

const WrittenContentForm: React.FC<WrittenContentFormProps> = ({ folders, fixedFolderId, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    folderId: fixedFolderId || '',
    body: '',
    isPremium: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        folderId: initialData.folderId,
        body: initialData.body || '',
        isPremium: initialData.isPremium || false
      });
    } else {
      setFormData({
        title: '',
        folderId: fixedFolderId || '',
        body: '',
        isPremium: false
      });
    }
  }, [initialData, fixedFolderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId || !formData.body) {
      alert("Please fill in all fields");
      return;
    }
    onSubmit(formData);
    // Only reset if not editing, or handle reset in parent
    if (!initialData) {
        setFormData({ title: '', folderId: fixedFolderId || '', body: '', isPremium: false }); 
    }
  };

  const ToolbarButton = ({ icon: Icon, active = false }: { icon: any, active?: boolean }) => (
    <button type="button" className={`p-1.5 rounded transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
      <Icon size={16} />
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in flex flex-col h-[70vh]">
      {/* 1. Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Document Title</label>
          <input
            type="text"
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. Chapter 4 Summary"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Save In Folder</label>
          {fixedFolderId ? (
              <div className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 truncate">
                  {folders.find(f => f.id === fixedFolderId)?.name || 'Selected Folder'}
              </div>
          ) : (
              <select
                required
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

        {/* Premium Toggle */}
        <div className="md:col-span-1 flex items-end">
            <label className={`w-full flex items-center justify-between p-2 rounded-lg border-2 cursor-pointer transition-all ${formData.isPremium ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center">
                    <div className={`p-1 rounded-full mr-2 ${formData.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Crown size={16} fill={formData.isPremium ? "currentColor" : "none"} />
                    </div>
                    <span className={`text-sm font-bold ${formData.isPremium ? 'text-amber-700' : 'text-slate-500'}`}>
                        {formData.isPremium ? 'Premium / Paid' : 'Free Content'}
                    </span>
                </div>
                <input 
                    type="checkbox" 
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    checked={formData.isPremium}
                    onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                />
            </label>
        </div>
      </div>

      {/* 2. MS Word Style Editor Container */}
      <div className="flex-1 flex flex-col border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-slate-100">
        
        {/* Ribbon / Toolbar */}
        <div className="bg-white border-b border-slate-200 shadow-sm z-10">
            {/* Fake Tabs */}
            <div className="flex bg-indigo-700 text-white text-xs">
                <div className="px-4 py-1.5 bg-white text-indigo-700 font-bold rounded-t-md mt-1 ml-2">Home</div>
                <div className="px-4 py-1.5 hover:bg-indigo-600 cursor-pointer mt-1 rounded-t-md">Insert</div>
                <div className="px-4 py-1.5 hover:bg-indigo-600 cursor-pointer mt-1 rounded-t-md">Layout</div>
                <div className="px-4 py-1.5 hover:bg-indigo-600 cursor-pointer mt-1 rounded-t-md">View</div>
            </div>

            {/* Toolbar Icons */}
            <div className="p-2 flex items-center space-x-1 overflow-x-auto">
                <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
                    <ToolbarButton icon={FileText} />
                    <ToolbarButton icon={Save} />
                </div>
                
                <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
                     <div className="flex flex-col items-center justify-center px-1">
                        <select className="text-xs border border-slate-300 rounded p-0.5 w-24 mb-0.5">
                            <option>Arial</option>
                            <option>Times New Roman</option>
                        </select>
                        <select className="text-xs border border-slate-300 rounded p-0.5 w-24">
                            <option>11</option>
                            <option>12</option>
                            <option>14</option>
                        </select>
                     </div>
                     <ToolbarButton icon={Bold} />
                     <ToolbarButton icon={Italic} />
                     <ToolbarButton icon={Underline} />
                </div>

                <div className="flex items-center space-x-1 border-r border-slate-200 pr-2 mr-2">
                    <ToolbarButton icon={AlignLeft} active />
                    <ToolbarButton icon={AlignCenter} />
                    <ToolbarButton icon={AlignRight} />
                    <ToolbarButton icon={List} />
                </div>

                <div className="flex items-center space-x-1">
                    <ToolbarButton icon={LinkIcon} />
                    <ToolbarButton icon={ImageIcon} />
                </div>
            </div>
        </div>

        {/* The "Paper" Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100 cursor-text" onClick={() => document.getElementById('doc-editor')?.focus()}>
            <textarea
                id="doc-editor"
                required
                className="w-full max-w-[8.5in] min-h-[11in] bg-white shadow-lg p-10 text-slate-800 leading-relaxed focus:outline-none resize-none"
                style={{ fontFamily: 'Arial, sans-serif' }}
                placeholder="Type your document content here..."
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
            />
        </div>

        {/* Status Bar */}
        <div className="bg-indigo-600 text-white text-[10px] px-4 py-1 flex justify-between items-center">
            <div className="flex space-x-4">
                <span>Page 1 of 1</span>
                <span>{formData.body.split(/\s+/).filter(w => w.length > 0).length} words</span>
                <span>English (US)</span>
            </div>
            <div className="flex items-center space-x-2">
                <span>100%</span>
                <div className="w-16 h-1 bg-indigo-400 rounded-full"></div>
            </div>
        </div>
      </div>

      <Button type="submit" className="w-full flex items-center justify-center py-3">
          <Save size={18} className="mr-2" /> {initialData ? 'Update Document' : 'Save Document'}
      </Button>
    </form>
  );
};

export default WrittenContentForm;