
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  MapPin,
  Briefcase,
  Share2,
  Clock,
  Hash,
  Camera,
  Edit3,
  CheckCircle,
  AlertTriangle
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
    // Handle invalid dates or legacy strings like "2 hours ago"
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  
  // State to force re-render for time updates
  const [ticker, setTicker] = useState(0);

  // Info Modal State
  const [notificationModal, setNotificationModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'INFO' | 'ERROR' | 'SUCCESS' }>({ isOpen: false, title: '', message: '', type: 'INFO' });

  // Update time every minute
  useEffect(() => {
      const interval = setInterval(() => {
          setTicker(prev => prev + 1);
      }, 60000); // 1 minute
      return () => clearInterval(interval);
  }, []);

  const showNotification = (title: string, message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {
      setNotificationModal({ isOpen: true, title, message, type });
  };

  // --- DASHBOARD STATS CALCULATION ---
  const myStats = useMemo(() => {
      if (!currentUser) return { posts: 0, likesReceived: 0, friends: 0 };
      
      const myPosts = posts.filter(p => p.authorName === currentUser.name);
      const totalLikes = myPosts.reduce((acc, curr) => acc + curr.likes, 0);
      
      return {
          posts: myPosts.length,
          likesReceived: totalLikes,
          friends: currentUser.friends?.length || 12 // Mock if empty
      };
  }, [posts, currentUser]);

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
    setActiveCommentBox(activeCommentBox === id ? null : id);
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
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT: PERSONAL DASHBOARD */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
              <Card className="p-0 overflow-hidden border-0 shadow-lg relative group">
                  {/* Cover Photo */}
                  <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                      <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                  
                  {/* Profile Info */}
                  <div className="px-4 pb-4 relative">
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                          <div className="relative">
                              <img 
                                src={currentUser?.avatar || "https://ui-avatars.com/api/?name=Me"} 
                                alt="Profile" 
                                className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                          </div>
                      </div>
                      
                      <div className="mt-12 text-center">
                          <h3 className="font-bold text-slate-800 text-lg">{currentUser?.name}</h3>
                          <p className="text-xs text-slate-500">{currentUser?.institute || 'Student'}</p>
                          <p className="text-xs text-indigo-600 font-medium mt-1">{currentUser?.class}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-6 border-t border-slate-100 pt-4 text-center">
                          <div>
                              <span className="block font-bold text-slate-800">{myStats.posts}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Posts</span>
                          </div>
                          <div className="border-x border-slate-100">
                              <span className="block font-bold text-slate-800">{myStats.friends}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Friends</span>
                          </div>
                          <div>
                              <span className="block font-bold text-slate-800">{myStats.likesReceived}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Likes</span>
                          </div>
                      </div>
                  </div>
              </Card>

              {/* Quick Menu */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-3 hover:bg-slate-50 cursor-pointer flex items-center text-sm font-medium text-slate-700 transition-colors">
                      <Clock size={18} className="mr-3 text-blue-500" /> Memories
                  </div>
                  <div className="p-3 hover:bg-slate-50 cursor-pointer flex items-center text-sm font-medium text-slate-700 transition-colors">
                      <Hash size={18} className="mr-3 text-purple-500" /> Saved Posts
                  </div>
                  <div className="p-3 hover:bg-slate-50 cursor-pointer flex items-center text-sm font-medium text-slate-700 transition-colors">
                      <Flag size={18} className="mr-3 text-orange-500" /> Pages
                  </div>
              </div>
          </div>

          {/* MIDDLE: FEED */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* CREATE POST */}
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
                  <Card className="p-4 shadow-sm border-0 ring-1 ring-slate-100">
                    <div className="flex gap-3 mb-3">
                        <img 
                            src={currentUser?.avatar || "https://ui-avatars.com/api/?name=Me"} 
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0" 
                        />
                        <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 cursor-text hover:bg-slate-100 transition-colors border border-transparent focus-within:bg-white focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-50">
                             <textarea
                                className="w-full bg-transparent border-none p-0 resize-none text-slate-700 placeholder:text-slate-500 focus:ring-0 text-sm leading-relaxed"
                                placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0]}?`}
                                rows={2}
                                value={newPostText}
                                onChange={(e) => setNewPostText(e.target.value)}
                             />
                        </div>
                    </div>
                    
                    {newPostImage && (
                       <div className="relative mb-3 mx-2 rounded-xl overflow-hidden border border-slate-200">
                          <img src={newPostImage} alt="Preview" className="w-full max-h-80 object-cover" />
                          <button onClick={() => setNewPostImage('')} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm">
                             <X size={16} />
                          </button>
                       </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 px-1">
                        <div className="flex gap-1">
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                           <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                               <ImageIcon size={18} />
                               <span className="text-xs font-bold hidden sm:inline">Photo</span>
                           </button>
                           
                           <div className="relative">
                               <button onClick={() => setShowFeelingPicker(!showFeelingPicker)} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors">
                                   {selectedFeeling ? <span className="text-lg">{selectedFeeling.icon}</span> : <Smile size={18} />}
                                   <span className="text-xs font-bold hidden sm:inline">{selectedFeeling ? selectedFeeling.label : 'Feeling'}</span>
                               </button>
                               
                               {showFeelingPicker && (
                                  <div className="absolute top-10 left-0 bg-white shadow-xl border border-slate-100 rounded-xl p-2 z-50 w-64 grid grid-cols-2 gap-1 animate-scale-up">
                                      {FEELINGS.map(f => (
                                          <button key={f.label} onClick={() => { setSelectedFeeling(f); setShowFeelingPicker(false); }} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-left">
                                              <span className="text-lg">{f.icon}</span>
                                              <span className="text-xs font-medium text-slate-700">{f.label}</span>
                                          </button>
                                      ))}
                                  </div>
                               )}
                           </div>
                        </div>
                        
                        <Button size="sm" onClick={handleCreatePost} disabled={!newPostText.trim() && !newPostImage} className="rounded-lg px-6 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
                           Post
                        </Button>
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
                              <div className="relative cursor-pointer">
                                  <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                              </div>
                              <div>
                                  <div className="flex items-center flex-wrap">
                                      <h4 className="font-bold text-slate-800 text-sm mr-2 cursor-pointer hover:underline">{post.authorName}</h4>
                                      {post.feeling && (
                                          <span className="text-xs text-slate-500 flex items-center">
                                              is <span className="mx-1 text-base">{post.feeling.icon}</span> feeling {post.feeling.label.toLowerCase()}
                                          </span>
                                      )}
                                  </div>
                                  <div className="flex items-center text-[11px] text-slate-400 font-medium mt-0.5">
                                     <span key={ticker}>{formatTimeAgo(post.timestamp)}</span>
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
                                  <div className="absolute right-0 top-8 w-40 bg-white shadow-xl border border-slate-100 rounded-xl z-20 overflow-hidden animate-scale-up">
                                      <button onClick={() => openReportModal(post.id)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center">
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
                          <div className="w-full bg-slate-100 cursor-pointer">
                              <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                          </div>
                      )}

                      {/* STATS */}
                      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-50">
                          <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-1 cursor-pointer hover:text-indigo-600 transition-colors">
                                <div className="bg-indigo-100 p-1 rounded-full"><Heart size={10} className="text-indigo-600 fill-indigo-600" /></div>
                                <span className="font-bold">{post.likes}</span>
                             </div>
                             <div className="flex items-center space-x-1">
                                <TrendingUp size={12} className="text-slate-400" />
                                <span>{currentReach.toLocaleString()} views</span>
                             </div>
                          </div>
                          <div className="cursor-pointer hover:underline">{commentsList.length > 0 ? `${commentsList.length} comments` : 'No comments'}</div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center justify-between px-2 py-1">
                          <button 
                              onClick={() => currentUser?.status !== 'BLOCKED' ? handleLike(post.id) : showNotification("Restricted", "You are banned.", "ERROR")}
                              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${post.isLiked ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                              <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} className={post.isLiked ? "animate-bounce-short" : ""} />
                              <span>Like</span>
                          </button>
                          <button onClick={() => toggleCommentBox(post.id)} className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                              <MessageCircle size={18} />
                              <span>Comment</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                              <Share2 size={18} />
                              <span>Share</span>
                          </button>
                      </div>

                      {/* COMMENTS SECTION */}
                      {activeCommentBox === post.id && (
                        <div className="bg-slate-50 p-4 animate-fade-in border-t border-slate-100">
                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                               {commentsList.map(comment => (
                                 <div key={comment.id} className="flex gap-3">
                                    <img src={comment.avatar} alt="av" className="w-8 h-8 rounded-full border border-slate-200 mt-1 object-cover" />
                                    <div>
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/60 inline-block">
                                           <div className="flex items-center gap-2 mb-0.5">
                                               <p className="text-xs font-bold text-slate-800 hover:underline cursor-pointer">{comment.author}</p>
                                               <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.time)}</span>
                                           </div>
                                           <p className="text-sm text-slate-700 leading-snug">{comment.text}</p>
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
                                <div className="flex items-center gap-2 sticky bottom-0">
                                    <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                                    <div className="flex-1 relative">
                                        <input 
                                            type="text" 
                                            className="w-full pl-4 pr-10 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white shadow-sm"
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                        />
                                        <button onClick={() => handleAddComment(post.id)} className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm" disabled={!commentText.trim()}>
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

          {/* RIGHT: TRENDING & SUGGESTIONS */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
              {/* TRENDING TOPICS */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <TrendingUp size={18} className="mr-2 text-indigo-600" /> Trending Now
                  </h3>
                  <div className="space-y-4">
                      {['PhysicsExam', 'HSC2024', 'OrganicChemistry', 'MathTricks', 'EduMaster'].map((tag, i) => (
                          <div key={i} className="flex justify-between items-center group cursor-pointer">
                              <div>
                                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">#{tag}</p>
                                  <p className="text-[10px] text-slate-400">{10 + i * 5}k posts</p>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-full group-hover:bg-indigo-50 transition-colors">
                                  <Hash size={12} className="text-slate-400 group-hover:text-indigo-500" />
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  <div className="border-t border-slate-100 my-5 pt-5">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm">
                          <UserIcon size={16} className="mr-2 text-emerald-600" /> Suggested Friends
                      </h3>
                      <div className="space-y-3">
                          {[1,2,3].map(i => (
                              <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <img src={`https://i.pravatar.cc/150?img=${10+i}`} className="w-8 h-8 rounded-full" alt="User" />
                                      <div>
                                          <p className="text-xs font-bold text-slate-700">User {i}</p>
                                          <p className="text-[9px] text-slate-400">Class 12</p>
                                      </div>
                                  </div>
                                  <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">Add</button>
                              </div>
                          ))}
                      </div>
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
