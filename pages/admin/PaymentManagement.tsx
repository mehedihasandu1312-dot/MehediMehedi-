import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { PaymentRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { CreditCard, CheckCircle, XCircle, Search, Clock, DollarSign, Smartphone, Copy, Filter, TrendingUp, Users, PieChart, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const PaymentManagement: React.FC = () => {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [filter, setFilter] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [filterClass, setFilterClass] = useState<string>('ALL');
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

    // --- ANALYTICS CALCULATION ---
    const analytics = useMemo(() => {
        const approved = requests.filter(r => r.status === 'APPROVED');
        
        const totalEarnings = approved.reduce((sum, r) => sum + r.amount, 0);
        const totalSubscribers = approved.length;

        // Class-wise breakdown
        const classData: Record<string, { earnings: number; count: number }> = {};
        
        approved.forEach(r => {
            const cls = r.studentClass || 'Unknown';
            if (!classData[cls]) classData[cls] = { earnings: 0, count: 0 };
            classData[cls].earnings += r.amount;
            classData[cls].count += 1;
        });

        const chartData = Object.keys(classData).map(cls => ({
            name: cls,
            earnings: classData[cls].earnings,
            subscribers: classData[cls].count
        }));

        return { totalEarnings, totalSubscribers, chartData, classData };
    }, [requests]);

    // Unique Classes for Filter
    const uniqueClasses = useMemo(() => {
        const classes = new Set(requests.map(r => r.studentClass || 'Unknown'));
        return Array.from(classes).sort();
    }, [requests]);

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
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <CreditCard className="mr-3 text-indigo-600" size={28} />
                    Financial & Subscription Hub
                </h1>
            </div>

            {/* 1. FINANCIAL DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center p-6 border-l-4 border-l-emerald-500 bg-white shadow-sm">
                    <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mr-4">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Total Revenue</p>
                        <h3 className="text-3xl font-black text-slate-800">৳{analytics.totalEarnings.toLocaleString()}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-6 border-l-4 border-l-indigo-500 bg-white shadow-sm">
                    <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mr-4">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Total Subscribers</p>
                        <h3 className="text-3xl font-black text-slate-800">{analytics.totalSubscribers}</h3>
                    </div>
                </Card>
                <Card className="flex items-center p-6 border-l-4 border-l-amber-500 bg-white shadow-sm">
                    <div className="p-4 bg-amber-50 rounded-full text-amber-600 mr-4">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Pending Review</p>
                        <h3 className="text-3xl font-black text-slate-800">{requests.filter(r => r.status === 'PENDING').length}</h3>
                    </div>
                </Card>
            </div>

            {/* 2. ANALYTICS CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-indigo-600"/> Revenue by Class
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} interval={0} />
                                <YAxis />
                                <Tooltip formatter={(value) => `৳${value}`} />
                                <Legend />
                                <Bar dataKey="earnings" name="Revenue (৳)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <PieChart size={18} className="mr-2 text-purple-600"/> Subscribers by Class
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="subscribers" name="Subscribers" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* 3. REQUEST LIST HEADER & FILTER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
                <div className="flex bg-slate-100 p-1 rounded-lg">
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

                <div className="flex items-center space-x-2">
                    <Filter size={18} className="text-slate-400" />
                    <select 
                        className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[150px]"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="ALL">All Classes</option>
                        {uniqueClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 4. REQUESTS LIST */}
            <div className="grid gap-4">
                {filteredRequests.length === 0 ? (
                    <Card className="text-center py-10 text-slate-400 border border-dashed">
                        <CheckCircle size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No matching requests found.</p>
                    </Card>
                ) : (
                    filteredRequests.map(req => (
                        <Card key={req.id} className={`border-l-4 ${req.status === 'APPROVED' ? 'border-l-emerald-500' : req.status === 'REJECTED' ? 'border-l-red-500' : 'border-l-amber-400'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                            {req.status}
                                        </Badge>
                                        <span className="text-xs text-slate-400">{new Date(req.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-800">{req.userName}</h3>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">
                                            {req.studentClass || 'Unknown Class'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">{req.userEmail}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
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
                                            className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center w-full shadow-sm"
                                        >
                                            <CheckCircle size={16} className="mr-2" /> Approve
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            onClick={() => setConfirmModal({ isOpen: true, request: req, action: 'REJECT' })}
                                            className="flex items-center justify-center w-full shadow-sm"
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