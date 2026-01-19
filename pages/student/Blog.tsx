
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { BookOpen, User, Calendar, ArrowRight, Folder as FolderIcon, ArrowLeft, FolderOpen, Eye, Home, ChevronRight, ArrowUp, Newspaper, Lock, Crown } from 'lucide-react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

interface BlogProps {
    folders: Folder[];
    blogs: BlogPost[];
    onViewBlog?: (blogId: string) => void;
}

const Blog: React.FC<BlogProps> = ({ folders, blogs, onViewBlog }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);

  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isPro = user?.subscription?.status === 'ACTIVE';

  const displayedFolders = folders.filter(f => (currentFolderId === null && !f.parentId) || f.parentId === currentFolderId);
  const displayedBlogs = blogs.filter(b => b.folderId === (currentFolderId || 'root_unsupported'));

  const handleReadBlog = (blog: BlogPost) => {
      if (blog.isPremium && !isPro) {
          if(confirm("Premium Article. Upgrade to read?")) navigate('/student/subscription');
          return;
      }
      setReadingBlog(blog);
      if (onViewBlog) onViewBlog(blog.id);
  };

  if (readingBlog) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-white md:bg-black/80 backdrop-blur-sm animate-fade-in">
              <SEO title={readingBlog.title} description={readingBlog.excerpt} type="article" />
              <div className="bg-white md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[95vh] flex flex-col overflow-hidden relative">
                  <button onClick={() => setReadingBlog(null)} className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur p-2 rounded-full shadow-md hover:bg-white transition-all">
                      <ArrowLeft size={24} className="text-slate-800" />
                  </button>

                  <div className="flex-1 overflow-y-auto">
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
                          <div className="prose prose-lg prose-pink text-slate-700 leading-loose first-letter:text-5xl first-letter:font-bold first-letter:text-pink-600 first-letter:float-left first-letter:mr-3">
                              {readingBlog.content}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        <SEO title="Knowledge Hub" description="Explore articles and tips." />
        
        {/* HEADER */}
        <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600 rounded-full blur-[100px] opacity-50 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-40 -ml-10 -mb-10"></div>
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Knowledge <span className="text-pink-400">Hub</span></h1>
                <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                    Dive into a world of wisdom. Curated articles, study tips, and educational insights to fuel your learning journey.
                </p>
            </div>
        </div>

        {/* CATEGORY NAV */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <button 
                onClick={() => setCurrentFolderId(null)}
                className={`flex items-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${currentFolderId === null ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
                <Home size={16} className="mr-2" /> All Topics
            </button>
            {displayedFolders.map(folder => (
                <button 
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="flex items-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm"
                >
                    {folder.name}
                </button>
            ))}
        </div>

        {/* BLOG GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayedBlogs.map(blog => (
                <div 
                    key={blog.id} 
                    onClick={() => handleReadBlog(blog)}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                    <div className="relative h-56 overflow-hidden">
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
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex gap-2 mb-3">
                            {blog.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 leading-snug group-hover:text-pink-600 transition-colors">
                            {blog.title}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                            {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                            <div className="flex items-center text-xs font-bold text-slate-500">
                                <User size={14} className="mr-1.5" /> {blog.author}
                            </div>
                            <span className="text-pink-600 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                Read Article <ArrowRight size={16} className="ml-1" />
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {displayedBlogs.length === 0 && (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                <Newspaper size={48} className="mx-auto mb-4 opacity-20" />
                <p>No articles found in this category.</p>
            </div>
        )}
    </div>
  );
};

export default Blog;
