
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog, DeletionRequest } from '../../types';
import { db, firebaseConfig } from '../../services/firebase';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { authService } from '../../services/authService';
import { 
    Search, Filter, Shield, Trash2, UserPlus, MoreVertical, 
    Lock, Unlock, Activity, AlertTriangle, CheckCircle, 
    XCircle, Clock, User as UserIcon, ShieldAlert 
} from 'lucide-react';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    adminLogs: AdminActivityLog[];
    currentUser?: User | null;
    educationLevels?: { REGULAR: string[], ADMISSION: string[] };
    deletionRequests: DeletionRequest[];
    setDeletionRequests: React.Dispatch<React.SetStateAction<DeletionRequest[]>>;
}

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs = [], currentUser, educationLevels, deletionRequests = [], setDeletionRequests }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS' | 'REQUESTS'>('USERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

    // Modals
    const [statusConfirm, setStatusConfirm] = useState<{ id: string, status: 'ACTIVE' | 'BLOCKED' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
    
    // Create Admin Modal
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [adminCreationLoading, setAdminCreationLoading] = useState(false);

    // Info Modal
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

    // --- HELPERS ---
    const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
        setInfoModal({ isOpen: true, title, message, type });
    };

    // --- FILTERING (DEFENSIVE) ---
    const filteredUsers = users.filter(user => {
        if (!user) return false;
        const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    // --- ACTIONS ---

    const initiateStatusToggle = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED') => {
        setStatusConfirm({ id, status: currentStatus });
    };

    const confirmStatusToggle = async () => {
        if (!statusConfirm || !currentUser) return;
        const { id, status } = statusConfirm;
        const newStatus = status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const targetUser = users.find(u => u.id === id);
        
        try {
            const userRef = doc(db, "users", id);
            await setDoc(userRef, { status: newStatus }, { merge: true });

            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
            
            // LOGGING
            await authService.logAdminAction(
                currentUser.id, 
                currentUser.name, 
                newStatus === 'BLOCKED' ? "Blocked User" : "Unblocked User", 
                `User: ${targetUser?.name || id}`, 
                newStatus === 'BLOCKED' ? "WARNING" : "INFO"
            );

            showInfo("Success", `User ${newStatus === 'BLOCKED' ? 'blocked' : 'activated'} successfully.`);
        } catch (error) {
            console.error("Status update failed", error);
            showInfo("Error", "Failed to update user status.", "ERROR");
        }

        setStatusConfirm(null);
    };

    const initiateDeleteUser = (id: string, name: string) => {
        setDeleteConfirm({ id, name });
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirm || !currentUser) return;
        
        try {
            await deleteDoc(doc(db, "users", deleteConfirm.id));
            setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
            
            // LOGGING
            await authService.logAdminAction(
                currentUser.id, 
                currentUser.name, 
                "Deleted User", 
                `User: ${deleteConfirm.name}`, 
                "DANGER"
            );

            showInfo("Deleted", `${deleteConfirm.name} has been permanently removed.`);
        } catch (error: any) {
            console.error("Delete failed:", error);
            showInfo("Error", "Failed to delete user.", "ERROR");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminCreationLoading(true);
        
        // Initialize a secondary app instance to create user without logging out the current admin
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newAdminEmail, newAdminPassword);
            const newUser = userCredential.user;
            
            const newAdminData: User = {
                id: newUser.uid,
                name: newAdminName,
                email: newAdminEmail,
                role: UserRole.ADMIN,
                isSuperAdmin: false,
                status: 'ACTIVE',
                profileCompleted: true,
                joinedDate: new Date().toISOString(),
                points: 0,
                rank: 0,
                avatar: `https://ui-avatars.com/api/?name=${newAdminName}&background=6366f1&color=fff`
            };

            await setDoc(doc(db, "users", newUser.uid), newAdminData);
            setUsers(prev => [...prev, newAdminData]);
            
            // LOGGING
            if (currentUser) {
                await authService.logAdminAction(
                    currentUser.id, 
                    currentUser.name, 
                    "Created Admin", 
                    `New Admin: ${newAdminName}`, 
                    "SUCCESS"
                );
            }

            showInfo("Admin Created", `New Admin "${newAdminName}" created successfully!`);
            setIsAdminModalOpen(false);
            setNewAdminName('');
            setNewAdminEmail('');
            setNewAdminPassword('');
        } catch (error: any) {
            console.error("Creation Failed", error);
            showInfo("Creation Failed", error.message, "ERROR");
        } finally {
            await deleteApp(secondaryApp);
            setAdminCreationLoading(false);
        }
    };

    // Handle Deletion Requests (Approve/Reject)
    const handleRequestAction = async (request: DeletionRequest, action: 'APPROVED' | 'REJECTED') => {
        try {
            if (action === 'APPROVED') {
                if (request.actionType === 'DELETE_USER') {
                    await deleteDoc(doc(db, "users", request.targetId));
                    setUsers(prev => prev.filter(u => u.id !== request.targetId));
                } else if (request.actionType === 'BLOCK_USER') {
                    await setDoc(doc(db, "users", request.targetId), { status: 'BLOCKED' }, { merge: true });
                    setUsers(prev => prev.map(u => u.id === request.targetId ? { ...u, status: 'BLOCKED' } : u));
                }
            }

            // Update Request Status in Firestore (assuming requests are stored there)
            // Note: Since setDeletionRequests is passed, we assume we manage local state or sync it.
            // For now updating local state.
            setDeletionRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: action } : r));

            if (currentUser) {
                await authService.logAdminAction(
                    currentUser.id,
                    currentUser.name,
                    `${action === 'APPROVED' ? 'Approved' : 'Rejected'} Request`,
                    `Request ID: ${request.id} (${request.actionType})`,
                    action === 'APPROVED' ? 'WARNING' : 'INFO'
                );
            }
        } catch (e) {
            console.error(e);
            showInfo("Error", "Failed to process request.", "ERROR");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <UserIcon className="mr-3 text-indigo-600" size={28} />
                        User Management
                    </h1>
                    <p className="text-slate-500 text-sm">Manage students, admins, and system logs.</p>
                </div>
                
                <div className="flex gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex">
                        <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'USERS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}>Users</button>
                        <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'LOGS' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Logs</button>
                        <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'REQUESTS' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Requests ({deletionRequests.filter(r=>r.status==='PENDING').length})</button>
                    </div>
                    {activeTab === 'USERS' && currentUser?.isSuperAdmin && (
                        <Button onClick={() => setIsAdminModalOpen(true)} className="flex items-center">
                            <UserPlus size={18} className="mr-2" /> Add Admin
                        </Button>
                    )}
                </div>
            </div>

            {/* USERS TAB */}
            {activeTab === 'USERS' && (
                <Card className="min-h-[500px]">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-slate-100 pb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..."
                                className="w-full pl-10 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={filterRole} onChange={(e: any) => setFilterRole(e.target.value)}>
                                <option value="ALL">All Roles</option>
                                <option value="STUDENT">Student</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <select className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="avatar" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                {user.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <div>Class: {user.class || 'N/A'}</div>
                                            <div>Joined: {new Date(user.joinedDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Only Super Admin can modify Admins, Admins can modify Students */}
                                                {(currentUser?.isSuperAdmin || user.role === UserRole.STUDENT) && !user.isSuperAdmin && (
                                                    <>
                                                        <button 
                                                            onClick={() => initiateStatusToggle(user.id, user.status)}
                                                            className={`p-1.5 rounded hover:bg-slate-200 ${user.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`}
                                                            title={user.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                                                        >
                                                            {user.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => initiateDeleteUser(user.id, user.name)}
                                                            className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-slate-400">No users found.</div>
                        )}
                    </div>
                </Card>
            )}

            {/* LOGS TAB */}
            {activeTab === 'LOGS' && (
                <Card className="min-h-[500px]">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Activity className="mr-2 text-indigo-600" size={20} /> System Activity Logs
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs">
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
                                        <td className="px-4 py-3 font-medium text-slate-800">{log.adminName}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={
                                                log.type === 'DANGER' ? 'bg-red-100 text-red-700' :
                                                log.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                                log.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-blue-100 text-blue-700'
                                            }>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 truncate max-w-xs" title={log.details}>{log.details}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {adminLogs.length === 0 && <div className="p-8 text-center text-slate-400">No logs available.</div>}
                    </div>
                </Card>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'REQUESTS' && (
                <Card className="min-h-[500px]">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <ShieldAlert className="mr-2 text-red-600" size={20} /> Deletion & Block Requests
                    </h3>
                    <div className="space-y-4">
                        {deletionRequests.filter(r => r.status === 'PENDING').length === 0 && (
                            <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                <CheckCircle size={48} className="mx-auto mb-2 text-emerald-200" />
                                No pending requests.
                            </div>
                        )}
                        {deletionRequests.map(request => (
                            <div key={request.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${request.status === 'PENDING' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color="bg-red-100 text-red-700">{request.actionType}</Badge>
                                        <span className="text-xs text-slate-400">{new Date(request.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">Target: {request.targetName}</p>
                                    <p className="text-xs text-slate-500 mt-1">Requested by: <span className="font-semibold">{request.requesterName}</span></p>
                                    {request.reason && <p className="text-xs text-slate-600 italic mt-1">Reason: "{request.reason}"</p>}
                                </div>
                                {request.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="danger" onClick={() => handleRequestAction(request, 'APPROVED')}>Approve</Button>
                                        <Button size="sm" variant="outline" onClick={() => handleRequestAction(request, 'REJECTED')}>Reject</Button>
                                    </div>
                                ) : (
                                    <Badge color={request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}>
                                        {request.status}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* MODALS */}
            
            {/* Status Toggle Confirmation */}
            <Modal isOpen={!!statusConfirm} onClose={() => setStatusConfirm(null)} title="Confirm Status Change">
                <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start text-amber-800">
                        <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Are you sure you want to {statusConfirm?.status === 'ACTIVE' ? 'BLOCK' : 'UNBLOCK'} this user?</p>
                            <p className="text-xs mt-1">Blocked users cannot login or access content.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStatusConfirm(null)}>Cancel</Button>
                        <Button onClick={confirmStatusToggle} className={statusConfirm?.status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
                            Confirm {statusConfirm?.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete User">
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                        <Trash2 size={24} className="mr-3 shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Permanently delete {deleteConfirm?.name}?</p>
                            <p className="text-xs mt-1">This cannot be undone. All data (results, payments) will be lost.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteUser}>Delete Permanently</Button>
                    </div>
                </div>
            </Modal>

            {/* Create Admin Modal */}
            <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Create New Admin">
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                        <Shield className="inline mr-2" size={16} />
                        New admin will have full access to manage content and users (except deleting other admins).
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input required type="password" minLength={6} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={adminCreationLoading}>
                            {adminCreationLoading ? 'Creating...' : 'Create Admin'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Success/Error Modal */}
            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
                <div className="p-4 text-center">
                    {infoModal.type === 'SUCCESS' ? <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" /> : <XCircle size={40} className="text-red-500 mx-auto mb-3" />}
                    <p className="text-slate-700">{infoModal.message}</p>
                    <Button className="mt-4" onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
                </div>
            </Modal>

        </div>
    );
};

export default UserManagement;
