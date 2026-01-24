
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { SocialPost as SocialPostType } from '../../types';
import { authService } from '../../services/authService';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Send, 
  TrendingUp, 
  User as UserIcon,
  Smile,
  Globe,
  X,
  Flag,
  AlertOctagon,
  Ban,
  Lock,
  CheckCircle,
  AlertTriangle,
  Share2,
  Clock,
  Hash
} from 'lucide-react';

// Extended type to handle local comments and reach for this component
interface ExtendedPost extends SocialPostType {
  reach?: number;
  commentsList?: { id: string; author: string; avatar: string; text: string; time: string }[];
}

const FEELINGS = [
    { label: 'Happy', icon: '😄' },
    { label: 'Excited', icon: '🤩' },
    { label: 'Blessed', icon: '😇' },
    { label: 'Sad', icon: '😔' },
    { label: 'Stressed', icon: '😫' },
    { label: 'Confused', icon: '🤔' },
    { label: 'Proud', icon: '🏆' },
    { label: 'Motivated', icon: '🔥' },
];

const REPORT_REASONS = [
    "Hate Speech or Bullying",
    "Spam or Scam",
    "Inappropriate Content",
    "False Information",
    "Harassment"
];

// --- TIME FORMATTER FUNCTION ---
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    // Handle invalid dates (legacy mock data might be "2 hours ago")
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

interface Props {
    posts?: SocialPostType[];
    setPosts?: React.Dispatch<React.SetStateAction<SocialPostType[]>>;
}

