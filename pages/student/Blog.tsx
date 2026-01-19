
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

  const currentFolder = folders.find(f => f.id === currentFolderId);

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

  const handleReadBlog = (blog: BlogPost) => {
      // PREMIUM CHECK
      if (blog.isPremium && !isPro) {
          if(confirm("This article is for Premium Subscribers only. Upgrade now to read?")) {
              navigate('/student/subscription');
          }
          return;
      }

      setReadingBlog(blog);
      if (onViewBlog) {
          onViewBlog(blog.id);
      }
  };

  const handleNavigateUp = () => {
      if (currentFolder?.parentId) {
          setCurrentFolderId(currentFolder.parentId);
      } else {
          setCurrentFolderId(null);
      }
  };

  if (readingBlog) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              {/* ADVANCED SEO: ARTICLE SCHEMA FOR GOOGLE NEWS/DISCOVER */}
              <SEO 
                title={readingBlog.title} 
                description={readingBlog.excerpt} 
                image={readingBlog.thumbnail} 
                type="article"
                author={readingBlog.author}
                publishedTime={readingBlog.date}
                modifiedTime={new Date().toISOString()} // Signal freshness
                keywords={readingBlog.tags}
                breadcrumbs={[
                    { name: 'Home', url: '/' },
                    { name: 'Blog', url: '/#/student/blog' },
                    { name: currentFolder?.name || 'Category', url: '/#/student/blog' },
                    { name: readingBlog.title, url: `/#/student/blog?id=${readingBlog.id}` }
                ]}
              />
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                      <div className="flex items-center space-x-3">
                          <Badge color="bg-indigo-100 text-indigo-700">BLOG</Badge>
                          <span className="text-slate-400 text-sm border-l border-slate-200 pl-3">
                              {currentFolder?.name}
                          </span>
                      </div>
                      <button onClick={() => setReadingBlog(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                          <ArrowLeft size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                      <div className="w-full h-64 md:h-80 bg-slate-200 relative">
                          <img src={readingBlog.thumbnail} alt={readingBlog.title} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="p-8 md:p-12 max-w-3xl mx-auto">
                          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">{readingBlog.title}</h1>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
                              <span className="flex items-center bg-slate-50 px-3 py-1 rounded-full"><User size={14} className="mr-2 text-indigo-500"/> {readingBlog.author}</span>
                              <span className="flex items-center"><Calendar size={14} className="mr-2 text-indigo-500"/> {readingBlog.date}</span>
                              <span className="flex items-center"><Eye size={14} className="mr-2 text-indigo-500"/> {((readingBlog.views || 0) + 1).toLocaleString()} Reads</span>
                          </div>

                          <div className="prose prose-lg prose-indigo text-slate-700 leading-loose">
                              <p className="font-semibold text-xl text-slate-800 mb-6 italic border-l-4 border-indigo-500 pl-4">{readingBlog.excerpt}</p>
                              <div className="whitespace-pre-wrap">{readingBlog.content}</div>
                          </div>

                          <div className="mt-12 pt-6 border-t border-slate-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Related Topics</h4>
                              <div className="flex gap-2">
                                  {readingBlog.tags.map(tag => (
                                      <Badge key={tag} color="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">#{tag}</Badge>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <SEO 
            title="Educational Blog" 
            description="Read insightful articles, tips, and guides from EduMaster Pro." 
            type="website"
            breadcrumbs={[
                { name: 'Home', url: '/' },
                { name: 'Blog', url: '/#/student/blog' }
            ]}
        />
        
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <BookOpen className="mr-3 text-indigo-600" size={28} />
            Educational Blog
            </h1>
        </div>

        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 overflow-x-auto">
            {currentFolderId !== null && (
                <button 
                    onClick={handleNavigateUp}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 mr-2 transition-colors shrink-0"
                    title="Go Up"
                >
                    <ArrowUp size={16} />
                </button>
            )}

            <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg w-full shadow-sm">
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

        {displayedFolders.length > 0 && (
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <FolderIcon size={14} className="mr-1"/> Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedFolders.map(folder => {
                        const subCount = folders.filter(f => f.parentId === folder.id).length + blogs.filter(b => b.folderId === folder.id).length;
                        return (
                            <div 
                                key={folder.id} 
                                onClick={() => setCurrentFolderId(folder.id)}
                                className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all flex flex-col items-center text-center"
                            >
                                <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FolderOpen size={24} />
                                </div>
                                <h3 className="font-bold text-slate-700 text-sm mb-1">{folder.name}</h3>
                                <Badge color="bg-slate-100 text-slate-500 text-[10px]">{subCount} Items</Badge>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div>
            {displayedFolders.length > 0 && displayedBlogs.length > 0 && (
                <div className="border-t border-slate-100 my-6"></div>
            )}
            
            {(displayedBlogs.length > 0 || currentFolderId !== null) && (
                 <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <Newspaper size={14} className="mr-1"/> Articles
                </h3>
            )}

            {displayedBlogs.length === 0 ? (
                currentFolderId !== null && displayedFolders.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <p>No content available in this folder yet.</p>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedBlogs.map(blog => {
                        const isLocked = blog.isPremium && !isPro;
                        return (
                            <Card 
                                key={blog.id} 
                                className={`flex flex-col h-full overflow-hidden p-0 hover:shadow-lg transition-all group cursor-pointer ${isLocked ? 'opacity-80 hover:opacity-100' : ''}`}
                                onClick={() => !isLocked && handleReadBlog(blog)} // Only click if unlocked, otherwise button handles it
                            >
                                <div className="h-48 overflow-hidden bg-slate-200 relative">
                                    {blog.isPremium && (
                                        <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 flex items-center">
                                            <Crown size={10} className="mr-1" fill="currentColor"/> PREMIUM
                                        </div>
                                    )}
                                    <img 
                                        src={blog.thumbnail} 
                                        alt={blog.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                                                <Lock className="text-white" size={32} />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm flex items-center">
                                        <Eye size={10} className="mr-1"/> {blog.views?.toLocaleString() || 0}
                                    </div>
                                </div>
                                
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {blog.tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} color="bg-indigo-50 text-indigo-600">#{tag}</Badge>
                                        ))}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {blog.title}
                                    </h3>
                                    
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-1">
                                        {blog.excerpt}
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center text-xs text-slate-500">
                                            <User size={12} className="mr-1" /> {blog.author}
                                        </div>
                                        <Button 
                                            variant={isLocked ? 'outline' : 'outline'}
                                            size="sm"
                                            className={`text-xs transition-all ${isLocked ? 'border-amber-400 text-amber-600 hover:bg-amber-50' : 'group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReadBlog(blog);
                                            }}
                                        >
                                            {isLocked ? (
                                                <span className="flex items-center"><Lock size={10} className="mr-1"/> Unlock</span>
                                            ) : (
                                                <span className="flex items-center">Read <ArrowRight size={12} className="ml-1" /></span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
        
        {currentFolderId === null && displayedFolders.length === 0 && displayedBlogs.length === 0 && (
             <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>Welcome to the Blog! Categories will appear here soon.</p>
            </div>
        )}
    </div>
  );
};

export default Blog;
