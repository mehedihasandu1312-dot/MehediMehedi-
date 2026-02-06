
import React, { useState } from 'react';
import { Card } from '../../components/UI';
import { Calendar, Calculator, PenTool } from 'lucide-react';
import SEO from '../../components/SEO';

const Tools: React.FC = () => {
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

    const getBanglaDate = (isoDate: string) => {
        if (!isoDate) return '';
        const d = new Date(isoDate);
        return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <SEO title="Student Tools" description="Utility tools for students." />
            
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <PenTool className="mr-3 text-brand-600" size={28} />
                    Student Tools
                </h1>
                <p className="text-slate-500 text-sm mt-1">Helpful utilities to make your student life easier.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* BANGLA DATE CONVERTER */}
                <Card className="p-6 border-t-4 border-t-brand-600 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-50 rounded-full blur-2xl opacity-50"></div>
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shadow-sm">
                            <Calendar size={24} />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800">Bangla Date</h3>
                    </div>
                    
                    <div className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select English Date</label>
                            <input 
                                type="date" 
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 font-medium bg-slate-50"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                            />
                        </div>

                        <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 text-center shadow-inner">
                            <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mb-2">Bangla Date</p>
                            <p className="text-2xl font-black text-brand-700 leading-tight">{getBanglaDate(dateInput)}</p>
                            <p className="text-[10px] text-brand-400 mt-2 font-medium">Useful for applications</p>
                        </div>
                    </div>
                </Card>

                {/* AGE CALCULATOR (Placeholder for future) */}
                <Card className="p-6 border-t-4 border-t-indigo-500 shadow-sm opacity-60">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Calculator size={24} />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800">Age Calculator</h3>
                    </div>
                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Coming Soon
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Tools;
