import React, { useMemo, useState, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Appeal } from '../../types';
import { CheckCircle, MessageSquare, Inbox, AlertCircle, TrendingUp, Filter, ImageIcon, Send, X, Upload } from 'lucide-react';

interface Props {
    appeals: Appeal[];
    setAppeals: React.Dispatch<React.SetStateAction<Appeal[]>>;
}

const CANNED_RESPONSES = [
    "Thank you for reporting. We have fixed the issue.",
    "The content is correct. Please check your textbook reference.",
    "We have noted this and will update it in the next maintenance cycle.",
    "Image added as requested. Thanks!",
    "Question format has been corrected."
];

const AppealManagement: React.FC<Props> = ({ appeals, setAppeals }) => {
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REPLIED'>('ALL');
    
    // Modal State
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate Dashboard Metrics
    const stats = useMemo(() => {
        const total = appeals.length;
        const pending = appeals.filter(a => a.status === 'PENDING').length;
        const replied = appeals.filter(a => a.status === 'REPLIED').length;
        const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
        return { total, pending, replied, rate };
    }, [appeals]);

    // Filter Logic
    const filteredAppeals = appeals.filter(a => {
        if (filter === 'ALL') return true;
        return a.status === filter;
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
            alert("Please enter text or attach an image.");
            return;
        }

        setAppeals(prev => prev.map(a => 
            a.id === selectedAppeal.id 
            ? { ...a, status: 'REPLIED', reply: replyText, replyImage: replyImage } 
            : a
        ));

        alert("Reply sent successfully!");
        setSelectedAppeal(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Smart Appeal Center</h1>
            </div>
            
            {/* 1. Monitoring Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center space-x-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <Inbox size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Appeals</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 border-l-4 border-l-amber-500">
                    <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Pending Action</p>
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        Student Appeals
                        <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {filteredAppeals.length}
                        </span>
                    </h2>
                    
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setFilter('ALL')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('PENDING')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'PENDING' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setFilter('REPLIED')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'REPLIED' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Resolved
                        </button>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {filteredAppeals.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <CheckCircle size={40} className="mx-auto mb-2 opacity-20" />
                            No appeals found matching filter.
                        </div>
                    ) : (
                        filteredAppeals.map(appeal => (
                            <div key={appeal.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4">
                                {/* Left: Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800 text-sm">{appeal.contentTitle}</h3>
                                                {appeal.status === 'PENDING' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                By <span className="font-medium text-indigo-600">{appeal.studentName}</span> • {appeal.timestamp}
                                            </p>
                                        </div>
                                        <Badge color={appeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                            {appeal.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 mb-2">
                                        "{appeal.text}"
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
                                <div className="flex items-center md:items-start md:border-l md:border-slate-100 md:pl-4">
                                    {appeal.status === 'PENDING' ? (
                                        <Button onClick={() => openReplyModal(appeal)} size="sm" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                                            <MessageSquare size={16} className="mr-2" /> Resolve
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

            {/* SMART REPLY MODAL - FIXED LAYOUT */}
            <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title="Resolve Appeal">
                {selectedAppeal && (
                    <div className="flex flex-col h-[80vh]">
                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            {/* Student Context */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">STUDENT REPORT</span>
                                    <span className="text-xs text-slate-400">{selectedAppeal.timestamp}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">{selectedAppeal.contentTitle}</h3>
                                <p className="text-sm text-slate-700 mb-3">{selectedAppeal.text}</p>
                                
                                {selectedAppeal.image && (
                                    <div className="relative group">
                                        <img src={selectedAppeal.image} alt="Evidence" className="w-full rounded-lg border border-slate-200 max-h-60 object-contain bg-black/5" />
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Attachment</div>
                                    </div>
                                )}
                            </div>

                            {/* Smart Reply Section */}
                            <div className="space-y-3 pb-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">Your Reply</label>
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
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px] text-sm"
                                    placeholder="Type a custom reply here..."
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
                                            <Upload size={14} className="mr-2" /> Attach Solution Image
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

                        {/* Footer Buttons - Always Visible */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-auto bg-white sticky bottom-0">
                            <Button variant="outline" onClick={() => setSelectedAppeal(null)}>Cancel</Button>
                            <Button onClick={handleSendReply} className="flex items-center bg-emerald-600 hover:bg-emerald-700">
                                <Send size={16} className="mr-2" /> Mark Resolved
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AppealManagement;