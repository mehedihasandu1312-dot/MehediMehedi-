
import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal } from './UI';
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
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Layout,
  PaintBucket, Undo, Redo, CheckSquare
} from 'lucide-react';

interface WrittenContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; body: string; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; body: string; isPremium: boolean }) => void;
}

// --- HELPER COMPONENTS ---

const Ruler = () => (
  <div className="h-6 bg-[#f9fbfd] border-b border-slate-300 flex items-end px-[1in] relative select-none overflow-hidden shrink-0">
    {/* Left Margin Indicator */}
    <div className="absolute left-[1in] top-0 h-full w-px bg-slate-400 z-10"></div>
    <div className="absolute left-[1in] -ml-1.5 top-0 w-3 h-3 bg-blue-500 clip-path-triangle-down cursor-ew-resize z-20" title="Left Indent"></div>
    
    {/* Right Margin Indicator */}
    <div className="absolute right-[1in] top-0 h-full w-px bg-slate-400 z-10"></div>
    <div className="absolute right-[1in] -mr-1.5 top-0 w-3 h-3 bg-blue-500 clip-path-triangle-down cursor-ew-resize z-20" title="Right Margin"></div>

    {/* Ruler Ticks */}
    <div className="flex w-full h-full">
        {Array.from({ length: 80 }).map((_, i) => {
            const isInch = i % 8 === 0; // Assuming 8 ticks per inch for visual
            const isHalf = i % 4 === 0;
            return (
              <div key={i} className="flex-1 flex flex-col justify-end relative group">
                <div className={`border-l border-slate-400 ${isInch ? 'h-2.5' : isHalf ? 'h-1.5' : 'h-1'}`}></div>
                {isInch && i > 0 && <span className="absolute -top-1 -left-1 text-[8px] text-slate-500 font-medium">{i / 8}</span>}
              </div>
            );
        })}
    </div>
  </div>
);

const RibbonGroup = ({ label, children, className = '' }: { label?: string, children?: React.ReactNode, className?: string }) => (
    <div className={`flex items-center px-1 gap-0.5 border-r border-slate-300 h-full ${className}`}>
        {children}
    </div>
);

