import React, { useState, useEffect } from 'react';
import AdBanner from './AdBanner';
import { X, Clock, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface AdModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    timerSeconds?: number; // How long user must wait
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, title = "Advertisement", timerSeconds = 5 }) => {
    const [timeLeft, setTimeLeft] = useState(timerSeconds);
    const [canClose, setCanClose] = useState(false);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        // CHECK PRO STATUS
        const user = authService.getCurrentUser();
        if (user?.subscription?.status === 'ACTIVE') {
            setIsPro(true);
            if (isOpen) {
                onClose(); // Auto close if open
            }
            return;
        }

        if (isOpen) {
            setTimeLeft(timerSeconds);
            setCanClose(false);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, timerSeconds]);

    if (!isOpen || isPro) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-scale-up">
                
                {/* Header */}
                <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center text-slate-600 text-sm font-bold uppercase tracking-wider">
                        <AlertCircle size={16} className="mr-2" />
                        {title}
                    </div>
                    {canClose ? (
                        <button 
                            onClick={onClose}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center"
                        >
                            <X size={14} className="mr-1" /> CLOSE
                        </button>
                    ) : (
                        <div className="flex items-center text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-full">
                            <Clock size={14} className="mr-1 animate-spin" />
                            Wait {timeLeft}s
                        </div>
                    )}
                </div>

                {/* Ad Content Area */}
                <div className="p-6 bg-slate-50 flex flex-col items-center justify-center min-h-[300px]">
                    <p className="text-xs text-slate-400 mb-4">Please watch this sponsor message to continue.</p>
                    
                    {/* Large Rectangle Ad Unit */}
                    <AdBanner slotId="POPUP_MODAL_AD_ID" format="rectangle" className="w-full max-w-[336px] min-h-[280px]" />
                    
                </div>

                {/* Footer */}
                <div className="bg-white p-4 border-t border-slate-100 text-center">
                    <button 
                        disabled={!canClose}
                        onClick={onClose}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                            canClose 
                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200 transform hover:scale-[1.02]' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {canClose ? "Continue to App 🚀" : `Reward unlocking in ${timeLeft}s...`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdModal;