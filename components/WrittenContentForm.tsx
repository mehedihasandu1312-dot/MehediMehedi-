
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Link as LinkIcon, Image as ImageIcon,
  RotateCcw, RotateCw, Save,
  ChevronDown, Scissors, Copy, Clipboard,
  Highlighter, Type, Subscript, Superscript,
  Search, MousePointer, Crown,
  CheckCircle, Minus, Plus
} from 'lucide-react';

interface WrittenContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; isPremium: boolean }) => void;
}

// Helper Components moved outside to avoid re-creation on render and fix TS inference
const RibbonGroup = ({ label, children, className = '' }: { label: string, children: React.ReactNode, className?: string }) => (
    <div className={`flex flex-col px-2 border-r border-slate-300 h-full justify-between ${className}`}>
        <div className="flex gap-1 items-start justify-center flex-wrap">
            {children}
        </div>
        <div className="text-[10px] text-slate-500 text-center mt-1 font-medium select-none">{label}</div>
    </div>
);

const RibbonButton = ({ icon: Icon, label, onClick, sub, active = false }: any) => (
    <button 
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1 rounded hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all min-w-[40px] ${active ? 'bg-indigo-100 border-indigo-300' : ''}`}
      title={label}
    >
        <Icon size={20} className={active ? 'text-indigo-700' : 'text-slate-700'} />
        {label && <span className="text-[10px] text-slate-600 mt-0.5 leading-none">{label}</span>}
        {sub && <ChevronDown size={8} className="text-slate-400 mt-0.5"/>}
    </button>
);

const SmallRibbonButton = ({ icon: Icon, onClick, active = false }: any) => (
    <button 
      type="button"
      onClick={onClick}
      className={`p-1 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-200 ${active ? 'bg-indigo-100 border-indigo-300' : ''}`}
    >
        <Icon size={16} className={active ? 'text-indigo-700' : 'text-slate-700'} />
    </button>
);

const WrittenContentForm: React.FC<WrittenContentFormProps> = ({ folders, fixedFolderId, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    folderId: fixedFolderId || '',
    body: '',
    isPremium: false
  });

  const [activeTab, setActiveTab] = useState('Home');
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  // Initialize
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
        updateStats();
      }
    } else {
        if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [initialData, fixedFolderId]);

  const updateStats = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText || '';
      const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(count);
      setFormData(prev => ({ ...prev, body: editorRef.current?.innerHTML || '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId) {
      alert("Please fill in Title and Select a Folder");
      return;
    }
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
    updateStats();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          execCmd('insertImage', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] bg-[#f3f4f6] overflow-hidden rounded-xl border border-slate-300 shadow-2xl">
      
      {/* 1. TOP BAR (File Info) */}
      <div className="bg-[#2b579a] text-white px-4 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-2 flex-1">
                  <div className="bg-white/20 p-1.5 rounded text-xs font-bold px-2">DOC</div>
                  <input 
                    type="text" 
                    className="bg-transparent border-none text-white font-semibold focus:ring-0 placeholder:text-blue-200 w-full"
                    placeholder="Document Title"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
              </div>
              
              {/* Folder Select in Top Bar */}
              <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-blue-200">Save to:</span>
                  {fixedFolderId ? (
                      <span className="text-xs font-bold">{folders.find(f => f.id === fixedFolderId)?.name}</span>
                  ) : (
                      <select 
                        className="text-xs bg-white/10 border border-blue-400 rounded px-2 py-1 outline-none focus:bg-white/20"
                        value={formData.folderId}
                        onChange={e => setFormData({...formData, folderId: e.target.value})}
                      >
                          <option value="" className="text-slate-800">Select Folder</option>
                          {folders.map(f => <option key={f.id} value={f.id} className="text-slate-800">{f.name}</option>)}
                      </select>
                  )}
              </div>

              {/* Premium Toggle */}
              <label className="flex items-center cursor-pointer bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition-colors">
                  <input 
                    type="checkbox" 
                    className="mr-2"
                    checked={formData.isPremium}
                    onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                  />
                  <Crown size={14} className={`mr-1 ${formData.isPremium ? 'text-yellow-400' : 'text-slate-300'}`} />
                  <span className="text-xs font-bold">{formData.isPremium ? 'Premium' : 'Free'}</span>
              </label>

              <Button type="submit" size="sm" className="bg-white text-[#2b579a] hover:bg-blue-50 font-bold border-none shadow-none h-8">
                  <Save size={14} className="mr-1" /> Save
              </Button>
          </div>
      </div>

      {/* 2. RIBBON TABS */}
      <div className="bg-white border-b border-slate-300 px-2 flex gap-1 shrink-0">
          {['File', 'Home', 'Insert', 'Draw', 'Design', 'Layout', 'References', 'Review', 'View'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1 text-xs font-medium border-b-2 transition-colors mt-1 ${
                    activeTab === tab 
                    ? 'border-[#2b579a] text-[#2b579a] font-bold bg-slate-50' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                  {tab}
              </button>
          ))}
      </div>

      {/* 3. RIBBON TOOLBAR (Dynamic based on Tab) */}
      <div className="bg-[#f9fafb] border-b border-slate-300 h-28 flex items-center px-2 shadow-sm shrink-0 overflow-x-auto whitespace-nowrap">
          {activeTab === 'Home' && (
              <>
                  <RibbonGroup label="Clipboard">
                      <RibbonButton icon={Clipboard} label="Paste" onClick={() => navigator.clipboard.readText().then(text => execCmd('insertText', text))} sub />
                      <div className="flex flex-col gap-1">
                          <SmallRibbonButton icon={Scissors} onClick={() => execCmd('cut')} />
                          <SmallRibbonButton icon={Copy} onClick={() => execCmd('copy')} />
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Font" className="min-w-[180px]">
                      <div className="flex gap-1 mb-1">
                          <select className="text-xs border border-slate-300 rounded p-0.5 w-28 h-6" onChange={(e) => execCmd('fontName', e.target.value)}>
                              <option value="Arial">Arial</option>
                              <option value="SolaimanLipi">SolaimanLipi</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                          </select>
                          <select className="text-xs border border-slate-300 rounded p-0.5 w-12 h-6" onChange={(e) => execCmd('fontSize', e.target.value)}>
                              <option value="3">12</option>
                              <option value="1">8</option>
                              <option value="2">10</option>
                              <option value="4">14</option>
                              <option value="5">18</option>
                              <option value="6">24</option>
                              <option value="7">36</option>
                          </select>
                      </div>
                      <div className="flex gap-0.5">
                          <SmallRibbonButton icon={Bold} onClick={() => execCmd('bold')} />
                          <SmallRibbonButton icon={Italic} onClick={() => execCmd('italic')} />
                          <SmallRibbonButton icon={Underline} onClick={() => execCmd('underline')} />
                          <SmallRibbonButton icon={Strikethrough} onClick={() => execCmd('strikethrough')} />
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          <SmallRibbonButton icon={Subscript} onClick={() => execCmd('subscript')} />
                          <SmallRibbonButton icon={Superscript} onClick={() => execCmd('superscript')} />
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          
                          {/* Color Pickers */}
                          <div className="relative">
                              <input type="color" ref={highlightInputRef} className="absolute opacity-0 w-full h-full cursor-pointer" onChange={(e) => execCmd('hiliteColor', e.target.value)} />
                              <SmallRibbonButton icon={Highlighter} className="text-yellow-500" />
                          </div>
                          <div className="relative">
                              <input type="color" ref={colorInputRef} className="absolute opacity-0 w-full h-full cursor-pointer" onChange={(e) => execCmd('foreColor', e.target.value)} />
                              <SmallRibbonButton icon={Type} className="text-red-600" />
                          </div>
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Paragraph">
                      <div className="flex flex-col gap-1 w-full">
                          <div className="flex gap-0.5 justify-center">
                              <SmallRibbonButton icon={List} onClick={() => execCmd('insertUnorderedList')} />
                              <SmallRibbonButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} />
                              <div className="w-px h-4 bg-slate-300 mx-1"></div>
                              <SmallRibbonButton icon={Outdent} onClick={() => execCmd('outdent')} />
                              <SmallRibbonButton icon={Indent} onClick={() => execCmd('indent')} />
                          </div>
                          <div className="flex gap-0.5 justify-center">
                              <SmallRibbonButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} />
                              <SmallRibbonButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} />
                              <SmallRibbonButton icon={AlignRight} onClick={() => execCmd('justifyRight')} />
                              <SmallRibbonButton icon={AlignJustify} onClick={() => execCmd('justifyFull')} />
                          </div>
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Styles" className="min-w-[150px]">
                      <div className="flex gap-2 h-[50px] overflow-hidden">
                          <button onClick={() => execCmd('formatBlock', 'P')} className="border border-slate-200 bg-white px-2 rounded hover:bg-slate-50 text-left min-w-[60px]">
                              <span className="block text-[20px] leading-none mb-1 font-serif">Aa</span>
                              <span className="text-[9px] font-bold text-slate-600">Normal</span>
                          </button>
                          <button onClick={() => execCmd('formatBlock', 'H1')} className="border border-slate-200 bg-white px-2 rounded hover:bg-slate-50 text-left min-w-[60px]">
                              <span className="block text-[20px] leading-none mb-1 font-bold text-blue-600">Aa</span>
                              <span className="text-[9px] font-bold text-slate-600">Heading 1</span>
                          </button>
                          <button onClick={() => execCmd('formatBlock', 'H2')} className="border border-slate-200 bg-white px-2 rounded hover:bg-slate-50 text-left min-w-[60px]">
                              <span className="block text-[18px] leading-none mb-1 font-bold text-slate-700">Aa</span>
                              <span className="text-[9px] font-bold text-slate-600">Heading 2</span>
                          </button>
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Editing">
                      <RibbonButton icon={Search} label="Find" />
                      <RibbonButton icon={MousePointer} label="Select" />
                  </RibbonGroup>
              </>
          )}

          {activeTab === 'Insert' && (
              <>
                  <RibbonGroup label="Media">
                      <div className="relative">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                          <RibbonButton icon={ImageIcon} label="Pictures" onClick={() => fileInputRef.current?.click()} />
                      </div>
                      <RibbonButton icon={LinkIcon} label="Link" onClick={() => { const url = prompt('Enter URL:'); if(url) execCmd('createLink', url); }} />
                  </RibbonGroup>
              </>
          )}
          
          {/* Other tabs can be placeholders */}
          {['File', 'Layout', 'View'].includes(activeTab) && (
              <div className="px-4 text-sm text-slate-400 italic">Options for {activeTab} coming soon...</div>
          )}
      </div>

      {/* 4. EDITOR WORKSPACE (Gray Background + White Paper) */}
      <div 
        className="flex-1 overflow-y-auto bg-[#e3e5e8] relative p-8 flex justify-center cursor-text"
        onClick={() => editorRef.current?.focus()}
      >
          {/* Ruler Simulation */}
          {/* <div className="absolute top-0 left-0 right-0 h-6 bg-white border-b border-slate-300 flex items-end px-[calc(50%-4in)] text-[8px] text-slate-400">
              <div className="flex-1 border-l border-slate-300 h-2 ml-4"></div>
          </div> */}

          <div
            ref={editorRef}
            contentEditable
            onInput={updateStats}
            onKeyDown={updateStats}
            className="bg-white shadow-xl min-h-[11in] w-[8.5in] p-[1in] outline-none text-slate-900 leading-relaxed print:w-full print:shadow-none transition-transform origin-top"
            style={{ 
                fontFamily: 'Arial, sans-serif',
                transform: `scale(${zoom / 100})`
            }}
          >
              {/* Content goes here */}
          </div>
      </div>

      {/* 5. STATUS BAR */}
      <div className="bg-[#2b579a] text-white text-[11px] h-6 flex justify-between items-center px-2 shrink-0 select-none">
          <div className="flex gap-4">
              <span>Page 1 of 1</span>
              <span>{wordCount} words</span>
              <span className="flex items-center gap-1"><CheckCircle size={10}/> No proofing errors</span>
          </div>
          <div className="flex items-center gap-3">
              <span>Focus</span>
              <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(z => Math.max(10, z - 10))}><Minus size={10} /></button>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-24 h-1 bg-blue-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <button onClick={() => setZoom(z => Math.min(200, z + 10))}><Plus size={10} /></button>
                  <span>{zoom}%</span>
              </div>
          </div>
      </div>

    </form>
  );
};

export default WrittenContentForm;
