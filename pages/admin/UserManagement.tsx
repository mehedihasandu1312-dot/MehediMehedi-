
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User, UserRole, AdminActivityLog, DeletionRequest } from '../../types';
import { db, firebaseConfig } from '../../services/firebase';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
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
    Send,
    BarChart2,
    Check,
    Briefcase as BriefcaseIcon,
    Zap,
    History,
    TrendingUp,
    Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    adminLogs?: AdminActivityLog[]; 
    currentUser?: User; 
    educationLevels: { REGULAR: string[], ADMISSION: string[] };
    deletionRequests?: DeletionRequest[];
    setDeletionRequests?: React.Dispatch<React.SetStateAction<DeletionRequest[]>>;
}

const UserManagement: React.FC<Props> = ({ users, setUsers, adminLogs = [], currentUser, educationLevels, deletionRequests = [], setDeletionRequests }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMINS' | 'REQUESTS'>('STUDENTS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Student Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // NEW: Admin Profile Modal State
  const [selectedAdminProfile, setSelectedAdminProfile] = useState<User | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({ 
      name: '', 
      class: '', 
      institute: '',
      phone: '',
      district: '',
      studentType: 'REGULAR' as 'REGULAR' | 'ADMISSION',
      points: 0
  });

  // Admin Warning State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [targetAdminId, setTargetAdminId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState('');

  // Status Change Confirmation State
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; id: string; status: 'ACTIVE' | 'BLOCKED'; role: UserRole } | null>(null);

  // DELETE CONFIRMATION STATE
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Admin Creation State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminCreationLoading, setAdminCreationLoading] = useState(false);

  // Info/Alert Modal State
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ 
      isOpen: false, title: '', message: '', type: 'SUCCESS' 
  });

  const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
      setInfoModal({ isOpen: true, title, message, type });
  };

  const isSuperAdmin = currentUser?.isSuperAdmin === true || currentUser?.email === MASTER_ADMIN_EMAIL;

  // --- DEDUPLICATION LOGIC ---
  const uniqueUsers = useMemo(() => {
      const seen = new Set();
      const sortedUsers = [...users].sort((a, b) => {
          if (a.profileCompleted === b.profileCompleted) {
              return b.id.length - a.id.length; 
          }
          return a.profileCompleted ? -1 : 1;
      });

      return sortedUsers.filter(u => {
          const email = u.email ? u.email.toLowerCase() : `no-email-${u.id}`;
          if (seen.has(email)) return false;
          seen.add(email);
          return true;
      });
  }, [users]);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const students = uniqueUsers.filter(u => u.role === UserRole.STUDENT);
    const admins = uniqueUsers.filter(u => u.role === UserRole.ADMIN);
    
    return {
        totalStudents: students.length,
        totalAdmins: admins.length,
        activeStudents: students.filter(u => u.status === 'ACTIVE').length,
        blocked: uniqueUsers.filter(u => u.status === 'BLOCKED').length,
        pendingRequests: deletionRequests.filter(r => r.status === 'PENDING').length
    };
  }, [uniqueUsers, deletionRequests]);

  // --- ADMIN ANALYTICS ENGINE ---
  const getAdminAnalytics = (adminId: string) => {
      const logs = adminLogs.filter(l => l.adminId === adminId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // 1. Counts
      const actions24h = logs.filter(l => new Date(l.timestamp) > oneDayAgo).length;
      const actionsMonth = logs.filter(l => {
          const d = new Date(l.timestamp);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      const totalActions = logs.length;

      // 2. Active Time Estimation
      const sortedAsc = [...logs].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      let totalMinutes = 0;
      
      for(let i = 0; i < sortedAsc.length; i++) {
          if (i < sortedAsc.length - 1) {
              const curr = new Date(sortedAsc[i].timestamp).getTime();
              const next = new Date(sortedAsc[i+1].timestamp).getTime();
              const diffMins = (next - curr) / 60000;
              
              if (diffMins < 20) {
                  totalMinutes += diffMins;
              } else {
                  totalMinutes += 5; // Base time per task
              }
          } else {
              totalMinutes += 5; // Last task
          }
      }
      
      const activeHours = Math.floor(totalMinutes / 60);
      const activeMinsRemainder = Math.floor(totalMinutes % 60);

      // 3. Daily Activity Graph Data
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const activityMap: Record<number, number> = {};
      for(let i=1; i<=daysInMonth; i++) activityMap[i] = 0;

      logs.forEach(log => {
          const logDate = new Date(log.timestamp);
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
              const day = logDate.getDate();
              activityMap[day] = (activityMap[day] || 0) + 1;
          }
      });

      const chartData = Object.entries(activityMap).map(([day, count]) => ({
          name: day,
          actions: count
      }));

      return {
          actions24h,
          actionsMonth,
          totalActions,
          activeTime: `${activeHours}h ${activeMinsRemainder}m`,
          chartData,
          logs // Full history
      };
  };

  const adminAnalytics = selectedAdminProfile ? getAdminAnalytics(selectedAdminProfile.id) : null;

  // --- Filtering Logic ---
  const displayUsers = uniqueUsers.filter(u => {
    if (activeTab === 'STUDENTS' && u.role !== UserRole.STUDENT) return false;
    
    if (activeTab === 'ADMINS') {
        if (u.role !== UserRole.ADMIN) return false;
        // Super Admin sees everyone. Non-super doesn't see Admins tab usually, but if they do, hide master admin
        if (!isSuperAdmin && (u.isSuperAdmin || u.email === MASTER_ADMIN_EMAIL)) return false;
    }

    const name = u.name || '';
    const email = u.email || '';
    const phone = u.phone || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    
    if (activeTab === 'STUDENTS') {
        const matchesClass = filterClass === 'ALL' || u.class === filterClass;
        const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
        return matchesSearch && matchesClass && matchesStatus;
    }

    return matchesSearch;
  });

  // --- Handlers ---

  const initiateStatusToggle = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED', targetRole: UserRole) => {
    if (targetRole === UserRole.ADMIN && !isSuperAdmin) {
        showInfo("Access Denied", "Only Super Admin can manage other admins.", "ERROR");
        return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser?.isSuperAdmin || targetUser?.email === MASTER_ADMIN_EMAIL) {
        showInfo("Action Restricted", "Master/Super Admin cannot be blocked.", "ERROR");
        return;
    }

    // NEW LOGIC: If not Super Admin, create a request instead of executing
    if (!isSuperAdmin && setDeletionRequests) {
        if (window.confirm("As a Sub-Admin, your action requires approval. Submit request?")) {
            const request: DeletionRequest = {
                id: `req_${Date.now()}`,
                requesterId: currentUser?.id || 'unknown',
                requesterName: currentUser?.name || 'Admin',
                actionType: currentStatus === 'ACTIVE' ? 'BLOCK_USER' : 'DELETE_USER',
                targetId: id,
                targetName: targetUser?.name || 'User',
                status: 'PENDING',
                timestamp: new Date().toISOString(),
                reason: `Requested to change status from ${currentStatus}`
            };
            setDeletionRequests(prev => [request, ...prev]);
            showInfo("Request Submitted", "Main Admin will review your request.");
        }
        return;
    }

    setStatusConfirm({ isOpen: true, id, status: currentStatus, role: targetRole });
  };

  const confirmStatusToggle = () => {
    if (!statusConfirm) return;
    const { id, status } = statusConfirm;
    const newStatus = status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    if (selectedUser?.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setStatusConfirm(null);
  };

  const handleDeleteUser = async () => {
      if (!deleteConfirm) return;
      
      try {
          // 1. Delete from Firestore
          await deleteDoc(doc(db, "users", deleteConfirm.id));
          
          // 2. Update Local State
          setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
          
          if (selectedUser?.id === deleteConfirm.id) setSelectedUser(null);
          if (selectedAdminProfile?.id === deleteConfirm.id) setSelectedAdminProfile(null);

          showInfo("Deleted", `${deleteConfirm.name} has been permanently removed.`);
      } catch (error: any) {
          console.error("Delete failed:", error);
          showInfo("Error", "Failed to delete user from database.", "ERROR");
      } finally {
          setDeleteConfirm(null);
      }
  };

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

      showInfo("Warning Sent", "The warning has been issued to the administrator.");
      setWarningModalOpen(false);
      setTargetAdminId(null);
  };

  const openStudentModal = (user: User) => {
      setSelectedUser(user);
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
      showInfo("Profile Updated", "Student details have been saved successfully.");
  };

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
          showInfo("Admin Created", `New Admin "${newAdminName}" created successfully!`);
          setIsAdminModalOpen(false);
          setNewAdminEmail('');
          setNewAdminPassword('');
          setNewAdminName('');
      } catch (error: any) {
          console.error("Admin Creation Error:", error);
          showInfo("Creation Failed", error.message, "ERROR");
      } finally {
          await deleteApp(secondaryApp);
          setAdminCreationLoading(false);
      }
  };

  const handleApproveRequest = (request: DeletionRequest) => {
      if (!setDeletionRequests) return;
      if (request.actionType === 'BLOCK_USER' || request.actionType === 'DELETE_USER') {
          setUsers(prev => prev.map(u => u.id === request.targetId ? { ...u, status: 'BLOCKED' } : u));
      } 
      setDeletionRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'APPROVED' } : r));
      showInfo("Approved", `Request to ${request.actionType} approved.`);
  };

  const handleRejectRequest = (request: DeletionRequest) => {
      if (!setDeletionRequests) return;
      setDeletionRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'REJECTED' } : r));
  };

  const getLogColor = (type: string) => {
      switch(type) {
          case 'DANGER': return 'bg-red-100 text-red-700';
          case 'WARNING': return 'bg-amber-100 text-amber-700';
          case 'SUCCESS': return 'bg-emerald-100 text-emerald-700';
          default: return 'bg-blue-100 text-blue-700';
      }
  };

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
                <>
                    <button
                        onClick={() => setActiveTab('ADMINS')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'ADMINS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <ShieldCheck size={16} className="mr-2" /> Admins
                    </button>
                    <button
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            activeTab === 'REQUESTS' ? 'bg-white shadow text-amber-700' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <AlertTriangle size={16} className="mr-2" /> Requests
                        {stats.pendingRequests > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{stats.pendingRequests}</span>}
                    </button>
                </>
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
        {/* Toolbar (Search & Filter) */}
        {activeTab !== 'REQUESTS' && (
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
                                    <optgroup label="Regular">
                                        {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Admission">
                                        {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
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
        )}

        {/* --- REQUESTS TAB VIEW --- */}
        {activeTab === 'REQUESTS' && (
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Pending Approvals</h3>
                {deletionRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No pending requests from sub-admins.</div>
                ) : (
                    deletionRequests.filter(r => r.status === 'PENDING').map(req => (
                        <div key={req.id} className="p-4 border border-amber-200 bg-amber-50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{req.actionType.replace('_', ' ')} <span className="font-mono text-xs bg-white px-1 rounded ml-2">{req.targetName}</span></p>
                                <p className="text-xs text-slate-600 mt-1">Requested by: <span className="font-bold">{req.requesterName}</span> on {new Date(req.timestamp).toLocaleString()}</p>
                                <p className="text-xs text-slate-500 italic mt-1">Reason: "{req.reason}"</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)}>Reject</Button>
                                <Button size="sm" onClick={() => handleApproveRequest(req)} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- USERS TABLE VIEW (STUDENTS OR ADMINS) --- */}
        {activeTab !== 'REQUESTS' && (
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
                            <tr 
                                key={user.id} 
                                className={`hover:bg-slate-50 transition-colors group ${activeTab === 'ADMINS' ? 'cursor-pointer' : ''}`}
                                onClick={activeTab === 'ADMINS' ? () => setSelectedAdminProfile(user) : undefined}
                            >
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
                                <td className="py-4 text-right pr-4" onClick={(e) => e.stopPropagation()}>
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

                                        {/* ADMIN: Only Super Admin actions */}
                                        {user.role === UserRole.ADMIN && isSuperAdmin && !(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && (
                                            <Button 
                                                variant="outline"
                                                className="p-1.5 h-auto border-slate-200 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                                onClick={() => openWarningModal(user.id)}
                                                title="Issue Warning"
                                            >
                                                <AlertTriangle size={16} />
                                            </Button>
                                        )}

                                        {/* BLOCK BUTTON (For Sub Admins this creates Request) */}
                                        {!(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && (
                                            <Button 
                                                variant="outline" 
                                                className={`p-1.5 h-auto border-slate-200 ${
                                                    user.status === 'ACTIVE' 
                                                    ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' 
                                                    : 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200'
                                                }`}
                                                onClick={() => initiateStatusToggle(user.id, user.status, user.role)}
                                                title={user.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                                            >
                                                {user.role === UserRole.ADMIN ? <ShieldAlert size={16} /> : <Ban size={16} />}
                                            </Button>
                                        )}

                                        {/* PERMANENT DELETE (Super Admin Only) */}
                                        {isSuperAdmin && !(user.isSuperAdmin || user.email === MASTER_ADMIN_EMAIL) && (
                                            <Button
                                                variant="outline"
                                                className="p-1.5 h-auto border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm({ isOpen: true, id: user.id, name: user.name });
                                                }}
                                                title="Delete Permanently"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </Card>

      {/* --- ADMIN PROFILE MODAL (SUPER DETAILED) --- */}
      <Modal 
        isOpen={!!selectedAdminProfile} 
        onClose={() => setSelectedAdminProfile(null)} 
        title="Admin Performance Profile"
        size="lg"
      >
        {selectedAdminProfile && adminAnalytics && (
            <div className="space-y-6">
                {/* 1. Header Profile */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <img src={selectedAdminProfile.avatar} className="w-20 h-20 rounded-full border-4 border-indigo-200 shadow-sm" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                {selectedAdminProfile.name}
                                <ShieldCheck size={18} className="ml-2 text-emerald-600" />
                            </h3>
                            <p className="text-sm text-slate-500">{selectedAdminProfile.email}</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center">
                                <Clock size={12} className="mr-1" /> Member since: {new Date(selectedAdminProfile.joinedDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge color={selectedAdminProfile.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {selectedAdminProfile.status}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">ID: {selectedAdminProfile.id.substring(0,8)}</span>
                    </div>
                </div>

                {/* 2. Key Metrics (24H, Month, Lifetime) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-3 border-l-4 border-l-blue-500">
                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center"><Zap size={12} className="mr-1"/> Last 24 Hours</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{adminAnalytics.actions24h} <span className="text-xs font-normal text-slate-400">actions</span></h3>
                    </Card>
                    <Card className="p-3 border-l-4 border-l-purple-500">
                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center"><Calendar size={12} className="mr-1"/> This Month</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{adminAnalytics.actionsMonth} <span className="text-xs font-normal text-slate-400">actions</span></h3>
                    </Card>
                    <Card className="p-3 border-l-4 border-l-indigo-500">
                        <p className="text-xs font-bold text-slate-500 uppercase flex items-center"><History size={12} className="mr-1"/> Lifetime Total</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{adminAnalytics.totalActions}</h3>
                    </Card>
                    <Card className="p-3 border-l-4 border-l-emerald-500 bg-emerald-50/20">
                        <p className="text-xs font-bold text-emerald-700 uppercase flex items-center"><Activity size={12} className="mr-1"/> Est. Active Time</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-1">{adminAnalytics.activeTime}</h3>
                    </Card>
                </div>

                {/* 3. Monthly Activity Graph */}
                <Card className="p-4 border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                        <TrendingUp size={16} className="mr-2 text-indigo-600" /> Monthly Work Intensity (Daily)
                    </h4>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={adminAnalytics.chartData}>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="actions" radius={[2, 2, 0, 0]}>
                                    {adminAnalytics.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.actions > 5 ? '#4f46e5' : '#a5b4fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">Days of Current Month</p>
                </Card>

                {/* 4. Full History Timeline (Table Format) */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex justify-between items-center">
                        <span>Full Activity History</span>
                        <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded-full text-slate-500">{adminAnalytics.totalActions} records</span>
                    </h4>
                    <div className="max-h-60 overflow-y-auto border rounded-lg bg-white custom-scrollbar shadow-inner">
                        {adminAnalytics.logs.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No activity recorded yet.</p>
                        ) : (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Date & Time</th>
                                        <th className="p-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Action Name</th>
                                        <th className="p-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {adminAnalytics.logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 text-slate-500 whitespace-nowrap border-r border-slate-50">
                                                <div className="font-mono text-xs font-bold text-slate-700">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                                                    <Clock size={10} className="mr-1"/>
                                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </td>
                                            <td className="p-3 border-r border-slate-50">
                                                <span className={`font-bold text-[10px] px-2 py-1 rounded border ${getLogColor(log.type)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600 text-xs break-words">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button onClick={() => setSelectedAdminProfile(null)}>Close Profile</Button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- STUDENT FULL PROFILE MODAL --- */}
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
                                    <optgroup label="Regular">
                                        {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Admission">
                                        {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
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
                    // --- VIEW MODE ---
                    <div className="space-y-6">
                        {/* Personal & Contact */}
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

                        {/* Academic Info */}
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
                                        <BriefcaseIcon size={12} className="mr-1 text-indigo-400"/> {selectedUser.class || 'N/A'}
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

                        {/* Platform Stats */}
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

      {/* --- STATUS CHANGE CONFIRMATION MODAL --- */}
      <Modal isOpen={!!statusConfirm} onClose={() => setStatusConfirm(null)} title="Confirm Status Change">
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${statusConfirm?.status === 'ACTIVE' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                  {statusConfirm?.status === 'ACTIVE' ? (
                      <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  ) : (
                      <CheckCircle size={24} className="mr-3 shrink-0 mt-1" />
                  )}
                  <div>
                      <p className="font-bold">
                          Are you sure you want to {statusConfirm?.status === 'ACTIVE' ? 'BLOCK' : 'UNBLOCK'} this {statusConfirm?.role === 'ADMIN' ? 'Admin' : 'Student'} account?
                      </p>
                      <p className="text-xs mt-1">
                          {statusConfirm?.status === 'ACTIVE' 
                              ? "The user will lose access to the platform immediately." 
                              : "The user will regain access to the platform."}
                      </p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setStatusConfirm(null)}>Cancel</Button>
                  <Button 
                    variant={statusConfirm?.status === 'ACTIVE' ? "danger" : "primary"} 
                    className={statusConfirm?.status === 'BLOCKED' ? "bg-emerald-600 hover:bg-emerald-700 border-transparent text-white" : ""}
                    onClick={confirmStatusToggle}
                  >
                      {statusConfirm?.status === 'ACTIVE' ? 'Confirm Block' : 'Confirm Unblock'}
                  </Button>
              </div>
          </div>
      </Modal>

      {/* --- PERMANENT DELETE CONFIRMATION MODAL (NEW) --- */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete User Permanently?">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <Trash2 size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Are you sure you want to delete <span className="underline">{deleteConfirm?.name}</span>?</p>
                      <p className="text-xs mt-2 font-medium">
                          This action is <strong className="text-red-900">IRREVERSIBLE</strong>.
                          <ul className="list-disc pl-4 mt-1 space-y-1 opacity-90">
                              <li>Account will be removed from database.</li>
                              <li>All progress, logs, and activity will be lost.</li>
                              <li>User cannot recover this account.</li>
                          </ul>
                      </p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="danger" onClick={handleDeleteUser} className="flex items-center">
                      <Trash2 size={16} className="mr-2" /> Yes, Delete Permanently
                  </Button>
              </div>
          </div>
      </Modal>

      {/* --- GENERIC INFO / ALERT MODAL --- */}
      <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${infoModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {infoModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
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

export default UserManagement;
