import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion, 
  Trophy, 
  AlertCircle, 
  Users, 
  FolderPlus, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon, 
  ClipboardList, 
  Bell, 
  Newspaper, 
  MessageSquare, 
  Settings, 
  Share2, 
  CheckSquare, 
  Sliders 
} from 'lucide-react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface LayoutProps {
  user: User;
  setUser: (user: User | null) => void;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, setUser, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setIsSidebarOpen(false);
        }}
        className={`flex items-center w-full px-4 py-2.5 mb-1 rounded-lg transition-colors ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <Icon size={20} className="mr-3" />
        <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  const StudentLinks = () => (
    <>
      <NavItem to="/student/dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/student/notice" icon={Bell} label="Notices" />
      <NavItem to="/student/social" icon={MessageSquare} label="Social Feed" />
      <NavItem to="/student/content" icon={BookOpen} label="Study Content" />
      <NavItem to="/student/exams" icon={FileQuestion} label="Exams" />
      <NavItem to="/student/blog" icon={Newspaper} label="Educational Blog" />
      <NavItem to="/student/leaderboard" icon={Trophy} label="Leaderboard" />
      <NavItem to="/student/appeals" icon={AlertCircle} label="My Appeals" />
      <div className="my-2 border-t border-slate-100"></div>
      <NavItem to="/student/profile" icon={Settings} label="Profile Settings" />
    </>
  );

  const AdminLinks = () => (
    <>
      <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/admin/settings" icon={Sliders} label="System Settings" />
      
      <div className="my-2 border-t border-slate-100"></div>
      
      <NavItem to="/admin/users" icon={Users} label="Student Mgmt" />
      <NavItem to="/admin/content" icon={FolderPlus} label="Content Mgmt" />
      <NavItem to="/admin/exams" icon={ClipboardList} label="Exam Mgmt" />
      <NavItem to="/admin/grading" icon={CheckSquare} label="Grading" />
      <NavItem to="/admin/appeals" icon={AlertCircle} label="Appeal Mgmt" />
      
      <div className="my-2 border-t border-slate-100"></div>
      
      <NavItem to="/admin/blog" icon={Newspaper} label="Blog Mgmt" />
      <NavItem to="/admin/notice" icon={Bell} label="Notice Mgmt" />
      <NavItem to="/admin/social" icon={Share2} label="Social Mgmt" />
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-30 w-64 h-full bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-slate-800">EduMaster</span>
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center border-b border-slate-100 bg-slate-50/50 shrink-0">
           <img 
            src={user.avatar || "https://picsum.photos/200/200"} 
            alt="Profile" 
            className="w-14 h-14 rounded-full border-2 border-indigo-100 mb-2"
          />
          <h3 className="font-semibold text-slate-800 text-sm">{user.name}</h3>
          <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium mt-1 uppercase">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          {user.role === UserRole.STUDENT ? <StudentLinks /> : <AdminLinks />}
        </nav>

        <div className="p-3 border-t border-slate-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} className="text-slate-600" />
          </button>
          <span className="font-bold text-slate-800">EduMaster</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-10">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;