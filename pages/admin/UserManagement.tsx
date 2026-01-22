
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog, DeletionRequest } from '../../types';
import { db, firebaseConfig } from '../../services/firebase';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { authService } from '../../services/authService';
import { 
    Search, Filter, Shield, Trash2, UserPlus, 
    Lock, Unlock, Activity, ShieldAlert, CheckCircle, 
    XCircle, User as UserIcon, AlertTriangle, GraduationCap, Ban, ShieldCheck, Mail
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

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs = [], currentUser, deletionRequests = [], setDeletionRequests }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMINS' | 'LOGS' | 'REQUESTS'>('STUDENTS');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

    // Modals
    const [statusConfirm, setStatusConfirm] = useState<{ id: string, status: 'ACTIVE' | 'BLOCKED' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    
    // Create Admin Form
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [adminCreationLoading, setAdminCreationLoading] = useState(false);

    // Info Modal
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

    // --- STATS CALCULATION ---
    const stats = useMemo(() => {
        return {
            total: users.length,
            students: users.filter(u => u.role === UserRole.STUDENT).length,
            admins: users.filter(u => u.role === UserRole.ADMIN).length,
            blocked: users.filter(u => u.status === 'BLOCKED').length
        };
    }, [users]);

    // --- FILTERING ---
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (!user) return false;
            
            // Tab Filtering (Strict Separation)
            if (activeTab === 'STUDENTS' && user.role !== UserRole.STUDENT) return false;
            if (activeTab === 'ADMINS' && user.role !== UserRole.ADMIN) return false;
            if (activeTab === 'LOGS' || activeTab === 'REQUESTS') return true; // Handled separately in render

            // Search Filtering
            const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status Filtering
            const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [users, activeTab, searchTerm, filterStatus]);

    const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
        setInfoModal({ isOpen: true, title, message, type });
    };

    // --- ACTIONS ---
    const initiateStatusToggle = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED') => {
        setStatusConfirm({ id, status: currentStatus });
    };

    const confirmStatusToggle = async () => {
        if (!statusConfirm || !currentUser) return;
        const { id, status } = statusConfirm;
        const newStatus = status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        
        try {
            const userRef = doc(db, "users", id);
            await setDoc(userRef, { status: newStatus }, { merge: true });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
            
            await authService.logAdminAction(currentUser.id, currentUser.name, newStatus === 'BLOCKED' ? "Blocked User" : "Unblocked User", `ID: ${id}`, "WARNING");
            showInfo("Success", `User status updated to ${newStatus}`);
        } catch (error) {
            console.error(error);
            showInfo("Error", "Failed to update status", "ERROR");
        }
        setStatusConfirm(null);
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirm || !currentUser) return;
        try {
            await deleteDoc(doc(db, "users", deleteConfirm.id));
            setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
            await authService.logAdminAction(currentUser.id, currentUser.name, "Deleted User", `User: ${deleteConfirm.name}`, "DANGER");
            showInfo("Deleted", "User deleted successfully.");
        } catch (error) {
            console.error(error);
            showInfo("Error", "Failed to delete user", "ERROR");
        }
        setDeleteConfirm(null);
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminCreationLoading(true);
        // Create secondary app to avoid logging out current admin
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
            
            if (currentUser) {
                authService.logAdminAction(currentUser.id, currentUser.name, "Created Admin", `New Admin: ${newAdminName}`, "SUCCESS");
            }

            showInfo("Success", `Admin ${newAdminName} created!`);
            setIsAdminModalOpen(false);
            setNewAdminName(''); setNewAdminEmail(''); setNewAdminPassword('');
        } catch (error: any) {
            showInfo("Error", error.message, "ERROR");
        } finally {
            await deleteApp(secondaryApp);
            setAdminCreationLoading(false);
        }
    };

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
            setDeletionRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: action } : r));
            
            if (currentUser) {
                authService.logAdminAction(currentUser.id, currentUser.name, `${action} Request`, `ID: ${request.id}`, action === 'APPROVED' ? "WARNING" : "INFO");
            }
        } catch (e) {
            console.error(e);
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
                
                {/* NAVIGATION TABS */}
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setActiveTab('STUDENTS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'STUDENTS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}>Students</button>
                    <button onClick={() => setActiveTab('ADMINS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'ADMINS' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}>Admins</button>
                    <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'LOGS' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Logs</button>
                    <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'REQUESTS' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Requests</button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <Card className="flex items-center p-4 border-l-4 border-l-blue-500">
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600 mr-4"><UserIcon size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Total Users</p><h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3></div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-l-indigo-500">
                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 mr-4"><GraduationCap size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Students</p><h3 className="text-2xl font-bold text-slate-800">{stats.students}</h3></div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-l-purple-500">
                    <div className="bg-purple-50 p-3 rounded-full text-purple-600 mr-4"><ShieldCheck size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Admins</p><h3 className="text-2xl font-bold text-slate-800">{stats.admins}</h3></div>
                </Card>
                <Card className="flex items-center p-4 border-l-4 border-l-red-500">
                    <div className="bg-red-50 p-3 rounded-full text-red-600 mr-4"><Ban size={24} /></div>
                    <div><p className="text-xs font-bold text-slate-500 uppercase">Blocked</p><h3 className="text-2xl font-bold text-slate-800">{stats.blocked}</h3></div>
                </Card>
            </div>

            {/* MAIN CONTENT AREA */}
            <Card className="min-h-[500px]">
                
                {/* TOOLBAR FOR STUDENT/ADMIN TABS */}
                {(activeTab === 'STUDENTS' || activeTab === 'ADMINS') && (
                    <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-slate-100 pb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={`Search ${activeTab === 'STUDENTS' ? 'students' : 'admins'}...`}
                                className="w-full pl-10 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none" value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>
                            
                            {/* ADD ADMIN BUTTON (Only visible in ADMINS tab for Super Admin) */}
                            {activeTab === 'ADMINS' && currentUser?.isSuperAdmin && (
                                <Button onClick={() => setIsAdminModalOpen(true)} className="flex items-center">
                                    <UserPlus size={18} className="mr-2" /> Add Admin
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- USERS LIST (STUDENTS or ADMINS) --- */}
                {(activeTab === 'STUDENTS' || activeTab === 'ADMINS') && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">User Profile</th>
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
                                                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="avatar" className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-200" />
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
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {user.class && <div className="mb-1"><span className="font-bold">Class:</span> {user.class}</div>}
                                            <div><span className="font-bold">Joined:</span> {new Date(user.joinedDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Super Admin can manage everyone. Regular Admin can manage Students only. */}
                                                {(currentUser?.isSuperAdmin || (user.role === UserRole.STUDENT && currentUser?.role === UserRole.ADMIN)) && !user.isSuperAdmin && (
                                                    <>
                                                        <button 
                                                            onClick={() => initiateStatusToggle(user.id, user.status)}
                                                            className={`p-2 rounded-lg hover:bg-slate-200 transition-colors ${user.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`}
                                                            title={user.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                                                        >
                                                            {user.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => setDeleteConfirm({ id: user.id, name: user.name })}
                                                            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={18} />
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
                            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl mt-4">
                                <UserIcon size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No {activeTab.toLowerCase()} found.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ACTIVITY LOGS --- */}
                {activeTab === 'LOGS' && (
                    <div>
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
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
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
                    </div>
                )}

                {/* --- REQUESTS --- */}
                {activeTab === 'REQUESTS' && (
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <ShieldAlert className="mr-2 text-red-600" size={20} /> Requests
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
                    </div>
                )}
            </Card>

            {/* MODALS */}
            
            <Modal isOpen={!!statusConfirm} onClose={() => setStatusConfirm(null)} title="Confirm Status Change">
                <div className="space-y-4">
                    <p className="text-slate-700">Are you sure you want to <strong>{statusConfirm?.status === 'ACTIVE' ? 'BLOCK' : 'UNBLOCK'}</strong> this user?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStatusConfirm(null)}>Cancel</Button>
                        <Button onClick={confirmStatusToggle} className={statusConfirm?.status === 'ACTIVE' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}>Confirm</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete User">
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                        <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Permanently delete {deleteConfirm?.name}?</p>
                            <p className="text-xs mt-1">This user will lose all data including exam results and payments. This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteUser}>Delete Permanently</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Create New Admin">
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-purple-900 text-sm mb-4">
                        <p className="font-bold mb-1">Admin Access Privileges</p>
                        <p>New admins will have full access to manage content, exams, and students. Only Super Admins can manage other admins.</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                            <input className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Admin Name" value={newAdminName} onChange={e=>setNewAdminName(e.target.value)} required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                            <input className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" type="email" placeholder="admin@edumaster.com" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                            <input className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" type="password" placeholder="******" value={newAdminPassword} onChange={e=>setNewAdminPassword(e.target.value)} required minLength={6} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={adminCreationLoading} className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                            {adminCreationLoading ? 'Creating...' : 'Create Admin Account'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({...infoModal, isOpen: false})} title={infoModal.title}>
                <div className="p-4 text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${infoModal.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {infoModal.type === 'SUCCESS' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <p className="text-slate-700 font-medium">{infoModal.message}</p>
                    <Button className="mt-6 w-full" onClick={() => setInfoModal({...infoModal, isOpen: false})}>OK</Button>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
