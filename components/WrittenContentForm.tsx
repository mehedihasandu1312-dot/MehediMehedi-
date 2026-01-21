
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { 
  Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Type, Save, FileText, ChevronDown, Crown,
  RotateCcw, RotateCw, Strikethrough, ListOrdered
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

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        folderId: initialData.folderId,
        body: initialData.body || '',
        isPremium: initialData.isPremium || false
      });
      if (editorRef.current) {
        editorRef.current.innerHTML = initialData.body || '';
      }
    } else {
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    }
  }, [initialData, fixedFolderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId) {
      alert("Please fill in Title and Select a Folder");
      return;
    }
    // Get the HTML content from the editable div
    const content = editorRef.current?.innerHTML || '';
    
    if (!content.trim()) {
        alert("Document body cannot be empty.");
        return;
    }

    onSubmit({ ...formData, body: content });
    
    if (!initialData) {
        setFormData({ title: '', folderId: fixedFolderId || '', body: '', isPremium: false }); 
        if (editorRef.current) editorRef.current.innerHTML = '';
    }
  };

  // --- EDITOR COMMANDS ---
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // Insert image at cursor
          execCmd('insertImage', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = () => {
    const url = prompt("Enter the URL:");
    if (url) execCmd('createLink', url);
  };

  // Handle updates to state when typing
  const handleInput = () => {
      if (editorRef.current) {
          setFormData(prev => ({ ...prev, body: editorRef.current?.innerHTML || '' }));
      }
  };

  const ToolbarButton = ({ icon: Icon, cmd, val, title }: { icon: any, cmd: string, val?: string, title?: string }) => (
    <button 
      type="button" 
      onClick={() => execCmd(cmd, val)}
      title={title}
      className="p-1.5 rounded text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from editor
    >
      <Icon size={16} />
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in flex flex-col h-[80vh]">
      
      {/* 1. Meta Data Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
              <div className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 truncate">
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

      {/* 2. MS Word Style Editor */}
      <div className="flex-1 flex flex-col border border-slate-300 rounded-xl overflow-hidden shadow-md bg-slate-100">
        
        {/* Ribbon / Toolbar */}
        <div className="bg-white border-b border-slate-200 shadow-sm z-10 select-none">
            {/* Fake Tabs */}
            <div className="flex bg-[#2b579a] text-white text-xs">
                <div className="px-4 py-1.5 bg-white text-[#2b579a] font-bold rounded-t-md mt-1 ml-2 border-t border-x border-slate-200">Home</div>
                <div className="px-4 py-1.5 hover:bg-[#3e6db5] cursor-pointer mt-1 rounded-t-md">Insert</div>
                <div className="px-4 py-1.5 hover:bg-[#3e6db5] cursor-pointer mt-1 rounded-t-md">Layout</div>
                <div className="px-4 py-1.5 hover:bg-[#3e6db5] cursor-pointer mt-1 rounded-t-md">View</div>
            </div>

            {/* Toolbar Icons */}
            <div className="p-2 flex items-center gap-1 overflow-x-auto bg-[#f3f4f6]">
                
                {/* Undo/Redo */}
                <div className="flex items-center space-x-1 border-r border-slate-300 pr-2 mr-1">
                    <ToolbarButton icon={RotateCcw} cmd="undo" title="Undo" />
                    <ToolbarButton icon={RotateCw} cmd="redo" title="Redo" />
                </div>
                
                {/* Font Styles */}
                <div className="flex items-center space-x-1 border-r border-slate-300 pr-2 mr-1">
                     <div className="flex flex-col gap-1">
                        <select 
                            className="text-xs border border-slate-300 rounded p-0.5 w-28 outline-none"
                            onChange={(e) => execCmd('fontName', e.target.value)}
                        >
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                        </select>
                        <div className="flex gap-1">
                             <ToolbarButton icon={Bold} cmd="bold" title="Bold" />
                             <ToolbarButton icon={Italic} cmd="italic" title="Italic" />
                             <ToolbarButton icon={Underline} cmd="underline" title="Underline" />
                             <ToolbarButton icon={Strikethrough} cmd="strikethrough" title="Strikethrough" />
                        </div>
                     </div>
                     <div className="flex flex-col justify-between h-full pl-1">
                        <select 
                            className="text-xs border border-slate-300 rounded p-0.5 w-14 outline-none"
                            onChange={(e) => execCmd('fontSize', e.target.value)}
                        >
                            <option value="3">12</option>
                            <option value="1">8</option>
                            <option value="2">10</option>
                            <option value="4">14</option>
                            <option value="5">18</option>
                            <option value="6">24</option>
                            <option value="7">36</option>
                        </select>
                     </div>
                </div>

                {/* Alignment & Lists */}
                <div className="flex items-center space-x-1 border-r border-slate-300 pr-2 mr-1">
                    <div className="grid grid-cols-4 gap-0.5">
                        <ToolbarButton icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
                        <ToolbarButton icon={AlignCenter} cmd="justifyCenter" title="Center" />
                        <ToolbarButton icon={AlignRight} cmd="justifyRight" title="Align Right" />
                        <ToolbarButton icon={AlignJustify} cmd="justifyFull" title="Justify" />
                        <ToolbarButton icon={List} cmd="insertUnorderedList" title="Bullet List" />
                        <ToolbarButton icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
                    </div>
                </div>

                {/* Insert */}
                <div className="flex items-center space-x-1">
                    <button 
                      type="button"
                      onClick={addLink}
                      className="p-1.5 rounded text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center"
                      title="Link"
                    >
                       <LinkIcon size={16} />
                       <span className="text-[9px]">Link</span>
                    </button>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload} 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex flex-col items-center"
                      title="Insert Image"
                    >
                       <ImageIcon size={16} />
                       <span className="text-[9px]">Image</span>
                    </button>
                </div>
            </div>
        </div>

        {/* The "Paper" Area */}
        <div 
            className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#e3e5e8] cursor-text" 
            onClick={() => editorRef.current?.focus()}
        >
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full max-w-[8.5in] min-h-[11in] bg-white shadow-2xl p-8 md:p-12 text-slate-900 leading-relaxed focus:outline-none prose prose-slate max-w-none print:shadow-none"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {/* Content goes here */}
            </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#2b579a] text-white text-[10px] px-4 py-1 flex justify-between items-center shrink-0">
            <div className="flex space-x-4">
                <span>Page 1 of 1</span>
                <span>{formData.body.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length} words</span>
                <span>English (US)</span>
            </div>
            <div className="flex items-center space-x-2">
                <span>100%</span>
                <div className="w-20 h-1 bg-blue-300 rounded-full">
                    <div className="w-1/2 h-full bg-white rounded-full"></div>
                </div>
                <span>+</span>
            </div>
        </div>
      </div>

      <Button type="submit" className="w-full flex items-center justify-center py-3 bg-[#2b579a] hover:bg-[#1e4072] text-white shadow-lg">
          <Save size={18} className="mr-2" /> {initialData ? 'Update Document' : 'Save Document'}
      </Button>
    </form>
  );
};

export default WrittenContentForm;
