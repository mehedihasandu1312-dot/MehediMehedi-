import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog } from '../../types';
import { db, firebaseConfig } from '../../services/firebase';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { 
    Search, 
    Ban, 
    Eye, 
    Filter, 
    Edit,
    Save,
    X,
    GraduationCap,
    Clock,
    Mail,
    CheckCircle,
    ShieldCheck,
    Plus,
    Lock,
    Users,
    Activity,
    School,
    ScrollText,
    ShieldAlert
} from 'lucide-react';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    adminLogs?: AdminActivityLog[]; // Optional for now
}

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMINS'>('STUDENTS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Student Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', class: '', institute: '' });

  // Admin Logs State
  const [viewLogsAdminId, setViewLogsAdminId] = useState<string | null>(null);

  // Admin Creation State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminCreationLoading, setAdminCreationLoading] = useState(false);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const students = users.filter(u => u.role === UserRole.STUDENT);
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    
    return {
        totalStudents: students.length,
        totalAdmins: admins.length,
        activeStudents: students.filter(u => u.status === 'ACTIVE').length,
        blocked: users.filter(u => u.status === 'BLOCKED').length,
    };
  }, [users]);

  // --- Filtering Logic ---
  const displayUsers = users.filter(u => {
    // 1. Role Filter
    if (activeTab === 'STUDENTS' && u.role !== UserRole.STUDENT) return false;
    if (activeTab === 'ADMINS' && u.role !== UserRole.ADMIN) return false;

    // 2. Search
    const name = u.name || '';
    const email = u.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Dropdown Filters (Only for Students)
    if (activeTab === 'STUDENTS') {
        const matchesClass = filterClass === 'ALL' || u.class === filterClass;
        const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
        return matchesSearch && matchesClass && matchesStatus;
    }

    return matchesSearch;
  });

  // --- Handlers ---

  const handleToggleStatus = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED', role: UserRole) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'Block' : 'Unblock';
    
    const confirmMsg = role === UserRole.ADMIN 
        ? `⚠️ CRITICAL: Are you sure you want to ${action} this ADMIN?\nThis will prevent them from accessing the dashboard immediately.`
        : `Are you sure you want to ${action} this student account?`;

    if (confirm(confirmMsg)) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const openStudentModal = (user: User) => {
      setSelectedUser(user);
      setEditForm({
          name: user.name || '',
          class: user.class || '',
          institute: user.institute || ''
      });
      setIsEditing(false);
  };

  const handleSaveStudentChanges = () => {
      if (!selectedUser) return;
      setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
          ? { ...u, name: editForm.name, class: editForm.class, institute: editForm.institute }
          : u
      ));
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      alert("Profile updated successfully.");
  };

  // --- ADMIN CREATION LOGIC (SECURE) ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminCreationLoading(true);

      // 1. Initialize a secondary Firebase App to create user WITHOUT logging out current admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      try {
          // 2. Create User in Auth
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newAdminEmail, newAdminPassword);
          const newUser = userCredential.user;

          // 3. Create User Document in Firestore (using main db connection)
          const newAdminData: User = {
              id: newUser.uid,
              name: newAdminName,
              email: newAdminEmail,
              role: UserRole.ADMIN,
              status: 'ACTIVE',
              profileCompleted: true,
              joinedDate: new Date().toISOString(),
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAdminName)}&background=0D9488&color=fff`
          };

          await setDoc(doc(db, "users", newUser.uid), newAdminData);

          // 4. Update Local State
          setUsers(prev => [...prev, newAdminData]);

          alert(`New Admin "${newAdminName}" created successfully!`);
          setIsAdminModalOpen(false);
          setNewAdminEmail('');
          setNewAdminPassword('');
          setNewAdminName('');

      } catch (error: any) {
          console.error("Admin Creation Error:", error);
          alert("Error creating admin: " + error.message);
      } finally {
          // 5. Cleanup Secondary App
          await deleteApp(secondaryApp);
          setAdminCreationLoading(false);
      }
  };

  // Filter logs for selected admin
  const selectedAdminLogs = viewLogsAdminId 
    ? adminLogs.filter(l => l.adminId === viewLogsAdminId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const selectedAdminName = users.find(u => u.id === viewLogsAdminId)?.name || 'Admin';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">User & Admin Management</h1>
            <p className="text-slate-500 text-sm">Manage student access and platform administrators.</p>
        </div>
        
        {/* TAB SWITCHER */}
        <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
                onClick={() => setActiveTab('STUDENTS')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === 'STUDENTS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Users size={16} className="mr-2" /> Students
            </button>
            <button
                onClick={() => setActiveTab('ADMINS')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === 'ADMINS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <ShieldCheck size={16} className="mr-2" /> Admins
            </button>
        </div>
      </div>

      {/* 1. Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents}</h3>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
              <p className="text-slate-500 text-xs font-bold uppercase">System Admins</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalAdmins}</h3>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Active Students</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.activeStudents}</h3>
          </Card>
           <Card className="p-4 border-l-4 border-l-red-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Blocked Users</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.blocked}</h3>
          </Card>
      </div>

      <Card className="min-h-[500px]">
        {/* 2. Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'STUDENTS' ? "Search students..." : "Search admins..."}
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters / Actions */}
            <div className="flex gap-2 w-full md:w-auto">
                {activeTab === 'STUDENTS' ? (
                    <>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
                            <select 
                                className="pl-9 pr-8 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white appearance-none text-sm font-medium text-slate-600"
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                            >
                                <option value="ALL">All Classes</option>
                                <option value="9">Class 9</option>
                                <option value="10">Class 10</option>
                                <option value="11">Class 11</option>
                                <option value="12">Class 12</option>
                            </select>
                        </div>
                        
                        <select 
                            className="p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm font-medium text-slate-600"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="BLOCKED">Blocked Only</option>
                        </select>
                    </>
                ) : (
                    <Button onClick={() => setIsAdminModalOpen(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-700">
                        <Plus size={18} className="mr-2" /> Add New Admin
                    </Button>
                )}
            </div>
        </div>

        {/* 3. User Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-3 pl-4 font-semibold text-slate-600 text-sm">Profile</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Role Details</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Status</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Joined</th>
                        <th className="py-3 text-right pr-4 font-semibold text-slate-600 text-sm">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {displayUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-4 pl-4">
                                <div className="flex items-center">
                                    <img 
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                                        alt={user.name} 
                                        className="w-10 h-10 rounded-full mr-3 border border-slate-200 object-cover"
                                    />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm flex items-center">
                                            {user.name}
                                            {user.role === UserRole.ADMIN && <ShieldCheck size={14} className="ml-1 text-emerald-500" />}
                                        </p>
                                        <p className="text-xs text-slate-500">{user.email || 'No Email'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4">
                                <div className="text-sm">
                                    {user.role === UserRole.ADMIN ? (
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-100">
                                            Administrator
                                        </span>
                                    ) : (
                                        <>
                                            <p className="font-medium text-slate-700">Class {user.class || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{user.institute || 'No Institute'}</p>
                                        </>
                                    )}
                                </div>
                            </td>
                            <td className="py-4">
                                <Badge color={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                    {user.status || 'UNKNOWN'}
                                </Badge>
                            </td>
                            <td className="py-4 text-xs text-slate-500">
                                {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-4 text-right pr-4">
                                <div className="flex items-center justify-end space-x-2">
                                    {/* STUDENT ACTIONS */}
                                    {user.role === UserRole.STUDENT && (
                                        <Button 
                                            variant="outline" 
                                            className="p-1.5 h-auto border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" 
                                            onClick={() => openStudentModal(user)}
                                            title="Edit Profile"
                                        >
                                            <Eye size={16} />
                                        </Button>
                                    )}

                                    {/* ADMIN ACTIONS: Activity Log */}
                                    {user.role === UserRole.ADMIN && (
                                        <Button 
                                            variant="outline"
                                            className="p-1.5 h-auto border-slate-200 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                            onClick={() => setViewLogsAdminId(user.id)}
                                            title="View Activity Logs"
                                        >
                                            <ScrollText size={16} />
                                        </Button>
                                    )}

                                    {/* BLOCK/UNBLOCK (Both) */}
                                    <Button 
                                        variant="outline" 
                                        className={`p-1.5 h-auto border-slate-200 ${
                                            user.status === 'ACTIVE' 
                                            ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                                            : 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200'
                                        }`}
                                        onClick={() => handleToggleStatus(user.id, user.status, user.role)}
                                        title={user.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
                                    >
                                        {user.role === UserRole.ADMIN ? <ShieldAlert size={16} /> : <Ban size={16} />}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {displayUsers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-b-xl">
                                <div className="flex flex-col items-center">
                                    <Search size={32} className="mb-2 opacity-20" />
                                    <p>No {activeTab.toLowerCase()} found.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>

      {/* --- STUDENT MODAL --- */}
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={isEditing ? "Edit Student Profile" : "Student Overview"}
      >
        {selectedUser && (
            <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-4">
                    <img src={selectedUser.avatar} alt="av" className="w-16 h-16 rounded-full border-4 border-slate-100" />
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3>
                        <p className="text-sm text-slate-500">{selectedUser.email}</p>
                    </div>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="ml-auto text-indigo-600 hover:bg-indigo-50 p-2 rounded-full"><Edit size={18}/></button>}
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        <input className="w-full p-2 border rounded" placeholder="Full Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="Institute" value={editForm.institute} onChange={e => setEditForm({...editForm, institute: e.target.value})} />
                        <select className="w-full p-2 border rounded" value={editForm.class} onChange={e => setEditForm({...editForm, class: e.target.value})}>
                            <option value="">Select Class</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                        </select>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSaveStudentChanges}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-slate-400 block">Class</span>
                            <span className="font-bold text-slate-700">{selectedUser.class || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">Institute</span>
                            <span className="font-bold text-slate-700">{selectedUser.institute || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 block">Status</span>
                            <span className={`font-bold ${selectedUser.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>{selectedUser.status}</span>
                        </div>
                    </div>
                )}
            </div>
        )}
      </Modal>

      {/* --- ADMIN ACTIVITY LOG MODAL --- */}
      <Modal 
        isOpen={!!viewLogsAdminId} 
        onClose={() => setViewLogsAdminId(null)} 
        title={`Activity Log: ${selectedAdminName}`}
      >
          <div className="max-h-[60vh] overflow-y-auto pr-2">
              {selectedAdminLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                      <ScrollText size={32} className="mx-auto mb-2 opacity-20" />
                      <p>No activity recorded for this admin yet.</p>
                  </div>
              ) : (
                  <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                      {selectedAdminLogs.map((log) => (
                          <div key={log.id} className="relative pl-6">
                              <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                                  log.type === 'DANGER' ? 'bg-red-500' : 
                                  log.type === 'WARNING' ? 'bg-amber-500' :
                                  log.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}></div>
                              
                              <div className="flex flex-col">
                                  <span className="text-xs text-slate-400 font-mono mb-0.5">
                                      {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                  <span className="font-bold text-slate-800 text-sm">
                                      {log.action}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                      {log.details}
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setViewLogsAdminId(null)}>Close</Button>
          </div>
      </Modal>

      {/* --- ADD ADMIN MODAL --- */}
      <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Create New Admin">
          <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start">
                  <ShieldCheck className="text-emerald-600 mr-3 mt-0.5 shrink-0" size={20} />
                  <div>
                      <h4 className="text-sm font-bold text-emerald-800">Secure Creation</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                          You are creating a user with <strong>Full Access</strong>. This user can manage content, exams, and other students.
                      </p>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                  <div className="relative">
                      <Users size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                          type="text" 
                          required
                          className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. Senior Instructor"
                          value={newAdminName}
                          onChange={e => setNewAdminName(e.target.value)}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                          type="email" 
                          required
                          className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="admin@edumaster.com"
                          value={newAdminEmail}
                          onChange={e => setNewAdminEmail(e.target.value)}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                          type="password" 
                          required
                          minLength={6}
                          className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="******"
                          value={newAdminPassword}
                          onChange={e => setNewAdminPassword(e.target.value)}
                      />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Must be at least 6 characters.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdminModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={adminCreationLoading}>
                      {adminCreationLoading ? "Creating..." : "Create Admin Account"}
                  </Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default UserManagement;