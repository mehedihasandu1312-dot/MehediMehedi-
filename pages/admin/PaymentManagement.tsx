
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { PaymentRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign, Filter, Search } from 'lucide-react';

interface Props {
    requests: PaymentRequest[];
    setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
}

const PaymentManagement: React.FC<Props> = ({ requests, setRequests }) => {
    const [filter, setFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; request: PaymentRequest | null; action: 'APPROVE' | 'REJECT' }>({ isOpen: false, request: null, action: 'APPROVE' });

    const currentUser = authService.getCurrentUser();

    // Analytics
    const analytics = useMemo(() => {
        const approved = requests.filter(r => r.status === 'APPROVED');
        const pending = requests.filter(r => r.status === 'PENDING');
        return { 
            totalEarnings: approved.reduce((sum, r) => sum + r.amount, 0),
            pendingCount: pending.length,
            approvedCount: approved.length
        };
    }, [requests]);

    const filteredRequests = requests.filter(r => {
        const matchesStatus = filter === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING';
        const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.senderNumber.includes(searchTerm) || 
                              r.trxId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleAction = async () => {
        if (!confirmModal.request) return;
        
        try {
            if (confirmModal.action === 'APPROVE') {
                await authService.approvePayment(confirmModal.request);
                // Update local state
                setRequests(prev => prev.map(r => r.id === confirmModal.request!.id ? { ...r, status: 'APPROVED' } : r));
                
                if (currentUser) {
                    authService.logAdminAction(
                        currentUser.id, 
                        currentUser.name, 
                        "Approved Payment", 
                        `User: ${confirmModal.request.userName} | Amount: ${confirmModal.request.amount}`, 
                        "SUCCESS"
                    );
                }
            } else {
                await setDoc(doc(db, "payment_requests", confirmModal.request.id), { status: 'REJECTED' }, { merge: true });
                setRequests(prev => prev.map(r => r.id === confirmModal.request!.id ? { ...r, status: 'REJECTED' } : r));
                
                if (currentUser) {
                    authService.logAdminAction(
                        currentUser.id, 
                        currentUser.name, 
                        "Rejected Payment", 
                        `User: ${confirmModal.request.userName} | Amount: ${confirmModal.request.amount}`, 
                        "WARNING"
                    );
                }
            }
        } catch (e) {
            console.error(e);
            alert("Action failed. Check console.");
        } finally {
            setConfirmModal({ isOpen: false, request: null, action: 'APPROVE' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <CreditCard className="mr-3 text-indigo-600" size={28} /> Payment & Subscriptions
                </h1>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'PENDING' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}>Pending ({analytics.pendingCount})</button>
                    <button onClick={() => setFilter('HISTORY')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'HISTORY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>History</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex items-center p-4 border-l-4 border-l-emerald-500">
                    <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 mr-4"><DollarSign size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Total Revenue</p><h3 className="text-2xl font-bold text-slate-800">৳{analytics.totalEarnings}</h3></div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-l-amber-500">
                    <div className="bg-amber-50 p-3 rounded-full text-amber-600 mr-4"><Clock size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Pending Requests</p><h3 className="text-2xl font-bold text-slate-800">{analytics.pendingCount}</h3></div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-l-indigo-500">
                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 mr-4"><CheckCircle size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Approved Subs</p><h3 className="text-2xl font-bold text-slate-800">{analytics.approvedCount}</h3></div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by User Name, Number or TrxID..."
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                        No requests found.
                    </div>
                ) : (
                    filteredRequests.map(req => (
                        <Card key={req.id} className={`flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 ${req.status === 'PENDING' ? 'border-l-amber-500' : req.status === 'APPROVED' ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-800 text-lg">{req.userName}</h4>
                                    <Badge color="bg-slate-100 text-slate-600">{req.studentClass}</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mt-2">
                                    <div><span className="text-slate-400 text-xs uppercase">Plan</span><br/><span className="font-bold text-indigo-600">{req.plan}</span></div>
                                    <div><span className="text-slate-400 text-xs uppercase">Amount</span><br/><span className="font-bold text-emerald-600">৳{req.amount}</span></div>
                                    <div><span className="text-slate-400 text-xs uppercase">Method</span><br/><span className="font-bold">{req.method}</span></div>
                                    <div><span className="text-slate-400 text-xs uppercase">TrxID</span><br/><span className="font-mono bg-slate-100 px-1 rounded">{req.trxId}</span></div>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    Sender: {req.senderNumber} • {new Date(req.timestamp).toLocaleString()}
                                </div>
                            </div>

                            {req.status === 'PENDING' ? (
                                <div className="flex gap-2">
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'APPROVE' })}>
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'REJECT' })}>
                                        Reject
                                    </Button>
                                </div>
                            ) : (
                                <Badge color={req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                    {req.status}
                                </Badge>
                            )}
                        </Card>
                    ))
                )}
            </div>
            
            {/* CONFIRM MODAL */}
            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} title={`Confirm ${confirmModal.action === 'APPROVE' ? 'Approval' : 'Rejection'}`}>
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Are you sure you want to <strong>{confirmModal.action}</strong> this request from <strong>{confirmModal.request?.userName}</strong>?
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</Button>
                        <Button onClick={handleAction} className={confirmModal.action === 'APPROVE' ? "bg-emerald-600" : "bg-red-600"}>
                            Confirm {confirmModal.action}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentManagement;
