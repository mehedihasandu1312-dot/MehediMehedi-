
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './UI';
import { 
  Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Link as LinkIcon, Image as ImageIcon,
  RotateCcw, RotateCw, 
  Printer, Type, Highlighter,
  Minus, Plus, Table as TableIcon,
  CheckSquare, BarChart, GitCompare, Loader2, X,
  Undo, Redo
} from 'lucide-react';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// --- HELPER COMPONENTS ---
const Ruler = () => (
  <div className="h-6 bg-[#f9fbfd] border-b border-slate-300 flex items-end relative select-none shrink-0 z-10">
    <div className="w-full h-full relative mx-auto" style={{ maxWidth: '8.27in' }}>
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
    </div>
  </div>
);

const ToolbarButton = ({ icon: Icon, onClick, active = false, title = '', disabled = false }: any) => (
    <button 
      type="button"
      onMouseDown={(e) => e.preventDefault()} 
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue = '', onChange, placeholder }) => {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  // Table Picker
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridSize, setTableGridSize] = useState({ rows: 0, cols: 0 });

  // Chart Builder State
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartConfig, setChartConfig] = useState<{
      type: 'bar' | 'pie' | 'line' | 'doughnut';
      title: string;
      labels: string[];
      data: string[]; 
  }>({
      type: 'bar',
      title: '',
      labels: ['', '', ''],
      data: ['', '', '']
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize
  useEffect(() => {
    if (editorRef.current && initialValue) {
        if (editorRef.current.innerHTML !== initialValue) {
            editorRef.current.innerHTML = initialValue;
            forceUpdateStats();
        }
    }
  }, []); // Run once on mount

  // --- STATS & SYNC ---
  const forceUpdateStats = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText || '';
      const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(count);
      checkFormats();
      onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
          forceUpdateStats();
      }, 500);
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
    if (editorRef.current) editorRef.current.focus();
    forceUpdateStats();
  };

  // --- HANDLERS ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const storageRef = ref(storage, `content_images/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null,
            (error) => { console.error(error); setIsUploading(false); },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (editorRef.current) {
                    editorRef.current.focus();
                    document.execCommand('insertHTML', false, `<img src="${downloadURL}" style="max-width: 100%; height: auto; margin: 10px 0;" /><br/>`);
                    forceUpdateStats();
                }
                setIsUploading(false);
            }
        );
    } catch (error) { setIsUploading(false); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertTable = (rows: number, cols: number) => {
      setShowTableGrid(false);
      if (editorRef.current) editorRef.current.focus();
      if (rows > 0 && cols > 0) {
          let html = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ccc;"><tbody>';
          const colWidth = Math.floor(100 / cols);
          for (let i = 0; i < rows; i++) {
              html += '<tr>';
              for (let j = 0; j < cols; j++) {
                  html += `<td style="border: 1px solid #ccc; padding: 5px; width: ${colWidth}%;">&nbsp;</td>`;
              }
              html += '</tr>';
          }
          html += '</tbody></table><p><br/></p>';
          document.execCommand('insertHTML', false, html);
          forceUpdateStats();
      }
  };

  const handleInsertChart = () => {
      const validIndices = chartConfig.labels.map((l, i) => l.trim() ? i : -1).filter(i => i !== -1);
      const labels = validIndices.map(i => chartConfig.labels[i]);
      const data = validIndices.map(i => Number(chartConfig.data[i]) || 0);
      const qcConfig = {
          type: chartConfig.type,
          data: {
              labels: labels,
              datasets: [{
                  label: chartConfig.title || 'Data',
                  data: data,
                  backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'],
              }]
          }
      };
      const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(qcConfig))}&w=500&h=300`;
      if(editorRef.current) editorRef.current.focus();
      document.execCommand('insertHTML', false, `<img src="${url}" alt="Chart" style="max-width: 100%;" /><br/>`);
      setShowChartModal(false);
      forceUpdateStats();
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden rounded-xl border border-slate-300 shadow-sm relative">
      {/* TOOLBAR */}
      <div className="bg-[#edf2fa] px-3 py-1.5 flex items-center gap-0.5 shrink-0 overflow-x-auto border-b border-slate-200">
          <ToolbarButton icon={Undo} onClick={() => execCmd('undo')} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => execCmd('redo')} title="Redo" />
          <ToolbarSeparator />
          <div className="flex items-center bg-white rounded-[4px] px-2 h-7 border border-transparent hover:border-slate-300 mx-1">
              <select className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none w-20 cursor-pointer" onChange={(e) => execCmd('fontName', e.target.value)}>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
              </select>
          </div>
          <div className="flex items-center bg-white rounded-[4px] px-1 h-7 border border-transparent hover:border-slate-300 w-12 justify-center mx-1">
              <select className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer" onChange={(e) => execCmd('fontSize', e.target.value)} defaultValue="3">
                  <option value="1">Small</option>
                  <option value="3">Normal</option>
                  <option value="5">Large</option>
                  <option value="7">Huge</option>
              </select>
          </div>
          <ToolbarSeparator />
          <ToolbarButton icon={Bold} onClick={() => execCmd('bold')} active={activeFormats.bold} />
          <ToolbarButton icon={Italic} onClick={() => execCmd('italic')} active={activeFormats.italic} />
          <ToolbarButton icon={Underline} onClick={() => execCmd('underline')} active={activeFormats.underline} />
          <div className="relative group mx-0.5">
              <input type="color" ref={colorInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('foreColor', e.target.value)} />
              <ToolbarButton icon={Type} title="Text Color" />
              <div className="h-0.5 w-4 bg-black mx-auto mt-[-6px] rounded-full group-hover:bg-blue-600 transition-colors"></div>
          </div>
          <div className="relative group mx-0.5">
              <input type="color" ref={highlightInputRef} className="absolute opacity-0 w-full h-full cursor-pointer z-10" onChange={(e) => execCmd('hiliteColor', e.target.value)} defaultValue="#ffff00" />
              <ToolbarButton icon={Highlighter} title="Highlight" />
              <div className="h-0.5 w-4 bg-yellow-400 mx-auto mt-[-6px] rounded-full"></div>
          </div>
          <ToolbarSeparator />
          <ToolbarButton icon={LinkIcon} onClick={() => { const url = prompt('Enter URL:'); if(url) execCmd('createLink', url); }} />
          <div className="relative">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <ToolbarButton icon={isUploading ? Loader2 : ImageIcon} onClick={() => fileInputRef.current?.click()} className={isUploading ? 'animate-spin' : ''} />
          </div>
          <ToolbarButton icon={BarChart} onClick={() => setShowChartModal(true)} title="Insert Chart" />
          <ToolbarButton icon={GitCompare} onClick={() => { 
                if(editorRef.current) editorRef.current.focus();
                document.execCommand('insertHTML', false, '<table style="width:100%; border:1px solid #ccc;"><tr><th style="border:1px solid #ccc; padding:5px;">A</th><th style="border:1px solid #ccc; padding:5px;">B</th></tr><tr><td style="border:1px solid #ccc; padding:5px;">...</td><td style="border:1px solid #ccc; padding:5px;">...</td></tr></table><br/>');
          }} title="Comparison Table" />
          
          <div className="relative">
              <ToolbarButton icon={TableIcon} onClick={() => setShowTableGrid(!showTableGrid)} active={showTableGrid} />
              {showTableGrid && (
                  <div className="absolute top-full left-0 mt-2 bg-white border shadow-xl rounded-lg p-3 z-[100] w-52" onMouseDown={e => e.preventDefault()}>
                      <div className="grid grid-cols-8 gap-1">
                          {[...Array(8)].map((_, r) => [...Array(8)].map((_, c) => (
                              <div key={`${r}-${c}`} 
                                   onMouseEnter={() => setTableGridSize({ rows: r + 1, cols: c + 1 })}
                                   onClick={() => insertTable(r + 1, c + 1)}
                                   className={`w-4 h-4 border rounded-[2px] cursor-pointer ${r < tableGridSize.rows && c < tableGridSize.cols ? 'bg-blue-500 border-blue-600' : 'bg-white'}`} 
                              />
                          )))}
                      </div>
                      <div className="text-center text-xs mt-2">{tableGridSize.cols} x {tableGridSize.rows} Table</div>
                  </div>
              )}
          </div>
          <ToolbarSeparator />
          <ToolbarButton icon={AlignLeft} onClick={() => execCmd('justifyLeft')} active={activeFormats.justifyLeft} />
          <ToolbarButton icon={AlignCenter} onClick={() => execCmd('justifyCenter')} active={activeFormats.justifyCenter} />
          <ToolbarButton icon={AlignRight} onClick={() => execCmd('justifyRight')} active={activeFormats.justifyRight} />
          <ToolbarButton icon={AlignJustify} onClick={() => execCmd('justifyFull')} active={activeFormats.justifyFull} />
          <ToolbarSeparator />
          <ToolbarButton icon={CheckSquare} onClick={() => execCmd('insertUnorderedList')} />
          <ToolbarButton icon={List} onClick={() => execCmd('insertUnorderedList')} active={activeFormats.insertUnorderedList} />
          <ToolbarButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} active={activeFormats.insertOrderedList} />
          <ToolbarSeparator />
          <ToolbarButton icon={Outdent} onClick={() => execCmd('outdent')} />
          <ToolbarButton icon={Indent} onClick={() => execCmd('indent')} />
      </div>

      <Ruler />

      {/* EDITOR AREA */}
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] p-8 flex justify-center cursor-text" onClick={() => editorRef.current?.focus()}>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyUp={checkFormats}
            onMouseUp={checkFormats}
            className="bg-white shadow-lg outline-none text-slate-900 leading-relaxed"
            style={{
                width: '8.27in', 
                minHeight: '11.69in', 
                padding: '1in',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt', 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: '2rem',
                backgroundColor: '#ffffff'
            }}
            data-placeholder={placeholder}
          />
      </div>

      {/* STATUS BAR */}
      <div className="bg-white border-t border-slate-200 px-4 py-1.5 flex justify-between items-center text-xs text-slate-500 z-10">
          <div>{wordCount} words</div>
          <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:bg-slate-100 p-1 rounded"><Minus size={12} /></button>
              <span className="w-10 text-center">{zoom}%</span>
              <button type="button" onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:bg-slate-100 p-1 rounded"><Plus size={12} /></button>
          </div>
      </div>

      {/* CHART MODAL */}
      {showChartModal && (
          <div className="absolute inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold">Insert Chart</h3>
                      <button onClick={() => setShowChartModal(false)}><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                      <select className="w-full p-2 border rounded" value={chartConfig.type} onChange={e => setChartConfig({...chartConfig, type: e.target.value as any})}>
                          <option value="bar">Bar Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="line">Line Chart</option>
                      </select>
                      <input className="w-full p-2 border rounded" placeholder="Chart Title" value={chartConfig.title} onChange={e => setChartConfig({...chartConfig, title: e.target.value})} />
                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Label</span><span>Value</span></div>
                          {chartConfig.labels.map((l, i) => (
                              <div key={i} className="flex gap-2 mb-2">
                                  <input className="flex-1 p-2 border rounded text-sm" placeholder="Label" value={l} onChange={e => { const nl = [...chartConfig.labels]; nl[i] = e.target.value; setChartConfig({...chartConfig, labels: nl}); }} />
                                  <input className="w-24 p-2 border rounded text-sm" type="number" placeholder="0" value={chartConfig.data[i]} onChange={e => { const nd = [...chartConfig.data]; nd[i] = e.target.value; setChartConfig({...chartConfig, data: nd}); }} />
                              </div>
                          ))}
                      </div>
                      <Button className="w-full" onClick={handleInsertChart}>Insert Chart</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RichTextEditor;
