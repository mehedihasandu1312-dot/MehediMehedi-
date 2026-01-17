import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { SocialPost, SocialReport, User } from '../../types';
import { Trash2, MessageCircle, Heart, Share2, Image as ImageIcon, Flag, ShieldAlert, CheckCircle, Ban, Users, Activity, Eye, AlertTriangle } from 'lucide-react';

interface Props {
    posts: SocialPost[];
    setPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
    reports: SocialReport[];
    setReports: React.Dispatch<React.SetStateAction<SocialReport[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SocialManagement: React.FC<Props> = ({ posts, setPosts, reports, setReports, users, setUsers }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FEED' | 'REPORTS'>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');

  // Report State
  const [selectedReport, setSelectedReport] = useState<SocialReport | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // --- ANALYTICS ---
  const stats = useMemo(() => {
      const totalPosts = posts.length;
      const totalEngagement = posts.reduce((acc, p) => acc + p.likes + p.comments, 0);
      const activeReports = reports.length;
      const blockedUsers = users.filter(u => u.status === 'BLOCKED').length;
      return { totalPosts, totalEngagement, activeReports, blockedUsers };
  }, [posts, reports, users]);

  // --- ACTIONS ---

  const initiateDeletePost = (id: string) => {
      setPostToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = () => {
      if (postToDelete) {
          setPosts(posts.filter(p => p.id !== postToDelete));
          setIsDeleteModalOpen(false);
          setPostToDelete(null);
      }
  };

  const handleDismissReport = (reportId: string) => {
      setReports(reports.filter(r => r.id !== reportId));
  };

  const openBanModal = (report: SocialReport) => {
      setSelectedReport(report);
      setBanReason(`Violation of community guidelines: ${report.reason}`);
      setIsBanModalOpen(true);
  };

  const confirmBan = () => {
      if (!selectedReport) return;
      if (!banReason.trim()) {
          alert("Please provide a reason for the ban so the user knows why.");
          return;
      }

      // 1. Find User by Name (Ideally use ID in real app)
      const targetUser = users.find(u => u.name === selectedReport.postAuthor);
      
      if (targetUser) {
          // 2. Block User & Set Reason
          const updatedUser: User = {
              ...targetUser,
              status: 'BLOCKED',
              banReason: banReason // Save reason here
          };
          setUsers(users.map(u => u.id === targetUser.id ? updatedUser : u));
          alert(`User ${targetUser.name} has been BLOCKED.\nReason: ${banReason}`);
      } else {
          alert("User not found in database (might be deleted or name mismatch). Continuing to remove content.");
      }
      
      // 3. Delete the reported post
      setPosts(posts.filter(p => p.id !== selectedReport.postId));

      // 4. Resolve Report
      setReports(reports.filter(r => r.id !== selectedReport.id));

      setIsBanModalOpen(false);
      setSelectedReport(null);
      setBanReason('');
  };

  // Filtered Posts for Feed View
  const displayPosts = posts.filter(p => p.content.toLowerCase().includes(searchTerm.toLowerCase()) || p.authorName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">Social Monitor</h1>
              <p className="text-slate-500 text-sm">Oversee community interactions and handle violations.</p>
          </div>
          
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
              <button 
                onClick={() => setActiveTab('DASHBOARD')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'DASHBOARD' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Overview
              </button>
              <button 
                onClick={() => setActiveTab('REPORTS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'REPORTS' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Flag size={14} className="mr-2" />
                  Reports
                  {reports.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{reports.length}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('FEED')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'FEED' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  All Posts
              </button>
          </div>
      </div>

      {/* VIEW: DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              <Card className="border-l-4 border-l-indigo-500 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Posts</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalPosts}</h3>
                  <div className="mt-2 text-xs text-indigo-600 flex items-center"><Activity size={12} className="mr-1"/> Live Content</div>
              </Card>
              <Card className="border-l-4 border-l-emerald-500 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Engagement</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalEngagement}</h3>
                  <div className="mt-2 text-xs text-emerald-600 flex items-center"><Heart size={12} className="mr-1"/> Likes & Comments</div>
              </Card>
              <Card className="border-l-4 border-l-red-500 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Pending Reports</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.activeReports}</h3>
                  <div className="mt-2 text-xs text-red-600 flex items-center"><ShieldAlert size={12} className="mr-1"/> Action Required</div>
              </Card>
              <Card className="border-l-4 border-l-slate-500 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase">Banned Users</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.blockedUsers}</h3>
                  <div className="mt-2 text-xs text-slate-500 flex items-center"><Ban size={12} className="mr-1"/> Restricted Access</div>
              </Card>
          </div>
      )}

      {/* VIEW: REPORTS */}
      {activeTab === 'REPORTS' && (
          <div className="space-y-4 animate-fade-in">
              {reports.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
                      <h3 className="text-lg font-bold text-slate-600">Clean Feed!</h3>
                      <p>No user reports pending review.</p>
                  </div>
              ) : (
                  reports.map(report => (
                      <Card key={report.id} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                              <div className="flex items-center space-x-2">
                                  <Badge color="bg-red-100 text-red-700 flex items-center">
                                      <ShieldAlert size={12} className="mr-1"/> REPORTED
                                  </Badge>
                                  <span className="text-xs text-slate-500">{report.timestamp}</span>
                              </div>
                              <div className="flex space-x-2 w-full md:w-auto">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDismissReport(report.id)}
                                    className="flex-1 md:flex-none"
                                  >
                                      Dismiss (False Alarm)
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-red-600 hover:bg-red-700 text-white border-transparent flex items-center flex-1 md:flex-none"
                                    onClick={() => openBanModal(report)}
                                  >
                                      <Ban size={14} className="mr-1" /> Punish User
                                  </Button>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Offending Content</h4>
                                  <p className="text-sm text-slate-800 font-medium mb-1 italic">"{report.postContent}"</p>
                                  <p className="text-xs text-slate-500 mt-2">Posted by: <span className="font-bold text-indigo-600">{report.postAuthor}</span></p>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-2">Accusation Details</h4>
                                  <p className="text-sm text-slate-800"><span className="font-semibold">Reason:</span> {report.reason}</p>
                                  <p className="text-xs text-slate-500 mt-1">Reported by: {report.reporterName}</p>
                              </div>
                          </div>
                      </Card>
                  ))
              )}
          </div>
      )}

      {/* VIEW: FEED MONITORING */}
      {activeTab === 'FEED' && (
        <div className="space-y-4 animate-fade-in">
            <div className="relative mb-4">
                <input 
                    type="text" 
                    placeholder="Search posts by content or author..."
                    className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Eye className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>

            {displayPosts.length === 0 && <Card className="text-center py-10 text-slate-400">No posts found.</Card>}
            
            <div className="grid gap-4">
                {displayPosts.map(post => (
                    <Card key={post.id} className="p-0 overflow-hidden border border-slate-200">
                        <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center space-x-2">
                                <img src={post.authorAvatar} alt="av" className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{post.authorName}</p>
                                    <p className="text-xs text-slate-500">{post.timestamp}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => initiateDeletePost(post.id)} 
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                title="Force Delete Post"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-slate-700 mb-2">{post.content}</p>
                            {post.imageUrl && <img src={post.imageUrl} alt="post" className="w-full h-48 object-cover rounded-lg bg-slate-100" />}
                        </div>
                        <div className="bg-slate-50 p-2 flex justify-around text-slate-400 text-xs border-t border-slate-100">
                            <span className="flex items-center"><Heart size={14} className="mr-1" /> {post.likes}</span>
                            <span className="flex items-center"><MessageCircle size={14} className="mr-1" /> {post.comments}</span>
                            <span className="flex items-center"><Share2 size={14} className="mr-1" /> Share</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <Trash2 size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Permanently delete this post?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDeletePost}>Delete Post</Button>
              </div>
          </div>
      </Modal>

      {/* Ban / Punishment Modal */}
      <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)} title="Take Action">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <ShieldAlert size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">You are banning {selectedReport?.postAuthor}</p>
                      <p className="text-xs mt-1">
                          This will block the user from accessing the platform. 
                          The reported content will be deleted, and the report marked as resolved.
                      </p>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Punishment (Required)</label>
                  <p className="text-xs text-slate-500 mb-2">This reason will be shown to the user when they try to access features.</p>
                  <textarea 
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"
                      placeholder="e.g. Violation of Rule #4: Hate Speech against community guidelines..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                  />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                  <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={confirmBan} disabled={!banReason.trim()}>Confirm Ban & Delete</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default SocialManagement;