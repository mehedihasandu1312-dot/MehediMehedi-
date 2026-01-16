import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { User } from '../../types';
import { 
    Search, 
    Ban, 
    Eye, 
    Calendar, 
    School, 
    Filter, 
    Edit,
    Save,
    X,
    GraduationCap,
    Clock,
    Mail,
    CheckCircle
} from 'lucide-react';

interface Props {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserManagement: React.FC<Props> = ({ users, setUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', class: '', institute: '' });

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    return {
        total: users.length,
        active: users.filter(u => u.status === 'ACTIVE').length,
        blocked: users.filter(u => u.status === 'BLOCKED').length,
        newThisWeek: users.filter(u => {
            if (!u.joinedDate) return false;
            const date = new Date(u.joinedDate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        }).length
    };
  }, [users]);

  // --- Filtering Logic ---
  const filteredUsers = users.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'ALL' || u.class === filterClass;
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  // --- Handlers ---

  const handleToggleStatus = (id: string, currentStatus: 'ACTIVE' | 'BLOCKED') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'Block' : 'Unblock';
    
    if (confirm(`Are you sure you want to ${action} this student?`)) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const openModal = (user: User) => {
      setSelectedUser(user);
      setEditForm({
          name: user.name || '',
          class: user.class || '',
          institute: user.institute || ''
      });
      setIsEditing(false);
  };

  const handleSaveChanges = () => {
      if (!selectedUser) return;
      
      setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
          ? { ...u, name: editForm.name, class: editForm.class, institute: editForm.institute }
          : u
      ));
      
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      alert("Student profile updated successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
      </div>

      {/* 1. Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Active Now</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.active}</h3>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500">
              <p className="text-slate-500 text-xs font-bold uppercase">Blocked</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.blocked}</h3>
          </Card>
           <Card className="p-4 border-l-4 border-l-blue-500">
              <p className="text-slate-500 text-xs font-bold uppercase">New (7d)</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.newThisWeek}</h3>
          </Card>
      </div>

      <Card>
        {/* 2. Advanced Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by name, email..." 
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full md:w-auto">
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
            </div>
        </div>

        {/* 3. Enhanced User Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-3 pl-4 font-semibold text-slate-600 text-sm">Student Profile</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Class / Info</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Status</th>
                        <th className="py-3 font-semibold text-slate-600 text-sm">Performance (Avg)</th>
                        <th className="py-3 text-right pr-4 font-semibold text-slate-600 text-sm">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => {
                        // Generating a pseudo-random score based on name length for demo visual
                        // Safe access to user.name
                        const safeName = user.name || 'Unknown';
                        const randomScore = Math.min(100, Math.max(40, (safeName.length * 7) + 20)); 
                        const scoreColor = randomScore > 80 ? 'bg-emerald-500' : randomScore > 60 ? 'bg-amber-500' : 'bg-red-500';

                        return (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="py-4 pl-4">
                                    <div className="flex items-center">
                                        <img 
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${safeName}`} 
                                            alt={safeName} 
                                            className="w-10 h-10 rounded-full mr-3 border border-slate-200"
                                        />
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{safeName}</p>
                                            <p className="text-xs text-slate-500">{user.email || 'No Email'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-700">Class {user.class || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{user.institute || 'No Institute'}</p>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <Badge color={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                        {user.status || 'UNKNOWN'}
                                    </Badge>
                                </td>
                                <td className="py-4 align-middle">
                                    <div className="w-24 bg-slate-200 rounded-full h-1.5 mb-1">
                                        <div className={`${scoreColor} h-1.5 rounded-full`} style={{width: `${randomScore}%`}}></div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">{randomScore}% Score</span>
                                </td>
                                <td className="py-4 text-right pr-4">
                                    <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="outline" 
                                            className="p-1.5 h-auto border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" 
                                            onClick={() => openModal(user)}
                                            title="View/Edit Profile"
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className={`p-1.5 h-auto border-slate-200 ${user.status === 'ACTIVE' ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:bg-red-50'}`}
                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                            title={user.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                                        >
                                            <Ban size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-b-xl">
                                <div className="flex flex-col items-center">
                                    <Search size={32} className="mb-2 opacity-20" />
                                    <p>No students found matching your filters.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>

      {/* 4. Enhanced Profile Modal (View + Edit) */}
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={isEditing ? "Edit Student Profile" : "Student Overview"}
      >
        {selectedUser && (
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <img 
                            src={selectedUser.avatar || "https://picsum.photos/200/200"} 
                            alt={selectedUser.name} 
                            className="w-16 h-16 rounded-full border-4 border-slate-100 shadow-sm"
                        />
                        <div>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    className="font-bold text-lg text-slate-800 border-b border-indigo-300 focus:outline-none w-full"
                                    value={editForm.name}
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                />
                            ) : (
                                <h3 className="text-xl font-bold text-slate-800">{selectedUser.name || 'Unnamed User'}</h3>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge color={selectedUser.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                    {selectedUser.status || 'UNKNOWN'}
                                </Badge>
                                <span className="text-xs text-slate-500 flex items-center">
                                    <Clock size={12} className="mr-1"/> Joined {selectedUser.joinedDate ? new Date(selectedUser.joinedDate).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                        >
                            <Edit size={18} />
                        </button>
                    ) : (
                         <button 
                            onClick={() => setIsEditing(false)}
                            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Edit Form or Info View */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Academic Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-slate-500 block mb-1">Class / Year</label>
                            {isEditing ? (
                                <select 
                                    className="w-full text-sm p-1.5 border rounded"
                                    value={editForm.class}
                                    onChange={e => setEditForm({...editForm, class: e.target.value})}
                                >
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                            ) : (
                                <div className="flex items-center font-medium text-slate-800">
                                    <GraduationCap size={14} className="mr-2 text-indigo-500" />
                                    Class {selectedUser.class || 'N/A'}
                                </div>
                            )}
                         </div>

                         <div>
                            <label className="text-xs text-slate-500 block mb-1">Institute Name</label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    className="w-full text-sm p-1.5 border rounded"
                                    value={editForm.institute}
                                    onChange={e => setEditForm({...editForm, institute: e.target.value})}
                                />
                            ) : (
                                <div className="flex items-center font-medium text-slate-800">
                                    <School size={14} className="mr-2 text-indigo-500" />
                                    {selectedUser.institute || 'N/A'}
                                </div>
                            )}
                         </div>

                         <div className="col-span-2">
                             <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                             <div className="flex items-center text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                                <Mail size={14} className="mr-2 text-slate-400" />
                                {selectedUser.email || 'No Email'}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Academic Insights (Read Only) */}
                {!isEditing && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                            <div className="text-lg font-bold text-indigo-700">85%</div>
                            <div className="text-[10px] text-indigo-500 font-medium">AVG SCORE</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-lg font-bold text-emerald-700">92%</div>
                            <div className="text-[10px] text-emerald-500 font-medium">ATTENDANCE</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <div className="text-lg font-bold text-amber-700">#{selectedUser.rank || '-'}</div>
                            <div className="text-[10px] text-amber-500 font-medium">RANK</div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button className="flex items-center" onClick={handleSaveChanges}>
                                <Save size={16} className="mr-2" /> Save Profile
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant={selectedUser.status === 'ACTIVE' ? 'danger' : 'secondary'}
                            onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                            className="w-full flex items-center justify-center"
                        >
                            {selectedUser.status === 'ACTIVE' ? <Ban size={16} className="mr-2"/> : <CheckCircle size={16} className="mr-2"/>}
                            {selectedUser.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
                        </Button>
                    )}
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;