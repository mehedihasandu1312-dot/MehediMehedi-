
import React, { useMemo, useState } from 'react';
import { Card, Badge, Modal, Button } from '../../components/UI';
import { Appeal } from '../../types';
import { 
    AlertCircle, 
    CheckCircle, 
    Clock, 
    MessageCircle, 
    ChevronRight, 
    ImageIcon, 
    HelpCircle,
    Inbox,
    Plus,
    FileQuestion
} from 'lucide-react';

interface Props {
    appeals: Appeal[];
    studentName: string;
    onAddQA: (data: { text: string; image?: string }) => void;
}

const StudentAppeals: React.FC<Props> = ({ appeals, studentName, onAddQA }) => {
    const [activeTab, setActiveTab] = useState<'REPORT' | 'QA'>('QA');
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    
    // Q&A Modal
    const [isQaModalOpen, setIsQaModalOpen] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [questionImage, setQuestionImage] = useState('');

    // --- 1. Filter Logic ---
    const myItems = useMemo(() => {
        return appeals.filter(a => a.studentName === studentName && a.type === activeTab);
    }, [appeals, studentName, activeTab]);

    // --- 2. Dashboard Stats (Based on active tab) ---
    const stats = useMemo(() => {
        const total = myItems.length;
        const pending = myItems.filter(a => a.status === 'PENDING').length;
        const solved = myItems.filter(a => a.status === 'REPLIED').length;
        return { total, pending, solved };
    }, [myItems]);

    const handleQaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;
        
        onAddQA({ text: questionText, image: questionImage });
        setIsQaModalOpen(false);
        setQuestionText('');
        setQuestionImage('');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setQuestionImage(event.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            
            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <HelpCircle className="mr-3 text-indigo-600" size={28} />
                        Support & Q&A
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Ask questions to instructors or report content errors.</p>
                </div>
                
                <div className="bg-slate-100 p-1 rounded-xl flex shadow-sm">
                    <button 
                        onClick={() => setActiveTab('QA')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                            activeTab === 'QA' 
                            ? 'bg-white shadow text-emerald-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <MessageCircle size={16} className="mr-2" /> Q&A
                    </button>
                    <button 
                        onClick={() => setActiveTab('REPORT')}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                            activeTab === 'REPORT' 
                            ? 'bg-white shadow text-amber-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <AlertCircle size={16} className="mr-2" /> Reports
                    </button>
                </div>
            </div>

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex items-center space-x-4 border-l-4 border-l-indigo-500">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <Inbox size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Total {activeTab === 'QA' ? 'Questions' : 'Reports'}</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-amber-500">
                    <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Pending</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.pending}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Answered</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.solved}</h3>
                    </div>
                </Card>
            </div>

            {/* LIST SECTION */}
            <Card className="min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        {activeTab === 'QA' ? 'My Questions' : 'My Reports'}
                        <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {myItems.length}
                        </span>
                    </h2>
                    
                    {activeTab === 'QA' && (
                        <Button onClick={() => setIsQaModalOpen(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-700">
                            <Plus size={16} className="mr-2" /> Ask Question
                        </Button>
                    )}
                </div>

                {myItems.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {activeTab === 'QA' ? (
                            <>
                                <FileQuestion size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-medium">No questions asked yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Stuck on a topic? Ask an instructor now!</p>
                                <Button size="sm" variant="outline" className="mt-4" onClick={() => setIsQaModalOpen(true)}>Ask Now</Button>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-medium">No error reports found.</p>
                                <p className="text-xs text-slate-400 mt-1">If you find content errors, report them from the study page.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myItems.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedAppeal(item)}
                                className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <Badge color={item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                            {item.status === 'PENDING' ? 'Waiting' : 'Replied'}
                                        </Badge>
                                        <span className="text-xs text-slate-400 flex items-center">
                                            <Clock size={12} className="mr-1" /> {item.timestamp}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                        {item.contentTitle || (activeTab === 'QA' ? 'General Question' : 'Unknown Item')}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                                        {item.text}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                    {item.image && (
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center">
                                            <ImageIcon size={12} className="mr-1" /> Image
                                        </span>
                                    )}
                                    <div className="text-indigo-600 bg-indigo-50 p-2 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* DETAIL MODAL */}
            <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title={activeTab === 'QA' ? "Question Details" : "Report Details"}>
                {selectedAppeal && (
                    <div className="flex flex-col h-[75vh]">
                        <div className="flex-1 overflow-y-auto pr-2 pb-4">
                            {/* Request Content */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center">
                                    {activeTab === 'QA' ? <FileQuestion size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                                    {activeTab === 'QA' ? 'Your Question' : 'Your Report'}
                                </h4>
                                {selectedAppeal.contentTitle && <p className="font-bold text-indigo-700 mb-2 text-sm">{selectedAppeal.contentTitle}</p>}
                                <p className="text-sm text-slate-800 leading-relaxed mb-4 bg-white p-3 rounded border border-slate-100">{selectedAppeal.text}</p>
                                
                                {selectedAppeal.image && (
                                    <div className="mt-3">
                                        <p className="text-xs text-slate-400 mb-1">Attachment:</p>
                                        <a href={selectedAppeal.image} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                                            <img 
                                                src={selectedAppeal.image} 
                                                alt="Attachment" 
                                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform" 
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Response Section */}
                            {selectedAppeal.reply || selectedAppeal.replyImage ? (
                                <div className="mt-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center">
                                        <CheckCircle size={14} className="mr-1" /> Instructor Response
                                    </h4>
                                    {selectedAppeal.reply && (
                                        <p className="text-sm text-emerald-900 leading-relaxed mb-3">
                                            {selectedAppeal.reply}
                                        </p>
                                    )}
                                    {selectedAppeal.replyImage && (
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Attached Solution:</p>
                                            <a href={selectedAppeal.replyImage} target="_blank" rel="noreferrer" className="block">
                                                <img src={selectedAppeal.replyImage} alt="Admin Reply" className="max-h-48 rounded border border-emerald-200 shadow-sm" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-6 text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                                    <Clock size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Waiting for instructor response...</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 bg-white shrink-0">
                            <Button 
                                variant="primary" 
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white" 
                                onClick={() => setSelectedAppeal(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ASK QUESTION MODAL */}
            <Modal isOpen={isQaModalOpen} onClose={() => setIsQaModalOpen(false)} title="Ask a Question">
                <form onSubmit={handleQaSubmit} className="space-y-4">
                    <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800 flex items-start border border-indigo-100">
                        <HelpCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                        <p>Ask about any academic topic. Our instructors will reply as soon as possible.</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Your Question</label>
                        <textarea 
                            required 
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none"
                            placeholder="Type your question here..."
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Attach Image (Optional)</label>
                        <div className="flex items-center gap-2">
                            <div className="relative overflow-hidden w-full">
                                <button type="button" className="w-full flex items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all">
                                    <ImageIcon size={18} className="mr-2" />
                                    {questionImage ? 'Change Image' : 'Upload Screenshot / Photo'}
                                </button>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                            </div>
                        </div>
                        {questionImage && (
                            <div className="mt-2 relative inline-block">
                                <img src={questionImage} alt="Preview" className="h-20 rounded border border-slate-200" />
                                <button 
                                    type="button" 
                                    onClick={() => setQuestionImage('')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                                >
                                    <span className="sr-only">Remove</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsQaModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Submit Question</Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default StudentAppeals;
