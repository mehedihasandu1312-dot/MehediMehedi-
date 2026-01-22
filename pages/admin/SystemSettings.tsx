import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { SystemSettings, ClassPrice, PremiumFeature } from '../../types';
import { Sliders, Plus, Trash2, Save, BookOpen, GraduationCap, AlertTriangle, Edit2, Check, X, CheckCircle, DollarSign, Settings, CreditCard, Lock, Unlock, Crown } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

interface Props {
    settings: SystemSettings[];
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings[]>>;
}

const AVAILABLE_FEATURES: { id: PremiumFeature; label: string; icon: any }[] = [
    { id: 'NO_ADS', label: 'Ad-Free Experience', icon: Crown },
    { id: 'EXAMS', label: 'Exams & Quizzes', icon: BookOpen },
    { id: 'CONTENT', label: 'PDF Notes & Suggestions', icon: Sliders },
    { id: 'LEADERBOARD', label: 'Leaderboard Ranking', icon: Lock },
    { id: 'SOCIAL', label: 'Social Community', icon: Lock }
];

const SystemSettingsPage: React.FC<Props> = ({ settings, setSettings }) => {
    const defaultSettings: SystemSettings = {
        id: 'global_settings',
        educationLevels: { REGULAR: [], ADMISSION: [] },
        pricing: {},
        lockedFeatures: {},
        paymentNumbers: { bKash: '', Nagad: '' }
    };

    const currentSettings = settings.find(s => s.id === 'global_settings') || defaultSettings;

    const [regularList, setRegularList] = useState<string[]>([]);
    const [admissionList, setAdmissionList] = useState<string[]>([]);
    const [pricingMap, setPricingMap] = useState<Record<string, ClassPrice>>({});
    const [lockedFeaturesMap, setLockedFeaturesMap] = useState<Record<string, PremiumFeature[]>>({});
    const [paymentNumbers, setPaymentNumbers] = useState({ bKash: '', Nagad: '' });
    
    useEffect(() => {
        setRegularList(currentSettings.educationLevels.REGULAR || []);
        setAdmissionList(currentSettings.educationLevels.ADMISSION || []);
        setPricingMap(currentSettings.pricing || {});
        setLockedFeaturesMap(currentSettings.lockedFeatures || {});
        setPaymentNumbers(currentSettings.paymentNumbers || { bKash: '', Nagad: '' });
    }, [currentSettings]);

    const [newRegular, setNewRegular] = useState('');
    const [newAdmission, setNewAdmission] = useState('');
    const [editingItem, setEditingItem] = useState<{ index: number; type: 'REGULAR' | 'ADMISSION'; value: string } | null>(null);
    
    // --- NEW CONFIG STATE ---
    const [editingConfig, setEditingConfig] = useState<{ 
        className: string; 
        type: 'FREE' | 'PAID';
        monthly: number; 
        yearly: number;
        features: PremiumFeature[]; // Features that are PAID (Locked)
    } | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null; type: 'REGULAR' | 'ADMISSION' }>({ 
        isOpen: false, index: null, type: 'REGULAR' 
    });

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

    const handleSave = async () => {
        const updatedSettings: SystemSettings = {
            id: 'global_settings',
            educationLevels: {
                REGULAR: regularList,
                ADMISSION: admissionList
            },
            pricing: pricingMap,
            lockedFeatures: lockedFeaturesMap,
            paymentNumbers: paymentNumbers
        };

        if (settings.length === 0) {
            setSettings([updatedSettings]);
        } else {
            setSettings(settings.map(s => s.id === 'global_settings' ? updatedSettings : s));
        }
        
        try {
            await setDoc(doc(db, "settings", "global_settings"), updatedSettings);
            setInfoModal({ isOpen: true, title: "Success", message: "System settings saved successfully!" });
        } catch (error) {
            console.error("Error saving settings:", error);
            setInfoModal({ isOpen: true, title: "Error", message: "Failed to save settings to cloud." });
        }
    };

    const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
        if (item.trim() && !list.includes(item.trim())) {
            const newItem = item.trim();
            setList([...list, newItem]);
            // Default to Free
            setPricingMap(prev => ({ ...prev, [newItem]: { monthly: 0, yearly: 0 } }));
            setLockedFeaturesMap(prev => ({ ...prev, [newItem]: [] }));
            setItem('');
        }
    };

    const initiateEdit = (index: number, type: 'REGULAR' | 'ADMISSION', currentValue: string) => {
        setEditingItem({ index, type, value: currentValue });
    };

    const saveEdit = () => {
        if (!editingItem || !editingItem.value.trim()) return;

        let oldName = '';
        if (editingItem.type === 'REGULAR') {
            oldName = regularList[editingItem.index];
            const newList = [...regularList];
            newList[editingItem.index] = editingItem.value.trim();
            setRegularList(newList);
        } else {
            oldName = admissionList[editingItem.index];
            const newList = [...admissionList];
            newList[editingItem.index] = editingItem.value.trim();
            setAdmissionList(newList);
        }

        if (oldName !== editingItem.value.trim()) {
            const newPricing = { ...pricingMap };
            newPricing[editingItem.value.trim()] = newPricing[oldName] || { monthly: 0, yearly: 0 };
            delete newPricing[oldName];
            setPricingMap(newPricing);

            const newFeatures = { ...lockedFeaturesMap };
            newFeatures[editingItem.value.trim()] = newFeatures[oldName] || [];
            delete newFeatures[oldName];
            setLockedFeaturesMap(newFeatures);
        }

        setEditingItem(null);
    };

    const initiateRemove = (index: number, type: 'REGULAR' | 'ADMISSION') => {
        setDeleteModal({ isOpen: true, index, type });
    };

    const confirmRemove = () => {
        if (deleteModal.index !== null) {
            let removedName = '';
            if (deleteModal.type === 'REGULAR') {
                removedName = regularList[deleteModal.index];
                const newList = [...regularList];
                newList.splice(deleteModal.index, 1);
                setRegularList(newList);
            } else {
                removedName = admissionList[deleteModal.index];
                const newList = [...admissionList];
                newList.splice(deleteModal.index, 1);
                setAdmissionList(newList);
            }
            const newPricing = { ...pricingMap };
            delete newPricing[removedName];
            setPricingMap(newPricing);
            
            const newFeatures = { ...lockedFeaturesMap };
            delete newFeatures[removedName];
            setLockedFeaturesMap(newFeatures);

            setDeleteModal({ isOpen: false, index: null, type: 'REGULAR' });
        }
    };

    // --- NEW CONFIG LOGIC ---
    const openConfigEdit = (className: string) => {
        const currentPrice = pricingMap[className] || { monthly: 0, yearly: 0 };
        const currentFeatures = lockedFeaturesMap[className] || [];
        const isPaid = currentPrice.monthly > 0 || currentPrice.yearly > 0;

        setEditingConfig({ 
            className, 
            type: isPaid ? 'PAID' : 'FREE',
            monthly: currentPrice.monthly, 
            yearly: currentPrice.yearly,
            features: currentFeatures
        });
    };

    const toggleFeature = (featureId: PremiumFeature) => {
        if (!editingConfig) return;
        const current = editingConfig.features;
        if (current.includes(featureId)) {
            setEditingConfig({ ...editingConfig, features: current.filter(f => f !== featureId) });
        } else {
            setEditingConfig({ ...editingConfig, features: [...current, featureId] });
        }
    };

    const saveConfigEdit = () => {
        if (!editingConfig) return;
        
        let finalMonthly = editingConfig.monthly;
        let finalYearly = editingConfig.yearly;

        // If user sets to FREE, force prices to 0
        if (editingConfig.type === 'FREE') {
            finalMonthly = 0;
            finalYearly = 0;
        }

        setPricingMap(prev => ({
            ...prev,
            [editingConfig.className]: { monthly: finalMonthly, yearly: finalYearly }
        }));
        
        // If FREE, clear locked features (everything is free) OR keep them if you want a "Freemium" model
        // For simplicity based on prompt: If FREE, user usually wants everything free. 
        // But the prompt says "select features". So we save the features regardless.
        // If Type is FREE but features are locked, those features become inaccessible? 
        // No, let's stick to: Locked Features = Require Subscription. 
        // If Price is 0, Subscription is Free.
        
        setLockedFeaturesMap(prev => ({
            ...prev,
            [editingConfig.className]: editingConfig.features
        }));
        setEditingConfig(null);
    };

    const renderListItem = (item: string, index: number, type: 'REGULAR' | 'ADMISSION') => {
        const isEditing = editingItem?.index === index && editingItem?.type === type;
        const price = pricingMap[item];
        const isPaid = price && (price.monthly > 0 || price.yearly > 0);

        return (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-200 group mb-2 hover:shadow-sm transition-all">
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 w-full">
                        <input 
                            type="text" 
                            autoFocus
                            className="flex-1 p-2 text-sm border border-indigo-300 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                        <button onClick={saveEdit} className="text-emerald-600 bg-emerald-50 p-2 rounded hover:bg-emerald-100"><Check size={18} /></button>
                        <button onClick={() => setEditingItem(null)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><X size={18} /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center mb-2 sm:mb-0">
                            <span className="text-sm font-bold text-slate-700 mr-2">{item}</span>
                            
                            {/* STATUS BADGE */}
                            {isPaid ? (
                                <Badge color="bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                    <Crown size={10} fill="currentColor"/> PREMIUM
                                </Badge>
                            ) : (
                                <Badge color="bg-emerald-100 text-emerald-700 border border-emerald-200">FREE</Badge>
                            )}

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button onClick={() => initiateEdit(index, type, item)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={14} /></button>
                                <button onClick={() => initiateRemove(index, type)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => openConfigEdit(item)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                                isPaid 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <Settings size={14} />
                            <span>Configure Plan</span>
                        </button>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Sliders className="mr-3 text-indigo-600" size={28} />
                        Class & Subscription Manager
                    </h1>
                    <p className="text-slate-500 text-sm">Define classes and set which ones are Free vs Paid.</p>
                </div>
                <Button onClick={handleSave} className="flex items-center shadow-lg shadow-indigo-200">
                    <Save size={18} className="mr-2" /> Save Changes
                </Button>
            </div>

            {/* PAYMENT NUMBERS */}
            <Card className="border-t-4 border-t-pink-500 mb-8">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-100 rounded text-pink-600"><CreditCard size={20} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Merchant Numbers</h3>
                            <p className="text-xs text-slate-400">Students will send money to these numbers.</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">bKash Personal</label>
                        <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="017xxxxxxxx"
                            value={paymentNumbers.bKash} onChange={e => setPaymentNumbers({...paymentNumbers, bKash: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nagad Personal</label>
                        <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="018xxxxxxxx"
                            value={paymentNumbers.Nagad} onChange={e => setPaymentNumbers({...paymentNumbers, Nagad: e.target.value})} />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* REGULAR CLASSES */}
                <Card className="border-t-4 border-t-indigo-500">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded text-indigo-700"><BookOpen size={20} /></div>
                            <h3 className="font-bold text-slate-800">Regular Classes</h3>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6">
                        <input type="text" className="flex-1 p-2.5 border rounded-lg text-sm" placeholder="e.g. Class 9"
                            value={newRegular} onChange={e => setNewRegular(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(regularList, setRegularList, newRegular, setNewRegular)} />
                        <Button size="sm" onClick={() => addItem(regularList, setRegularList, newRegular, setNewRegular)}><Plus size={18} /> Add</Button>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {regularList.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No classes added.</p>}
                        {regularList.map((item, idx) => renderListItem(item, idx, 'REGULAR'))}
                    </div>
                </Card>

                {/* ADMISSION CATEGORIES */}
                <Card className="border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 rounded text-emerald-700"><GraduationCap size={20} /></div>
                            <h3 className="font-bold text-slate-800">Admission Batches</h3>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6">
                        <input type="text" className="flex-1 p-2.5 border rounded-lg text-sm" placeholder="e.g. Medical Admission"
                            value={newAdmission} onChange={e => setNewAdmission(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)} />
                        <Button size="sm" variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}><Plus size={18} /> Add</Button>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {admissionList.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No categories added.</p>}
                        {admissionList.map((item, idx) => renderListItem(item, idx, 'ADMISSION'))}
                    </div>
                </Card>
            </div>

            {/* CONFIG MODAL */}
            <Modal isOpen={!!editingConfig} onClose={() => setEditingConfig(null)} title={`Configure: ${editingConfig?.className}`}>
                <div className="space-y-6">
                    {/* 1. Plan Type Selector */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Access Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setEditingConfig(prev => prev ? { ...prev, type: 'FREE' } : null)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                    editingConfig?.type === 'FREE' 
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' 
                                    : 'border-slate-200 text-slate-500 hover:border-emerald-200'
                                }`}
                            >
                                <Unlock size={24} className="mb-2" />
                                <span className="font-bold">Free Access</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingConfig(prev => prev ? { ...prev, type: 'PAID' } : null)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                    editingConfig?.type === 'PAID' 
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                                    : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                                }`}
                            >
                                <Crown size={24} className="mb-2" />
                                <span className="font-bold">Paid Subscription</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Pricing Inputs (Only if PAID) */}
                    {editingConfig?.type === 'PAID' && (
                        <div className="animate-fade-in p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Subscription Cost</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly (৳)</label>
                                    <input type="number" min="0" className="w-full p-2 border rounded font-bold text-slate-800"
                                        value={editingConfig.monthly}
                                        onChange={e => setEditingConfig(prev => prev ? { ...prev, monthly: Number(e.target.value) } : null)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yearly (৳)</label>
                                    <input type="number" min="0" className="w-full p-2 border rounded font-bold text-slate-800"
                                        value={editingConfig.yearly}
                                        onChange={e => setEditingConfig(prev => prev ? { ...prev, yearly: Number(e.target.value) } : null)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Feature Locking */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                            <span>Select Paid Facilities</span>
                            <span className="text-xs font-normal text-slate-400">Checked = Requires Subscription</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_FEATURES.map(feat => {
                                const isChecked = editingConfig?.features.includes(feat.id);
                                return (
                                    <label key={feat.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="checkbox" className="hidden"
                                            checked={isChecked} onChange={() => toggleFeature(feat.id)} />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {isChecked && <Check size={12} className="text-white" />}
                                        </div>
                                        <feat.icon size={16} className={`mr-2 ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className={`text-sm font-medium flex-1 ${isChecked ? 'text-indigo-800' : 'text-slate-600'}`}>{feat.label}</span>
                                        {isChecked ? <Lock size={14} className="text-indigo-400" /> : <Unlock size={14} className="text-slate-300" />}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
                        <Button onClick={saveConfigEdit} className="px-6">Save Configuration</Button>
                    </div>
                </div>
            </Modal>

            {/* INFO & DELETE MODALS */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Removal">
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                        <AlertTriangle size={24} className="mr-3 shrink-0" />
                        <div>
                            <p className="font-bold">Remove this class?</p>
                            <p className="text-xs">This will remove it from the student selection list.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
                        <Button variant="danger" onClick={confirmRemove}>Remove</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
                <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg text-emerald-800 flex items-center">
                        <CheckCircle size={24} className="mr-3" /> <p>{infoModal.message}</p>
                    </div>
                    <div className="flex justify-end"><Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button></div>
                </div>
            </Modal>
        </div>
    );
};

export default SystemSettingsPage;