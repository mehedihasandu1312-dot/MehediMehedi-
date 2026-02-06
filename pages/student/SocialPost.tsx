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
      timestamp: 'Just now',
      content: newPostText,
      imageUrl: newPostImage || undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      feeling: selectedFeeling || undefined,
      reach: 150, 
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
              time: 'Just now'
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* 1. CHECK STATUS: IF BLOCKED SHOW ALERT, ELSE SHOW COMPOSER */}
      {currentUser?.status === 'BLOCKED' ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                  <Ban size={32} className="text-red-600 mr-4 mt-1" />
                  <div>
                      <h3 className="text-lg font-bold text-red-800">Account Restricted</h3>
                      <p className="text-sm text-red-700 mt-1">
                          You have been blocked from posting or commenting by the administrator.
                      </p>
                      {currentUser.banReason && (
                          <div className="mt-3 bg-red-100 p-3 rounded-lg border border-red-200">
                              <p className="text-xs font-bold text-red-800 uppercase mb-1">Reason for Punishment:</p>
                              <p className="text-sm text-red-900 italic">"{currentUser.banReason}"</p>
                          </div>
                      )}
                      <p className="text-xs text-red-600 mt-3">
                          You can still view posts and study materials. Please contact support if you believe this is a mistake.
                      </p>
                  </div>
              </div>
          </div>
      ) : (
          <Card className="p-4 shadow-sm border-slate-200">
            <div className="flex space-x-3 mb-4">
              <img 
                src={currentUser?.avatar || "https://ui-avatars.com/api/?name=Me"} 
                alt="Profile" 
                className="w-10 h-10 rounded-full bg-slate-200"
              />
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                     <span className="font-bold text-slate-700 text-sm">{currentUser?.name.split(' ')[0]}</span>
                     {selectedFeeling && (
                         <span className="text-sm text-slate-500 flex items-center bg-indigo-50 px-2 py-0.5 rounded-full">
                             is feeling {selectedFeeling.icon} {selectedFeeling.label}
                             <button onClick={() => setSelectedFeeling(null)} className="ml-2 hover:text-red-500"><X size={12}/></button>
                         </span>
                     )}
                 </div>
                 <textarea
                    className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-100 resize-none text-slate-700 placeholder:text-slate-400"
                    placeholder={`What's on your mind?`}
                    rows={2}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                 />
                 
                 {newPostImage && (
                   <div className="mt-3 relative animate-fade-in group inline-block">
                      <img 
                        src={newPostImage} 
                        alt="Preview" 
                        className="w-full h-auto max-h-80 object-cover rounded-lg border border-slate-200" 
                      />
                      <button 
                        onClick={() => setNewPostImage('')}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                      >
                         <X size={16} />
                      </button>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 relative">
               <div className="flex space-x-2">
                  <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-slate-50"
                  >
                      <ImageIcon size={18} className="text-emerald-500" />
                      <span>Photo</span>
                  </button>
                  <div className="relative">
                      <button 
                        onClick={() => setShowFeelingPicker(!showFeelingPicker)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFeelingPicker ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <Smile size={18} className="text-amber-500" />
                          <span>Feeling</span>
                      </button>
                      
                      {showFeelingPicker && (
                          <div className="absolute top-10 left-0 bg-white shadow-xl border border-slate-100 rounded-xl p-2 z-20 w-48 grid grid-cols-2 gap-1 animate-fade-in">
                              {FEELINGS.map(f => (
                                  <button 
                                    key={f.label}
                                    onClick={() => { setSelectedFeeling(f); setShowFeelingPicker(false); }}
                                    className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg text-xs text-slate-700"
                                  >
                                      <span>{f.icon}</span>
                                      <span>{f.label}</span>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
               </div>
               <Button size="sm" onClick={handleCreatePost} disabled={!newPostText.trim() && !newPostImage}>
                  Post
               </Button>
            </div>
          </Card>
      )}

      {/* 2. FEED */}
      {posts.map(post => {
        const p = post as ExtendedPost;
        const currentReach = calculateReach(p);
        const commentsList = p.commentsList || [];

        return (
          <Card key={post.id} className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full border border-slate-100" />
                      <div>
                          <div className="flex items-center flex-wrap">
                              <h4 className="font-bold text-slate-800 text-sm leading-tight mr-2">{post.authorName}</h4>
                              {post.feeling && (
                                  <span className="text-xs text-slate-500 flex items-center">
                                      is feeling {post.feeling.icon} <span className="font-medium text-slate-700 ml-1">{post.feeling.label}</span>
                                  </span>
                              )}
                          </div>
                          <div className="flex items-center text-xs text-slate-500 mt-0.5">
                             <span>{post.timestamp}</span>
                             <span className="mx-1">•</span>
                             <Globe size={10} />
                          </div>
                      </div>
                  </div>
                  <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
                      >
                          <MoreHorizontal size={20} />
                      </button>
                      
                      {activeMenuId === post.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white shadow-lg border border-slate-100 rounded-lg z-10 overflow-hidden animate-fade-in">
                              <button 
                                onClick={() => openReportModal(post.id)}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                  <Flag size={14} className="mr-2" /> Report Post
                              </button>
                          </div>
                      )}
                  </div>
              </div>

              <div className="px-4 pb-3">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[15px]">{post.content}</p>
              </div>

              {post.imageUrl && (
                  <div className="w-full bg-slate-50 border-t border-b border-slate-100">
                      <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                  </div>
              )}

              <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 border-b border-slate-50">
                  <div className="flex items-center space-x-4">
                     {post.likes > 0 && (
                       <div className="flex items-center space-x-1">
                          <div className="bg-indigo-500 p-1 rounded-full">
                            <Heart size={8} className="text-white fill-white" />
                          </div>
                          <span>{post.likes}</span>
                       </div>
                     )}
                     <div className="flex items-center space-x-1 text-slate-400" title="Estimated Post Reach">
                        <TrendingUp size={12} />
                        <span>{currentReach.toLocaleString()} reached</span>
                     </div>
                  </div>
                  
                  <div>
                      {commentsList.length > 0 ? `${commentsList.length} comments` : ''}
                  </div>
              </div>

              <div className="px-2 py-1 flex items-center justify-between">
                  <button 
                      onClick={() => currentUser?.status !== 'BLOCKED' ? handleLike(post.id) : showNotification("Restricted", "You are banned from interacting.", "ERROR")}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          post.isLiked 
                          ? 'text-indigo-600 bg-indigo-50' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                      <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                      <span>Like</span>
                  </button>
                  <button 
                    onClick={() => toggleCommentBox(post.id)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                      <MessageCircle size={18} />
                      <span>Comment</span>
                  </button>
              </div>

              {activeCommentBox === post.id && (
                <div className="bg-slate-50 p-4 border-t border-slate-100 animate-fade-in">
                    <div className="space-y-3 mb-4">
                       {commentsList.map(comment => (
                         <div key={comment.id} className="flex space-x-2">
                            <img src={comment.avatar} alt="av" className="w-8 h-8 rounded-full" />
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                               <p className="text-xs font-bold text-slate-800">{comment.author}</p>
                               <p className="text-sm text-slate-700">{comment.text}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    {currentUser?.status === 'BLOCKED' ? (
                        <div className="text-center text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-center justify-center">
                            <Lock size={12} className="mr-1" /> Commenting disabled due to account restriction.
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <img src={currentUser?.avatar || "https://ui-avatars.com/api/?name=Me"} className="w-8 h-8 rounded-full" />
                            <div className="flex-1 relative">
                                <input 
                                type="text" 
                                className="w-full pl-3 pr-10 py-2 rounded-full border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                />
                                <button 
                                onClick={() => handleAddComment(post.id)}
                                className="absolute right-1 top-1 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                                disabled={!commentText.trim()}
                                >
                                <Send size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              )}
          </Card>
        );
      })}

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Post">
          <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg flex items-start text-sm text-amber-800 border border-amber-200">
                  <AlertOctagon size={16} className="mr-2 mt-0.5 shrink-0" />
                  <p>Reporting helps keep our educational community safe. Please select a reason below.</p>
              </div>
              
              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Reason for reporting:</label>
                  {REPORT_REASONS.map(reason => (
                      <label key={reason} className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                          <input 
                            type="radio" 
                            name="reportReason" 
                            value={reason} 
                            checked={reportReason === reason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">{reason}</span>
                      </label>
                  ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                  <Button variant="danger" onClick={submitReport}>Submit Report</Button>
              </div>
          </div>
      </Modal>

      {/* Generic Info Modal */}
      <Modal isOpen={notificationModal.isOpen} onClose={() => setNotificationModal({ ...notificationModal, isOpen: false })} title={notificationModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${notificationModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : notificationModal.type === 'ERROR' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                  {notificationModal.type === 'SUCCESS' && <CheckCircle size={24} className="mr-3 shrink-0" />}
                  {notificationModal.type === 'ERROR' && <AlertTriangle size={24} className="mr-3 shrink-0" />}
                  {notificationModal.type === 'INFO' && <AlertOctagon size={24} className="mr-3 shrink-0" />}
                  <p>{notificationModal.message}</p>
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