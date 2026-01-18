import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../../components/UI';
import { SystemSettings, ClassPrice } from '../../types';
import { Sliders, Plus, Trash2, Save, BookOpen, GraduationCap, AlertTriangle, Edit2, Check, X, CheckCircle, DollarSign } from 'lucide-react';

interface Props {
    settings: SystemSettings[];
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings[]>>;
}

const SystemSettingsPage: React.FC<Props> = ({ settings, setSettings }) => {
    const defaultSettings: SystemSettings = {
        id: 'global_settings',
        educationLevels: { REGULAR: [], ADMISSION: [] },
        pricing: {}
    };

    const currentSettings = settings.find(s => s.id === 'global_settings') || defaultSettings;

    const [regularList, setRegularList] = useState<string[]>([]);
    const [admissionList, setAdmissionList] = useState<string[]>([]);
    const [pricingMap, setPricingMap] = useState<Record<string, ClassPrice>>({});
    
    // Load data on mount or change
    useEffect(() => {
        setRegularList(currentSettings.educationLevels.REGULAR || []);
        setAdmissionList(currentSettings.educationLevels.ADMISSION || []);
        setPricingMap(currentSettings.pricing || {});
    }, [currentSettings]);

    const [newRegular, setNewRegular] = useState('');
    const [newAdmission, setNewAdmission] = useState('');

    const [editingItem, setEditingItem] = useState<{ index: number; type: 'REGULAR' | 'ADMISSION'; value: string } | null>(null);
    const [editingPrice, setEditingPrice] = useState<{ className: string; monthly: number; yearly: number } | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null; type: 'REGULAR' | 'ADMISSION' }>({ 
        isOpen: false, index: null, type: 'REGULAR' 
    });

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

    const handleSave = () => {
        const updatedSettings: SystemSettings = {
            id: 'global_settings',
            educationLevels: {
                REGULAR: regularList,
                ADMISSION: admissionList
            },
            pricing: pricingMap
        };

        // Update local state optimistic
        if (settings.length === 0) {
            setSettings([updatedSettings]);
        } else {
            setSettings(settings.map(s => s.id === 'global_settings' ? updatedSettings : s));
        }
        
        // In a real app with Firestore hook, this setSettings should trigger the sync
        setInfoModal({ isOpen: true, title: "Success", message: "System settings and pricing saved successfully!" });
    };

    const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
        if (item.trim() && !list.includes(item.trim())) {
            setList([...list, item.trim()]);
            // Set default pricing for new item
            setPricingMap(prev => ({
                ...prev,
                [item.trim()]: { monthly: 100, yearly: 1000 }
            }));
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

        // Migrate pricing key
        if (oldName !== editingItem.value.trim()) {
            const newPricing = { ...pricingMap };
            newPricing[editingItem.value.trim()] = newPricing[oldName] || { monthly: 100, yearly: 1000 };
            delete newPricing[oldName];
            setPricingMap(newPricing);
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

            setDeleteModal({ isOpen: false, index: null, type: 'REGULAR' });
        }
    };

    // Pricing Edit Logic
    const openPriceEdit = (className: string) => {
        const currentPrice = pricingMap[className] || { monthly: 100, yearly: 1000 };
        setEditingPrice({ className, monthly: currentPrice.monthly, yearly: currentPrice.yearly });
    };

    const savePriceEdit = () => {
        if (!editingPrice) return;
        setPricingMap(prev => ({
            ...prev,
            [editingPrice.className]: { monthly: editingPrice.monthly, yearly: editingPrice.yearly }
        }));
        setEditingPrice(null);
    };

    const renderListItem = (item: string, index: number, type: 'REGULAR' | 'ADMISSION') => {
        const isEditing = editingItem?.index === index && editingItem?.type === type;
        const price = pricingMap[item] || { monthly: 0, yearly: 0 };

        return (
            <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            className="flex-1 p-1 px-2 text-sm border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                        <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50">
                            <Check size={16} />
                        </button>
                        <button onClick={() => setEditingItem(null)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-700 mr-3">{item}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => initiateEdit(index, type, item)}
                                    className="text-indigo-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"
                                    title="Rename"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={() => initiateRemove(index, type)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                    title="Remove"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Price Badge / Edit Trigger */}
                        <button 
                            onClick={() => openPriceEdit(item)}
                            className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                            title="Edit Pricing"
                        >
                            <DollarSign size={12} />
                            <span>Mo: {price.monthly} / Yr: {price.yearly}</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Sliders className="mr-3 text-indigo-600" size={28} />
                        System Settings & Pricing
                    </h1>
                    <p className="text-slate-500 text-sm">Manage class lists and set subscription fees.</p>
                </div>
                <Button onClick={handleSave} className="flex items-center">
                    <Save size={18} className="mr-2" /> Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* REGULAR CLASSES */}
                <Card>
                    <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-2">
                        <div className="p-2 bg-indigo-100 rounded text-indigo-700">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Regular Classes / Job Sectors</h3>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Class 13 / BCS"
                            value={newRegular}
                            onChange={e => setNewRegular(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(regularList, setRegularList, newRegular, setNewRegular)}
                        />
                        <Button size="sm" onClick={() => addItem(regularList, setRegularList, newRegular, setNewRegular)}>
                            <Plus size={16} />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {regularList.map((item, idx) => renderListItem(item, idx, 'REGULAR'))}
                    </div>
                </Card>

                {/* ADMISSION CATEGORIES */}
                <Card>
                    <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-2">
                        <div className="p-2 bg-emerald-100 rounded text-emerald-700">
                            <GraduationCap size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Admission Categories</h3>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Dental / Nursing"
                            value={newAdmission}
                            onChange={e => setNewAdmission(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}
                        />
                        <Button size="sm" variant="secondary" onClick={() => addItem(admissionList, setAdmissionList, newAdmission, setNewAdmission)}>
                            <Plus size={16} />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {admissionList.map((item, idx) => renderListItem(item, idx, 'ADMISSION'))}
                    </div>
                </Card>

            </div>

            {/* PRICE EDIT MODAL */}
            <Modal isOpen={!!editingPrice} onClose={() => setEditingPrice(null)} title={`Set Pricing: ${editingPrice?.className}`}>
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                        Set the subscription fees for students in <strong>{editingPrice?.className}</strong>.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fee (৳)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editingPrice?.monthly || 0}
                            onChange={e => setEditingPrice(prev => prev ? { ...prev, monthly: Number(e.target.value) } : null)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Yearly Fee (৳)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editingPrice?.yearly || 0}
                            onChange={e => setEditingPrice(prev => prev ? { ...prev, yearly: Number(e.target.value) } : null)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setEditingPrice(null)}>Cancel</Button>
                        <Button onClick={savePriceEdit}>Update Pricing</Button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Removal">
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                        <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Remove this category?</p>
                            <p className="text-xs mt-1">Existing users or content might still display it, but it won't be selectable for new items.</p>
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