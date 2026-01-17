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
        className={`flex items-center w-full px-4 py-3 mb-1.5 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-brand-600 text-white shadow-soft font-bold' 
            : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600 font-medium'
        }`}
      >
        <Icon size={20} className={`mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600'}`} />
        <span className="text-sm tracking-wide">{label}</span>
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
      <NavItem to="/student/profile" icon={Settings} label="Profile Settings" />
    </>
  );

  const AdminLinks = () => (
    <>
      <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/admin/settings" icon={Sliders} label="System Settings" />
      <NavItem to="/admin/users" icon={Users} label="Student Mgmt" />
      <NavItem to="/admin/content" icon={FolderPlus} label="Content Mgmt" />
      <NavItem to="/admin/exams" icon={ClipboardList} label="Exam Mgmt" />
      <NavItem to="/admin/grading" icon={CheckSquare} label="Grading" />
      <NavItem to="/admin/appeals" icon={AlertCircle} label="Appeal Mgmt" />
      <NavItem to="/admin/blog" icon={Newspaper} label="Blog Mgmt" />
      <NavItem to="/admin/notice" icon={Bell} label="Notice Mgmt" />
      <NavItem to="/admin/social" icon={Share2} label="Social Mgmt" />
    </>
  );

  return (
    // Fixed inset-0 ensures the layout takes exactly the viewport size and does not scroll the body
    <div className="fixed inset-0 flex bg-surface overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-50 w-72 h-full bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-soft transform rotate-3">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Edu<span className="text-brand-600">Master</span></span>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col items-center shrink-0">
           <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-full blur opacity-25"></div>
             <img 
              src={user.avatar || "https://picsum.photos/200/200"} 
              alt="Profile" 
              className="relative w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
            />
           </div>
          <h3 className="font-bold text-slate-800 text-base mt-3">{user.name}</h3>
          <span className="text-[10px] px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-bold mt-1 uppercase tracking-wider border border-brand-100">
            {user.role}
          </span>
        </div>

        {/* Sidebar Navigation - Scrolls independently with 'overscroll-contain' to prevent chaining */}
        <nav 
            className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar overscroll-contain"
            style={{ overscrollBehavior: 'contain' }} // Inline style fallback
        >
          {user.role === UserRole.STUDENT ? <StudentLinks /> : <AdminLinks />}
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-slate-500 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 font-bold text-sm group"
          >
            <LogOut size={18} className="mr-3 group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600">
            <Menu size={28} />
          </button>
          <span className="font-extrabold text-lg text-slate-800">Edu<span className="text-brand-600">Master</span></span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Main Scrollable Area - Scrolls independently */}
        <div 
            className="flex-1 overflow-y-auto p-4 md:p-8 overscroll-contain"
            style={{ overscrollBehavior: 'contain' }} // Inline style fallback
        >
          <div className="max-w-7xl mx-auto pb-10">
            {children || <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;