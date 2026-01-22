
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { PaymentRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CreditCard, CheckCircle, XCircle, Clock, DollarSign, Copy, Filter, Users, PieChart, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props {
    requests: PaymentRequest[];
    setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
}

const PaymentManagement: React.FC<Props> = ({ requests, setRequests }) => {
    const [filter, setFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [filterClass, setFilterClass] = useState<string>('ALL');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; request: PaymentRequest | null; action: 'APPROVE' | 'REJECT' }>({ isOpen: false, request: null, action: 'APPROVE' });

    const currentUser = authService.getCurrentUser();

    // ... (Analytics Logic) ...
    const analytics = useMemo(() => {
        const approved = requests.filter(r => r.status === 'APPROVED');
        return { 
            totalEarnings: approved.reduce((sum, r) => sum + r.amount, 0),
            totalSubscribers: approved.length,
            chartData: [] // Simplified for brevity in this update block
        };
    }, [requests]);

    const uniqueClasses = useMemo(() => Array.from(new Set(requests.map(r => r.studentClass || 'Unknown'))).sort(), [requests]);

    const filteredRequests = requests.filter(r => {
        const matchesStatus = filter === 'PENDING' ? r.status === 'PENDING' : r.status !== 'PENDING';
        const matchesClass = filterClass === 'ALL' || (r.studentClass || 'Unknown') === filterClass;
        return matchesStatus && matchesClass;
    });

    const handleAction = async () => {
        if (!confirmModal.request) return;
        
        try {
            if (confirmModal.action === 'APPROVE') {
                await authService.approvePayment(confirmModal.request);
                
                // LOGGING ADDED
                if (currentUser) {
                    authService.logAdminAction(
                        currentUser.id, 
                        currentUser.name, 
                        "Approved Payment", 
                        `User: ${confirmModal.request.userName} | Amount: ${confirmModal.request.amount}`, 
                        "SUCCESS"
                    );
                }
                alert("Payment Approved!");
            } else {
                await setDoc(doc(db, "payment_requests", confirmModal.request.id), { status: 'REJECTED' }, { merge: true });
                
                // LOGGING ADDED
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
            alert("Action failed.");
        } finally {
            setConfirmModal({ isOpen: false, request: null, action: 'APPROVE' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* ... (UI Code) ... */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <CreditCard className="mr-3 text-indigo-600" size={28} /> Financial & Subscription Hub
                </h1>
            </div>
            
            {/* ... (Lists & Cards) ... */}
            
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
