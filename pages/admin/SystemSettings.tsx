
import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { SystemSettings, PremiumFeature } from '../../types';
import { Sliders, Save, CheckCircle, AlertTriangle, DollarSign, Lock, Unlock, BookOpen, GraduationCap } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '../../services/firebase';

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

    // Local state initialized safely with optional chaining
    const [regularList, setRegularList] = useState<string[]>(currentSettings.educationLevels?.REGULAR || []);
    const [admissionList, setAdmissionList] = useState<string[]>(currentSettings.educationLevels?.ADMISSION || []);
    const [pricingMap, setPricingMap] = useState(currentSettings.pricing || {});
    const [paymentNumbers, setPaymentNumbers] = useState(currentSettings.paymentNumbers || { bKash: '', Nagad: '' });
    
    // UI State
    const [newRegular, setNewRegular] = useState('');
    const [newAdmission, setNewAdmission] = useState('');
    const [infoModal, setInfoModal] = useState({ isOpen: false, message: '' });

    // Sync state when props change
    useEffect(() => {
        setRegularList(currentSettings.educationLevels?.REGULAR || []);
        setAdmissionList(currentSettings.educationLevels?.ADMISSION || []);
        setPricingMap(currentSettings.pricing || {});
        setPaymentNumbers(currentSettings.paymentNumbers || { bKash: '', Nagad: '' });
    }, [currentSettings]);

    const handleSave = async () => {
        const updatedSettings: SystemSettings = {
            id: 'global_settings',
            educationLevels: {
                REGULAR: regularList,
                ADMISSION: admissionList
            },
            pricing: pricingMap,
            lockedFeatures: currentSettings.lockedFeatures || {},
            paymentNumbers: paymentNumbers
        };

        try {
            await setDoc(doc(db, "settings", "global_settings"), updatedSettings);
            // Update local state if needed (though Firestore listener usually handles this)
            const newSettingsList = settings.length > 0 
                ? settings.map(s => s.id === 'global_settings' ? updatedSettings : s)
                : [updatedSettings];
            setSettings(newSettingsList);
            
            setInfoModal({ isOpen: true, message: "Settings saved successfully!" });
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        }
    };

    const addClass = (type: 'REGULAR' | 'ADMISSION') => {
        if (type === 'REGULAR' && newRegular.trim()) {
            setRegularList([...regularList, newRegular.trim()]);
            setNewRegular('');
        } else if (type === 'ADMISSION' && newAdmission.trim()) {
            setAdmissionList([...admissionList, newAdmission.trim()]);
            setNewAdmission('');
        }
    };

    const removeClass = (type: 'REGULAR' | 'ADMISSION', index: number) => {
        if (type === 'REGULAR') {
            setRegularList(regularList.filter((_, i) => i !== index));
        } else {
            setAdmissionList(admissionList.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Sliders className="mr-3 text-indigo-600" size={28} /> System Settings
                </h1>
                <Button onClick={handleSave} className="flex items-center">
                    <Save size={18} className="mr-2" /> Save Changes
                </Button>
            </div>

            {/* Payment Numbers */}
            <Card>
                <h3 className="font-bold text-slate-800 mb-4">Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">bKash Number</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg"
                            value={paymentNumbers.bKash}
                            onChange={e => setPaymentNumbers({...paymentNumbers, bKash: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nagad Number</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg"
                            value={paymentNumbers.Nagad}
                            onChange={e => setPaymentNumbers({...paymentNumbers, Nagad: e.target.value})}
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><BookOpen size={20} className="mr-2"/> Regular Classes</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg" 
                            placeholder="Add Class..." 
                            value={newRegular}
                            onChange={e => setNewRegular(e.target.value)}
                        />
                        <Button size="sm" onClick={() => addClass('REGULAR')}>Add</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {regularList.map((c, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                <span>{c}</span>
                                <button onClick={() => removeClass('REGULAR', i)} className="text-red-500 text-xs">Remove</button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><GraduationCap size={20} className="mr-2"/> Admission</h3>
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border rounded-lg" 
                            placeholder="Add Category..." 
                            value={newAdmission}
                            onChange={e => setNewAdmission(e.target.value)}
                        />
                        <Button size="sm" onClick={() => addClass('ADMISSION')}>Add</Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {admissionList.map((c, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                <span>{c}</span>
                                <button onClick={() => removeClass('ADMISSION', i)} className="text-red-500 text-xs">Remove</button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title="Success">
                <div className="p-4 text-center">
                    <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
                    <p>{infoModal.message}</p>
                    <Button className="mt-4" onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
                </div>
            </Modal>
        </div>
    );
};

export default SystemSettingsPage;
