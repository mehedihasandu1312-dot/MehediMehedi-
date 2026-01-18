import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { PaymentRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { CreditCard, CheckCircle, XCircle, Search, Clock, DollarSign, Smartphone, Copy } from 'lucide-react';

const PaymentManagement: React.FC = () => {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [filter, setFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [isLoading, setIsLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; request: PaymentRequest | null; action: 'APPROVE' | 'REJECT' }>({ isOpen: false, request: null, action: 'APPROVE' });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "payment_requests"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as PaymentRequest);
            setRequests(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredRequests = requests.filter(r => 
        filter === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING'
    );

    const handleAction = async () => {
        if (!confirmModal.request) return;
        
        try {
            if (confirmModal.action === 'APPROVE') {
                await authService.approvePayment(confirmModal.request);
                alert("Payment Approved! User subscription updated.");
            } else {
                // Reject logic
                await setDoc(doc(db, "payment_requests", confirmModal.request.id), { status: 'REJECTED' }, { merge: true });
            }
        } catch (e) {
            console.error(e);
            alert("Action failed.");
        } finally {
            setConfirmModal({ isOpen: false, request: null, action: 'APPROVE' });
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading requests...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <CreditCard className="mr-3 text-indigo-600" size={28} />
                    Payment Requests
                </h1>
                
                <div className="bg-slate-100 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'PENDING' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}
                    >
                        Pending ({requests.filter(r => r.status === 'PENDING').length})
                    </button>
                    <button 
                        onClick={() => setFilter('HISTORY')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'HISTORY' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredRequests.length === 0 ? (
                    <Card className="text-center py-10 text-slate-400">
                        <CheckCircle size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No requests found.</p>
                    </Card>
                ) : (
                    filteredRequests.map(req => (
                        <Card key={req.id} className="border-l-4 border-l-slate-300">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                            {req.status}
                                        </Badge>
                                        <span className="text-xs text-slate-400">{new Date(req.timestamp).toLocaleString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">{req.userName}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{req.userEmail}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Method</p>
                                            <p className="text-sm font-bold text-slate-700 flex items-center">
                                                {req.method} <span className="mx-1">•</span> {req.senderNumber}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">TrxID</p>
                                            <p className="text-sm font-mono font-bold text-indigo-600 flex items-center select-all">
                                                {req.trxId}
                                                <button onClick={() => navigator.clipboard.writeText(req.trxId)} className="ml-2 text-slate-400 hover:text-indigo-600"><Copy size={12}/></button>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Plan</p>
                                            <p className="text-sm font-bold text-slate-700">{req.plan}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold">Amount</p>
                                            <p className="text-sm font-bold text-slate-700">৳{req.amount}</p>
                                        </div>
                                    </div>
                                </div>

                                {req.status === 'PENDING' && (
                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        <Button 
                                            onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'APPROVE' })}
                                            className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center w-full"
                                        >
                                            <CheckCircle size={16} className="mr-2" /> Approve
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'REJECT' })}
                                            className="flex items-center justify-center w-full"
                                        >
                                            <XCircle size={16} className="mr-2" /> Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
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
                    {confirmModal.action === 'APPROVE' && (
                        <div className="text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100">
                            Approving will automatically enable the <strong>{confirmModal.request?.plan}</strong> subscription for this user.
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</Button>
                        <Button 
                            className={confirmModal.action === 'APPROVE' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                            onClick={handleAction}
                        >
                            Confirm {confirmModal.action}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentManagement;