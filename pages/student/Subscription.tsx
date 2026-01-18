import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { CheckCircle, Zap, Crown, ShieldCheck, X, Loader2, Copy, AlertTriangle, Star } from 'lucide-react';
import { authService } from '../../services/authService';
import { User, PaymentRequest, SystemSettings } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

interface SubscriptionPageProps {
    user: User;
    setUser: (user: User) => void;
}

const Subscription: React.FC<SubscriptionPageProps> = ({ user, setUser }) => {
    const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY' | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
    
    // Inputs
    const [senderNumber, setSenderNumber] = useState('');
    const [trxId, setTrxId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch Settings for Pricing & Numbers
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    React.useEffect(() => {
        // Simple fetch of settings for pricing
        const unsubscribe = onSnapshot(doc(db, "settings", "global_settings"), (doc) => {
            if(doc.exists()) {
                setSettings({ id: doc.id, ...doc.data() } as SystemSettings);
            }
        });
        return () => unsubscribe();
    }, []);

    // Get Pricing for User's Class
    const pricing = useMemo(() => {
        const userClass = user.class;
        if (!settings || !settings.pricing || !userClass) return null;
        
        const classPrice = settings.pricing[userClass];
        
        // Return price only if configured (greater than 0)
        if (classPrice && (classPrice.monthly > 0 || classPrice.yearly > 0)) {
            return classPrice;
        }
        return null;
    }, [settings, user.class]);

    // Get Dynamic Merchant Numbers
    const merchantNumbers = useMemo(() => {
        return {
            bKash: settings?.paymentNumbers?.bKash || "Not Set",
            Nagad: settings?.paymentNumbers?.Nagad || "Not Set"
        };
    }, [settings]);

    const isPro = user.subscription?.status === 'ACTIVE';

    const handleSelectPlan = (plan: 'MONTHLY' | 'YEARLY') => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedPlan || !pricing) return;

        setIsProcessing(true);
        
        try {
            const amount = selectedPlan === 'MONTHLY' ? pricing.monthly : pricing.yearly;
            
            const request: PaymentRequest = {
                id: `pay_${Date.now()}`,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                studentClass: user.class || 'Unknown',
                amount: amount,
                method: paymentMethod,
                plan: selectedPlan,
                senderNumber: senderNumber,
                trxId: trxId,
                status: 'PENDING',
                timestamp: new Date().toISOString()
            };

            await authService.submitPaymentRequest(request);
            
            setIsPaymentModalOpen(false);
            alert("Payment Request Submitted! \nPlease wait for admin approval (usually within 30 mins).");
            
            // Clear Form
            setSenderNumber('');
            setTrxId('');

        } catch (error) {
            alert("Submission Failed. Please check internet connection.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isPro) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in py-10 text-center">
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <Crown size={64} className="mx-auto mb-6 text-yellow-400" fill="currentColor" />
                    <h1 className="text-4xl font-bold mb-2">You are a PRO Member!</h1>
                    <p className="text-indigo-200 mb-6">Enjoy your ad-free learning experience.</p>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-sm mx-auto border border-white/20">
                        <p className="text-sm font-bold uppercase tracking-wider text-indigo-200 mb-1">Current Plan</p>
                        <p className="text-2xl font-bold">{user.subscription?.plan === 'MONTHLY' ? 'Monthly' : 'Yearly'} Access</p>
                        <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                            Expires on: {new Date(user.subscription?.expiryDate || '').toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-8 pb-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">Your Study Plan</h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    {pricing 
                        ? `Upgrade to unlock premium features for ${user.class || 'your class'}.`
                        : `Current status for ${user.class || 'your class'}.`
                    }
                </p>
            </div>

            {pricing ? (
                /* PAID PLANS GRID */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mt-10">
                    
                    {/* FREE PLAN */}
                    <Card className="p-8 border-2 border-slate-100 hover:border-slate-200 transition-all h-full flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-700">Free</h3>
                            <p className="text-3xl font-black text-slate-800 mt-2">৳0<span className="text-sm font-medium text-slate-400">/mo</span></p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-slate-600"><CheckCircle size={16} className="text-slate-400 mr-2" /> Access Free Content</li>
                            <li className="flex items-center text-sm text-slate-600"><CheckCircle size={16} className="text-slate-400 mr-2" /> Basic Exams</li>
                            <li className="flex items-center text-sm text-slate-400 line-through decoration-slate-300"><X size={16} className="text-slate-300 mr-2" /> Ad-Free Experience</li>
                            <li className="flex items-center text-sm text-slate-400 line-through decoration-slate-300"><X size={16} className="text-slate-300 mr-2" /> Premium Badges</li>
                        </ul>
                        <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    </Card>

                    {/* MONTHLY PLAN */}
                    <Card className="p-8 border-2 border-indigo-100 bg-indigo-50/50 hover:shadow-lg transition-all h-full flex flex-col relative transform hover:-translate-y-1">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-indigo-900">Monthly</h3>
                            <p className="text-3xl font-black text-indigo-600 mt-2">৳{pricing.monthly}<span className="text-sm font-medium text-slate-400">/mo</span></p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle size={16} className="text-indigo-500 mr-2" /> Remove All Ads</li>
                            <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle size={16} className="text-indigo-500 mr-2" /> Premium Content</li>
                            <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle size={16} className="text-indigo-500 mr-2" /> Pro Badge on Profile</li>
                            <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle size={16} className="text-indigo-500 mr-2" /> Priority Support</li>
                        </ul>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSelectPlan('MONTHLY')}>Get Monthly</Button>
                    </Card>

                    {/* YEARLY PLAN */}
                    <Card className="p-8 border-4 border-yellow-400 bg-white shadow-xl h-full flex flex-col relative transform scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Best Value
                        </div>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center"><Crown size={20} className="text-yellow-500 mr-2" fill="currentColor"/> Yearly</h3>
                            <p className="text-3xl font-black text-slate-800 mt-2">৳{pricing.yearly}<span className="text-sm font-medium text-slate-400">/yr</span></p>
                            <p className="text-xs text-green-600 font-bold mt-1">Save on long term!</p>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-slate-800 font-bold"><CheckCircle size={16} className="text-yellow-500 mr-2" /> Remove All Ads Forever</li>
                            <li className="flex items-center text-sm text-slate-800 font-bold"><CheckCircle size={16} className="text-yellow-500 mr-2" /> Gold Crown Profile Badge</li>
                            <li className="flex items-center text-sm text-slate-800 font-bold"><CheckCircle size={16} className="text-yellow-500 mr-2" /> Access to Live Exams</li>
                            <li className="flex items-center text-sm text-slate-800 font-bold"><CheckCircle size={16} className="text-yellow-500 mr-2" /> Early Access Features</li>
                        </ul>
                        <Button className="w-full bg-slate-900 hover:bg-black text-white" onClick={() => handleSelectPlan('YEARLY')}>Get Yearly</Button>
                    </Card>
                </div>
            ) : (
                /* NO PRICING / FREE FULL ACCESS */
                <div className="max-w-lg mx-auto mt-10">
                    <Card className="p-8 border-2 border-emerald-100 bg-emerald-50/30 text-center shadow-lg relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50"></div>
                        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-md">
                                <Star size={40} fill="currentColor" className="animate-pulse-slow" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Full Access Unlocked</h3>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Great news! All study materials and exams for <strong>{user.class}</strong> are currently free. No subscription required.
                            </p>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 text-left space-y-4 mb-8">
                                <div className="flex items-center">
                                    <div className="bg-emerald-100 p-1.5 rounded-full mr-3 text-emerald-600">
                                        <CheckCircle size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Unlimited Content Access</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-emerald-100 p-1.5 rounded-full mr-3 text-emerald-600">
                                        <CheckCircle size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Participate in All Exams</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-amber-100 p-1.5 rounded-full mr-3 text-amber-600">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500">Ad-Supported Experience</span>
                                </div>
                            </div>

                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white pointer-events-none">
                                Active Plan
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* PAYMENT MODAL (MANUAL TRX ID) */}
            {pricing && (
                <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Complete Payment">
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                            <p className="text-sm text-slate-500">You are paying for</p>
                            <h3 className="text-xl font-bold text-slate-800 mt-1">{selectedPlan === 'MONTHLY' ? `Monthly Plan (৳${pricing.monthly})` : `Yearly Plan (৳${pricing.yearly})`}</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Select Method</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('bKash')}
                                    className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all ${paymentMethod === 'bKash' ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-pink-200'}`}
                                >
                                    <span className="text-pink-600 font-black text-lg">bKash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('Nagad')}
                                    className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all ${paymentMethod === 'Nagad' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}`}
                                >
                                    <span className="text-orange-600 font-black text-lg">Nagad</span>
                                </button>
                            </div>
                        </div>

                        {/* Instruction Box */}
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center">
                                <AlertTriangle size={16} className="mr-1.5"/> How to Pay
                            </h4>
                            <ol className="text-xs text-amber-900 space-y-1.5 list-decimal pl-4">
                                <li>Open your {paymentMethod} App.</li>
                                <li>Select <strong>Send Money</strong> option.</li>
                                <li>Send <strong>৳{selectedPlan === 'MONTHLY' ? pricing.monthly : pricing.yearly}</strong> to:</li>
                            </ol>
                            
                            <div className="flex items-center justify-between bg-white border border-amber-200 p-2 rounded mt-2">
                                <span className="font-mono font-bold text-slate-700 text-lg">{merchantNumbers[paymentMethod]}</span>
                                <button 
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(merchantNumbers[paymentMethod])}
                                    className="text-amber-600 hover:text-amber-800 p-1"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-700 mt-2">After sending, copy the <strong>Transaction ID (TrxID)</strong> and paste below.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your {paymentMethod} Number</label>
                                <input 
                                    type="tel" 
                                    required
                                    placeholder="017..." 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                                    value={senderNumber}
                                    onChange={e => setSenderNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction ID (TrxID)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. 9H7G6F5D" 
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none uppercase font-mono"
                                    value={trxId}
                                    onChange={e => setTrxId(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-2 rounded">
                            <ShieldCheck size={14} className="mr-1.5" />
                            Admin will verify TrxID before activation.
                        </div>

                        <Button type="submit" className="w-full py-3 flex items-center justify-center" disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-2" /> Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Request <Zap size={18} className="ml-2 fill-current" />
                                </>
                            )}
                        </Button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Subscription;