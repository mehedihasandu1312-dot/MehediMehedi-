import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { SystemSettings, ClassPrice, PremiumFeature } from '../../types';
import { Sliders, Plus, Trash2, Save, BookOpen, GraduationCap, AlertTriangle, Edit2, Check, X, CheckCircle, DollarSign, Settings, CreditCard, Lock, Unlock } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../../services/firebase';

interface Props {
    settings: SystemSettings[];
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings[]>>;
}

const AVAILABLE_FEATURES: { id: PremiumFeature; label: string }[] = [
    { id: 'NO_ADS', label: 'Ad-Free Experience' },
    { id: 'EXAMS', label: 'Premium Exams Access' },
    { id: 'CONTENT', label: 'Study Materials (PDFs/Notes)' },
    { id: 'LEADERBOARD', label: 'Leaderboard Ranking' },
    { id: 'SOCIAL', label: 'Social Community Access' }
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
    
    // Load data on mount or change
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
    
    // Pricing & Feature Edit State
    const [editingConfig, setEditingConfig] = useState<{ 
        className: string; 
        monthly: number; 
        yearly: number;
        features: PremiumFeature[];
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

        // Update local state optimistic
        if (settings.length === 0) {
            setSettings([updatedSettings]);
        } else {
            setSettings(settings.map(s => s.id === 'global_settings' ? updatedSettings : s));
        }
        
        try {
            // Save to Firestore
            await setDoc(doc(db, "settings", "global_settings"), updatedSettings);
            setInfoModal({ isOpen: true, title: "Success", message: "System settings and payment numbers saved successfully!" });
        } catch (error) {
            console.error("Error saving settings:", error);
            setInfoModal({ isOpen: true, title: "Error", message: "Failed to save settings to cloud." });
        }
    };

    const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
        if (item.trim() && !list.includes(item.trim())) {
            const newItem = item.trim();
            setList([...list, newItem]);
            // Set default pricing to 0
            setPricingMap(prev => ({ ...prev, [newItem]: { monthly: 0, yearly: 0 } }));
            // Set default features to empty (free)
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

        // Migrate pricing and features key if name changed
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
            // Remove from pricing
            const newPricing = { ...pricingMap };
            delete newPricing[removedName];
            setPricingMap(newPricing);
            
            // Remove from features
            const newFeatures = { ...lockedFeaturesMap };
            delete newFeatures[removedName];
            setLockedFeaturesMap(newFeatures);

            setDeleteModal({ isOpen: false, index: null, type: 'REGULAR' });
        }
    };

    // Configuration (Price + Features) Edit Logic
    const openConfigEdit = (className: string) => {
        const currentPrice = pricingMap[className] || { monthly: 0, yearly: 0 };
        const currentFeatures = lockedFeaturesMap[className] || [];
        setEditingConfig({ 
            className, 
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
        setPricingMap(prev => ({
            ...prev,
            [editingConfig.className]: { monthly: editingConfig.monthly, yearly: editingConfig.yearly }
        }));
        setLockedFeaturesMap(prev => ({
            ...prev,
            [editingConfig.className]: editingConfig.features
        }));
        setEditingConfig(null);
    };

    const renderListItem = (item: string, index: number, type: 'REGULAR' | 'ADMISSION') => {
        const isEditing = editingItem?.index === index && editingItem?.type === type;
        const price = pricingMap[item];
        const features = lockedFeaturesMap[item] || [];
        const hasPrice = price && (price.monthly > 0 || price.yearly > 0);

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
                        <button onClick={saveEdit} className="text-emerald-600 bg-emerald-50 p-2 rounded hover:bg-emerald-100">
                            <Check size={18} />
                        </button>
                        <button onClick={() => setEditingItem(null)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100">
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center mb-2 sm:mb-0">
                            <span className="text-sm font-bold text-slate-700 mr-3">{item}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => initiateEdit(index, type, item)}
                                    className="text-indigo-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"
                                    title="Rename"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                    onClick={() => initiateRemove(index, type)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                    title="Remove"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        {/* CONFIG BUTTON - RENAMED FOR CLARITY */}
                        <div className="flex items-center gap-2">
                            {hasPrice && (
                                <div className="hidden sm:flex text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 items-center mr-2">
                                    <Lock size={10} className="mr-1" /> {features.length} Locked Features
                                </div>
                            )}
                            <button 
                                onClick={() => openConfigEdit(item)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                                    hasPrice 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300'
                                }`}
                                title="Set Fees & Select Locked Features"
                            >
                                {hasPrice ? (
                                    <>
                                        <CheckCircle size={14} className="text-emerald-600" />
                                        <span>Manage Plan</span>
                                    </>
                                ) : (
                                    <>
                                        <Settings size={14} />
                                        <span>Setup Subscription</span>
                                    </>
                                )}
                            </button>
                        </div>
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
                        Class & Pricing Settings
                    </h1>
                    <p className="text-slate-500 text-sm">Configure fees and select which features require subscription.</p>
                </div>
                <Button onClick={handleSave} className="flex items-center shadow-lg shadow-indigo-200">
                    <Save size={18} className="mr-2" /> Save All Changes
                </Button>
            </div>

            {/* PAYMENT CONFIGURATION SECTION */}
            <Card className="border-t-4 border-t-pink-500 mb-8">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-pink-100 rounded text-pink-600">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Payment Numbers</h3>
                            <p className="text-xs text-slate-400">Update these numbers instantly if limit reaches.</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">bKash Personal Number</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="017xxxxxxxx"
                            value={paymentNumbers.bKash}
                            onChange={e => setPaymentNumbers({...paymentNumbers, bKash: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nagad Personal Number</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="018xxxxxxxx"
                            value={paymentNumbers.Nagad}
                            onChange={e => setPaymentNumbers({...paymentNumbers, Nagad: e.target.value})}
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* REGULAR CLASSES */}
                <Card className="border-t-4 border-t-indigo-500">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded text-indigo-700">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Regular Classes</h3>
                                <p className="text-xs text-slate-400">Class 6-12, Job Prep, etc.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Class 9"
                            value={newRegular}
                            onChange={e => setNewRegular(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(regularList, setRegularList, newRegular, setNewRegular)}
                        />
                        <Button size="sm" onClick={() => addItem(regularList, setRegularList, newRegular, setNewRegular)}>
                            <Plus size={18} /> Add
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 bg-slate-50 p-2 rounded-xl">
                        {regularList.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No classes added yet.</p>}
                        {regularList.map((item, idx) => renderListItem(item, idx, 'REGULAR'))}
                    </div>
                </Card>

                {/* ADMISSION CATEGORIES */}
                <Card className="border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 rounded text-emerald-700">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Admission Categories</h3>
                                <p className="text-xs text-slate-400">University, Medical, etc.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Medical Admission"
                            value={newAdmission}
                            onChange={e => setNewAdmission(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}
                        />
                        <Button size="sm" variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700 border-transparent" onClick={() => addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}>
                            <Plus size={18} /> Add
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 bg-slate-50 p-2 rounded-xl">
                        {admissionList.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No categories added yet.</p>}
                        {admissionList.map((item, idx) => renderListItem(item, idx, 'ADMISSION'))}
                    </div>
                </Card>

            </div>

            {/* CONFIG MODAL (PRICE + FEATURES) */}
            <Modal isOpen={!!editingConfig} onClose={() => setEditingConfig(null)} title={`Configure: ${editingConfig?.className}`}>
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100 flex items-start">
                        <Settings size={20} className="mr-2 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold text-base mb-1">Subscription Configuration</p>
                            <p>Set fees and choose which features should be <strong>Locked</strong> behind the subscription. Unchecked features will be free.</p>
                        </div>
                    </div>
                    
                    {/* Fees Section */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-100 pb-1">Subscription Fees</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 border rounded-xl focus-within:ring-2 focus-within:ring-indigo-500">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Fee (৳)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                    placeholder="0"
                                    value={editingConfig?.monthly}
                                    onChange={e => setEditingConfig(prev => prev ? { ...prev, monthly: Number(e.target.value) } : null)}
                                />
                            </div>
                            <div className="bg-white p-3 border rounded-xl focus-within:ring-2 focus-within:ring-indigo-500">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yearly Fee (৳)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                    placeholder="0"
                                    value={editingConfig?.yearly}
                                    onChange={e => setEditingConfig(prev => prev ? { ...prev, yearly: Number(e.target.value) } : null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-100 pb-1 flex items-center justify-between">
                            <span>Locked Features (Premium Only)</span>
                            <span className="text-xs font-normal text-slate-400">Check to Lock</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {AVAILABLE_FEATURES.map(feat => {
                                const isChecked = editingConfig?.features.includes(feat.id);
                                return (
                                    <label key={feat.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border transition-colors ${isChecked ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                                            {isChecked && <Check size={14} className="text-white" />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={() => toggleFeature(feat.id)}
                                        />
                                        <span className={`text-sm font-medium flex-1 ${isChecked ? 'text-red-800' : 'text-slate-600'}`}>
                                            {feat.label}
                                        </span>
                                        {isChecked ? <Lock size={16} className="text-red-400" /> : <Unlock size={16} className="text-slate-300" />}
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">Unchecked items will remain available to free users (with ads).</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
                        <Button onClick={saveConfigEdit} className="px-6">Save Configuration</Button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Removal">
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                        <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Remove this class/category?</p>
                            <p className="text-xs mt-1">This will prevent new students from selecting it. Existing data might be affected.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
                        <Button variant="danger" onClick={confirmRemove}>Remove</Button>
                    </div>
                </div>
            </Modal>

            {/* INFO MODAL */}
            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
                <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start text-emerald-800">
                        <CheckCircle size={24} className="mr-3 shrink-0" />
                        <p>{infoModal.message}</p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default SystemSettingsPage;