const SocialPost: React.FC<Props> = ({ posts = [], setPosts }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(''); 
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{ label: string; icon: string } | null>(null);
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [postToReport, setPostToReport] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Info Modal State
  const [notificationModal, setNotificationModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'INFO' | 'ERROR' | 'SUCCESS' }>({ isOpen: false, title: '', message: '', type: 'INFO' });

  const showNotification = (title: string, message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {
      setNotificationModal({ isOpen: true, title, message, type });
  };

  const calculateReach = (post: ExtendedPost) => {
    const baseReach = post.reach || 150;
    const commentsCount = post.commentsList ? post.commentsList.length : post.comments;
    return baseReach + (post.likes * 10) + (commentsCount * 50);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostText.trim() && !newPostImage) || !setPosts) return;

    const newPost: ExtendedPost = {
      id: `new_${Date.now()}`,
      authorName: currentUser?.name || 'Student',
      authorAvatar: currentUser?.avatar || 'https://ui-avatars.com/api/?name=Student',
      timestamp: new Date().toISOString(), // SAVE AS ISO DATE
      content: newPostText,
      imageUrl: newPostImage || undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      feeling: selectedFeeling || undefined,
      reach: 0, 
      commentsList: []
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setNewPostImage('');
    setSelectedFeeling(null);
    setShowFeelingPicker(false);
  };

  const handleLike = (id: string) => {
    if(!setPosts) return;
    setPosts(posts.map(post => {
      if (post.id === id) {
        const isLiked = !post.isLiked;
        const likeChange = isLiked ? 1 : -1;
        return {
          ...post,
          likes: post.likes + likeChange,
          isLiked: isLiked,
        };
      }
      return post;
    }));
  };

  const toggleCommentBox = (id: string) => {
    if (activeCommentBox === id) {
      setActiveCommentBox(null);
    } else {
      setActiveCommentBox(id);
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim() || !setPosts) return;

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const p = post as ExtendedPost;
        const commentsList = p.commentsList || [];
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [
            ...commentsList,
            {
              id: `c_${Date.now()}`,
              author: currentUser?.name || 'Me',
              avatar: currentUser?.avatar || 'https://ui-avatars.com/api/?name=Me',
              text: commentText,
              time: new Date().toISOString()
            }
          ]
        } as SocialPostType;
      }
      return post;
    }));
    setCommentText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setNewPostImage(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const openReportModal = (postId: string) => {
      setPostToReport(postId);
      setReportReason('');
      setReportModalOpen(true);
      setActiveMenuId(null);
  };

  const submitReport = () => {
      if (!reportReason) {
          showNotification("Action Required", "Please select a reason for reporting.", "ERROR");
          return;
      }
      showNotification("Report Submitted", "Your report has been sent to the admin team for review.", "SUCCESS");
      setReportModalOpen(false);
      setPostToReport(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN FEED */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* COMPOSER */}
              {currentUser?.status === 'BLOCKED' ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm">
                      <div className="flex items-start">
                          <Ban size={32} className="text-red-600 mr-4 mt-1" />
                          <div>
                              <h3 className="text-lg font-bold text-red-800">Account Restricted</h3>
                              <p className="text-sm text-red-700 mt-1">
                                  You have been blocked from posting. Reason: "{currentUser.banReason || 'Violation of rules'}"
                              </p>
                          </div>
                      </div>
                  </div>
              ) : (
                  <Card className="p-5 shadow-soft border-0 ring-1 ring-slate-100 relative z-20">
                    <div className="flex space-x-4">
                      <img 
                        src={currentUser?.avatar || "https://ui-avatars.com/api/?name=Me"} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                      />
                      <div className="flex-1">
                         <div className="bg-slate-50 rounded-2xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                             <textarea
                                className="w-full bg-transparent border-none p-2 resize-none text-slate-700 placeholder:text-slate-400 focus:ring-0 text-base"
                                placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0]}?`}
                                rows={2}
                                value={newPostText}
                                onChange={(e) => setNewPostText(e.target.value)}
                             />
                             {newPostImage && (
                               <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 inline-block">
                                  <img src={newPostImage} alt="Preview" className="max-h-60 w-auto object-cover" />
                                  <button onClick={() => setNewPostImage('')} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                                     <X size={14} />
                                  </button>
                               </div>
                             )}
                         </div>
                         
                         <div className="flex justify-between items-center mt-3 px-1">
                            <div className="flex space-x-1">
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                               <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors">
                                   <ImageIcon size={18} />
                                   <span className="text-xs font-bold">Photo</span>
                               </button>
                               
                               <div className="relative">
                                   <button onClick={() => setShowFeelingPicker(!showFeelingPicker)} className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-amber-50 text-amber-600 transition-colors">
                                       {selectedFeeling ? <span className="text-lg">{selectedFeeling.icon}</span> : <Smile size={18} />}
                                       <span className="text-xs font-bold">{selectedFeeling ? selectedFeeling.label : 'Feeling'}</span>
                                   </button>
                                   
                                   {showFeelingPicker && (
                                      <div className="absolute top-10 left-0 bg-white shadow-xl border border-slate-100 rounded-2xl p-2 z-50 w-64 grid grid-cols-2 gap-1 animate-scale-up">
                                          {FEELINGS.map(f => (
                                              <button key={f.label} onClick={() => { setSelectedFeeling(f); setShowFeelingPicker(false); }} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left">
                                                  <span className="text-lg">{f.icon}</span>
                                                  <span className="text-xs font-medium text-slate-700">{f.label}</span>
                                              </button>
                                          ))}
                                      </div>
                                   )}
                               </div>
                            </div>
                            
                            <Button size="sm" onClick={handleCreatePost} disabled={!newPostText.trim() && !newPostImage} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700">
                               Post
                            </Button>
                         </div>
                      </div>
                    </div>
                  </Card>
              )}

              {/* POST LIST */}
              {posts.map(post => {
                const p = post as ExtendedPost;
                const currentReach = calculateReach(p);
                const commentsList = p.commentsList || [];

                return (
                  <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* HEADER */}
                      <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                              <div className="relative">
                                  <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                                  {/* Online Indicator Mock */}
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                              </div>
                              <div>
                                  <div className="flex items-center">
                                      <h4 className="font-bold text-slate-800 text-sm mr-2">{post.authorName}</h4>
                                      {post.feeling && (
                                          <span className="text-xs text-slate-500 flex items-center bg-slate-100 px-2 py-0.5 rounded-full">
                                              is {post.feeling.icon} {post.feeling.label}
                                          </span>
                                      )}
                                  </div>
                                  <div className="flex items-center text-[11px] text-slate-400 font-medium mt-0.5">
                                     <span>{formatTimeAgo(post.timestamp)}</span>
                                     <span className="mx-1">•</span>
                                     <Globe size={10} />
                                  </div>
                              </div>
                          </div>
                          
                          <div className="relative">
                              <button onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
                                  <MoreHorizontal size={20} />
                              </button>
                              {activeMenuId === post.id && (
                                  <div className="absolute right-0 top-10 w-40 bg-white shadow-xl border border-slate-100 rounded-xl z-20 overflow-hidden animate-scale-up">
                                      <button onClick={() => openReportModal(post.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium">
                                          <Flag size={14} className="mr-2" /> Report Post
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* CONTENT */}
                      <div className="px-4 pb-3">
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[15px]">{post.content}</p>
                      </div>

                      {post.imageUrl && (
                          <div className="w-full bg-slate-100">
                              <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                          </div>
                      )}

                      {/* STATS */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 text-xs text-slate-500">
                          <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-1">
                                <div className="bg-indigo-500 p-1 rounded-full"><Heart size={8} className="text-white fill-white" /></div>
                                <span className="font-bold text-slate-700">{post.likes}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                                <TrendingUp size={12} className="text-slate-400" />
                                <span>{currentReach.toLocaleString()} views</span>
                             </div>
                          </div>
                          <div>{commentsList.length > 0 ? `${commentsList.length} comments` : 'No comments'}</div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center justify-between px-2 py-1">
                          <button 
                              onClick={() => currentUser?.status !== 'BLOCKED' ? handleLike(post.id) : showNotification("Restricted", "You are banned.", "ERROR")}
                              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${post.isLiked ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                              <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} className={post.isLiked ? "animate-pulse" : ""} />
                              <span>Like</span>
                          </button>
                          <button onClick={() => toggleCommentBox(post.id)} className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                              <MessageCircle size={18} />
                              <span>Comment</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                              <Share2 size={18} />
                              <span>Share</span>
                          </button>
                      </div>

                      {/* COMMENTS SECTION */}
                      {activeCommentBox === post.id && (
                        <div className="bg-slate-50 p-4 animate-fade-in border-t border-slate-100">
                            <div className="space-y-4 mb-4">
                               {commentsList.map(comment => (
                                 <div key={comment.id} className="flex gap-3">
                                    <img src={comment.avatar} alt="av" className="w-8 h-8 rounded-full border border-slate-200 mt-1" />
                                    <div>
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/60 inline-block">
                                           <div className="flex items-center gap-2 mb-0.5">
                                               <p className="text-xs font-bold text-slate-800">{comment.author}</p>
                                               <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.time)}</span>
                                           </div>
                                           <p className="text-sm text-slate-700">{comment.text}</p>
                                        </div>
                                    </div>
                                 </div>
                               ))}
                            </div>

                            {currentUser?.status === 'BLOCKED' ? (
                                <div className="text-center text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                                    Commenting disabled.
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-slate-200" />
                                    <div className="flex-1 relative">
                                        <input 
                                            type="text" 
                                            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                        />
                                        <button onClick={() => handleAddComment(post.id)} className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors" disabled={!commentText.trim()}>
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                      )}
                  </div>
                );
              })}
          </div>

          {/* RIGHT SIDEBAR (Trending & Community) */}
          <div className="hidden lg:block space-y-6">
              {/* TRENDING TOPICS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Hash size={18} className="mr-2 text-indigo-600" /> Trending Topics
                  </h3>
                  <div className="space-y-4">
                      {['PhysicsExam', 'HSC2024', 'OrganicChemistry', 'MathTricks', 'EduMaster'].map((tag, i) => (
                          <div key={i} className="flex justify-between items-center group cursor-pointer">
                              <div>
                                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">#{tag}</p>
                                  <p className="text-xs text-slate-400">{10 + i * 5}k posts</p>
                              </div>
                              <TrendingUp size={14} className="text-slate-300 group-hover:text-indigo-500" />
                          </div>
                      ))}
                  </div>
              </div>

              {/* ACTIVE STUDENTS (Mock) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <UserIcon size={18} className="mr-2 text-emerald-600" /> Active Learners
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="relative group cursor-pointer">
                              <img src={`https://i.pravatar.cc/150?img=${10+i}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                      ))}
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border-2 border-white shadow-sm cursor-pointer hover:bg-slate-200">
                          +42
                      </div>
                  </div>
              </div>

              {/* FOOTER */}
              <div className="text-center text-xs text-slate-400">
                  <p>© 2024 EduMaster Community</p>
                  <div className="flex justify-center gap-3 mt-2">
                      <span className="hover:underline cursor-pointer">Guidelines</span>
                      <span className="hover:underline cursor-pointer">Privacy</span>
                      <span className="hover:underline cursor-pointer">Report</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Content">
          <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-xl flex items-start text-sm text-amber-800 border border-amber-200">
                  <AlertOctagon size={18} className="mr-3 mt-0.5 shrink-0" />
                  <p>Reporting helps keep our educational community safe. Reports are anonymous.</p>
              </div>
              
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Why are you reporting this?</label>
                  {REPORT_REASONS.map(reason => (
                      <label key={reason} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input 
                            type="radio" 
                            name="reportReason" 
                            value={reason} 
                            checked={reportReason === reason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="text-sm text-slate-700 font-medium">{reason}</span>
                      </label>
                  ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={submitReport}>Submit Report</Button>
              </div>
          </div>
      </Modal>

      {/* Notification Modal */}
      <Modal isOpen={notificationModal.isOpen} onClose={() => setNotificationModal({ ...notificationModal, isOpen: false })} title={notificationModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start ${notificationModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : notificationModal.type === 'ERROR' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                  {notificationModal.type === 'SUCCESS' && <CheckCircle size={24} className="mr-3 shrink-0" />}
                  {notificationModal.type === 'ERROR' && <AlertTriangle size={24} className="mr-3 shrink-0" />}
                  {notificationModal.type === 'INFO' && <AlertOctagon size={24} className="mr-3 shrink-0" />}
                  <p className="font-medium">{notificationModal.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setNotificationModal({ ...notificationModal, isOpen: false })}>OK</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default SocialPost;