const ToolbarButton = ({ icon: Icon, onClick, active = false, title = '', label = '', sub = false }: any) => (
    <button 
      type="button"
      onMouseDown={(e) => e.preventDefault()} // Critical for preventing focus loss
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center p-1 rounded-sm mx-0.5 transition-all
        ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}
      `}
    >
        <Icon size={18} strokeWidth={2} />
        {label && <span className="text-xs ml-1 font-medium">{label}</span>}
        {sub && <ChevronDown size={10} className="ml-0.5 opacity-70"/>}
    </button>
);

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
  
  // Google Docs Style Table Picker
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridSize, setTableGridSize] = useState({ rows: 0, cols: 0 });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to store selection range
  const savedSelection = useRef<Range | null>(null);

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
    }
  }, [initialData, fixedFolderId]);

  // Click outside listener for table picker
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (showTableGrid && !(event.target as Element).closest('.table-picker-container')) {
              setShowTableGrid(false);
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

  const toggleTablePicker = () => {
      if (!showTableGrid) {
          // Save selection before opening
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              // Ensure selection is inside editor
              if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                  savedSelection.current = range.cloneRange();
              }
          }
      }
      setShowTableGrid(!showTableGrid);
      setTableGridSize({ rows: 0, cols: 0 });
  };

  const insertTableFromGrid = (rows: number, cols: number) => {
      setShowTableGrid(false);
      
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();

      // Restore selection if available
      const selection = window.getSelection();
      if (selection && savedSelection.current) {
          selection.removeAllRanges();
          selection.addRange(savedSelection.current);
      } else if (selection) {
          // Fallback: move to end
          selection.selectAllChildren(editor);
          selection.collapseToEnd();
      }

      if (rows > 0 && cols > 0) {
          let html = '<table style="border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 10px; border: 1px solid #ccc;"><tbody>';
          for (let i = 0; i < rows; i++) {
              html += '<tr>';
              for (let j = 0; j < cols; j++) {
                  html += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px;">&nbsp;</td>';
              }
              html += '</tr>';
          }
          html += '</tbody></table><p><br/></p>';
          
          document.execCommand('insertHTML', false, html);
          updateStats();
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] bg-[#f9fbfd] overflow-hidden rounded-xl border border-slate-300 shadow-2xl">
      
      {/* 1. TOP BAR (Google Docs Style Header) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 w-full">
              <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm">
                  <FileText size={20} />
              </div>
              <div className="flex flex-col flex-1">
                  <input 
                    type="text" 
                    className="text-lg font-medium text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-400 w-full"
                    placeholder="Untitled Document"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                  
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">File</span>
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Edit</span>
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">View</span>
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Insert</span>
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Format</span>
                      <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Tools</span>
                      
                      {/* Save Location */}
                      <span className="ml-2 text-slate-400">|</span>
                      <div className="ml-1">
                          {fixedFolderId ? (
                              <span className="font-bold text-blue-600">{folders.find(f => f.id === fixedFolderId)?.name}</span>
                          ) : (
                              <select 
                                className="bg-transparent border-none text-blue-600 font-medium focus:ring-0 cursor-pointer p-0"
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
                  <label className="flex items-center cursor-pointer bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors select-none text-xs font-medium">
                      <input 
                        type="checkbox" 
                        className="mr-2 rounded text-blue-600 focus:ring-0"
                        checked={formData.isPremium}
                        onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                      />
                      <Crown size={14} className={`mr-1 ${formData.isPremium ? 'text-amber-500' : 'text-slate-400'}`} />
                      Premium
                  </label>

                  <Button type="submit" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-6 rounded-full flex items-center h-9">
                      <Save size={16} className="mr-2" /> Share
                  </Button>
              </div>
          </div>
      </div>

      {/* 2. GOOGLE DOCS STYLE TOOLBAR */}
      <div className="bg-[#edf2fa] px-3 py-1.5 flex items-center gap-1 shrink-0 overflow-x-auto rounded-full mx-2 my-2 shadow-inner border border-white">
          {/* History */}
          <RibbonGroup>
              <ToolbarButton icon={Undo} onClick={() => execCmd('undo')} title="Undo" />
              <ToolbarButton icon={Redo} onClick={() => execCmd('redo')} title="Redo" />
              <ToolbarButton icon={Printer} onClick={() => window.print()} title="Print" />
          </RibbonGroup>

          {/* Formatting */}
          <RibbonGroup>
              <div className="flex items-center bg-white rounded px-2 h-7 border border-transparent hover:border-slate-300 mr-1">
                  <select className="text-xs bg-transparent border-none outline-none w-24 cursor-pointer" onChange={(e) => execCmd('fontName', e.target.value)}>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                  </select>
              </div>
              <div className="flex items-center bg-white rounded px-1 h-7 border border-transparent hover:border-slate-300 w-12 justify-center mr-1">
                  <select className="text-xs bg-transparent border-none outline-none cursor-pointer" onChange={(e) => execCmd('fontSize', e.target.value)}>
                      <option value="3">11</option>
                      <option value="1">8</option>
                      <option value="2">10</option>
                      <option value="4">14</option>
                      <option value="5">18</option>
                      <option value="6">24</option>
                      <option value="7">36</option>
                  </select>
              </div>
              
              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <ToolbarButton icon={Bold} onClick={() => execCmd('bold')} active={activeFormats.bold} title="Bold (Ctrl+B)" />
              <ToolbarButton icon={Italic} onClick={() => execCmd('italic')} active={activeFormats.italic} title="Italic (Ctrl+I)" />
              <ToolbarButton icon={Underline} onClick={() => execCmd('underline')} active={activeFormats.underline} title="Underline (Ctrl+U)" />
              
              <div className="relative group mx-0.5">
                  <input type="color" ref={colorInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('foreColor', e.target.value)} />
                  <ToolbarButton icon={Type} title="Text Color" className="text-slate-800" />
                  <div className="h-1 w-4 bg-black mx-auto mt-[-4px]"></div>
              </div>
              <div className="relative group mx-0.5">
                  <input type="color" ref={highlightInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('hiliteColor', e.target.value)} />
                  <ToolbarButton icon={Highlighter} title="Highlight Color" />
              </div>
          </RibbonGroup>

          {/* Insert */}
          <RibbonGroup>
              <ToolbarButton icon={LinkIcon} onClick={() => { const url = prompt('Enter URL:'); if(url) execCmd('createLink', url); }} title="Insert Link" />
              
              <div className="relative">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <ToolbarButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} title="Insert Image" />
              </div>

              {/* TABLE PICKER */}
              <div className="relative table-picker-container">
                  <ToolbarButton icon={TableIcon} onClick={toggleTablePicker} title="Insert Table" active={showTableGrid} />
                  
                  {showTableGrid && (
                      <div 
                        className="absolute top-full left-0 mt-2 bg-white border border-slate-300 shadow-xl rounded-lg p-3 z-50 w-64 animate-fade-in select-none"
                        onMouseDown={(e) => e.preventDefault()} // CRITICAL: Prevents editor blur
                      >
                          <div className="grid grid-cols-10 gap-1 mb-2">
                              {[...Array(10)].map((_, r) => (
                                  [...Array(10)].map((_, c) => {
                                      const isSelected = r < tableGridSize.rows && c < tableGridSize.cols;
                                      return (
                                          <div
                                              key={`${r}-${c}`}
                                              onMouseEnter={() => setTableGridSize({ rows: r + 1, cols: c + 1 })}
                                              onClick={() => insertTableFromGrid(r + 1, c + 1)}
                                              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 border-blue-600' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                                          />
                                      );
                                  })
                              ))}
                          </div>
                          <div className="text-center text-xs font-medium text-slate-600 border-t pt-2">
                              {tableGridSize.rows > 0 ? `${tableGridSize.cols} x ${tableGridSize.rows} Table` : 'Select Table Size'}
                          </div>
                      </div>
                  )}
              </div>
          </RibbonGroup>

          {/* Alignment & Lists */}
          <RibbonGroup>
              <ToolbarButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} active={activeFormats.justifyLeft} title="Left Align" />
              <ToolbarButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} active={activeFormats.justifyCenter} title="Center Align" />
              <ToolbarButton icon={AlignRight} onClick={() => execCmd('justifyRight')} active={activeFormats.justifyRight} title="Right Align" />
              <ToolbarButton icon={AlignJustify} onClick={() => execCmd('justifyFull')} title="Justify" />
              
              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <ToolbarButton icon={CheckSquare} title="Checklist" />
              <ToolbarButton icon={List} onClick={() => execCmd('insertUnorderedList')} active={activeFormats.insertUnorderedList} title="Bullet List" />
              <ToolbarButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} active={activeFormats.insertOrderedList} title="Numbered List" />
              
              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <ToolbarButton icon={Outdent} onClick={() => execCmd('outdent')} title="Decrease Indent" />
              <ToolbarButton icon={Indent} onClick={() => execCmd('indent')} title="Increase Indent" />
          </RibbonGroup>

          <RibbonGroup className="border-none">
              <ToolbarButton icon={RotateCcw} onClick={() => setFormData({ ...formData, body: '' })} title="Clear Formatting" />
          </RibbonGroup>
      </div>

      {/* 3. RULER */}
      <Ruler />

      {/* 4. EDITOR WORKSPACE */}
      <div 
        className="flex-1 overflow-y-auto bg-[#f9fbfd] relative p-8 flex justify-center cursor-text print:p-0 print:bg-white print:overflow-visible"
        onClick={() => editorRef.current?.focus()}
      >
          <div
            ref={editorRef}
            contentEditable
            onInput={updateStats}
            onKeyUp={checkFormats}
            onMouseUp={checkFormats}
            className="bg-white shadow-xl outline-none text-slate-900 leading-relaxed print:shadow-none print:w-full print:h-auto print:m-0"
            style={{
                width: '8.27in', // A4 Width
                minHeight: '11.69in', // A4 Height
                padding: '1in',
                fontFamily: 'Arial, sans-serif',
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
      <div className="bg-white border-t border-slate-200 px-4 py-1 flex justify-between items-center shrink-0 select-none text-xs text-slate-500">
          <div className="flex gap-4">
              <span>Page 1 of 1</span>
              <span>{wordCount} words</span>
          </div>
          <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:bg-slate-100 p-1 rounded"><Minus size={12} /></button>
              <span className="w-12 text-center">{zoom}%</span>
              <button type="button" onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:bg-slate-100 p-1 rounded"><Plus size={12} /></button>
          </div>
      </div>

    </form>
  );
};

export default WrittenContentForm;
