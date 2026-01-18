import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { CheckCircle, Zap, Crown, ShieldCheck, X, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';

interface SubscriptionPageProps {
    user: User;
    setUser: (user: User) => void;
}

const Subscription: React.FC<SubscriptionPageProps> = ({ user, setUser }) => {
    const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY' | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
    const [mobileNumber, setMobileNumber] = useState('');
    const [pin, setPin] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isPro = user.subscription?.status === 'ACTIVE';

    const handleSelectPlan = (plan: 'MONTHLY' | 'YEARLY') => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedPlan) return;

        setIsProcessing(true);
        
        // SIMULATE API DELAY
        setTimeout(async () => {
            try {
                const updatedUser = await authService.upgradeSubscription(selectedPlan);
                setUser(updatedUser);
                setIsPaymentModalOpen(false);
                alert(`Payment Successful! Welcome to Pro.`);
            } catch (error) {
                alert("Payment Failed. Try again.");
            } finally {
                setIsProcessing(false);
            }
        }, 2000);
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
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">Upgrade Your Learning</h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Unlock the full potential of EduMaster with our Pro plans. No interruptions, just pure learning.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mt-10">
                
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
                        <p className="text-3xl font-black text-indigo-600 mt-2">৳50<span className="text-sm font-medium text-slate-400">/mo</span></p>
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
                        <p className="text-3xl font-black text-slate-800 mt-2">৳500<span className="text-sm font-medium text-slate-400">/yr</span></p>
                        <p className="text-xs text-green-600 font-bold mt-1">Save ৳100 per year!</p>
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

            {/* PAYMENT MODAL (MOCK) */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Secure Payment">
                <form onSubmit={handlePayment} className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200">
                        <p className="text-sm text-slate-500">You are paying for</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">{selectedPlan === 'MONTHLY' ? 'Monthly Plan (৳50)' : 'Yearly Plan (৳500)'}</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Select Payment Method</label>
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

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{paymentMethod} Number</label>
                            <input 
                                type="tel" 
                                required
                                placeholder="017..." 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                                value={mobileNumber}
                                onChange={e => setMobileNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN</label>
                            <input 
                                type="password" 
                                required
                                placeholder="****" 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-2 rounded">
                        <ShieldCheck size={14} className="mr-1.5" />
                        100% Secure Payment via {paymentMethod} Gateway
                    </div>

                    <Button type="submit" className="w-full py-3 flex items-center justify-center" disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 size={18} className="animate-spin mr-2" /> Processing...
                            </>
                        ) : (
                            <>
                                Pay Now <Zap size={18} className="ml-2 fill-current" />
                            </>
                        )}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default Subscription;