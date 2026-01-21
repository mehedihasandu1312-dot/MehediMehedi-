
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './UI';
import { Folder } from '../types';
import { 
  Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Link as LinkIcon, Image as ImageIcon,
  RotateCcw, RotateCw, Save,
  ChevronDown, Printer, Type, 
  Highlighter,
  Minus, Plus,
  Table as TableIcon,
  CheckSquare,
  MoreVertical,
  Crown,
  FileText,
  Undo,
  Redo,
  Loader2,
  Upload,
  FilePlus,
  FolderOpen,
  Copy as CopyIcon,
  Share2,
  Mail,
  Download,
  Edit3,
  Trash2
} from 'lucide-react';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface WrittenContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; isPremium: boolean }) => void;
}

// --- HELPER COMPONENTS ---

const Ruler = () => (
  <div className="h-6 bg-[#f9fbfd] border-b border-slate-300 flex items-end relative select-none shrink-0 z-10">
    <div className="w-full h-full relative mx-auto" style={{ maxWidth: '8.27in' }}>
        {/* Ruler Ticks */}
        <div className="absolute inset-0 flex items-end">
            {Array.from({ length: 41 }).map((_, i) => {
                const isInch = i % 5 === 0; 
                return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div className={`border-l border-slate-400 ${isInch ? 'h-2.5' : 'h-1.5'}`}></div>
                    {isInch && i > 0 && i < 40 && <span className="absolute -top-0.5 ml-0.5 text-[8px] text-slate-500 font-medium" style={{ left: `${(i/40)*100}%` }}>{i/5}</span>}
                </div>
                );
            })}
        </div>
        {/* Indicators */}
        <div className="absolute left-0 top-0 w-full h-full">
             <div className="absolute left-0 top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-500 cursor-ew-resize"></div>
             <div className="absolute right-0 top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-500 cursor-ew-resize"></div>
        </div>
    </div>
  </div>
);

const ToolbarButton = ({ icon: Icon, onClick, active = false, title = '', disabled = false }: any) => (
    <button 
      type="button"
      onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevents focus loss from editor
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded-[4px] mx-0.5 transition-all
        ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
        <Icon size={16} strokeWidth={2.5} />
    </button>
);

const ToolbarSeparator = () => <div className="w-px h-5 bg-slate-300 mx-1 self-center"></div>;

const MenuItem = ({ icon: Icon, label, shortcut, onClick, arrow }: any) => (
    <div 
        className="flex items-center justify-between px-4 py-1.5 hover:bg-slate-100 cursor-pointer text-sm group"
        onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
        }}
    >
        <div className="flex items-center gap-3">
            {Icon ? <Icon size={16} className="text-slate-500 group-hover:text-slate-700" /> : <div className="w-4" />}
            <span className="text-slate-700 group-hover:text-black">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {shortcut && <span className="text-xs text-slate-400 font-medium">{shortcut}</span>}
            {arrow && <ChevronDown size={12} className="text-slate-400 -rotate-90" />}
        </div>
    </div>
);

const MenuSeparator = () => <div className="my-1 border-t border-slate-200"></div>;

