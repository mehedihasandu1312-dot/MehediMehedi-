import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import StudentDashboard from './pages/student/StudentDashboard';
import StudyContentPage from './pages/student/StudyContent';
import ExamsPage from './pages/student/Exams';
import Notice from './pages/student/Notice';
import Blog from './pages/student/Blog';
import SocialPost from './pages/student/SocialPost';
import Leaderboard from './pages/student/Leaderboard';
import ProfileSettings from './pages/student/ProfileSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppealManagement from './pages/admin/AppealManagement';
import ContentManagement from './pages/admin/ContentManagement';
import ExamCreation from './pages/admin/ExamCreation';
import UserManagement from './pages/admin/UserManagement';
import BlogManagement from './pages/admin/BlogManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import SocialManagement from './pages/admin/SocialManagement';
import ExamGrading from './pages/admin/ExamGrading';
import { User, UserRole, Exam, Folder, StudyContent, StudentResult, BlogPost, Notice as NoticeType, Appeal, SocialPost as SocialPostType, SocialReport } from './types';
import { authService } from './services/authService';
import { MOCK_EXAMS, MOCK_FOLDERS, MOCK_CONTENT, MOCK_BLOG_FOLDERS, MOCK_BLOGS, MOCK_USERS, MOCK_NOTICES, MOCK_APPEALS, MOCK_SOCIAL_POSTS, MOCK_REPORTS } from './constants';
import { db } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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
      const fetchedData = snapshot.docs.map(doc => doc.data() as T);
      setData(fetchedData);
      setLoading(false);
      setInitialized(true);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // 2. SEED: Upload Mock Data if Collection is Empty (One-time check)
  useEffect(() => {
    const seedData = async () => {
        if (!initialized || data.length > 0) return;
        
        // Double check with a get to be sure before writing
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
      // Determine the new state based on action type
      const newState = typeof action === 'function' 
        ? (action as (prevState: T[]) => T[])(data) 
        : action;

      // We don't set local state immediately here because the onSnapshot listener will do it.
      // Instead, we identify diffs and write to Firestore.
      
      const sync = async () => {
          try {
              // Identify Additions & Updates
              for (const item of newState) {
                  const oldItem = data.find(i => i.id === item.id);
                  // If new or changed
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
      
      // Optimistic update for UI responsiveness
      setData(newState);
  };

  return [data, setSyncedData, loading];
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const globalLoading = usersLoading || examsLoading || foldersLoading || contentsLoading || 
                        blogFoldersLoading || blogsLoading || noticesLoading || appealsLoading || 
                        socialLoading || reportsLoading;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setAuthLoading(false);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  // Called when a student finishes an MCQ exam
  const handleExamComplete = (result: StudentResult) => {
      setStudentResults(prev => [result, ...prev]);
      
      if (user) {
          const updatedUser = { ...user, points: (user.points || 0) + Math.round(result.score) };
          setUser(updatedUser);
          authService.updateProfile({ points: updatedUser.points }); // Sync points to Firestore
          // Also update in global users list
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
  };

  const handleBlogView = (blogId: string) => {
      setBlogs(prev => prev.map(b => 
          b.id === blogId ? { ...b, views: (b.views || 0) + 1 } : b
      ));
  };

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
        
        <Route 
            path="/complete-profile" 
            element={
                user && !user.profileCompleted 
                ? <ProfileSetup /> 
                : <Navigate to={user ? (user.role === UserRole.ADMIN ? '/admin/dashboard' : '/student/dashboard') : '/login'} />
            } 
        />

        <Route element={user ? <Layout user={user} setUser={setUser} /> : <Navigate to="/login" />}>
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
                        exams={exams} 
                        results={studentResults.filter(r => r.score >= 0)} // Pass all results for history
                    />
                } 
              />
              <Route path="/student/notice" element={<Notice notices={notices} />} />
              <Route path="/student/social" element={<SocialPost posts={socialPosts} setPosts={setSocialPosts} />} />
              <Route 
                path="/student/content" 
                element={<StudyContentPage folders={folders} contents={contents} />} 
              />
              <Route 
                path="/student/exams" 
                element={
                    <ExamsPage 
                        exams={exams} 
                        folders={folders} 
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
              <Route path="/student/profile" element={<ProfileSettings />} />
              <Route path="/student/appeals" element={<div className="text-center py-10 text-slate-400">Appeals History (Coming Soon)</div>} />
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
              <Route path="/admin/users" element={<UserManagement users={users} setUsers={setUsers} />} />
              <Route 
                path="/admin/content" 
                element={
                    <ContentManagement 
                        folders={folders} 
                        setFolders={setFolders} 
                        contents={contents} 
                        setContents={setContents} 
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
                    />
                } 
              />
              <Route path="/admin/grading" element={<ExamGrading />} />
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
              <Route path="/admin/notice" element={<NoticeManagement notices={notices} setNotices={setNotices} />} />
              <Route 
                path="/admin/social" 
                element={
                    <SocialManagement 
                        posts={socialPosts} 
                        setPosts={setSocialPosts} 
                        reports={socialReports} 
                        setReports={setSocialReports} 
                    />
                } 
              />
            </>
          )}
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;