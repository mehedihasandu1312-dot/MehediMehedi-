import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { SocialPost, SocialReport } from '../../types';
import { Plus, Trash2, MessageCircle, Heart, Share2, Image as ImageIcon, Flag, ShieldAlert, CheckCircle, Ban } from 'lucide-react';

interface Props {
    posts: SocialPost[];
    setPosts: React.Dispatch<React.SetStateAction<SocialPost[]>>;
    reports: SocialReport[];
    setReports: React.Dispatch<React.SetStateAction<SocialReport[]>>;
}

const SocialManagement: React.FC<Props> = ({ posts, setPosts, reports, setReports }) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'REPORTS'>('FEED');
  
  // Feed State
  const [formData, setFormData] = useState({
    authorName: 'EduMaster Official',
    content: '',
    imageUrl: ''
  });

  // Report State
  const [selectedReport, setSelectedReport] = useState<SocialReport | null>(null);
  const [banDuration, setBanDuration] = useState('24h');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  // --- FEED ACTIONS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorName: formData.authorName,
      authorAvatar: 'https://ui-avatars.com/api/?name=EduMaster&background=4f46e5&color=fff',
      timestamp: 'Just now',
      content: formData.content,
      imageUrl: formData.imageUrl || undefined,
      likes: 0,
      comments: 0,
      isLiked: false
    };
    setPosts([newPost, ...posts]);
    setFormData({ authorName: 'EduMaster Official', content: '', imageUrl: '' });
    alert("Social post created successfully!");
  };

  const handleDeletePost = (id: string) => {
    if (confirm("Delete this post?")) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  // --- REPORT ACTIONS ---
  const handleDismissReport = (reportId: string) => {
      setReports(reports.filter(r => r.id !== reportId));
  };

  const openBanModal = (report: SocialReport) => {
      setSelectedReport(report);
      setIsBanModalOpen(true);
  };

  const confirmBan = () => {
      if (!selectedReport) return;
      alert(`User ${selectedReport.postAuthor} has been banned for ${banDuration}.\nReport marked as resolved.`);
      
      // Remove report from list
      setReports(reports.filter(r => r.id !== selectedReport.id));
      
      // Also delete the reported post from feed list if it exists there
      setPosts(posts.filter(p => p.id !== selectedReport.postId));

      setIsBanModalOpen(false);
      setSelectedReport(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Social Feed Management</h1>
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
              <button 
                onClick={() => setActiveTab('FEED')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'FEED' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Feed Content
              </button>
              <button 
                onClick={() => setActiveTab('REPORTS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'REPORTS' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Flag size={14} className="mr-2" />
                  Reported Content
                  {reports.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{reports.length}</span>}
              </button>
          </div>
      </div>

      {activeTab === 'FEED' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Form */}
            <div className="lg:col-span-1">
            <Card>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Plus size={20} className="mr-2 text-indigo-600" /> Create Post
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Author Name</label>
                    <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.authorName} onChange={e => setFormData({...formData, authorName: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                    <textarea required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={4}
                    value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="What's happening?" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                    <div className="relative">
                        <ImageIcon size={16} className="absolute left-3 top-3 text-slate-400"/>
                        <input type="text" className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                    </div>
                </div>
                <Button type="submit" className="w-full">Post to Feed</Button>
                </form>
            </Card>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
            {posts.length === 0 && <Card className="text-center py-10 text-slate-400">No posts active.</Card>}
            {posts.map(post => (
                <Card key={post.id} className="p-0 overflow-hidden border border-slate-200">
                <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                        <img src={post.authorAvatar} alt="av" className="w-8 h-8 rounded-full" />
                        <div>
                            <p className="text-sm font-bold text-slate-800">{post.authorName}</p>
                            <p className="text-xs text-slate-500">{post.timestamp}</p>
                        </div>
                    </div>
                    <button onClick={() => handleDeletePost(post.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
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
      ) : (
          <div className="space-y-4 animate-fade-in">
              {reports.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
                      <h3 className="text-lg font-bold text-slate-600">All Clear!</h3>
                      <p>No pending reports to review.</p>
                  </div>
              ) : (
                  reports.map(report => (
                      <Card key={report.id} className="border-l-4 border-l-red-500">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center space-x-2">
                                  <Badge color="bg-red-100 text-red-700 flex items-center">
                                      <ShieldAlert size={12} className="mr-1"/> PENDING REVIEW
                                  </Badge>
                                  <span className="text-xs text-slate-500">{report.timestamp}</span>
                              </div>
                              <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDismissReport(report.id)}
                                  >
                                      Dismiss
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="danger"
                                    onClick={() => openBanModal(report)}
                                    className="flex items-center"
                                  >
                                      <Ban size={14} className="mr-1" /> Punish User
                                  </Button>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Reported Content</h4>
                                  <p className="text-sm text-slate-800 font-medium mb-1">"{report.postContent}"</p>
                                  <p className="text-xs text-slate-500">Author: <span className="font-bold text-indigo-600">{report.postAuthor}</span></p>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-2">Report Details</h4>
                                  <p className="text-sm text-slate-800"><span className="font-semibold">Reason:</span> {report.reason}</p>
                                  <p className="text-xs text-slate-500 mt-1">Reported by: {report.reporterName}</p>
                              </div>
                          </div>
                      </Card>
                  ))
              )}
          </div>
      )}

      {/* Ban Modal */}
      <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)} title="Punish User">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center text-red-800">
                  <ShieldAlert size={24} className="mr-3 shrink-0" />
                  <div>
                      <p className="font-bold">You are banning {selectedReport?.postAuthor}</p>
                      <p className="text-xs mt-1">This action will prevent the user from posting and commenting.</p>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                      {['24 Hours', '7 Days', 'Permanent'].map(dur => (
                          <button
                            key={dur}
                            onClick={() => setBanDuration(dur)}
                            className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                                banDuration === dur 
                                ? 'bg-red-600 text-white border-red-600' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                            }`}
                          >
                              {dur}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                  <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={confirmBan}>Confirm Ban</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default SocialManagement;