const WrittenContentForm: React.FC<WrittenContentFormProps> = ({ folders, fixedFolderId, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    folderId: fixedFolderId || '',
    body: '',
    isPremium: false
  });

  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Table Picker
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridSize, setTableGridSize] = useState({ rows: 0, cols: 0 });

  // Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for color inputs
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
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
    }
  }, [initialData]);

  // Click outside to close popups and menus
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (showTableGrid && !(event.target as Element).closest('.table-picker-container')) {
              setShowTableGrid(false);
          }
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setActiveMenu(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTableGrid]);

  const updateStats = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText || '';
      const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(count);
      setFormData(prev => ({ ...prev, body: editorRef.current?.innerHTML || '' }));
      checkFormats();
  };

  const checkFormats = () => {
      setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight'),
          justifyFull: document.queryCommandState('justifyFull'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        // Ensure focus remains in editor
        editorRef.current.focus();
    }
    updateStats();
  };

  const handleFontNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      execCmd('fontName', e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Map visual px size to 1-7 for execCommand
      execCmd('fontSize', e.target.value);
  };

  const insertTable = (rows: number, cols: number) => {
      setShowTableGrid(false);
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      if (rows > 0 && cols > 0) {
          let html = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ccc;"><tbody>';
          for (let i = 0; i < rows; i++) {
              html += '<tr>';
              for (let j = 0; j < cols; j++) {
                  html += '<td style="border: 1px solid #ccc; padding: 5px; min-width: 30px;">&nbsp;</td>';
              }
              html += '</tr>';
          }
          html += '</tbody></table><p><br/></p>';
          document.execCommand('insertHTML', false, html);
          updateStats();
      }
  };

  // --- UPDATED IMAGE UPLOAD (FIREBASE STORAGE) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
        // Upload to Firebase Storage
        const storageRef = ref(storage, `content_images/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            null,
            (error) => {
                console.error("Upload failed", error);
                alert("Image upload failed. Please try again.");
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Insert into Editor
                if (editorRef.current) {
                    editorRef.current.focus();
                    // Insert Image with some default styling
                    const imgHtml = `<img src="${downloadURL}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Uploaded Image" /><br/>`;
                    document.execCommand('insertHTML', false, imgHtml);
                    updateStats();
                }
                setIsUploading(false);
            }
        );
    } catch (error) {
        console.error("Error:", error);
        setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = () => {
      fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.folderId) {
      alert("Please enter a Title and select a Folder");
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
        setWordCount(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] bg-[#f9fbfd] overflow-hidden rounded-xl border border-slate-300 shadow-2xl">
      
      {/* 1. GOOGLE DOCS HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-start shrink-0 z-50">
          <div className="flex items-center gap-3 w-full">
              <div className="bg-[#4285F4] p-2 rounded text-white shadow-sm cursor-pointer hover:bg-blue-600 transition-colors">
                  <FileText size={24} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 w-full">
                      {/* Title Input (Question) */}
                      <input 
                        type="text" 
                        className="text-lg font-medium text-slate-800 bg-transparent border border-transparent focus:border-blue-500 focus:bg-white rounded px-1.5 py-0.5 focus:ring-0 placeholder:text-slate-400 w-full md:w-96 transition-all hover:border-slate-300"
                        placeholder="Untitled Document (Type Question Here)"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                      
                      {/* Direct Image Upload Button next to Title */}
                      <button 
                        type="button"
                        onClick={triggerUpload}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                        title="Upload Image for Question"
                      >
                          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                      </button>

                      {/* Premium Toggle */}
                      <label className="flex items-center cursor-pointer bg-amber-50 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors select-none border border-amber-200 ml-2 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            className="mr-1.5 h-3 w-3 text-amber-600 rounded focus:ring-amber-500"
                            checked={formData.isPremium}
                            onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                          />
                          <Crown size={12} className={`mr-1 ${formData.isPremium ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Premium</span>
                      </label>
                  </div>
                  
                  {/* MENUS (FILE, EDIT, VIEW...) */}
                  <div className="flex items-center gap-1 text-[13px] text-slate-600 mt-0.5 select-none relative" ref={menuRef}>
                      <div className="relative">
                          <span 
                              className={`hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'File' ? 'bg-slate-200 text-slate-800' : ''}`}
                              onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}
                          >
                              File
                          </span>
                          {activeMenu === 'File' && (
                              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-lg py-2 z-[100] text-slate-700 font-normal">
                                  <MenuItem icon={FilePlus} label="New" onClick={() => { 
                                      setFormData({ title: '', folderId: fixedFolderId || '', body: '', isPremium: false }); 
                                      if(editorRef.current) editorRef.current.innerHTML = ''; 
                                      setWordCount(0);
                                      setActiveMenu(null);
                                  }} />
                                  <MenuItem icon={FolderOpen} label="Open" shortcut="Ctrl+O" />
                                  <MenuItem icon={CopyIcon} label="Make a copy" />
                                  <MenuSeparator />
                                  <MenuItem icon={Share2} label="Share" />
                                  <MenuItem icon={Mail} label="Email" />
                                  <MenuItem icon={Download} label="Download" arrow />
                                  <MenuSeparator />
                                  <MenuItem icon={Edit3} label="Rename" onClick={() => {
                                      document.querySelector<HTMLInputElement>('input[placeholder="Untitled Document (Type Question Here)"]')?.focus();
                                      setActiveMenu(null);
                                  }} />
                                  <MenuItem icon={Trash2} label="Move to bin" />
                                  <MenuSeparator />
                                  <MenuItem icon={Printer} label="Print" shortcut="Ctrl+P" onClick={() => { window.print(); setActiveMenu(null); }} />
                              </div>
                          )}
                      </div>

                      <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors">Edit</span>
                      <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors">View</span>
                      <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors" onClick={triggerUpload}>Insert</span>
                      <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors">Format</span>
                      <span className="hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors">Tools</span>
                      
                      {/* Folder Select */}
                      <div className="ml-2 flex items-center gap-1 text-slate-400 text-xs">
                          <span>in</span>
                          {fixedFolderId ? (
                              <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{folders.find(f => f.id === fixedFolderId)?.name}</span>
                          ) : (
                              <select 
                                className="bg-transparent border-none text-slate-600 font-medium focus:ring-0 cursor-pointer p-0 text-xs hover:text-blue-600"
                                value={formData.folderId}
                                onChange={e => setFormData({...formData, folderId: e.target.value})}
                              >
                                  <option value="">Select Folder</option>
                                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                          )}
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-3">
                  <Button type="submit" size="sm" className="bg-[#1a73e8] text-white hover:bg-blue-700 px-6 rounded-full flex items-center h-9 font-medium shadow-md">
                      <Save size={16} className="mr-2" /> Save
                  </Button>
              </div>
          </div>
      </div>

      {/* 2. GOOGLE DOCS TOOLBAR */}
      <div className="bg-[#edf2fa] px-3 py-1.5 flex items-center gap-0.5 shrink-0 overflow-x-auto rounded-full mx-3 my-2 shadow-inner border border-white z-40">
          
          <ToolbarButton icon={Undo} onClick={() => execCmd('undo')} title="Undo (Ctrl+Z)" />
          <ToolbarButton icon={Redo} onClick={() => execCmd('redo')} title="Redo (Ctrl+Y)" />
          <ToolbarButton icon={Printer} onClick={() => window.print()} title="Print (Ctrl+P)" />
          
          <ToolbarSeparator />

          <div className="flex items-center bg-white rounded-[4px] px-2 h-7 border border-transparent hover:border-slate-300 mx-1 transition-all">
              <select 
                className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none w-20 cursor-pointer" 
                onChange={handleFontNameChange}
                onMouseDown={(e) => e.stopPropagation()} // Allow click
              >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
              </select>
          </div>
          
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <div className="flex items-center bg-white rounded-[4px] px-1 h-7 border border-transparent hover:border-slate-300 w-12 justify-center mx-1 transition-all">
              <select 
                className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer" 
                onChange={handleFontSizeChange}
                defaultValue="3" // Approx 12pt
                onMouseDown={(e) => e.stopPropagation()}
              >
                  <option value="1">8</option>
                  <option value="2">10</option>
                  <option value="3">11</option>
                  <option value="4">14</option>
                  <option value="5">18</option>
                  <option value="6">24</option>
                  <option value="7">36</option>
              </select>
          </div>

          <ToolbarSeparator />

          <ToolbarButton icon={Bold} onClick={() => execCmd('bold')} active={activeFormats.bold} title="Bold (Ctrl+B)" />
          <ToolbarButton icon={Italic} onClick={() => execCmd('italic')} active={activeFormats.italic} title="Italic (Ctrl+I)" />
          <ToolbarButton icon={Underline} onClick={() => execCmd('underline')} active={activeFormats.underline} title="Underline (Ctrl+U)" />
          
          <div className="relative group mx-0.5">
              <input type="color" ref={colorInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('foreColor', e.target.value)} />
              <ToolbarButton icon={Type} title="Text Color" />
              <div className="h-0.5 w-4 bg-black mx-auto mt-[-6px] rounded-full group-hover:bg-blue-600 transition-colors"></div>
          </div>
          
          <div className="relative group mx-0.5">
              <input type="color" ref={highlightInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('hiliteColor', e.target.value)} defaultValue="#ffff00" />
              <ToolbarButton icon={Highlighter} title="Highlight Color" />
              <div className="h-0.5 w-4 bg-yellow-400 mx-auto mt-[-6px] rounded-full"></div>
          </div>

          <ToolbarSeparator />

          <ToolbarButton icon={LinkIcon} onClick={() => { const url = prompt('Enter URL:'); if(url) execCmd('createLink', url); }} title="Insert Link" />
          
          <div className="relative">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <ToolbarButton 
                icon={isUploading ? Loader2 : ImageIcon} 
                onClick={triggerUpload} 
                title="Insert Image" 
                disabled={isUploading}
                className={isUploading ? 'animate-spin text-blue-600' : ''}
              />
          </div>

          {/* Table Picker */}
          <div className="relative table-picker-container">
              <ToolbarButton icon={TableIcon} onClick={() => setShowTableGrid(!showTableGrid)} title="Insert Table" active={showTableGrid} />
              
              {showTableGrid && (
                  <div 
                    className="absolute top-full left-0 mt-2 bg-white border border-slate-300 shadow-xl rounded-lg p-3 z-[100] w-52 animate-fade-in select-none"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                      <div className="grid grid-cols-8 gap-1 mb-2">
                          {[...Array(8)].map((_, r) => (
                              [...Array(8)].map((_, c) => {
                                  const isSelected = r < tableGridSize.rows && c < tableGridSize.cols;
                                  return (
                                      <div
                                          key={`${r}-${c}`}
                                          onMouseEnter={() => setTableGridSize({ rows: r + 1, cols: c + 1 })}
                                          onClick={() => insertTable(r + 1, c + 1)}
                                          className={`w-4 h-4 border rounded-[2px] cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 border-blue-600' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                                      />
                                  );
                              })
                          ))}
                      </div>
                      <div className="text-center text-xs font-medium text-slate-600 border-t pt-2 mt-2">
                          {tableGridSize.rows > 0 ? `${tableGridSize.cols} x ${tableGridSize.rows} Table` : 'Select Table Size'}
                      </div>
                  </div>
              )}
          </div>

          <ToolbarSeparator />

          <ToolbarButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} active={activeFormats.justifyLeft} title="Align Left" />
          <ToolbarButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} active={activeFormats.justifyCenter} title="Align Center" />
          <ToolbarButton icon={AlignRight} onClick={() => execCmd('justifyRight')} active={activeFormats.justifyRight} title="Align Right" />
          <ToolbarButton icon={AlignJustify} onClick={() => execCmd('justifyFull')} active={activeFormats.justifyFull} title="Justify" />
          
          <ToolbarSeparator />

          <ToolbarButton icon={CheckSquare} title="Checklist" />
          <ToolbarButton icon={List} onClick={() => execCmd('insertUnorderedList')} active={activeFormats.insertUnorderedList} title="Bullet List" />
          <ToolbarButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} active={activeFormats.insertOrderedList} title="Numbered List" />
          
          <ToolbarSeparator />

          <ToolbarButton icon={Outdent} onClick={() => execCmd('outdent')} title="Decrease Indent" />
          <ToolbarButton icon={Indent} onClick={() => execCmd('indent')} title="Increase Indent" />
          
          <ToolbarSeparator />
          
          <ToolbarButton icon={RotateCcw} onClick={() => execCmd('removeFormat')} title="Clear Formatting" />
      </div>

      {/* 3. RULER */}
      <Ruler />

      {/* 4. EDITOR WORKSPACE */}
      <div 
        className="flex-1 overflow-y-auto bg-[#f0f2f5] relative p-8 flex justify-center cursor-text print:p-0 print:bg-white print:overflow-visible z-0"
        onClick={() => editorRef.current?.focus()}
      >
          <div
            ref={editorRef}
            contentEditable
            onInput={updateStats}
            onKeyUp={checkFormats}
            onMouseUp={checkFormats}
            className="bg-white shadow-lg outline-none text-slate-900 leading-relaxed print:shadow-none print:w-full print:h-auto print:m-0"
            style={{
                width: '8.27in', // A4 Width
                minHeight: '11.69in', // A4 Height
                padding: '1in',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt', // Default Doc Size
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s',
                marginBottom: '2rem'
            }}
          >
              {/* Content goes here */}
          </div>
      </div>

      {/* 5. STATUS BAR */}
      <div className="bg-white border-t border-slate-200 px-4 py-1.5 flex justify-between items-center shrink-0 select-none text-xs text-slate-500 z-50">
          <div className="flex gap-4">
              <span>Page 1 of 1</span>
              <span>{wordCount} words</span>
          </div>
          <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:bg-slate-100 p-1 rounded transition-colors"><Minus size={12} /></button>
              <span className="w-10 text-center font-medium">{zoom}%</span>
              <button type="button" onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:bg-slate-100 p-1 rounded transition-colors"><Plus size={12} /></button>
          </div>
      </div>

    </form>
  );
};

export default WrittenContentForm;
