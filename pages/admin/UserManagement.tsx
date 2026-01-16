import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog } from '../../types';
import { db, firebaseConfig } from '../../services/firebase';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { MASTER_ADMIN_EMAIL } from '../../constants';
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
    ShieldAlert,
    Phone,
    MapPin,
    Award,
    Hash,
    Briefcase,
    Calendar,
    AlertTriangle,
    Send
} from 'lucide-react';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    adminLogs?: AdminActivityLog[]; 
    currentUser?: User; 
}

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs = [], currentUser }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMINS'>('STUDENTS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Student Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Expanded Edit Form State
  const [editForm, setEditForm] = useState({ 
      name: '', 
      class: '', 
      institute: '',
      phone: '',
      district: '',
      studentType: 'REGULAR' as 'REGULAR' | 'ADMISSION',
      points: 0
  });

  // Admin Logs State
  const [viewLogsAdminId, setViewLogsAdminId] = useState<string | null>(null);

  // Admin Warning State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [targetAdminId, setTargetAdminId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState('');

  // Admin Creation State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminCreationLoading, setAdminCreationLoading] = useState(false);

  // --- PERMISSION CHECK ---
  const isSuperAdmin = currentUser?.isSuperAdmin === true || currentUser?.email === MASTER_ADMIN_EMAIL;

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
    
    if (activeTab === 'ADMINS') {
        if (u.role !== UserRole.ADMIN) return false;
        if (u.id === currentUser?.id) return false;
        if (!isSuperAdmin) return false;
    }

    // 2. Search
    const name = u.name || '';
    const email = u.email || '';
    const phone = u.phone || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    
    // 3. Dropdown Filters (Only for Students)
    if (activeTab === 'STUDENTS') {
        const matchesClass = filterClass === 'ALL' || u.class === filterClass;
        const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
        return matchesSearch && matchesClass && matchesStatus;
    }

    return matchesSearch;
  });

  // --- Handlers ---

  const handleToggleStatus = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED', targetRole: UserRole) => {
    if (targetRole === UserRole.ADMIN && !isSuperAdmin) {
        alert("Access Denied: Only Super Admin can manage other admins.");
        return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser?.isSuperAdmin || targetUser?.email === MASTER_ADMIN_EMAIL) {
        alert("Action Restricted: Master/Super Admin cannot be blocked.");
        return;
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'Block' : 'Unblock';
    
    const confirmMsg = targetRole === UserRole.ADMIN 
        ? `⚠️ CRITICAL: Are you sure you want to ${action} this ADMIN?`
        : `Are you sure you want to ${action} this student account?`;

    if (confirm(confirmMsg)) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  // --- WARNING SYSTEM ---
  const openWarningModal = (adminId: string) => {
      setTargetAdminId(adminId);
      setWarningText('');
      setWarningModalOpen(true);
  };

  const handleSendWarning = () => {
      if (!targetAdminId || !warningText.trim()) return;

      const timestamp = new Date().toLocaleString();
      const formattedWarning = `[${timestamp}] ${warningText}`;

      setUsers(prev => prev.map(u => {
          if (u.id === targetAdminId) {
              const currentWarnings = u.warnings || [];
              return { ...u, warnings: [...currentWarnings, formattedWarning] };
          }
          return u;
      }));

      alert("Warning sent to Admin!");
      setWarningModalOpen(false);
      setTargetAdminId(null);
  };

  const openStudentModal = (user: User) => {
      setSelectedUser(user);
      // Initialize form with all available data
      setEditForm({
          name: user.name || '',
          class: user.class || '',
          institute: user.institute || '',
          phone: user.phone || '',
          district: user.district || '',
          studentType: user.studentType || 'REGULAR',
          points: user.points || 0
      });
      setIsEditing(false);
  };

  const handleSaveStudentChanges = () => {
      if (!selectedUser) return;
      
      const updatedUser: User = {
          ...selectedUser,
          name: editForm.name,
          class: editForm.class,
          institute: editForm.institute,
          phone: editForm.phone,
          district: editForm.district,
          studentType: editForm.studentType,
          points: Number(editForm.points)
      };

      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setIsEditing(false);
      alert("Student profile updated successfully.");
  };

  // --- ADMIN CREATION LOGIC ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAdminCreationLoading(true);

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
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAdminName)}&background=0D9488&color=fff`,
              warnings: []
          };

          await setDoc(doc(db, "users", newUser.uid), newAdminData);
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
          await deleteApp(secondaryApp);
          setAdminCreationLoading(false);
      }
  };

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
        
        <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
                onClick={() => setActiveTab('STUDENTS')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    activeTab === 'STUDENTS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Users size={16} className="mr-2" /> Students
            </button>
            
            {isSuperAdmin && (
                <button
                    onClick={() => setActiveTab('ADMINS')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                        activeTab === 'ADMINS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ShieldCheck size={16} className="mr-2" /> Admins
                </button>
            )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents}</h3>
          </Card>
          
          {isSuperAdmin ? (
              <Card className="p-4 border-l-4 border-l-emerald-500">
                  <p className="text-slate-500 text-xs font-bold uppercase">System Admins</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalAdmins}</h3>
              </Card>
          ) : (
              <Card className="p-4 border-l-4 border-l-gray-300 bg-gray-50 opacity-60">
                  <p className="text-slate-400 text-xs font-bold uppercase">Admins</p>
                  <h3 className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Lock size={16}/> Hidden</h3>
              </Card>
          )}

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
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'STUDENTS' ? "Search by Name, Email or Phone..." : "Search admins..."}
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

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
                    isSuperAdmin && (
                        <Button onClick={() => setIsAdminModalOpen(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-700">
                            <Plus size={18} className="mr-2" /> Add New Admin
                        </Button>
                    )
                )}
            </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-3 pl-4 font-semibold text-slate-600 text-sm">Profile</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Contact</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Role Details</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Status</th>
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
                                            {(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">MASTER</span>}
                                        </p>
                                        <p className="text-xs text-slate-500">Rank: {user.rank || 'N/A'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4">
                                <div className="text-sm">
                                    <p className="text-slate-700 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                                    <p className="text-slate-500 flex items-center gap-1"><Phone size={12}/> {user.phone || 'N/A'}</p>
                                </div>
                            </td>
                            <td className="py-4">
                                <div className="text-sm">
                                    {user.role === UserRole.ADMIN ? (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-100">
                                                Administrator
                                            </span>
                                            {user.warnings && user.warnings.length > 0 && (
                                                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-100 flex items-center">
                                                    <AlertTriangle size={10} className="mr-1" /> {user.warnings.length} Warnings
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-medium text-slate-700">{user.class || 'No Class'}</p>
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
                            <td className="py-4 text-right pr-4">
                                <div className="flex items-center justify-end space-x-2">
                                    {user.role === UserRole.STUDENT && (
                                        <Button 
                                            variant="outline" 
                                            className="p-1.5 h-auto border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" 
                                            onClick={() => openStudentModal(user)}
                                            title="View Full Profile"
                                        >
                                            <Eye size={16} />
                                        </Button>
                                    )}

                                    {/* ADMIN: VIEW LOGS & WARNINGS */}
                                    {user.role === UserRole.ADMIN && isSuperAdmin && (
                                        <>
                                            <Button 
                                                variant="outline"
                                                className="p-1.5 h-auto border-slate-200 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                onClick={() => setViewLogsAdminId(user.id)}
                                                title="View Activity Logs"
                                            >
                                                <ScrollText size={16} />
                                            </Button>
                                            
                                            {/* Warning Button */}
                                            {!(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && (
                                                <Button 
                                                    variant="outline"
                                                    className="p-1.5 h-auto border-slate-200 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                                    onClick={() => openWarningModal(user.id)}
                                                    title="Issue Warning"
                                                >
                                                    <AlertTriangle size={16} />
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {!(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && (
                                        <Button 
                                            variant="outline" 
                                            className={`p-1.5 h-auto border-slate-200 ${
                                                user.status === 'ACTIVE' 
                                                ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                                                : 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200'
                                            }`}
                                            onClick={() => handleToggleStatus(user.id, user.status, user.role)}
                                            title={user.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                        >
                                            {user.role === UserRole.ADMIN ? <ShieldAlert size={16} /> : <Ban size={16} />}
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </Card>

      {/* --- STUDENT FULL PROFILE MODAL (EXPANDED) --- */}
      {/* (Code remains same as provided in previous version) */}
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={isEditing ? "Edit Student Profile" : "Student Details (Full View)"}
      >
        {selectedUser && (
            <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-slate-100">
                    <img src={selectedUser.avatar} alt="av" className="w-20 h-20 rounded-full border-4 border-indigo-50" />
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3>
                        <p className="text-sm text-slate-500">{selectedUser.email}</p>
                        <div className="flex gap-2 mt-1">
                            <Badge color="bg-indigo-100 text-indigo-700">{selectedUser.role}</Badge>
                            <Badge color={selectedUser.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                {selectedUser.status}
                            </Badge>
                        </div>
                    </div>
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="ml-auto text-indigo-600 hover:bg-indigo-50 p-2 rounded-full border border-indigo-100"
                            title="Edit Data"
                        >
                            <Edit size={20}/>
                        </button>
                    )}
                </div>

                {isEditing ? (
                    // --- EDIT MODE ---
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input className="w-full p-2 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input className="w-full p-2 border rounded" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Institute</label>
                            <input className="w-full p-2 border rounded" value={editForm.institute} onChange={e => setEditForm({...editForm, institute: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Class/Category</label>
                                <select className="w-full p-2 border rounded" value={editForm.class} onChange={e => setEditForm({...editForm, class: e.target.value})}>
                                    <option value="">Select Class</option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                    <option value="Admission">Admission</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">District</label>
                                <input className="w-full p-2 border rounded" value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Student Type</label>
                                <select className="w-full p-2 border rounded" value={editForm.studentType} onChange={e => setEditForm({...editForm, studentType: e.target.value as any})}>
                                    <option value="REGULAR">Regular</option>
                                    <option value="ADMISSION">Admission</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">XP / Points</label>
                                <input type="number" className="w-full p-2 border rounded" value={editForm.points} onChange={e => setEditForm({...editForm, points: Number(e.target.value)})} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSaveStudentChanges}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    // --- VIEW MODE (Comprehensive) ---
                    <div className="space-y-6">
                        
                        {/* 1. Personal & Contact */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                                <Users size={14} className="mr-1"/> Personal Details
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <span className="block text-xs text-slate-400">Mobile Number</span>
                                    <span className="font-semibold text-slate-700 flex items-center">
                                        <Phone size={12} className="mr-1 text-slate-400"/> {selectedUser.phone || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400">District</span>
                                    <span className="font-semibold text-slate-700 flex items-center">
                                        <MapPin size={12} className="mr-1 text-slate-400"/> {selectedUser.district || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400">Joined On</span>
                                    <span className="font-semibold text-slate-700 flex items-center">
                                        <Calendar size={12} className="mr-1 text-slate-400"/> 
                                        {new Date(selectedUser.joinedDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Academic Info */}
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase mb-3 flex items-center">
                                <GraduationCap size={14} className="mr-1"/> Academic Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <span className="block text-xs text-indigo-400">Student Type</span>
                                    <span className="font-bold text-indigo-900">{selectedUser.studentType || 'REGULAR'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-indigo-400">Class / Sector</span>
                                    <span className="font-bold text-indigo-900 flex items-center">
                                        <Briefcase size={12} className="mr-1 text-indigo-400"/> {selectedUser.class || 'N/A'}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-xs text-indigo-400">Institute</span>
                                    <span className="font-bold text-indigo-900 flex items-center">
                                        <School size={12} className="mr-1 text-indigo-400"/> {selectedUser.institute || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Platform Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-center">
                                <div className="text-amber-500 mb-1 flex justify-center"><Award size={20}/></div>
                                <div className="text-2xl font-bold text-amber-700">{selectedUser.points || 0}</div>
                                <div className="text-[10px] font-bold text-amber-600 uppercase">Total XP</div>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                                <div className="text-emerald-500 mb-1 flex justify-center"><Hash size={20}/></div>
                                <div className="text-2xl font-bold text-emerald-700">{selectedUser.rank || '-'}</div>
                                <div className="text-[10px] font-bold text-emerald-600 uppercase">Global Rank</div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        )}
      </Modal>

      {/* --- ADMIN LOGS MODAL --- */}
      <Modal isOpen={!!viewLogsAdminId} onClose={() => setViewLogsAdminId(null)} title={`Activity Log: ${selectedAdminName}`}>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
              {/* Show Warnings at the top if any */}
              {users.find(u => u.id === viewLogsAdminId)?.warnings?.length ? (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center">
                          <AlertTriangle size={14} className="mr-1"/> Warnings Issued
                      </h4>
                      <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                          {users.find(u => u.id === viewLogsAdminId)?.warnings?.map((w, idx) => (
                              <li key={idx}>{w}</li>
                          ))}
                      </ul>
                  </div>
              ) : null}

              {selectedAdminLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                      <ScrollText size={32} className="mx-auto mb-2 opacity-20" />
                      <p>No activity recorded yet.</p>
                  </div>
              ) : (
                  <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
                      {selectedAdminLogs.map((log) => (
                          <div key={log.id} className="relative pl-6">
                              <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                                  log.type === 'DANGER' ? 'bg-red-500' : log.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex flex-col">
                                  <span className="text-xs text-slate-400 font-mono mb-0.5">{new Date(log.timestamp).toLocaleString()}</span>
                                  <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                                  <span className="text-xs text-slate-500">{log.details}</span>
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

      {/* --- WARNING MODAL --- */}
      <Modal isOpen={warningModalOpen} onClose={() => setWarningModalOpen(false)} title="Issue Warning to Admin">
          <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-sm flex items-start">
                  <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0" />
                  <p>
                      You are issuing a warning to this administrator. This will be recorded in their profile.
                  </p>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Warning Message</label>
                  <textarea 
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      rows={4}
                      placeholder="e.g. Please do not delete exam questions without approval..."
                      value={warningText}
                      onChange={(e) => setWarningText(e.target.value)}
                  />
              </div>
              <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setWarningModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendWarning} className="bg-amber-500 hover:bg-amber-600 border-amber-600 text-white flex items-center">
                      <Send size={16} className="mr-2"/> Send Warning
                  </Button>
              </div>
          </div>
      </Modal>

      {/* --- ADD ADMIN MODAL --- */}
      <Modal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} title="Create New Admin">
          <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start">
                  <ShieldCheck className="text-emerald-600 mr-3 mt-0.5 shrink-0" size={20} />
                  <div>
                      <h4 className="text-sm font-bold text-emerald-800">Secure Creation</h4>
                      <p className="text-xs text-emerald-700 mt-1">You are creating a user with <strong>Full Access</strong> (Regular Admin).</p>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                  <input type="text" required className="w-full p-2 border rounded" placeholder="e.g. Senior Instructor" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="w-full p-2 border rounded" placeholder="admin@edumaster.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required minLength={6} className="w-full p-2 border rounded" placeholder="******" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} />
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