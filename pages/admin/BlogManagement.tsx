
import React, { useState, useMemo, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { Plus, Trash2, Calendar, User, Newspaper, Folder as FolderIcon, FolderPlus, ArrowLeft, FolderOpen, Eye, Home, ChevronRight, ArrowUp, AlertTriangle, CheckCircle, Crown, Upload, Loader2, X } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface BlogManagementProps {
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    blogs: BlogPost[];
    setBlogs: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}

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
    isPremium: false // NEW
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      isPremium: formData.isPremium // NEW
    };
    setBlogs([newBlog, ...blogs]);
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
          } else {
              setBlogs(blogs.filter(b => b.id !== deleteModal.id));
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

  // 1. BLOG CREATION FORM
  if (isCreatingBlog) {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center mb-4">
                  <Button variant="outline" onClick={() => setIsCreatingBlog(false)} className="mr-4 bg-white">
                      <ArrowLeft size={16} className="mr-2" /> Cancel
                  </Button>
                  <h1 className="text-2xl font-bold text-slate-800">New Blog Post</h1>
              </div>
              <div className="max-w-3xl mx-auto">
                  <Card>
                    <form onSubmit={handleBlogSubmit} className="space-y-4">
                        <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-700 font-medium mb-4">
                            Publishing to: <span className="font-bold">{currentFolder?.name}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Article Title" />
                        </div>
                        
                        {/* Premium Toggle */}
                        <div>
                            <label className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.isPremium ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                                <div className="flex items-center">
                                    <Crown size={20} className={`mr-2 ${formData.isPremium ? 'text-amber-600' : 'text-slate-400'}`} fill={formData.isPremium ? "currentColor" : "none"} />
                                    <div>
                                        <span className={`block font-bold text-sm ${formData.isPremium ? 'text-amber-800' : 'text-slate-600'}`}>
                                            Premium Article
                                        </span>
                                        <span className="text-xs text-slate-500">Only accessible to paid subscribers</span>
                                    </div>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                                    checked={formData.isPremium}
                                    onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                            <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="Author Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
                            <textarea required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={2}
                            value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} placeholder="Short summary..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Content</label>
                            <textarea required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={6}
                            value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Main article content..." />
                        </div>
                        
                        {/* Hybrid Upload for Thumbnail */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleThumbnailUpload}
                                />
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center"
                                >
                                    <Upload size={14} className="mr-2" /> Upload Image
                                </Button>
                                {isUploading && <span className="flex items-center text-xs text-indigo-600"><Loader2 size={12} className="animate-spin mr-1"/> Uploading...</span>}
                            </div>
                            
                            <div className="flex gap-2 items-center">
                                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} placeholder="Or paste Image URL..." />
                                {formData.thumbnail && (
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, thumbnail: ''})}
                                        className="text-red-500 p-2 hover:bg-red-50 rounded"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {formData.thumbnail && (
                                <div className="mt-2">
                                    <img src={formData.thumbnail} alt="Preview" className="h-32 rounded border border-slate-200 object-cover" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Math, Science, Tips" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isUploading}>Publish Post</Button>
                    </form>
                  </Card>
              </div>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {displayedFolders.map(folder => (
                              <div 
                                  key={folder.id} 
                                  onClick={() => setCurrentFolderId(folder.id)}
                                  className="group relative bg-amber-50/50 border border-amber-100 rounded-xl p-4 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all flex flex-col items-center text-center"
                              >
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => initiateDeleteFolder(e, folder.id)} className="text-amber-400 hover:text-red-500 p-1">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                                  <FolderIcon className="text-amber-400 fill-amber-100 mb-2" size={32} />
                                  <h4 className="font-bold text-slate-700 text-sm truncate w-full">{folder.name}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{folder.description}</p>
                              </div>
                          ))}
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
