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
    Inbox
} from 'lucide-react';

// Props: Receives all appeals, filters for the current student inside the component
// In a real app, you might fetch only student's appeals from the backend.
interface Props {
    appeals: Appeal[];
    studentName: string; // To filter appeals for this student
}

const StudentAppeals: React.FC<Props> = ({ appeals, studentName }) => {
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

    // --- 1. Filter Logic: Get only this student's appeals ---
    const myAppeals = useMemo(() => {
        return appeals.filter(a => a.studentName === studentName);
    }, [appeals, studentName]);

    // --- 2. Dashboard Stats ---
    const stats = useMemo(() => {
        const total = myAppeals.length;
        const pending = myAppeals.filter(a => a.status === 'PENDING').length;
        const solved = myAppeals.filter(a => a.status === 'REPLIED').length;
        return { total, pending, solved };
    }, [myAppeals]);

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <HelpCircle className="mr-3 text-indigo-600" size={28} />
                    My Support & Appeals
                </h1>
                <p className="text-slate-500 text-sm mt-1">Track the status of your content reports and questions.</p>
            </div>

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex items-center space-x-4 border-l-4 border-l-indigo-500">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <Inbox size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Total Appeals</p>
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
                        <p className="text-slate-500 text-xs font-bold uppercase">Solved</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.solved}</h3>
                    </div>
                </Card>
            </div>

            {/* APPEAL LIST */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Appeal History</h2>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {myAppeals.length} Records
                    </span>
                </div>

                {myAppeals.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">You haven't submitted any appeals yet.</p>
                        <p className="text-xs text-slate-400 mt-1">If you find an error in content, use the 'Report' button there.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myAppeals.map(appeal => (
                            <div 
                                key={appeal.id} 
                                onClick={() => setSelectedAppeal(appeal)}
                                className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <Badge color={appeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                            {appeal.status}
                                        </Badge>
                                        <span className="text-xs text-slate-400 flex items-center">
                                            <Clock size={12} className="mr-1" /> {appeal.timestamp}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                        {appeal.contentTitle}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">
                                        {appeal.text}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                    {appeal.image && (
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center">
                                            <ImageIcon size={12} className="mr-1" /> Image Attached
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
            <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title="Appeal Details">
                {selectedAppeal && (
                    <div className="flex flex-col h-[75vh]">
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto pr-2 pb-4">
                            {/* Original Report */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center">
                                    <AlertCircle size={14} className="mr-1" /> Your Report
                                </h4>
                                <p className="font-bold text-indigo-700 mb-1">{selectedAppeal.contentTitle}</p>
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">{selectedAppeal.text}</p>
                                
                                {selectedAppeal.image && (
                                    <div className="mt-3">
                                        <p className="text-xs text-slate-400 mb-1">Attached Screenshot:</p>
                                        <a href={selectedAppeal.image} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
                                            <img 
                                                src={selectedAppeal.image} 
                                                alt="Evidence" 
                                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform" 
                                            />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Click to View Full</span>
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Status Section */}
                            <div className="flex items-center justify-between border-t border-b border-slate-100 py-4 my-4">
                                <span className="text-sm text-slate-500">Current Status:</span>
                                <Badge color={selectedAppeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                    {selectedAppeal.status === 'PENDING' ? 'Processing...' : 'Resolved'}
                                </Badge>
                            </div>

                            {/* Admin Reply */}
                            {selectedAppeal.reply || selectedAppeal.replyImage ? (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center">
                                        <CheckCircle size={14} className="mr-1" /> Admin Response
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
                                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg">
                                    <Clock size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Admin has not replied yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer with Close Button */}
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

        </div>
    );
};

export default StudentAppeals;