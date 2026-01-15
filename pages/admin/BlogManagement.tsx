import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { Plus, Trash2, Calendar, User, Newspaper, Folder as FolderIcon, FolderPlus, ArrowLeft, FolderOpen, Eye } from 'lucide-react';

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
    tags: ''
  });

  // --- Handlers ---

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      
      const newFolder: Folder = {
          id: `blog_folder_${Date.now()}`,
          name: newFolderName,
          description: newFolderDesc
      };
      
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setNewFolderDesc('');
      setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const hasBlogs = blogs.some(b => b.folderId === id);
      if (hasBlogs) {
          alert("Cannot delete folder. It contains blog posts.");
          return;
      }
      if (confirm("Delete this folder?")) {
          setFolders(folders.filter(f => f.id !== id));
      }
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFolderId) {
        alert("Error: No folder selected.");
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
      views: 0 // Initialize views to 0
    };
    setBlogs([newBlog, ...blogs]);
    setFormData({ title: '', author: '', excerpt: '', content: '', thumbnail: '', tags: '' });
    setIsCreatingBlog(false);
    alert("Blog post published successfully!");
  };

  const handleDeleteBlog = (id: string) => {
    if (confirm("Delete this blog post?")) {
      setBlogs(blogs.filter(b => b.id !== id));
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
                            Publishing to: {folders.find(f => f.id === currentFolderId)?.name}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Article Title" />
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail URL</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Math, Science, Tips" />
                        </div>
                        <Button type="submit" className="w-full">Publish Post</Button>
                    </form>
                  </Card>
              </div>
          </div>
      );
  }

  // 2. FOLDER DETAIL VIEW (BLOG LIST)
  if (currentFolderId) {
      const currentFolder = folders.find(f => f.id === currentFolderId);
      const folderBlogs = blogs.filter(b => b.folderId === currentFolderId);

      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <Button variant="outline" className="mr-4 bg-white shadow-sm hover:bg-slate-50" onClick={() => setCurrentFolderId(null)}>
                          <ArrowLeft size={16} />
                      </Button>
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                              <FolderOpen className="mr-2 text-indigo-500" size={28} />
                              {currentFolder?.name}
                          </h1>
                          <p className="text-sm text-slate-500 ml-9">{folderBlogs.length} Articles</p>
                      </div>
                  </div>
                  <Button onClick={() => setIsCreatingBlog(true)} className="flex items-center">
                      <Plus size={18} className="mr-2" /> Write Blog
                  </Button>
              </div>

              {folderBlogs.length === 0 ? (
                  <Card className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200">
                      <Newspaper size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="mb-4">No articles in this folder yet.</p>
                      <Button variant="outline" onClick={() => setIsCreatingBlog(true)}>Write First Article</Button>
                  </Card>
              ) : (
                  <div className="grid gap-6">
                      {folderBlogs.map(blog => (
                        <Card key={blog.id} className="flex flex-col md:flex-row gap-4">
                            <img src={blog.thumbnail} alt={blog.title} className="w-full md:w-32 h-32 object-cover rounded-lg bg-slate-100" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 text-lg">{blog.title}</h3>
                                    <button onClick={() => handleDeleteBlog(blog.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                                <div className="flex items-center text-xs text-slate-500 mt-1 mb-2 space-x-3">
                                    <span className="flex items-center"><User size={12} className="mr-1"/> {blog.author}</span>
                                    <span className="flex items-center"><Calendar size={12} className="mr-1"/> {blog.date}</span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">{blog.excerpt}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {blog.tags.map(tag => <Badge key={tag} color="bg-indigo-50 text-indigo-600">#{tag}</Badge>)}
                                    </div>
                                    <div className="flex items-center text-slate-500 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
                                        <Eye size={14} className="mr-1.5" /> {blog.views?.toLocaleString() || 0} Views
                                    </div>
                                </div>
                            </div>
                        </Card>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // 3. FOLDER GRID VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <Button variant="outline" onClick={() => setIsFolderModalOpen(true)} className="flex items-center">
              <FolderPlus size={18} className="mr-2" /> New Category
          </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map(folder => {
              const blogCount = blogs.filter(b => b.folderId === folder.id).length;
              return (
                <div 
                    key={folder.id} 
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer flex flex-col items-center text-center"
                >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-500 mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <FolderIcon size={32} />
                    </div>
                    <h4 className="font-bold text-slate-700 text-lg">{folder.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-2 line-clamp-1">{folder.description || 'Category'}</p>
                    <Badge color="bg-slate-100 text-slate-500">{blogCount} Articles</Badge>
                </div>
              );
          })}
          
          <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-300 transition-all"
          >
              <Plus size={32} className="mb-2" />
              <span className="text-sm font-bold">Add Category Folder</span>
          </button>
      </div>

      {/* Modal for Folder Creation */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create Blog Category">
          <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
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
              <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Folder</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default BlogManagement;