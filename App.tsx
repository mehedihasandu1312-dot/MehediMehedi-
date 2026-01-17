import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import AdminSetup from './pages/AdminSetup'; // Imported Setup Page
import StudentDashboard from './pages/student/StudentDashboard';
import StudyContentPage from './pages/student/StudyContent';
import ExamsPage from './pages/student/Exams';
import Notice from './pages/student/Notice';
import Blog from './pages/student/Blog';
import SocialPost from './pages/student/SocialPost';
import Leaderboard from './pages/student/Leaderboard';
import ProfileSettings from './pages/student/ProfileSettings';
import StudentAppeals from './pages/student/StudentAppeals';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppealManagement from './pages/admin/AppealManagement';
import ContentManagement from './pages/admin/ContentManagement';
import ExamCreation from './pages/admin/ExamCreation';
import UserManagement from './pages/admin/UserManagement';
import BlogManagement from './pages/admin/BlogManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import SocialManagement from './pages/admin/SocialManagement';
import ExamGrading from './pages/admin/ExamGrading';
import SystemSettingsPage from './pages/admin/SystemSettings'; // New Import
import { User, UserRole, Exam, Folder, StudyContent, StudentResult, BlogPost, Notice as NoticeType, Appeal, SocialPost as SocialPostType, SocialReport, AdminActivityLog, SystemSettings } from './types';
import { authService } from './services/authService';
import { MOCK_EXAMS, MOCK_FOLDERS, MOCK_CONTENT, MOCK_BLOG_FOLDERS, MOCK_BLOGS, MOCK_USERS, MOCK_NOTICES, MOCK_APPEALS, MOCK_SOCIAL_POSTS, MOCK_REPORTS, MOCK_ADMIN_LOGS, EDUCATION_LEVELS as DEFAULT_EDUCATION_LEVELS } from './constants';
import { db } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal, Button } from './components/UI';

// Helper to clean data (convert undefined to null) before saving
const cleanData = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanData);
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : cleanData(v)])
        );
    }
    return obj;
};

