
import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog, DeletionRequest } from '../../types';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Search, Trash2, UserPlus, Lock, Unlock, Activity, ShieldAlert, CheckCircle, User as UserIcon } from 'lucide-react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../services/firebase';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    adminLogs: AdminActivityLog[];
    currentUser?: User | null;
    deletionRequests: DeletionRequest[];
    setDeletionRequests: React.Dispatch<React.SetStateAction<DeletionRequest[]>>;
    educationLevels?: any;
}

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs, currentUser, deletionRequests }) => {
    const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS' | 'REQUESTS'>('USERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
    
    // Create Admin State
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleStatusToggle = async (user: User) => {
        const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        try {
            await setDoc(doc(db, "users", user.id), { status: newStatus }, { merge: true });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
            if (currentUser) {
                authService.logAdminAction(currentUser.id, currentUser.name, "Changed User Status", `User: ${user.name} -> ${newStatus}`, "WARNING");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, "users", userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
            if (currentUser) {
                authService.logAdminAction(currentUser.id, currentUser.name, "Deleted User", `User: ${userName}`, "DANGER");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete user");
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Note: In a real app, you'd use a secondary app instance or a cloud function to create users without logging out.
            // For this demo, we'll simulate the DB entry creation.
            alert("To create a new admin securely, please use the Firebase Console or a dedicated Cloud Function to avoid logging out the current session.");
            setIsAdminModalOpen(false);
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <UserIcon className="mr-3 text-indigo-600" size={28} /> User Management
                </h1>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'USERS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}>Users</button>
                    <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'LOGS' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Activity Logs</button>
                    <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'REQUESTS' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Requests</button>
                </div>
            </div>

            {activeTab === 'USERS' && (
                <Card>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search users..."
                                className="w-full pl-10 p-2 border rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="p-2 border rounded-lg" value={filterRole} onChange={(e: any) => setFilterRole(e.target.value)}>
                            <option value="ALL">All Roles</option>
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        {currentUser?.isSuperAdmin && (
                            <Button onClick={() => setIsAdminModalOpen(true)}><UserPlus size={18} className="mr-2"/> New Admin</Button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </td>
                                        <td className="px-4 py-3"><Badge>{user.role}</Badge></td>
                                        <td className="px-4 py-3">
                                            <Badge color={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{user.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            {(!user.isSuperAdmin || currentUser?.isSuperAdmin) && (
                                                <>
                                                    <button onClick={() => handleStatusToggle(user)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded" title="Toggle Status">
                                                        {user.status === 'ACTIVE' ? <Lock size={16}/> : <Unlock size={16}/>}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'LOGS' && (
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Activity size={20} className="mr-2"/> System Activity</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Admin</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {adminLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{log.adminName}</td>
                                        <td className="px-4 py-3"><Badge>{log.action}</Badge></td>
                                        <td className="px-4 py-3 text-slate-500">{log.details}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {adminLogs.length === 0 && <div className="p-8 text-center text-slate-400">No activity logs found.</div>}
                    </div>
                </Card>
            )}

            {activeTab === 'REQUESTS' && (
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><ShieldAlert size={20} className="mr-2 text-red-600"/> Deletion Requests</h3>
                    <div className="space-y-3">
                        {deletionRequests.length === 0 && <div className="text-center text-slate-400 py-10">No pending requests.</div>}
                        {deletionRequests.map(req => (
                            <div key={req.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                    <p className="font-bold text-sm">{req.actionType} - {req.targetName}</p>
                                    <p className="text-xs text-slate-500">Requested by: {req.requesterName}</p>
                                </div>
                                <Badge color={req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100'}>{req.status}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Add Admin">
                <div className="p-4">
                    <p className="text-slate-600 mb-4">Please create admins via Firebase Console for security in this demo.</p>
                    <Button onClick={() => setIsAdminModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
