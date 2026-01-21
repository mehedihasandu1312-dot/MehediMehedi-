
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Appeal, StudyContent, MCQQuestion } from '../../types';
import { CheckCircle, MessageSquare, Inbox, AlertCircle, TrendingUp, Filter, ImageIcon, Send, X, Upload, AlertTriangle, HelpCircle, FileQuestion, Edit3, Save, Search, Link as LinkIcon, ChevronRight, RefreshCw } from 'lucide-react';

interface Props {
    appeals: Appeal[];
    setAppeals: React.Dispatch<React.SetStateAction<Appeal[]>>;
    contents?: StudyContent[]; // To find the original question
    onUpdateQuestion?: (contentId: string, question: MCQQuestion) => void; // Handler to save edits
}

const CANNED_RESPONSES = [
    "Thank you for reporting. We have fixed the issue.",
    "The content is correct. Please check your textbook reference.",
    "We have noted this and will update it in the next maintenance cycle.",
    "Image added as requested. Thanks!",
    "Question format has been corrected.",
    "Great question! Here is the explanation..."
];

const AppealManagement: React.FC<Props> = ({ appeals, setAppeals, contents = [], onUpdateQuestion }) => {
    const [viewType, setViewType] = useState<'REPORT' | 'QA'>('REPORT'); // High level filter
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REPLIED'>('ALL');
    
    // Reply Modal State
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit Question Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);

    // --- MANUAL FIX LOCATOR STATE ---
    const [manualFixAppeal, setManualFixAppeal] = useState<Appeal | null>(null);
    const [manualSearchTerm, setManualSearchTerm] = useState('');
    const [manualSelectedContent, setManualSelectedContent] = useState<StudyContent | null>(null);
    const [manualSelectedQuestionId, setManualSelectedQuestionId] = useState<string>('');

    // Info Modal State
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

    // Calculate Dashboard Metrics
    const stats = useMemo(() => {
        const typeAppeals = appeals.filter(a => a.type === viewType);
        const total = typeAppeals.length;
        const pending = typeAppeals.filter(a => a.status === 'PENDING').length;
        const replied = typeAppeals.filter(a => a.status === 'REPLIED').length;
        const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
        return { total, pending, replied, rate };
    }, [appeals, viewType]);

    // Filter Logic
    const filteredAppeals = appeals.filter(a => {
        if (a.type !== viewType) return false;
        if (statusFilter === 'ALL') return true;
        return a.status === statusFilter;
    });

    const openReplyModal = (appeal: Appeal) => {
        setSelectedAppeal(appeal);
        setReplyText(appeal.reply || '');
        setReplyImage(appeal.replyImage || '');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setReplyImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendReply = () => {
        if (!selectedAppeal || (!replyText.trim() && !replyImage)) {
            setInfoModal({
                isOpen: true,
                title: "Error",
                message: "Please enter text or attach an image.",
                type: 'ERROR'
            });
            return;
        }

        setAppeals(prev => prev.map(a => 
            a.id === selectedAppeal.id 
            ? { ...a, status: 'REPLIED', reply: replyText, replyImage: replyImage } 
            : a
        ));

        setInfoModal({
            isOpen: true,
            title: "Success",
            message: "Reply sent successfully!",
            type: 'SUCCESS'
        });
        setSelectedAppeal(null);
    };

    // --- QUICK FIX LOGIC (ENHANCED) ---
    const openQuickFix = (appeal: Appeal) => {
        // 1. Try finding content
        let content = contents.find(c => c.id === appeal.contentId);
        let question: MCQQuestion | undefined;

        if (content && content.questionList) {
            // Strategy 1: Find by ID (New System - Exact Match)
            if (appeal.questionId) {
                question = content.questionList.find(q => q.id === appeal.questionId);
            }
            
            // Strategy 2: Find by Text matching (Fallback - Fuzzy Match)
            if (!question && appeal.contentTitle) {
                // contentTitle usually comes as "Q: [Question Text]"
                const cleanTitle = appeal.contentTitle.replace(/^Q:\s*/, '').trim().toLowerCase();
                question = content.questionList.find(q => 
                    q.questionText.trim().toLowerCase() === cleanTitle || 
                    q.questionText.trim().toLowerCase().includes(cleanTitle.substring(0, 30))
                );
            }
        }

        // IF AUTOMATIC LOOKUP FAILS -> OPEN MANUAL LOCATOR
        if (!content || !question) {
            setManualFixAppeal(appeal);
            setManualSearchTerm(''); // Reset search
            setManualSelectedContent(content || null); // Pre-select file if found
            setManualSelectedQuestionId('');
            return;
        }

        // IF FOUND -> OPEN EDITOR DIRECTLY
        setEditingContentId(content.id);
        setEditingQuestion({ ...question }); 
        setIsEditModalOpen(true);
    };

    // Triggered from Manual Locator Modal
    const proceedToEditFromManual = () => {
        if (manualSelectedContent && manualSelectedQuestionId) {
            const question = manualSelectedContent.questionList?.find(q => q.id === manualSelectedQuestionId);
            if (question) {
                setEditingContentId(manualSelectedContent.id);
                setEditingQuestion({ ...question });
                setIsEditModalOpen(true);
                setManualFixAppeal(null); // Close locator
            }
        }
    };

    const saveQuestionEdit = () => {
        if (editingContentId && editingQuestion && onUpdateQuestion) {
            onUpdateQuestion(editingContentId, editingQuestion);
            
            // Auto resolve the appeal if it's pending (Find related appeal even if ID mismatch via Manual Flow)
            const relatedAppeal = manualFixAppeal || appeals.find(a => 
                a.questionId === editingQuestion.id || 
                (a.contentTitle && a.contentTitle.includes(editingQuestion.questionText.substring(0,10)))
            );
            
            if (relatedAppeal && relatedAppeal.status === 'PENDING') {
                 setAppeals(prev => prev.map(a => a.id === relatedAppeal.id ? { ...a, status: 'REPLIED', reply: 'Question has been corrected.' } : a));
            }

            setIsEditModalOpen(false);
            setEditingQuestion(null);
            setEditingContentId(null);
            setManualFixAppeal(null);
        }
    };

    const updateEditField = (field: keyof MCQQuestion, value: any) => {
        if (!editingQuestion) return;
        setEditingQuestion({ ...editingQuestion, [field]: value });
    };

    const updateOption = (idx: number, val: string) => {
        if (!editingQuestion) return;
        const newOptions = [...editingQuestion.options];
        newOptions[idx] = val;
        setEditingQuestion({ ...editingQuestion, options: newOptions });
    };

    // Filter contents for manual search
    const manualFilteredContents = contents.filter(c => 
        c.type === 'MCQ' && c.title.toLowerCase().includes(manualSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Support Center</h1>
                
                {/* Main Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex shadow-sm">
                    <button 
                        onClick={() => { setViewType('REPORT'); setStatusFilter('ALL'); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                            viewType === 'REPORT' 
                            ? 'bg-white shadow text-amber-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <AlertCircle size={16} className="mr-2" /> Reports
                    </button>
                    <button 
                        onClick={() => { setViewType('QA'); setStatusFilter('ALL'); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                            viewType === 'QA' 
                            ? 'bg-white shadow text-emerald-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <MessageSquare size={16} className="mr-2" /> Q&A
                    </button>
                </div>
            </div>
            
            {/* 1. Monitoring Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center space-x-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <Inbox size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total {viewType === 'QA' ? 'Questions' : 'Reports'}</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-amber-500">
                    <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Pending</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.pending}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Resolved</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.replied}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-indigo-500">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Resolution Rate</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.rate}%</h3>
                    </div>
                </Card>
            </div>

            {/* 2. Filter & List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        {viewType === 'QA' ? 'Student Questions' : 'Content Issues'}
                        <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {filteredAppeals.length}
                        </span>
                    </h2>
                    
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'PENDING' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setStatusFilter('REPLIED')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'REPLIED' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Resolved
                        </button>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {filteredAppeals.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            {viewType === 'QA' ? <FileQuestion size={40} className="mx-auto mb-2 opacity-20" /> : <AlertTriangle size={40} className="mx-auto mb-2 opacity-20" />}
                            No items found matching filter.
                        </div>
                    ) : (
                        filteredAppeals.map(appeal => (
                            <div key={appeal.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4">
                                {/* Left: Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800 text-sm whitespace-pre-wrap leading-tight">
                                                    {appeal.contentTitle || (viewType === 'QA' ? 'General Query' : 'Unknown Content')}
                                                </h3>
                                                {appeal.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                By <span className="font-medium text-indigo-600">{appeal.studentName}</span> • {appeal.timestamp}
                                            </p>
                                        </div>
                                        <Badge color={appeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                            {appeal.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 mb-2 whitespace-pre-wrap font-mono">
                                        {appeal.text}
                                    </div>

                                    {/* Thumbnail Preview */}
                                    {appeal.image && (
                                        <div className="mb-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Attachment</span>
                                            <img src={appeal.image} alt="Ref" className="h-16 w-auto rounded border border-slate-200 cursor-pointer hover:opacity-80" onClick={() => openReplyModal(appeal)}/>
                                        </div>
                                    )}

                                    {appeal.reply && (
                                        <div className="flex items-start text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100 mt-2">
                                            <CheckCircle size={14} className="mr-2 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold">You Replied:</span> {appeal.reply}
                                                {appeal.replyImage && (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] font-bold uppercase text-emerald-600">Image Attached</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Action */}
                                <div className="flex items-center md:items-start md:border-l md:border-slate-100 md:pl-4 flex-col gap-2">
                                    {/* FIX QUESTION BUTTON (VISIBLE FOR ALL REPORTS NOW) */}
                                    {viewType === 'REPORT' && (
                                        <Button 
                                            onClick={() => openQuickFix(appeal)} 
                                            size="sm" 
                                            variant="outline"
                                            className="w-full md:w-auto text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                                        >
                                            <Edit3 size={14} className="mr-2" /> Fix Question
                                        </Button>
                                    )}

                                    {appeal.status === 'PENDING' ? (
                                        <Button onClick={() => openReplyModal(appeal)} size="sm" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                                            <MessageSquare size={16} className="mr-2" /> {viewType === 'QA' ? 'Answer' : 'Resolve'}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => openReplyModal(appeal)} className="w-full md:w-auto text-slate-400">
                                            Edit Reply
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MANUAL LOCATOR MODAL (For Broken Links) */}
            <Modal isOpen={!!manualFixAppeal} onClose={() => setManualFixAppeal(null)} title="Locate Question Manually" size="lg">
                <div className="space-y-4 h-[60vh] flex flex-col">
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800 flex items-start">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0" />
                        <p>We couldn't automatically match this report to a question. This can happen if the Question ID changed or text was updated. Please verify the report text below and find the question manually.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                        <p className="font-bold text-slate-700 mb-1">Student Reported:</p>
                        <p className="text-slate-600 italic">"{manualFixAppeal?.text}"</p>
                        {manualFixAppeal?.contentTitle && <p className="text-xs text-slate-400 mt-2">Context: {manualFixAppeal.contentTitle}</p>}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Step 1: Select Content File */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">1. Select Content File</label>
                            {!manualSelectedContent ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 p-2 border rounded-lg" 
                                            placeholder="Search file name..." 
                                            value={manualSearchTerm}
                                            onChange={e => setManualSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border rounded-lg bg-white">
                                        {manualFilteredContents.length === 0 && <div className="p-3 text-slate-400 text-sm text-center">No matching files.</div>}
                                        {manualFilteredContents.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => setManualSelectedContent(c)}
                                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                                            >
                                                <span className="text-sm font-medium text-slate-700">{c.title}</span>
                                                <ChevronRight size={14} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <span className="font-bold text-indigo-700 flex items-center"><FileQuestion size={16} className="mr-2"/> {manualSelectedContent.title}</span>
                                    <button onClick={() => { setManualSelectedContent(null); setManualSelectedQuestionId(''); }} className="text-xs text-indigo-500 hover:underline">Change File</button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Select Question */}
                        {manualSelectedContent && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-bold text-slate-700 mb-2">2. Select Question to Fix</label>
                                <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
                                    {manualSelectedContent.questionList?.map((q, idx) => (
                                        <div 
                                            key={q.id || idx} 
                                            onClick={() => setManualSelectedQuestionId(q.id)}
                                            className={`p-3 border-b border-slate-50 cursor-pointer transition-colors ${manualSelectedQuestionId === q.id ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 rounded mt-0.5">{idx + 1}</span>
                                                <p className="text-sm text-slate-700 line-clamp-2">{q.questionText}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setManualFixAppeal(null)}>Cancel</Button>
                        <Button 
                            onClick={proceedToEditFromManual} 
                            disabled={!manualSelectedContent || !manualSelectedQuestionId}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Proceed to Edit
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* QUICK EDIT QUESTION MODAL */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Quick Fix Question">
                {editingQuestion ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Question Text</label>
                            <textarea 
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                value={editingQuestion.questionText}
                                onChange={e => updateEditField('questionText', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {editingQuestion.options.map((opt, idx) => (
                                <div key={idx}>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Option {String.fromCharCode(65+idx)}</label>
                                    <input 
                                        type="text" 
                                        className={`w-full p-2 border rounded-lg text-sm ${editingQuestion.correctOptionIndex === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
                                        value={opt}
                                        onChange={e => updateOption(idx, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Correct Answer</label>
                                <select 
                                    className="w-full p-2 border rounded-lg bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                    value={editingQuestion.correctOptionIndex}
                                    onChange={e => updateEditField('correctOptionIndex', Number(e.target.value))}
                                >
                                    {editingQuestion.options.map((_, i) => (
                                        <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Explanation</label>
                            <textarea 
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[60px]"
                                value={editingQuestion.explanation || ''}
                                onChange={e => updateEditField('explanation', e.target.value)}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button onClick={saveQuestionEdit} className="bg-emerald-600 hover:bg-emerald-700">
                                <Save size={16} className="mr-2" /> Save Correction
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10">Loading question data...</div>
                )}
            </Modal>

            {/* SMART REPLY MODAL */}
            <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title={viewType === 'QA' ? "Answer Question" : "Resolve Report"}>
                {selectedAppeal && (
                    <div className="flex flex-col h-[80vh]">
                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            {/* Student Context */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">STUDENT {viewType === 'QA' ? 'ASKED' : 'REPORTED'}</span>
                                    <span className="text-xs text-slate-400">{selectedAppeal.timestamp}</span>
                                </div>
                                {selectedAppeal.contentTitle && <h3 className="font-bold text-slate-800 mb-2 whitespace-pre-wrap">{selectedAppeal.contentTitle}</h3>}
                                <div className="text-sm text-slate-700 mb-3 bg-white p-3 rounded border border-slate-200 font-mono whitespace-pre-wrap">
                                    {selectedAppeal.text}
                                </div>
                                
                                {selectedAppeal.image && (
                                    <div className="relative group">
                                        <img src={selectedAppeal.image} alt="Evidence" className="w-full rounded-lg border border-slate-200 max-h-60 object-contain bg-black/5" />
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Attachment</div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Section */}
                            <div className="space-y-3 pb-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">Your Response</label>
                                    <span className="text-xs text-indigo-600 font-medium">Smart Suggestions</span>
                                </div>
                                
                                {/* Canned Responses */}
                                <div className="flex flex-wrap gap-2">
                                    {CANNED_RESPONSES.map((resp, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setReplyText(resp)}
                                            className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-left"
                                        >
                                            {resp}
                                        </button>
                                    ))}
                                </div>

                                <textarea 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] text-sm"
                                    placeholder={viewType === 'QA' ? "Write your answer/explanation here..." : "Type how you resolved the issue..."}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />

                                {/* Admin Image Upload */}
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleImageUpload} 
                                        accept="image/*"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            type="button" 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center text-xs"
                                        >
                                            <Upload size={14} className="mr-2" /> Attach Image/Solution
                                        </Button>
                                        {replyImage && (
                                            <span className="text-xs text-emerald-600 font-bold flex items-center">
                                                <CheckCircle size={12} className="mr-1" /> Image Added
                                            </span>
                                        )}
                                    </div>
                                    
                                    {replyImage && (
                                        <div className="mt-2 relative inline-block">
                                            <img src={replyImage} alt="Reply preview" className="h-24 rounded border border-slate-300" />
                                            <button 
                                                onClick={() => setReplyImage('')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-auto bg-white sticky bottom-0">
                            <Button variant="outline" onClick={() => setSelectedAppeal(null)}>Cancel</Button>
                            <Button onClick={handleSendReply} className="flex items-center bg-emerald-600 hover:bg-emerald-700">
                                <Send size={16} className="mr-2" /> {viewType === 'QA' ? 'Send Answer' : 'Mark Resolved'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* INFO MODAL */}
            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
                <div className="space-y-4">
                    <div className={`p-4 rounded-lg border flex items-start ${infoModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        {infoModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
                        <p>{infoModal.message}</p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default AppealManagement;