// --- CUSTOM HOOK: FIRESTORE REAL-TIME SYNC (Modular) ---
function useFirestoreCollection<T extends { id: string }>(
    collectionName: string, 
    initialMockData: T[]
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 1. READ: Real-time Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      // FIX: Ensure ID is included from doc.id, overriding data if necessary
      const fetchedData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
      
      // SORT: Latest (Largest ID) First
      fetchedData.sort((a, b) => {
          const idA = a.id.toString();
          const idB = b.id.toString();
          if (idA < idB) return 1; 
          if (idA > idB) return -1;
          return 0;
      });

      setData(fetchedData);
      setLoading(false);
      setInitialized(true);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // 2. SEED: Upload Mock Data if Collection is Empty
  useEffect(() => {
    const seedData = async () => {
        if (!initialized || data.length > 0) return;
        
        const snap = await getDocs(collection(db, collectionName));
        if (snap.empty && initialMockData.length > 0) {
            console.log(`Seeding ${collectionName} with mock data...`);
            const batch = writeBatch(db);
            initialMockData.forEach(item => {
                const ref = doc(db, collectionName, item.id);
                batch.set(ref, cleanData(item));
            });
            await batch.commit();
        }
    };
    if (!loading && initialized) {
        seedData();
    }
  }, [initialized, loading, data.length, collectionName, initialMockData]);

  // 3. WRITE: Smart Setter that syncs changes to Firestore
  const setSyncedData: React.Dispatch<React.SetStateAction<T[]>> = (action) => {
      const newState = typeof action === 'function' 
        ? (action as (prevState: T[]) => T[])(data) 
        : action;

      const sync = async () => {
          try {
              // Identify Additions & Updates
              for (const item of newState) {
                  const oldItem = data.find(i => i.id === item.id);
                  if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
                      await setDoc(doc(db, collectionName, item.id), cleanData(item));
                  }
              }
              // Identify Deletions
              for (const item of data) {
                  if (!newState.find(i => i.id === item.id)) {
                      await deleteDoc(doc(db, collectionName, item.id));
                  }
              }
          } catch (err: any) {
              console.error("Sync Error:", err);
              alert(`Error saving data to cloud: ${err.message}. Please check your connection or try again.`);
          }
      };
      
      sync();
      
      const sortedState = [...newState].sort((a, b) => {
          const idA = a.id.toString();
          const idB = b.id.toString();
          if (idA < idB) return 1; 
          if (idA > idB) return -1;
          return 0;
      });
      setData(sortedState);
  };

  return [data, setSyncedData, loading];
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global Alert Modal State
  const [globalModal, setGlobalModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

  // --- FIRESTORE COLLECTIONS ---
  const [users, setUsers, usersLoading] = useFirestoreCollection<User>('users', MOCK_USERS);
  const [exams, setExams, examsLoading] = useFirestoreCollection<Exam>('exams', MOCK_EXAMS);
  const [folders, setFolders, foldersLoading] = useFirestoreCollection<Folder>('folders', MOCK_FOLDERS);
  const [contents, setContents, contentsLoading] = useFirestoreCollection<StudyContent>('contents', MOCK_CONTENT);
  const [blogFolders, setBlogFolders, blogFoldersLoading] = useFirestoreCollection<Folder>('blog_folders', MOCK_BLOG_FOLDERS);
  const [blogs, setBlogs, blogsLoading] = useFirestoreCollection<BlogPost>('blogs', MOCK_BLOGS);
  const [studentResults, setStudentResults, resultsLoading] = useFirestoreCollection<StudentResult>('results', []);
  const [notices, setNotices, noticesLoading] = useFirestoreCollection<NoticeType>('notices', MOCK_NOTICES);
  const [appeals, setAppeals, appealsLoading] = useFirestoreCollection<Appeal>('appeals', MOCK_APPEALS);
  const [socialPosts, setSocialPosts, socialLoading] = useFirestoreCollection<SocialPostType>('social_posts', MOCK_SOCIAL_POSTS);
  const [socialReports, setSocialReports, reportsLoading] = useFirestoreCollection<SocialReport>('social_reports', MOCK_REPORTS);
  const [adminLogs, setAdminLogs, logsLoading] = useFirestoreCollection<AdminActivityLog>('admin_logs', MOCK_ADMIN_LOGS);
  
  // --- SETTINGS COLLECTION ---
  const [settings, setSettings, settingsLoading] = useFirestoreCollection<SystemSettings>('settings', [{
      id: 'global_settings',
      educationLevels: DEFAULT_EDUCATION_LEVELS
  }]);

  // --- LOCAL STATE FOR SEEN NOTICES ---
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);

  useEffect(() => {
      if (user) {
          const storedKey = `readNotices_${user.id}`;
          const stored = localStorage.getItem(storedKey);
          if (stored) {
              setReadNoticeIds(JSON.parse(stored));
          }
      }
  }, [user]);

  const handleMarkNoticeRead = (noticeId: string) => {
      if (user && !readNoticeIds.includes(noticeId)) {
          const newIds = [...readNoticeIds, noticeId];
          setReadNoticeIds(newIds);
          localStorage.setItem(`readNotices_${user.id}`, JSON.stringify(newIds));
      }
  };

  const currentEducationLevels = settings.find(s => s.id === 'global_settings')?.educationLevels || DEFAULT_EDUCATION_LEVELS;

  const globalLoading = usersLoading || examsLoading || foldersLoading || contentsLoading || 
                        blogFoldersLoading || blogsLoading || noticesLoading || appealsLoading || 
                        socialLoading || reportsLoading || logsLoading || settingsLoading;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setAuthLoading(false);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const handleExamComplete = (result: StudentResult) => {
      setStudentResults(prev => [result, ...prev]);
      
      if (user) {
          const updatedUser = { ...user, points: (user.points || 0) + Math.round(result.score) };
          setUser(updatedUser);
          authService.updateProfile({ points: updatedUser.points }); 
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
  };

  const handleBlogView = (blogId: string) => {
      setBlogs(prev => prev.map(b => 
          b.id === blogId ? { ...b, views: (b.views || 0) + 1 } : b
      ));
  };

  // --- Handle New Appeal Submission ---
  const handleAddAppeal = (appealData: { contentId: string; contentTitle: string; text: string; image?: string }) => {
      if (!user) return;
      
      const newAppeal: Appeal = {
          id: `appeal_${Date.now()}`,
          contentId: appealData.contentId,
          contentTitle: appealData.contentTitle,
          studentName: user.name,
          text: appealData.text,
          image: appealData.image, 
          status: 'PENDING',
          timestamp: 'Just now'
      };

      setAppeals(prev => [newAppeal, ...prev]);
      setGlobalModal({
          isOpen: true,
          title: "Appeal Submitted",
          message: "Appeal submitted successfully! Admin will review it shortly.",
          type: 'SUCCESS'
      });
  };

  // --- FILTER LOGIC FOR STUDENT VIEW ---
  const getFilteredDataForStudent = () => {
      if (!user || user.role !== UserRole.STUDENT || !user.class) {
          return { studentFolders: folders, studentExams: exams, studentNotices: notices }; 
      }

      const studentFolders = folders.filter(f => 
          !f.targetClass || f.targetClass === user.class
      );

      const studentExams = exams.filter(e => {
          if (e.targetClass && e.targetClass !== user.class) {
              return false;
          }
          if (e.folderId) {
              const parentFolder = folders.find(f => f.id === e.folderId);
              if (parentFolder?.targetClass && parentFolder.targetClass !== user.class) {
                  return false;
              }
          }
          return true;
      });

      const studentNotices = notices.filter(n => 
          !n.targetClass || n.targetClass === 'ALL' || n.targetClass === user.class
      );

      return { studentFolders, studentExams, studentNotices };
  };

  const { studentFolders, studentExams, studentNotices } = getFilteredDataForStudent();

  const unseenNoticeCount = studentNotices.filter(n => !readNoticeIds.includes(n.id)).length;

  if (authLoading || (user && globalLoading)) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
              <p className="text-slate-500 font-medium">Syncing with EduMaster Cloud...</p>
          </div>
      );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        {/* --- HIDDEN ADMIN SETUP ROUTE --- */}
        <Route path="/setup-admin" element={<AdminSetup />} />

        <Route 
            path="/complete-profile" 
            element={
                user && !user.profileCompleted 
                ? <ProfileSetup educationLevels={currentEducationLevels} onProfileComplete={setUser} /> 
                : <Navigate to={user ? (user.role === UserRole.ADMIN ? '/admin/dashboard' : '/student/dashboard') : '/login'} />
            } 
        />

        <Route element={user ? <Layout user={user} setUser={setUser} unseenNoticeCount={unseenNoticeCount} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Navigate to={user?.role === UserRole.ADMIN ? "/admin/dashboard" : "/student/dashboard"} />} />

          {/* Student Routes */}
          {user?.role === UserRole.STUDENT && user.profileCompleted && (
            <>
              <Route 
                path="/student/dashboard" 
                element={
                    <StudentDashboard 
                        user={user} 
                        onLogout={handleLogout} 
                        exams={studentExams} 
                        results={studentResults} // Pass ALL results, Dashboard will filter
                        allUsers={users}
                        setAllUsers={setUsers}
                    />
                } 
              />
              <Route 
                path="/student/notice" 
                element={
                    <Notice 
                        notices={studentNotices} 
                        readIds={readNoticeIds}
                        onMarkRead={handleMarkNoticeRead}
                    />
                } 
              />
              <Route path="/student/social" element={<SocialPost posts={socialPosts} setPosts={setSocialPosts} />} />
              <Route 
                path="/student/content" 
                element={
                    <StudyContentPage 
                        folders={studentFolders} 
                        contents={contents} 
                        onAppealSubmit={handleAddAppeal} 
                    />
                } 
              />
              <Route 
                path="/student/exams" 
                element={
                    <ExamsPage 
                        exams={studentExams} 
                        folders={studentFolders} 
                        onExamComplete={handleExamComplete}
                    />
                } 
              />
              <Route 
                path="/student/blog" 
                element={<Blog folders={blogFolders} blogs={blogs} onViewBlog={handleBlogView} />} 
              />
              <Route 
                 path="/student/leaderboard" 
                 element={<Leaderboard users={users} currentUser={user} />} 
              />
              <Route path="/student/profile" element={<ProfileSettings educationLevels={currentEducationLevels} />} />
              <Route 
                path="/student/appeals" 
                element={<StudentAppeals appeals={appeals} studentName={user.name} />} 
              />
            </>
          )}

          {/* Admin Routes */}
          {user?.role === UserRole.ADMIN && (
            <>
              <Route 
                path="/admin/dashboard" 
                element={<AdminDashboard exams={exams} users={users} appeals={appeals} onLogout={handleLogout} />} 
              />
              <Route path="/admin/appeals" element={<AppealManagement appeals={appeals} setAppeals={setAppeals} />} />
              {/* Pass currentUser to UserManagement for permission checks */}
              <Route path="/admin/users" element={<UserManagement users={users} setUsers={setUsers} adminLogs={adminLogs} currentUser={user} educationLevels={currentEducationLevels} />} />
              <Route 
                path="/admin/content" 
                element={
                    <ContentManagement 
                        folders={folders} 
                        setFolders={setFolders} 
                        contents={contents} 
                        setContents={setContents} 
                        educationLevels={currentEducationLevels}
                    />
                } 
              />
              <Route 
                path="/admin/exams" 
                element={
                    <ExamCreation 
                        exams={exams} 
                        setExams={setExams} 
                        folders={folders} 
                        setFolders={setFolders} 
                        educationLevels={currentEducationLevels}
                    />
                } 
              />
              {/* Pass exams and currentUser to Grading */}
              <Route path="/admin/grading" element={<ExamGrading exams={exams} currentUser={user} />} />
              <Route 
                path="/admin/blog" 
                element={
                    <BlogManagement 
                        folders={blogFolders} 
                        setFolders={setBlogFolders} 
                        blogs={blogs} 
                        setBlogs={setBlogs} 
                    />
                } 
              />
              <Route path="/admin/notice" element={<NoticeManagement notices={notices} setNotices={setNotices} educationLevels={currentEducationLevels} />} />
              <Route 
                path="/admin/social" 
                element={
                    <SocialManagement 
                        posts={socialPosts} 
                        setPosts={setSocialPosts} 
                        reports={socialReports} 
                        setReports={setSocialReports}
                        users={users}
                        setUsers={setUsers} 
                    />
                } 
              />
              <Route path="/admin/settings" element={<SystemSettingsPage settings={settings} setSettings={setSettings} />} />
            </>
          )}
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* GLOBAL MODAL RENDERED AT ROOT LEVEL */}
      <Modal isOpen={globalModal.isOpen} onClose={() => setGlobalModal({ ...globalModal, isOpen: false })} title={globalModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${globalModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {globalModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
                  <p>{globalModal.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setGlobalModal({ ...globalModal, isOpen: false })}>OK</Button>
              </div>
          </div>
      </Modal>
    </HashRouter>
  );
};

export default App;