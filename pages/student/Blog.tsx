import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { BlogPost, Folder } from '../../types';
import { BookOpen, User, Calendar, ArrowRight, Folder as FolderIcon, ArrowLeft, FolderOpen, Eye } from 'lucide-react';

interface BlogProps {
    folders: Folder[];
    blogs: BlogPost[];
    onViewBlog?: (blogId: string) => void;
}

const Blog: React.FC<BlogProps> = ({ folders, blogs, onViewBlog }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);

  const handleReadBlog = (blog: BlogPost) => {
      setReadingBlog(blog);
      if (onViewBlog) {
          onViewBlog(blog.id);
      }
  };

  // VIEW 1: FOLDER LIST
  if (!selectedFolderId) {
      return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <BookOpen className="mr-3 text-indigo-600" size={28} />
                Educational Blog Categories
                </h1>
            </div>

            {folders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <p>No blog categories available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {folders.map(folder => {
                        const count = blogs.filter(b => b.folderId === folder.id).length;
                        return (
                            <Card 
                                key={folder.id} 
                                className="cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all group"
                            >
                                <div onClick={() => setSelectedFolderId(folder.id)} className="text-center p-4">
                                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FolderIcon size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{folder.name}</h3>
                                    <p className="text-sm text-slate-500 mb-3">{folder.description}</p>
                                    <Badge color="bg-slate-100 text-slate-600">{count} Articles</Badge>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
      );
  }

  // VIEW 2: BLOG LIST IN FOLDER
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const folderBlogs = blogs.filter(b => b.folderId === selectedFolderId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="mr-4 bg-white">
            <ArrowLeft size={16} />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <FolderOpen className="mr-3 text-indigo-600" size={28} />
                {currentFolder?.name}
            </h1>
            <p className="text-slate-500 text-sm">{folderBlogs.length} articles found</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folderBlogs.length === 0 ? (
           <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              No blog posts available in this category yet.
           </div>
        ) : (
          folderBlogs.map(blog => (
            <Card key={blog.id} className="flex flex-col h-full overflow-hidden p-0 hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden bg-slate-200">
                <img 
                  src={blog.thumbnail} 
                  alt={blog.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  {blog.tags.map(tag => (
                    <Badge key={tag} color="bg-indigo-50 text-indigo-600">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                
                <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-1">
                  {blog.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center">
                    <User size={12} className="mr-1" /> {blog.author}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center"><Eye size={12} className="mr-1" /> {blog.views || 0}</span>
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {blog.date}</span>
                  </div>
                </div>
                
                <Button 
                    variant="outline" 
                    className="w-full mt-4 flex items-center justify-center group"
                    onClick={() => handleReadBlog(blog)}
                >
                  Read Article <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* BLOG READING MODAL */}
      {readingBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                  {/* Header */}
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

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                      <div className="w-full h-64 md:h-80 bg-slate-200">
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

                          {/* Tags Footer */}
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
      )}
    </div>
  );
};

export default Blog;