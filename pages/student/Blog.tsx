
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { BookOpen, User, Calendar, ArrowRight, Folder as FolderIcon, ArrowLeft, Newspaper, Lock, Crown, FileText, Search } from 'lucide-react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

interface BlogProps {
    folders: Folder[];
    blogs: BlogPost[];
    onViewBlog?: (blogId: string) => void;
}

// Consistent Pink/Warm Gradient Palette (Same as StudyContent)
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

const Blog: React.FC<BlogProps> = ({ folders, blogs, onViewBlog }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isPro = user?.subscription?.status === 'ACTIVE';

  const displayedFolders = folders.filter(f => (currentFolderId === null && !f.parentId) || f.parentId === currentFolderId);
  
  const displayedBlogs = blogs.filter(b => {
      const folderMatch = b.folderId === (currentFolderId || 'root_unsupported');
      const searchMatch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      return folderMatch && searchMatch;
  });

  const selectedFolder = folders.find(f => f.id === currentFolderId);

  const handleReadBlog = (blog: BlogPost) => {
      if (blog.isPremium && !isPro) {
          if(confirm("Premium Article. Upgrade to read?")) navigate('/student/subscription');
          return;
      }
      setReadingBlog(blog);
      if (onViewBlog) onViewBlog(blog.id);
  };

  // --- BLOG READING VIEW ---
  if (readingBlog) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-white md:bg-black/80 backdrop-blur-sm animate-fade-in">
              <SEO title={readingBlog.title} description={readingBlog.excerpt} type="article" />
              <div className="bg-white md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[95vh] flex flex-col overflow-hidden relative">
                  <button onClick={() => setReadingBlog(null)} className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white transition-all">
                      <ArrowLeft size={24} className="text-slate-800" />
                  </button>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="relative h-64 md:h-96 w-full">
                          <img src={readingBlog.thumbnail} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white">
                              <Badge color="bg-pink-600 text-white border-none mb-3">{folders.find(f => f.id === readingBlog.folderId)?.name}</Badge>
                              <h1 className="text-2xl md:text-4xl font-black leading-tight mb-2 font-serif">{readingBlog.title}</h1>
                              <div className="flex items-center text-sm font-medium text-white/80 space-x-4">
                                  <span className="flex items-center"><User size={14} className="mr-2"/> {readingBlog.author}</span>
                                  <span className="flex items-center"><Calendar size={14} className="mr-2"/> {readingBlog.date}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-6 md:p-12 max-w-3xl mx-auto">
                          <div className="prose prose-lg prose-pink text-slate-700 leading-loose first-letter:text-5xl first-letter:font-bold first-letter:text-pink-600 first-letter:float-left first-letter:mr-3 whitespace-pre-wrap font-serif">
                              {readingBlog.content}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN FOLDER & LIST VIEW ---
  return (
    <div className="space-y-8 animate-fade-in pb-20">
        <SEO title="Educational Blog" description="Explore articles and tips." />
        
        {/* HERO HEADER (Only visible on Root) */}
        {!currentFolderId && (
            <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden text-white shadow-2xl mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600 rounded-full blur-[100px] opacity-50 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-40 -ml-10 -mb-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-pink-400 font-bold uppercase text-xs tracking-widest mb-2">
                        <Newspaper size={14} />
                        <span>Knowledge Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Educational <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Insights</span></h1>
                    <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                        Curated articles, study strategies, and academic updates to fuel your learning journey.
                    </p>
                </div>
            </div>
        )}

        {/* FOLDER GRID VIEW (Root Level) */}
        {!currentFolderId ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-slide-up">
                {displayedFolders.map((folder, index) => {
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
                                    <BookOpen className="w-32 h-32" fill="currentColor" />
                                )}
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold leading-tight mb-2 drop-shadow-md font-sans tracking-tight line-clamp-2">
                                    {folder.name}
                                </h3>
                                <p className="text-white/80 text-xs md:text-sm font-medium line-clamp-2">
                                    {folder.description || 'Read Articles'}
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-auto">
                                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 group-hover:bg-white/30 transition-colors">
                                    <FileText size={12} className="text-white" />
                                    <span>{articleCount} Articles</span>
                                </div>
                                
                                <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white text-white hover:text-pink-600 transition-all shadow-sm">
                                    <ArrowLeft className="rotate-180" size={16} />
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            // --- INSIDE FOLDER (BLOG LIST) ---
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <Button variant="ghost" onClick={() => setCurrentFolderId(null)} className="mr-2 rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-slate-100">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                    {selectedFolder?.icon && <img src={selectedFolder.icon} alt="icon" className="w-6 h-6 mr-2 object-contain" />}
                                    {selectedFolder?.name}
                                </h2>
                                <p className="text-xs text-slate-500">Reading List</p>
                            </div>
                        </div>
                        
                        <div className="relative w-full md:w-64">
                            <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search articles..." 
                                className="w-full pl-10 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-pink-200 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {displayedBlogs.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Newspaper size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">No Articles Found</h3>
                        <p className="text-slate-400 text-sm">Check back later for updates.</p>
                    </div>
                ) : (
                    // Blog Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedBlogs.map(blog => (
                            <div 
                                key={blog.id} 
                                onClick={() => handleReadBlog(blog)}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                            >
                                <div className="relative h-52 overflow-hidden">
                                    <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                    {blog.isPremium && (
                                        <div className="absolute top-3 left-3 bg-amber-400 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center">
                                            <Crown size={12} className="mr-1" /> PREMIUM
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 text-white text-xs font-medium flex items-center">
                                        <Calendar size={12} className="mr-1.5 opacity-80" /> {blog.date}
                                    </div>
                                </div>
                                
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex gap-2 mb-3">
                                        {blog.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 leading-snug group-hover:text-pink-600 transition-colors line-clamp-2">
                                        {blog.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                                        {blog.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center text-xs font-bold text-slate-500">
                                            <User size={14} className="mr-1.5" /> {blog.author}
                                        </div>
                                        <span className="text-pink-600 text-xs font-bold flex items-center group-hover:translate-x-1 transition-transform uppercase tracking-wide">
                                            Read More <ArrowRight size={14} className="ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default Blog;
