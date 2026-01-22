
import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { PaymentRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CreditCard, CheckCircle, XCircle, Search } from 'lucide-react';

interface Props {
    requests: PaymentRequest[];
    setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
}

const PaymentManagement: React.FC<Props> = ({ requests, setRequests }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; request: PaymentRequest | null; action: 'APPROVE' | 'REJECT' }>({ isOpen: false, request: null, action: 'APPROVE' });

    // Defensive Filtering
    const filteredRequests = requests.filter(r => 
        (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.senderNumber || '').includes(searchTerm)
    );

    const handleAction = async () => {
        if (!confirmModal.request) return;
        
        try {
            if (confirmModal.action === 'APPROVE') {
                await authService.approvePayment(confirmModal.request);
                setRequests(prev => prev.map(r => r.id === confirmModal.request!.id ? { ...r, status: 'APPROVED' } : r));
            } else {
                await setDoc(doc(db, "payment_requests", confirmModal.request.id), { status: 'REJECTED' }, { merge: true });
                setRequests(prev => prev.map(r => r.id === confirmModal.request!.id ? { ...r, status: 'REJECTED' } : r));
            }
        } catch (e) {
            console.error(e);
            alert("Action failed.");
        } finally {
            setConfirmModal({ isOpen: false, request: null, action: 'APPROVE' });
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <CreditCard className="mr-3 text-indigo-600" size={28} /> Payment Requests
            </h1>

            <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search requests..."
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredRequests.map(req => (
                    <Card key={req.id} className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-slate-800">{req.userName}</h4>
                            <p className="text-sm text-slate-500">{req.method} • ৳{req.amount} • {req.trxId}</p>
                            <span className="text-xs text-slate-400">{new Date(req.timestamp).toLocaleDateString()}</span>
                        </div>
                        {req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'APPROVE' })}>Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'REJECT' })}>Reject</Button>
                            </div>
                        ) : (
                            <Badge color={req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{req.status}</Badge>
                        )}
                    </Card>
                ))}
                {filteredRequests.length === 0 && <div className="text-center text-slate-400 py-10">No requests found.</div>}
            </div>

            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} title="Confirm Action">
                <div className="space-y-4">
                    <p>Are you sure you want to {confirmModal.action} this request?</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</Button>
                        <Button onClick={handleAction} className={confirmModal.action === 'APPROVE' ? "bg-emerald-600" : "bg-red-600"}>Confirm</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentManagement;
