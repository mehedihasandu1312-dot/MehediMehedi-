
import React, { useState, useMemo, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { Plus, Trash2, Calendar, User, Newspaper, Folder as FolderIcon, FolderPlus, ArrowLeft, FolderOpen, Eye, Home, ChevronRight, ArrowUp, AlertTriangle, CheckCircle, Crown, Upload, Loader2, X, FileText } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { authService } from '../../services/authService';
import RichTextEditor from '../../components/RichTextEditor'; // IMPORTED

interface BlogManagementProps {
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    blogs: BlogPost[];
    setBlogs: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}

// Consistent Pink/Warm Gradient Palette
const getGradientClass = (index: number) => {
    const gradients = [
        'bg-gradient-to-br from-pink-600 to-rose-600 shadow-pink-200',
        'bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-fuchsia-200',
        'bg-gradient-to-br from-rose-500 to-orange-600 shadow-orange-200',
        'bg-gradient-to-br from-purple-600 to-fuchsia-500 shadow-purple-200',
        'bg-gradient-to-br from-brand-600 to-red-600 shadow-red-200',
        'bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-violet-200',
    ];
    return gradients[index % gradients.length];
};

const BlogManagement: React.FC<BlogManagementProps> = ({ folders, setFolders, blogs, setBlogs }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Folder Creation State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Blog Creation State
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    tags: '',
    isPremium: false
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authService.getCurrentUser();

  // Delete State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'FOLDER' | 'BLOG' }>({ isOpen: false, id: null, type: 'BLOG' });

  // Info Modal State
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

  const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
      setInfoModal({ isOpen: true, title, message, type });
  };

  // --- NAVIGATION HELPERS ---
  const currentFolder = folders.find(f => f.id === currentFolderId);

  // Recursive Breadcrumbs
  const getBreadcrumbs = (folderId: string | null): Folder[] => {
    if (!folderId) return [];
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return [...getBreadcrumbs(folder.parentId || null), folder];
  };

  const breadcrumbs = useMemo(() => getBreadcrumbs(currentFolderId), [currentFolderId, folders]);

  const displayedFolders = folders.filter(f => 
    (currentFolderId === null && !f.parentId) || f.parentId === currentFolderId
  );

  const displayedBlogs = blogs.filter(b => b.folderId === (currentFolderId || 'root_unsupported'));

  // --- HANDLERS ---

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      
      const newFolder: Folder = {
          id: `blog_folder_${Date.now()}`,
          name: newFolderName,
          description: newFolderDesc,
          parentId: currentFolderId || undefined // Support nesting
      };
      
      // UPDATED: Prepend new folder so it appears first
      setFolders([newFolder, ...folders]);
      
      if (currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Created Blog Folder", `Folder: ${newFolderName}`, "SUCCESS");
      
      setNewFolderName('');
      setNewFolderDesc('');
      setIsFolderModalOpen(false);
      showInfo("Success", "Folder created successfully!");
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      if (file.size < 700 * 1024) {
          // Direct Base64
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setFormData(prev => ({ ...prev, thumbnail: event.target!.result as string }));
                  setIsUploading(false);
              }
          };
          reader.readAsDataURL(file);
      } else {
          // Firebase Storage
          const storageRef = ref(storage, `blog_thumbnails/${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on('state_changed',
              null,
              (error) => {
                  console.error("Upload error:", error);
                  alert("Upload failed. Try a smaller image.");
                  setIsUploading(false);
              },
              async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  setFormData(prev => ({ ...prev, thumbnail: downloadURL }));
                  setIsUploading(false);
              }
          );
      }
  };

  const initiateDeleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      // Check for children folders or blogs
      const hasChildren = folders.some(f => f.parentId === id) || blogs.some(b => b.folderId === id);
      if (hasChildren) {
          showInfo("Cannot Delete", "Cannot delete folder. It contains sub-folders or blog posts.", "ERROR");
          return;
      }
      setDeleteModal({ isOpen: true, id, type: 'FOLDER' });
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolderId) {
        showInfo("Error", "Please select a folder first.", "ERROR");
        return;
    }

    const newBlog: BlogPost = {
      id: `blog_${Date.now()}`,
      folderId: currentFolderId,
      title: formData.title,
      author: formData.author,
      excerpt: formData.excerpt,
      content: formData.content,
      thumbnail: formData.thumbnail || 'https://picsum.photos/400/250',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      views: 0,
      isPremium: formData.isPremium
    };
    setBlogs([newBlog, ...blogs]);
    
    if (currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Published Blog", `Article: ${formData.title}`, "SUCCESS");

    setFormData({ title: '', author: '', excerpt: '', content: '', thumbnail: '', tags: '', isPremium: false });
    setIsCreatingBlog(false);
    showInfo("Success", "Blog post published successfully!");
  };

  const initiateDeleteBlog = (id: string) => {
      setDeleteModal({ isOpen: true, id, type: 'BLOG' });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          if (deleteModal.type === 'FOLDER') {
              setFolders(folders.filter(f => f.id !== deleteModal.id));
              if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Deleted Folder", `ID: ${deleteModal.id}`, "WARNING");
          } else {
              const blogTitle = blogs.find(b => b.id === deleteModal.id)?.title;
              setBlogs(blogs.filter(b => b.id !== deleteModal.id));
              if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Deleted Blog", `Article: ${blogTitle}`, "DANGER");
          }
          setDeleteModal({ isOpen: false, id: null, type: 'BLOG' });
      }
  };

  const handleNavigateUp = () => {
      if (currentFolder?.parentId) {
          setCurrentFolderId(currentFolder.parentId);
      } else {
          setCurrentFolderId(null);
      }
  };

  // --- VIEWS ---

  // 1. BLOG CREATION FORM (RICH TEXT ENABLED)
  if (isCreatingBlog) {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center mb-4">
                  <Button variant="outline" onClick={() => setIsCreatingBlog(false)} className="mr-4 bg-white">
                      <ArrowLeft size={16} className="mr-2" /> Cancel
                  </Button>
                  <h1 className="text-2xl font-bold text-slate-800">New Blog Post</h1>
              </div>
              
              <form onSubmit={handleBlogSubmit} className="space-y-6 max-w-6xl mx-auto">
                  {/* META DATA CARD */}
                  <Card className="bg-white border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-700 font-medium flex items-center">
                                    <FolderOpen size={16} className="mr-2" />
                                    Publishing to: <span className="font-bold ml-1">{currentFolder?.name}</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Article Title</label>
                                    <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" 
                                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Enter an engaging title..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Author Name</label>
                                    <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="e.g. Dr. A. Rahman" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt / Summary</label>
                                    <textarea required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                    value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} placeholder="Short summary for preview cards..." />
                                </div>
                                
                                {/* Premium & Tags */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tags</label>
                                        <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Math, Tips, Guide" />
                                    </div>
                                    <div className="flex items-end">
                                        <label className={`flex items-center justify-between p-2.5 rounded-lg border-2 cursor-pointer transition-all ${formData.isPremium ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex items-center mr-3">
                                                <Crown size={18} className={`mr-2 ${formData.isPremium ? 'text-amber-600' : 'text-slate-400'}`} fill={formData.isPremium ? "currentColor" : "none"} />
                                                <span className={`text-xs font-bold ${formData.isPremium ? 'text-amber-800' : 'text-slate-600'}`}>Premium</span>
                                            </div>
                                            <input type="checkbox" className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" checked={formData.isPremium} onChange={e => setFormData({...formData, isPremium: e.target.checked})} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail Upload */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cover Image</label>
                            <div className="flex items-center gap-4">
                                <div className="relative group w-32 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                                    {formData.thumbnail ? (
                                        <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400">No Image</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-2 mb-2">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                                        <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                            {isUploading ? <Loader2 size={14} className="animate-spin mr-1"/> : <Upload size={14} className="mr-1" />}
                                            Upload
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setFormData({...formData, thumbnail: ''})} className="text-red-500">
                                            Remove
                                        </Button>
                                    </div>
                                    <input type="text" className="w-full p-2 border rounded-lg text-xs" placeholder="Or paste image URL..." value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} />
                                </div>
                            </div>
                        </div>
                  </Card>

                  {/* RICH TEXT EDITOR */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                          <h3 className="font-bold text-slate-700 flex items-center">
                              <FileText size={18} className="mr-2 text-indigo-600" /> Article Content
                          </h3>
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <RichTextEditor 
                              initialValue={formData.content} 
                              onChange={(html) => setFormData(prev => ({...prev, content: html}))} 
                              placeholder="Start writing your amazing article here..."
                          />
                      </div>
                  </div>

                  <div className="flex justify-end pt-4 pb-10">
                      <Button type="submit" size="lg" className="px-8 shadow-lg shadow-indigo-200" disabled={isUploading}>
                          Publish Article
                      </Button>
                  </div>
              </form>
          </div>
      );
  }

  // 2. EXPLORER VIEW (FOLDERS + BLOGS)
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          
          <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFolderModalOpen(true)} className="flex items-center">
                  <FolderPlus size={18} className="mr-2" /> New Folder
              </Button>
              {currentFolderId && (
                  <Button onClick={() => setIsCreatingBlog(true)} className="flex items-center">
                      <Plus size={18} className="mr-2" /> Write Article
                  </Button>
              )}
          </div>
      </div>

      <Card className="min-h-[500px] flex flex-col">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4 overflow-x-auto">
                {currentFolderId !== null && (
                    <button 
                        onClick={handleNavigateUp}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 mr-2 transition-colors shrink-0"
                        title="Go Up"
                    >
                        <ArrowUp size={16} />
                    </button>
                )}

                <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg w-full">
                    <button 
                        onClick={() => setCurrentFolderId(null)}
                        className={`flex items-center hover:text-indigo-600 transition-colors ${currentFolderId === null ? 'font-bold text-indigo-700' : ''}`}
                    >
                        <Home size={16} className="mr-1" /> Home
                    </button>
                    
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            <ChevronRight size={14} className="text-slate-400" />
                            <button 
                                onClick={() => setCurrentFolderId(crumb.id)}
                                className={`hover:text-indigo-600 transition-colors ${index === breadcrumbs.length - 1 ? 'font-bold text-indigo-700' : ''}`}
                            >
                                {crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
          </div>

          <div className="flex-1 space-y-8">
              {/* SECTION: FOLDERS */}
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                      <FolderIcon size={14} className="mr-1"/> Sub-Folders
                  </h3>
                  {displayedFolders.length === 0 ? (
                      <p className="text-sm text-slate-400 italic pl-2">No sub-folders here.</p>
                  ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-up">
                          {displayedFolders.map((folder, index) => {
                              // Count items inside for display
                              const articleCount = blogs.filter(b => b.folderId === folder.id).length;
                              return (
                                  <div 
                                      key={folder.id} 
                                      onClick={() => setCurrentFolderId(folder.id)}
                                      className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl shadow-lg h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white border border-white/20`}
                                  >
                                      {/* Background Decoration */}
                                      <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500 pointer-events-none">
                                          {folder.icon ? (
                                              <img src={folder.icon} className="w-32 h-32 object-contain drop-shadow-md brightness-200" alt="" />
                                          ) : (
                                              <FolderIcon className="w-32 h-32" fill="currentColor" />
                                          )}
                                      </div>

                                      <div className="relative z-10 pr-8">
                                          <h3 className="text-xl font-bold leading-tight mb-2 drop-shadow-md font-sans tracking-tight line-clamp-2">
                                              {folder.name}
                                          </h3>
                                          <p className="text-white/80 text-xs font-medium line-clamp-2">
                                              {folder.description || 'Category'}
                                          </p>
                                      </div>

                                      <div className="relative z-10 flex items-center justify-between mt-auto">
                                          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 group-hover:bg-white/30 transition-colors">
                                              <Newspaper size={12} className="text-white" />
                                              <span>{articleCount} Articles</span>
                                          </div>
                                          
                                          <button 
                                              onClick={(e) => initiateDeleteFolder(e, folder.id)}
                                              className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-red-500 text-white transition-all shadow-sm backdrop-blur-md border border-white/10 z-20"
                                              title="Delete Folder"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  )}
              </div>

              {/* SECTION: BLOG POSTS */}
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center border-t border-slate-100 pt-4">
                      <Newspaper size={14} className="mr-1"/> Articles
                  </h3>
                  {displayedBlogs.length === 0 ? (
                      <p className="text-sm text-slate-400 italic pl-2">No articles in this folder.</p>
                  ) : (
                      <div className="grid grid-cols-1 gap-4">
                          {displayedBlogs.map(blog => (
                              <div key={blog.id} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-slate-50 transition-all group relative">
                                  {blog.isPremium && (
                                      <div className="absolute top-0 left-0 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-tl-xl rounded-br-lg z-10 flex items-center shadow-sm">
                                          <Crown size={10} className="mr-1" fill="currentColor"/> PREMIUM
                                      </div>
                                  )}
                                  <img src={blog.thumbnail} alt={blog.title} className="w-full md:w-32 h-24 object-cover rounded-lg bg-slate-200" />
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{blog.title}</h3>
                                          <button onClick={() => initiateDeleteBlog(blog.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                                      </div>
                                      <div className="flex items-center text-xs text-slate-500 mt-1 mb-2 space-x-3">
                                          <span className="flex items-center"><User size={12} className="mr-1"/> {blog.author}</span>
                                          <span className="flex items-center"><Calendar size={12} className="mr-1"/> {blog.date}</span>
                                      </div>
                                      <p className="text-sm text-slate-600 line-clamp-2">{blog.excerpt}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </Card>

      {/* Modal for Folder Creation */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create Blog Folder">
          <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Science Tips"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Short description..."
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                  />
              </div>
              
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
                {currentFolderId ? (
                     <>Creating sub-folder inside: <span className="font-bold text-indigo-600">{currentFolder?.name}</span></>
                ) : (
                     <>Creating category at: <span className="font-bold text-indigo-600">Root Level</span></>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Folder</Button>
              </div>
          </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Are you sure you want to delete this {deleteModal.type === 'FOLDER' ? 'Folder' : 'Blog Post'}?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
          </div>
      </Modal>

      {/* INFO MODAL */}
      <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${infoModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {infoModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
                  <p>{infoModal.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default BlogManagement;
