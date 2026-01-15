import React, { useMemo } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { Appeal } from '../../types';
import { CheckCircle, MessageSquare, Inbox, AlertCircle, TrendingUp } from 'lucide-react';

interface Props {
    appeals: Appeal[];
    setAppeals: React.Dispatch<React.SetStateAction<Appeal[]>>;
}

const AppealManagement: React.FC<Props> = ({ appeals, setAppeals }) => {

    // Calculate Dashboard Metrics
    const stats = useMemo(() => {
        const total = appeals.length;
        const pending = appeals.filter(a => a.status === 'PENDING').length;
        const replied = appeals.filter(a => a.status === 'REPLIED').length;
        const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
        return { total, pending, replied, rate };
    }, [appeals]);

    const handleReply = (id: string) => {
        const replyText = prompt("Enter your reply to the student:");
        if (replyText) {
            setAppeals(prev => prev.map(a => 
                a.id === id ? { ...a, status: 'REPLIED', reply: replyText } : a
            ));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">Appeal Management</h1>
            
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

            {/* 2. Appeal List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Student Appeals</h2>
                    <span className="text-sm text-slate-500">Showing {appeals.length} records</span>
                </div>
                
                <div className="grid gap-4">
                    {appeals.length === 0 ? (
                        <Card className="text-center py-12 text-slate-400">
                            <CheckCircle size={40} className="mx-auto mb-2 opacity-20" />
                            All caught up! No appeals found.
                        </Card>
                    ) : (
                        appeals.map(appeal => (
                            <Card key={appeal.id} className={`transition-all hover:shadow-md ${appeal.status === 'PENDING' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{appeal.contentTitle}</h3>
                                        <p className="text-sm text-slate-500">Reported by: <span className="font-medium text-slate-700">{appeal.studentName}</span> • {appeal.timestamp}</p>
                                    </div>
                                    <Badge color={appeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                        {appeal.status}
                                    </Badge>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg text-slate-700 text-sm mb-4 border border-slate-100">
                                    "{appeal.text}"
                                </div>

                                {appeal.reply && (
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-800 text-sm mb-4 flex items-start border border-emerald-100">
                                        <CheckCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">Admin Reply:</span> {appeal.reply}
                                        </div>
                                    </div>
                                )}

                                {appeal.status === 'PENDING' && (
                                    <div className="flex justify-end pt-2 border-t border-slate-100">
                                        <Button onClick={() => handleReply(appeal.id)} className="flex items-center text-sm h-9">
                                            <MessageSquare size={16} className="mr-2" />
                                            Reply to Student
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppealManagement;