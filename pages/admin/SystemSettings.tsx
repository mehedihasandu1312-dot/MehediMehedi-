
import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { SystemSettings, ClassPrice, PremiumFeature } from '../../types';
import { Sliders, Plus, Trash2, Save, CheckCircle, AlertTriangle, Edit2, Check, X, DollarSign, Lock, Unlock, Crown, BookOpen, GraduationCap } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../../services/firebase';
import { authService } from '../../services/authService';

interface Props {
    settings: SystemSettings[];
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings[]>>;
}

const FEATURE_LIST: { key: PremiumFeature, label: string }[] = [
    { key: 'NO_ADS', label: 'Ad-Free Experience' },
    { key: 'EXAMS', label: 'Premium Exams' },
    { key: 'CONTENT', label: 'Premium Notes' },
    { key: 'LEADERBOARD', label: 'Global Leaderboard' },
    { key: 'SOCIAL', label: 'Social Community' },
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
    const currentUser = authService.getCurrentUser();

    // State
    const [regularList, setRegularList] = useState<string[]>([]);
    const [admissionList, setAdmissionList] = useState<string[]>([]);
    const [pricingMap, setPricingMap] = useState<Record<string, ClassPrice>>({});
    const [lockedFeaturesMap, setLockedFeaturesMap] = useState<Record<string, PremiumFeature[]>>({});
    const [paymentNumbers, setPaymentNumbers] = useState({ bKash: '', Nagad: '' });
    
    // UI State
    const [newRegular, setNewRegular] = useState('');
    const [newAdmission, setNewAdmission] = useState('');
    const [editingItem, setEditingItem] = useState<{ index: number; type: 'REGULAR' | 'ADMISSION'; value: string } | null>(null);
    
    // Config Modal
    const [editingConfig, setEditingConfig] = useState<{ className: string; type: 'FREE' | 'PAID'; monthly: number; yearly: number; features: PremiumFeature[] } | null>(null);
    
    // Other Modals
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number; type: 'REGULAR' | 'ADMISSION' }>({ isOpen: false, index: -1, type: 'REGULAR' });
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        setRegularList(currentSettings.educationLevels.REGULAR || []);
        setAdmissionList(currentSettings.educationLevels.ADMISSION || []);
        setPricingMap(currentSettings.pricing || {});
        setLockedFeaturesMap(currentSettings.lockedFeatures || {});
        setPaymentNumbers(currentSettings.paymentNumbers || { bKash: '', Nagad: '' });
    }, [currentSettings]);

    // Handlers
    const addItem = (list: string[], setList: (l: string[]) => void, input: string, setInput: (s: string) => void) => {
        if (input.trim()) {
            setList([...list, input.trim()]);
            setInput('');
        }
    };

    const initiateRemove = (index: number, type: 'REGULAR' | 'ADMISSION') => {
        setDeleteModal({ isOpen: true, index, type });
    };

    const confirmRemove = () => {
        if (deleteModal.type === 'REGULAR') {
            setRegularList(regularList.filter((_, i) => i !== deleteModal.index));
        } else {
            setAdmissionList(admissionList.filter((_, i) => i !== deleteModal.index));
        }
        setDeleteModal({ ...deleteModal, isOpen: false });
    };

    const openConfigEdit = (className: string) => {
        const price = pricingMap[className] || { monthly: 0, yearly: 0 };
        const features = lockedFeaturesMap[className] || [];
        const isPaid = price.monthly > 0 || price.yearly > 0;
        
        setEditingConfig({
            className,
            type: isPaid ? 'PAID' : 'FREE',
            monthly: price.monthly,
            yearly: price.yearly,
            features
        });
    };

    const saveConfigEdit = () => {
        if (!editingConfig) return;
        
        setPricingMap(prev => ({
            ...prev,
            [editingConfig.className]: {
                monthly: editingConfig.type === 'PAID' ? Number(editingConfig.monthly) : 0,
                yearly: editingConfig.type === 'PAID' ? Number(editingConfig.yearly) : 0
            }
        }));

        setLockedFeaturesMap(prev => ({
            ...prev,
            [editingConfig.className]: editingConfig.features
        }));

        setEditingConfig(null);
    };

    const toggleFeature = (feature: PremiumFeature) => {
        if (!editingConfig) return;
        const current = editingConfig.features;
        const updated = current.includes(feature) 
            ? current.filter(f => f !== feature) 
            : [...current, feature];
        setEditingConfig({ ...editingConfig, features: updated });
    };

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
            
            if (currentUser) {
                authService.logAdminAction(
                    currentUser.id, 
                    currentUser.name, 
                    "Updated Settings", 
                    "Modified System Configuration", 
                    "WARNING"
                );
            }

            setInfoModal({ isOpen: true, title: "Success", message: "System settings saved successfully!" });
        } catch (error) {
            console.error("Error saving settings:", error);
            setInfoModal({ isOpen: true, title: "Error", message: "Failed to save settings to cloud." });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Sliders className="mr-3 text-indigo-600" size={28} />
                        Class & Subscription Manager
                    </h1>
                    <p className="text-slate-500 text-sm">Define classes, prices, and payment methods.</p>
                </div>
                <Button onClick={handleSave} className="flex items-center shadow-lg shadow-indigo-200">
                    <Save size={18} className="mr-2" /> Save Changes
                </Button>
            </div>

            {/* PAYMENT NUMBERS */}
            <Card>
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Payment Methods (Merchant Numbers)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">bKash Number</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="017..."
                            value={paymentNumbers.bKash}
                            onChange={e => setPaymentNumbers({...paymentNumbers, bKash: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nagad Number</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="018..."
                            value={paymentNumbers.Nagad}
                            onChange={e => setPaymentNumbers({...paymentNumbers, Nagad: e.target.value})}
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* REGULAR CLASSES */}
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <BookOpen size={20} className="mr-2 text-blue-600" /> Regular Classes / Job Prep
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm"
                            placeholder="Add Class (e.g. Class 9)"
                            value={newRegular}
                            onChange={e => setNewRegular(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(regularList, setRegularList, newRegular, setNewRegular)}
                        />
                        <Button size="sm" onClick={() => addItem(regularList, setRegularList, newRegular, setNewRegular)}><Plus size={16}/></Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {regularList.map((item, idx) => {
                            const isPaid = (pricingMap[item]?.monthly || 0) > 0;
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-sm font-medium">{item}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openConfigEdit(item)} className={`text-xs px-2 py-1 rounded font-bold border ${isPaid ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                            {isPaid ? `PAID` : 'FREE'}
                                        </button>
                                        <button onClick={() => initiateRemove(idx, 'REGULAR')} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* ADMISSION CLASSES */}
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <GraduationCap size={20} className="mr-2 text-purple-600" /> Admission Categories
                    </h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm"
                            placeholder="Add Category (e.g. Medical)"
                            value={newAdmission}
                            onChange={e => setNewAdmission(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}
                        />
                        <Button size="sm" onClick={() => addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}><Plus size={16}/></Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {admissionList.map((item, idx) => {
                            const isPaid = (pricingMap[item]?.monthly || 0) > 0;
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-sm font-medium">{item}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openConfigEdit(item)} className={`text-xs px-2 py-1 rounded font-bold border ${isPaid ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                            {isPaid ? `PAID` : 'FREE'}
                                        </button>
                                        <button onClick={() => initiateRemove(idx, 'ADMISSION')} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* CONFIG MODAL */}
            <Modal isOpen={!!editingConfig} onClose={() => setEditingConfig(null)} title="Configure Class Settings">
                {editingConfig && (
                    <div className="space-y-6">
                        <div className="text-center pb-4 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">{editingConfig.className}</h3>
                            <p className="text-slate-500 text-sm">Set pricing and access rules.</p>
                        </div>

                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setEditingConfig({...editingConfig, type: 'FREE'})}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingConfig.type === 'FREE' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
                            >
                                Free (Open Access)
                            </button>
                            <button 
                                onClick={() => setEditingConfig({...editingConfig, type: 'PAID'})}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editingConfig.type === 'PAID' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}
                            >
                                Paid (Subscription)
                            </button>
                        </div>

                        {/* Pricing Fields */}
                        {editingConfig.type === 'PAID' && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Fee (BDT)</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input 
                                            type="number" 
                                            className="w-full pl-8 p-2 border rounded-lg"
                                            value={editingConfig.monthly}
                                            onChange={e => setEditingConfig({...editingConfig, monthly: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Yearly Fee (BDT)</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input 
                                            type="number" 
                                            className="w-full pl-8 p-2 border rounded-lg"
                                            value={editingConfig.yearly}
                                            onChange={e => setEditingConfig({...editingConfig, yearly: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feature Locks */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Locked Features (Require Subscription)</label>
                            <div className="space-y-2">
                                {FEATURE_LIST.map(feature => {
                                    const isLocked = editingConfig.features.includes(feature.key);
                                    return (
                                        <div 
                                            key={feature.key} 
                                            onClick={() => toggleFeature(feature.key)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isLocked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center">
                                                {isLocked ? <Lock size={16} className="text-red-500 mr-3" /> : <Unlock size={16} className="text-emerald-500 mr-3" />}
                                                <span className={`text-sm font-medium ${isLocked ? 'text-red-700' : 'text-slate-700'}`}>{feature.label}</span>
                                            </div>
                                            {isLocked && <Badge color="bg-red-100 text-red-700">LOCKED</Badge>}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Checked features will be inaccessible to free users of this class.</p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={saveConfigEdit}>Apply Configuration</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({...deleteModal, isOpen: false})} title="Remove Class?">
                <div className="space-y-4">
                    <p className="text-slate-600">Are you sure you want to remove this class category? Users assigned to this class may lose access settings.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDeleteModal({...deleteModal, isOpen: false})}>Cancel</Button>
                        <Button variant="danger" onClick={confirmRemove}>Remove</Button>
                    </div>
                </div>
            </Modal>

            {/* Info Modal */}
            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({...infoModal, isOpen: false})} title={infoModal.title}>
                <div className="text-center p-4">
                    <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
                    <p>{infoModal.message}</p>
                    <Button className="mt-4" onClick={() => setInfoModal({...infoModal, isOpen: false})}>OK</Button>
                </div>
            </Modal>
        </div>
    );
};

export default SystemSettingsPage;
