import React, { useState } from 'react';
import { Card, Button, Modal } from '../../components/UI';
import { SystemSettings } from '../../types';
import { Sliders, Plus, Trash2, Save, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';

interface Props {
    settings: SystemSettings[];
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings[]>>;
}

const SystemSettingsPage: React.FC<Props> = ({ settings, setSettings }) => {
    // Get current settings object (assume ID 'global_settings')
    const currentSettings = settings.find(s => s.id === 'global_settings') || {
        id: 'global_settings',
        educationLevels: { REGULAR: [], ADMISSION: [] }
    };

    const [regularList, setRegularList] = useState<string[]>(currentSettings.educationLevels.REGULAR);
    const [admissionList, setAdmissionList] = useState<string[]>(currentSettings.educationLevels.ADMISSION);
    
    const [newRegular, setNewRegular] = useState('');
    const [newAdmission, setNewAdmission] = useState('');

    // Delete State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null; type: 'REGULAR' | 'ADMISSION' }>({ 
        isOpen: false, index: null, type: 'REGULAR' 
    });

    const handleSave = () => {
        const updatedSettings: SystemSettings = {
            id: 'global_settings',
            educationLevels: {
                REGULAR: regularList,
                ADMISSION: admissionList
            }
        };

        // Update global state which syncs to Firestore via App.tsx hook
        // If settings array is empty, create new; otherwise replace.
        if (settings.length === 0) {
            setSettings([updatedSettings]);
        } else {
            setSettings(settings.map(s => s.id === 'global_settings' ? updatedSettings : s));
        }
        alert("System settings saved successfully!");
    };

    const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
        if (item.trim() && !list.includes(item.trim())) {
            setList([...list, item.trim()]);
            setItem('');
        }
    };

    const initiateRemove = (index: number, type: 'REGULAR' | 'ADMISSION') => {
        setDeleteModal({ isOpen: true, index, type });
    };

    const confirmRemove = () => {
        if (deleteModal.index !== null) {
            if (deleteModal.type === 'REGULAR') {
                const newList = [...regularList];
                newList.splice(deleteModal.index, 1);
                setRegularList(newList);
            } else {
                const newList = [...admissionList];
                newList.splice(deleteModal.index, 1);
                setAdmissionList(newList);
            }
            setDeleteModal({ isOpen: false, index: null, type: 'REGULAR' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Sliders className="mr-3 text-indigo-600" size={28} />
                        System Settings
                    </h1>
                    <p className="text-slate-500 text-sm">Manage dynamic classes and admission categories.</p>
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
                        {regularList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                <span className="text-sm font-medium text-slate-700">{item}</span>
                                <button 
                                    onClick={() => initiateRemove(idx, 'REGULAR')}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
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
                        {admissionList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                <span className="text-sm font-medium text-slate-700">{item}</span>
                                <button 
                                    onClick={() => initiateRemove(idx, 'ADMISSION')}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>

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

        </div>
    );
};

export default SystemSettingsPage;