
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
  CheckCircle, Minus, Plus,
  Table as TableIcon, Calendar, MinusSquare,
  LayoutTemplate, Maximize, Printer, FileText,
  Settings, Grid,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Layout
} from 'lucide-react';

interface WrittenContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; isPremium: boolean }) => void;
}

// Helper Components
const RibbonGroup = ({ label, children, className = '' }: { label: string, children?: React.ReactNode, className?: string }) => (
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
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1 rounded hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all min-w-[40px] ${active ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-inner' : 'text-slate-700'}`}
      title={label}
    >
        <Icon size={20} />
        {label && <span className="text-[10px] mt-0.5 leading-none">{label}</span>}
        {sub && <ChevronDown size={8} className="text-slate-400 mt-0.5"/>}
    </button>
);

const SmallRibbonButton = ({ icon: Icon, onClick, active = false, className = '', title = '' }: any) => (
    <button 
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-200 ${active ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-inner' : 'text-slate-700'} ${className}`}
    >
        <Icon size={16} />
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
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  
  // Page Layout State
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [margins, setMargins] = useState<'Normal' | 'Narrow' | 'Wide'>('Normal');

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
      
      // Update active states for buttons
      checkFormats();
  };

  const checkFormats = () => {
      setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikethrough'),
          subscript: document.queryCommandState('subscript'),
          superscript: document.queryCommandState('superscript'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight'),
          justifyFull: document.queryCommandState('justifyFull'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
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
        setWordCount(0);
    }
  };

  // --- EDITOR COMMANDS ---
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
    }
    updateStats();
  };

  const insertTable = () => {
      const rowsStr = prompt('Enter number of rows (e.g., 3):', '3');
      const colsStr = prompt('Enter number of columns (e.g., 3):', '3');
      
      if (!rowsStr || !colsStr) return;

      const rows = parseInt(rowsStr);
      const cols = parseInt(colsStr);

      if (rows > 0 && cols > 0) {
          let html = '<table style="width:100%; border-collapse: collapse; margin-bottom: 1em; border: 1px solid #cbd5e1;"><tbody>';
          for (let i = 0; i < rows; i++) {
              html += '<tr>';
              for (let j = 0; j < cols; j++) {
                  html += '<td style="border: 1px solid #cbd5e1; padding: 8px; min-width: 50px;">&nbsp;</td>';
              }
              html += '</tr>';
          }
          html += '</tbody></table><p><br/></p>';
          execCmd('insertHTML', html);
      }
  };

  // --- TABLE MANIPULATION HELPERS ---
  const getTableElements = () => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return null;
      let node = selection.anchorNode;
      // If text node, get parent
      if (node && node.nodeType === 3) node = node.parentNode;
      
      const element = node as HTMLElement;
      const td = element.closest('td, th') as HTMLTableCellElement;
      const tr = element.closest('tr') as HTMLTableRowElement;
      const table = element.closest('table') as HTMLTableElement;
      
      return { table, tr, td };
  };

  const manipulateTable = (action: 'addRowAbove' | 'addRowBelow' | 'addColLeft' | 'addColRight' | 'delRow' | 'delCol' | 'delTable') => {
      const els = getTableElements();
      if (!els || !els.table) {
          alert("Please place your cursor inside a table cell first.");
          return;
      }
      const { table, tr, td } = els;

      switch(action) {
          case 'addRowAbove':
          case 'addRowBelow':
              if(tr) {
                  const idx = action === 'addRowAbove' ? tr.rowIndex : tr.rowIndex + 1;
                  const newRow = table.insertRow(idx);
                  const colCount = tr.cells.length;
                  for(let i=0; i<colCount; i++) {
                      const cell = newRow.insertCell(i);
                      cell.style.border = '1px solid #cbd5e1';
                      cell.style.padding = '8px';
                      cell.innerHTML = '&nbsp;';
                  }
              }
              break;
          case 'addColLeft':
          case 'addColRight':
              if(td) {
                  const idx = action === 'addColLeft' ? td.cellIndex : td.cellIndex + 1;
                  for(let i=0; i<table.rows.length; i++) {
                      const cell = table.rows[i].insertCell(idx);
                      cell.style.border = '1px solid #cbd5e1';
                      cell.style.padding = '8px';
                      cell.innerHTML = '&nbsp;';
                  }
              }
              break;
          case 'delRow':
              if(tr) table.deleteRow(tr.rowIndex);
              break;
          case 'delCol':
              if(td) {
                  const idx = td.cellIndex;
                  for(let i=0; i<table.rows.length; i++) {
                      if(table.rows[i].cells.length > idx) table.rows[i].deleteCell(idx);
                  }
              }
              break;
          case 'delTable':
              table.remove();
              break;
      }
      updateStats();
  };

  const insertDate = () => {
      const date = new Date().toLocaleDateString();
      execCmd('insertText', date);
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

  const handlePrint = () => {
      window.print();
  };

  // --- STYLE GENERATORS ---
  const getPageStyle = () => {
      const base: React.CSSProperties = {
          fontFamily: 'Arial, sans-serif',
          transform: `scale(${zoom / 100})`,
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minHeight: '11in',
          outline: 'none',
          color: '#0f172a',
          lineHeight: '1.6',
          transformOrigin: 'top center',
          transition: 'all 0.2s ease-in-out'
      };

      // Size
      if (pageSize === 'A4') {
          base.width = orientation === 'Portrait' ? '8.27in' : '11.69in';
          base.minHeight = orientation === 'Portrait' ? '11.69in' : '8.27in';
      } else {
          base.width = orientation === 'Portrait' ? '8.5in' : '11in';
          base.minHeight = orientation === 'Portrait' ? '11in' : '8.5in';
      }

      // Margins
      if (margins === 'Normal') base.padding = '1in';
      if (margins === 'Narrow') base.padding = '0.5in';
      if (margins === 'Wide') base.padding = '2in';

      return base;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] bg-[#f3f4f6] overflow-hidden rounded-xl border border-slate-300 shadow-2xl">
      
      {/* 1. TOP BAR */}
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
              
              <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-blue-200">Save to:</span>
                  {fixedFolderId ? (
                      <span className="text-xs font-bold">{folders.find(f => f.id === fixedFolderId)?.name}</span>
                  ) : (
                      <select 
                        className="text-xs bg-white/10 border border-blue-400 rounded px-2 py-1 outline-none focus:bg-white/20 text-white option:text-black"
                        value={formData.folderId}
                        onChange={e => setFormData({...formData, folderId: e.target.value})}
                      >
                          <option value="" className="text-slate-800">Select Folder</option>
                          {folders.map(f => <option key={f.id} value={f.id} className="text-slate-800">{f.name}</option>)}
                      </select>
                  )}
              </div>

              <label className="flex items-center cursor-pointer bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition-colors select-none">
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
      <div className="bg-white border-b border-slate-300 px-2 flex gap-1 shrink-0 overflow-x-auto">
          {['File', 'Home', 'Insert', 'Layout', 'Table Layout', 'View'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1 text-xs font-medium border-b-2 transition-colors mt-1 whitespace-nowrap ${
                    activeTab === tab 
                    ? 'border-[#2b579a] text-[#2b579a] font-bold bg-slate-50' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                  {tab}
              </button>
          ))}
      </div>

      {/* 3. RIBBON TOOLBAR */}
      <div className="bg-[#f9fafb] border-b border-slate-300 h-28 flex items-center px-2 shadow-sm shrink-0 overflow-x-auto whitespace-nowrap">
          {activeTab === 'Home' && (
              <>
                  <RibbonGroup label="Clipboard">
                      <RibbonButton icon={Clipboard} label="Paste" onClick={() => navigator.clipboard.readText().then(text => execCmd('insertText', text))} sub />
                      <div className="flex flex-col gap-1">
                          <SmallRibbonButton icon={Scissors} onClick={() => execCmd('cut')} title="Cut" />
                          <SmallRibbonButton icon={Copy} onClick={() => execCmd('copy')} title="Copy" />
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Font" className="min-w-[180px]">
                      <div className="flex gap-1 mb-1">
                          <select className="text-xs border border-slate-300 rounded p-0.5 w-28 h-6" onChange={(e) => execCmd('fontName', e.target.value)}>
                              <option value="Arial">Arial</option>
                              <option value="SolaimanLipi">SolaimanLipi</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Georgia">Georgia</option>
                          </select>
                          <select className="text-xs border border-slate-300 rounded p-0.5 w-12 h-6" onChange={(e) => execCmd('fontSize', e.target.value)}>
                              <option value="1">8</option>
                              <option value="2">10</option>
                              <option value="3">12</option>
                              <option value="4">14</option>
                              <option value="5">18</option>
                              <option value="6">24</option>
                              <option value="7">36</option>
                          </select>
                      </div>
                      <div className="flex gap-0.5">
                          <SmallRibbonButton icon={Bold} onClick={() => execCmd('bold')} active={activeFormats.bold} title="Bold (Ctrl+B)" />
                          <SmallRibbonButton icon={Italic} onClick={() => execCmd('italic')} active={activeFormats.italic} title="Italic (Ctrl+I)" />
                          <SmallRibbonButton icon={Underline} onClick={() => execCmd('underline')} active={activeFormats.underline} title="Underline (Ctrl+U)" />
                          <SmallRibbonButton icon={Strikethrough} onClick={() => execCmd('strikethrough')} active={activeFormats.strikethrough} title="Strikethrough" />
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          <SmallRibbonButton icon={Subscript} onClick={() => execCmd('subscript')} active={activeFormats.subscript} title="Subscript" />
                          <SmallRibbonButton icon={Superscript} onClick={() => execCmd('superscript')} active={activeFormats.superscript} title="Superscript" />
                          <div className="w-px h-6 bg-slate-300 mx-1"></div>
                          
                          {/* Color Pickers */}
                          <div className="relative group">
                              <input type="color" ref={highlightInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('hiliteColor', e.target.value)} />
                              <SmallRibbonButton icon={Highlighter} className="text-yellow-500" title="Highlight Color" />
                          </div>
                          <div className="relative group">
                              <input type="color" ref={colorInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('foreColor', e.target.value)} />
                              <SmallRibbonButton icon={Type} className="text-red-600" title="Font Color" />
                          </div>
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Paragraph">
                      <div className="flex flex-col gap-1 w-full">
                          <div className="flex gap-0.5 justify-center">
                              <SmallRibbonButton icon={List} onClick={() => execCmd('insertUnorderedList')} active={activeFormats.insertUnorderedList} title="Bullet List" />
                              <SmallRibbonButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} active={activeFormats.insertOrderedList} title="Numbered List" />
                              <div className="w-px h-4 bg-slate-300 mx-1"></div>
                              <SmallRibbonButton icon={Outdent} onClick={() => execCmd('outdent')} title="Decrease Indent" />
                              <SmallRibbonButton icon={Indent} onClick={() => execCmd('indent')} title="Increase Indent" />
                          </div>
                          <div className="flex gap-0.5 justify-center">
                              <SmallRibbonButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} active={activeFormats.justifyLeft} title="Align Left" />
                              <SmallRibbonButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} active={activeFormats.justifyCenter} title="Align Center" />
                              <SmallRibbonButton icon={AlignRight} onClick={() => execCmd('justifyRight')} active={activeFormats.justifyRight} title="Align Right" />
                              <SmallRibbonButton icon={AlignJustify} onClick={() => execCmd('justifyFull')} active={activeFormats.justifyFull} title="Justify" />
                          </div>
                      </div>
                  </RibbonGroup>

                  {/* INSERT GROUP ADDED TO HOME */}
                  <RibbonGroup label="Insert">
                      <RibbonButton icon={TableIcon} label="Table" onClick={insertTable} />
                      <div className="relative">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                          <RibbonButton icon={ImageIcon} label="Picture" onClick={() => fileInputRef.current?.click()} />
                      </div>
                  </RibbonGroup>

                  <RibbonGroup label="Editing">
                      <RibbonButton icon={Search} label="Find" onClick={() => (window as any).find(prompt("Enter text to find:") || '')} />
                      <RibbonButton icon={MousePointer} label="Select" onClick={() => execCmd('selectAll')} />
                  </RibbonGroup>
              </>
          )}

          {activeTab === 'Insert' && (
              <>
                  <RibbonGroup label="Tables">
                      <RibbonButton icon={TableIcon} label="Table" onClick={insertTable} />
                  </RibbonGroup>
                  <RibbonGroup label="Illustrations">
                      <div className="relative">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                          <RibbonButton icon={ImageIcon} label="Pictures" onClick={() => fileInputRef.current?.click()} />
                      </div>
                  </RibbonGroup>
                  <RibbonGroup label="Links">
                      <RibbonButton icon={LinkIcon} label="Link" onClick={() => { const url = prompt('Enter URL:'); if(url) execCmd('createLink', url); }} />
                  </RibbonGroup>
                  <RibbonGroup label="Text">
                      <RibbonButton icon={Calendar} label="Date & Time" onClick={insertDate} />
                      <RibbonButton icon={MinusSquare} label="Horiz. Line" onClick={() => execCmd('insertHorizontalRule')} />
                  </RibbonGroup>
              </>
          )}

          {activeTab === 'Layout' && (
              <>
                  <RibbonGroup label="Page Setup">
                      <div className="flex gap-1">
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500">Margins:</span>
                              <select className="text-xs border rounded p-1" value={margins} onChange={(e) => setMargins(e.target.value as any)}>
                                  <option value="Normal">Normal</option>
                                  <option value="Narrow">Narrow</option>
                                  <option value="Wide">Wide</option>
                              </select>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500">Orientation:</span>
                              <select className="text-xs border rounded p-1" value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                                  <option value="Portrait">Portrait</option>
                                  <option value="Landscape">Landscape</option>
                              </select>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500">Size:</span>
                              <select className="text-xs border rounded p-1" value={pageSize} onChange={(e) => setPageSize(e.target.value as any)}>
                                  <option value="A4">A4</option>
                                  <option value="Letter">Letter</option>
                              </select>
                          </div>
                      </div>
                  </RibbonGroup>
                  <RibbonGroup label="Paragraph">
                      <div className="flex items-center">
                          <SmallRibbonButton icon={LayoutTemplate} title="Paragraph Settings" />
                          <span className="text-xs ml-1 text-slate-500">Spacing</span>
                      </div>
                  </RibbonGroup>
              </>
          )}

          {/* NEW TABLE LAYOUT TAB */}
          {activeTab === 'Table Layout' && (
              <>
                  <RibbonGroup label="Rows & Columns">
                      <div className="flex gap-1">
                          <div className="flex flex-col gap-1">
                              <SmallRibbonButton icon={ArrowUp} onClick={() => manipulateTable('addRowAbove')} title="Insert Above" />
                              <SmallRibbonButton icon={ArrowDown} onClick={() => manipulateTable('addRowBelow')} title="Insert Below" />
                          </div>
                          <div className="flex flex-col gap-1">
                              <SmallRibbonButton icon={ArrowLeft} onClick={() => manipulateTable('addColLeft')} title="Insert Left" />
                              <SmallRibbonButton icon={ArrowRight} onClick={() => manipulateTable('addColRight')} title="Insert Right" />
                          </div>
                      </div>
                  </RibbonGroup>
                  <RibbonGroup label="Delete">
                       <div className="flex flex-col gap-1 w-full justify-center">
                          <div className="flex items-center gap-1 cursor-pointer hover:bg-red-50 p-1 rounded transition-colors" onClick={() => manipulateTable('delRow')}>
                              <Trash2 size={14} className="text-red-500" /> <span className="text-[10px] font-medium text-slate-700">Delete Row</span>
                          </div>
                          <div className="flex items-center gap-1 cursor-pointer hover:bg-red-50 p-1 rounded transition-colors" onClick={() => manipulateTable('delCol')}>
                              <Trash2 size={14} className="text-red-500" /> <span className="text-[10px] font-medium text-slate-700">Delete Col</span>
                          </div>
                          <div className="flex items-center gap-1 cursor-pointer hover:bg-red-50 p-1 rounded transition-colors border-t border-slate-200 mt-0.5 pt-0.5" onClick={() => manipulateTable('delTable')}>
                              <Trash2 size={14} className="text-red-600 font-bold" /> <span className="text-[10px] font-bold text-red-600">Delete Table</span>
                          </div>
                       </div>
                  </RibbonGroup>
                  <RibbonGroup label="Merge">
                      <RibbonButton icon={Layout} label="Merge Cells" onClick={() => alert("Merge feature coming soon!")} />
                  </RibbonGroup>
              </>
          )}

          {activeTab === 'View' && (
              <>
                  <RibbonGroup label="Views">
                      <RibbonButton icon={FileText} label="Print Layout" active={true} />
                      <RibbonButton icon={Grid} label="Web Layout" />
                  </RibbonGroup>
                  <RibbonGroup label="Zoom">
                      <RibbonButton icon={Search} label="100%" onClick={() => setZoom(100)} />
                      <div className="flex flex-col gap-1">
                          <SmallRibbonButton icon={Plus} onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom In" />
                          <SmallRibbonButton icon={Minus} onClick={() => setZoom(z => Math.max(10, z - 10))} title="Zoom Out" />
                      </div>
                  </RibbonGroup>
                  <RibbonGroup label="Window">
                      <RibbonButton icon={Maximize} label="Full Screen" onClick={() => document.documentElement.requestFullscreen()} />
                  </RibbonGroup>
              </>
          )}

          {activeTab === 'File' && (
              <RibbonGroup label="Print">
                  <RibbonButton icon={Printer} label="Print" onClick={handlePrint} />
              </RibbonGroup>
          )}
      </div>

      {/* 4. EDITOR WORKSPACE */}
      <div 
        className="flex-1 overflow-y-auto bg-[#e3e5e8] relative p-8 flex justify-center cursor-text print:p-0 print:bg-white print:overflow-visible"
        onClick={() => editorRef.current?.focus()}
      >
          <div
            ref={editorRef}
            contentEditable
            onInput={updateStats}
            onKeyUp={checkFormats}
            onMouseUp={checkFormats}
            className="bg-white shadow-xl outline-none text-slate-900 leading-relaxed print:shadow-none print:w-full print:h-auto print:m-0"
            style={getPageStyle()}
          >
              {/* Content goes here */}
          </div>
      </div>

      {/* 5. STATUS BAR */}
      <div className="bg-[#2b579a] text-white text-[11px] h-6 flex justify-between items-center px-2 shrink-0 select-none print:hidden">
          <div className="flex gap-4">
              <span>Page 1 of 1</span>
              <span>{wordCount} words</span>
              <span className="flex items-center gap-1"><CheckCircle size={10}/> No proofing errors</span>
          </div>
          <div className="flex items-center gap-3">
              <span>Focus</span>
              <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setZoom(z => Math.max(10, z - 10))}><Minus size={10} /></button>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-24 h-1 bg-blue-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <button type="button" onClick={() => setZoom(z => Math.min(200, z + 10))}><Plus size={10} /></button>
                  <span>{zoom}%</span>
              </div>
          </div>
      </div>

    </form>
  );
};

export default WrittenContentForm;
