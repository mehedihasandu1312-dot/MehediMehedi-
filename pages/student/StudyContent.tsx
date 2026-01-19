
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { Folder, StudyContent, ContentType, MCQQuestion } from '../../types';
import { Folder as FolderIcon, FileText, CheckSquare, AlertTriangle, ArrowLeft, CheckCircle2, Bookmark, Flag, X, Lock, Crown, Calendar, UserCheck, BookOpen, ChevronDown, ChevronUp, Search, Library } from 'lucide-react';
import AdBanner from '../../components/AdBanner'; 
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO'; 
import ShareTools from '../../components/ShareTools';

interface StudyContentPageProps {
    folders: Folder[];
    contents: StudyContent[];
    onAppealSubmit?: (data: { contentId: string; contentTitle: string; text: string; image?: string }) => void;
}

// Modern Gradient Palette for Folders
const getGradientClass = (index: number) => {
    const gradients = [
        'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-indigo-200',
        'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-200',
        'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200',
        'bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-200',
        'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-200',
        'bg-gradient-to-br from-fuchsia-600 to-purple-600 shadow-purple-200',
    ];
    return gradients[index % gradients.length];
};

const StudyContentPage: React.FC<StudyContentPageProps> = ({ folders, contents, onAppealSubmit }) => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedContent, setSelectedContent] = useState<StudyContent | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Appeal State
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealTarget, setAppealTarget] = useState<{ id: string, title: string } | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealImage, setAppealImage] = useState<string>(''); 

  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isPro = user?.subscription?.status === 'ACTIVE';

  const getDisplayQuestions = (content: StudyContent): MCQQuestion[] => {
    if (content.questionList && content.questionList.length > 0) {
      return content.questionList;
    }
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `demo_q_${i}`,
      questionText: `This is a sample question #${i + 1}.`,
      options: ["Option A", "Correct Answer", "Option C", "Option D"],
      correctOptionIndex: 1
    }));
  };

  const generateFAQs = (title: string, folderName: string) => [
      { question: `What is covered in ${title}?`, answer: `This material covers key concepts of ${title} for ${folderName}.` },
      { question: `Is this helpful for exams?`, answer: `Yes, "${title}" is designed for exam preparation.` },
      { question: `Can I download as PDF?`, answer: `Premium users may have download options.` }
  ];

  const openAppealModal = (id: string, title: string) => {
    setAppealTarget({ id, title });
    setAppealText('');
    setAppealImage('');
    setIsAppealModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) setAppealImage(event.target.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appealTarget && onAppealSubmit) {
        onAppealSubmit({
            contentId: appealTarget.id,
            contentTitle: appealTarget.title,
            text: appealText,
            image: appealImage || undefined
        });
        setIsAppealModalOpen(false);
        setAppealTarget(null);
    }
  };

  const handleContentClick = (item: StudyContent) => {
      if (item.isPremium && !isPro) {
          if (confirm("This content is Premium. Would you like to upgrade?")) {
              navigate('/student/subscription');
          }
          return;
      }
      setSelectedContent(item);
      window.scrollTo(0,0);
  };

  const displayFolders = folders.filter(f => !f.type || f.type === 'CONTENT');
  const filteredContents = contents.filter(c => c.folderId === selectedFolder?.id && !c.isDeleted && c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- DYNAMIC SEO ---
  const seoData = useMemo(() => {
      if (selectedContent) {
          const isMCQ = selectedContent.type === ContentType.MCQ;
          const folderName = selectedFolder?.name || "General";
          return {
              title: `${selectedContent.title} - ${folderName}`,
              desc: `Study ${selectedContent.title} on EduMaster.`,
              keywords: [selectedContent.title, folderName],
              type: isMCQ ? 'website' : 'article',
              breadcrumbs: [
                  { name: 'Home', url: '/' },
                  { name: 'Library', url: '/#/student/content' },
                  { name: selectedContent.title, url: `/#` }
              ],
              modifiedTime: new Date().toISOString()
          };
      }
      return { title: "Study Library", desc: "Access premium study materials.", type: 'website' };
  }, [selectedContent, selectedFolder]);

  // --- COMPONENT: FOLDER GRID ---
  const FolderList = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-slide-up">
      {displayFolders.map((folder, index) => {
        const itemCount = contents.filter(c => c.folderId === folder.id).length;
        
        return (
            <div 
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
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

                <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-bold leading-tight mb-2 drop-shadow-md font-sans tracking-tight">
                        {folder.name}
                    </h3>
                    <p className="text-white/80 text-xs md:text-sm font-medium line-clamp-2">
                        {folder.description || 'Access notes & materials'}
                    </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 group-hover:bg-white/30 transition-colors">
                        <FileText size={12} className="text-white" />
                        <span>{itemCount} Files</span>
                    </div>
                    
                    <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white text-white hover:text-indigo-600 transition-all shadow-sm">
                        <ArrowLeft className="rotate-180" size={16} />
                    </span>
                </div>
            </div>
        );
      })}
    </div>
  );

  // --- COMPONENT: CONTENT LIST ---
  const ContentList = () => {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center">
                <Button variant="ghost" onClick={() => setSelectedFolder(null)} className="mr-2 rounded-full w-10 h-10 p-0 flex items-center justify-center hover:bg-slate-100">
                    <ArrowLeft size={20} className="text-slate-600" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        {selectedFolder?.icon && <img src={selectedFolder.icon} alt="icon" className="w-6 h-6 mr-2 object-contain" />}
                        {selectedFolder?.name}
                    </h2>
                    <p className="text-xs text-slate-500">Browsing files</p>
                </div>
            </div>
            
            <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search files..." 
                    className="w-full pl-10 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Empty State */}
        {filteredContents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-600">No Content Found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or come back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredContents.map(item => {
                const isLocked = item.isPremium && !isPro;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleContentClick(item)}
                    className={`group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl transition-all cursor-pointer hover:shadow-lg hover:border-indigo-100 hover:translate-y-[-2px] ${isLocked ? 'opacity-90' : ''}`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${
                          isLocked ? 'bg-amber-100 text-amber-600' :
                          item.type === ContentType.WRITTEN ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 
                          'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                      }`}>
                        {isLocked ? <Lock size={24} /> : (item.type === ContentType.WRITTEN ? <FileText size={24} /> : <CheckSquare size={24} />)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-lg leading-tight group-hover:text-indigo-700 transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                                {item.title}
                            </h4>
                            {item.isPremium && (
                                <Badge color="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                                    <Crown size={10} fill="currentColor"/> PRO
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center mt-1.5 space-x-3 text-xs text-slate-500 font-medium">
                            <span className="uppercase tracking-wider">{item.type === ContentType.WRITTEN ? 'PDF Note' : 'Quiz'}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{item.type === ContentType.WRITTEN ? 'Read Only' : `${item.questions || '?'} Questions`}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                      {isLocked ? <Lock size={18} /> : <ArrowLeft className="rotate-180" size={18} />}
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-10">
      <SEO 
        title={seoData.title}
        description={seoData.desc}
        keywords={seoData.keywords}
        type={seoData.type as any}
        breadcrumbs={seoData.breadcrumbs}
        modifiedTime={seoData.modifiedTime}
      />

      {!selectedContent && (
        <div className="mb-8">
            {/* HERO SECTION */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-pink-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center space-x-2 text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2">
                        <Library size={14} />
                        <span>Knowledge Base</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
                        Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">Material</span>
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                        Access comprehensive notes, question banks, and suggestions tailored for your success.
                    </p>
                </div>
                
                <div className="relative z-10 mt-6 md:mt-0">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center space-x-3">
                        <div className="text-left">
                            <span className="block text-xs text-slate-400 uppercase font-bold">Total Resources</span>
                            <span className="block text-2xl font-bold">{contents.length}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-700"></div>
                        <div className="text-left">
                            <span className="block text-xs text-slate-400 uppercase font-bold">Categories</span>
                            <span className="block text-2xl font-bold">{displayFolders.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {!selectedFolder ? <FolderList /> : <ContentList />}

      {/* CONTENT READER VIEW */}
      {selectedContent && (
        <div className="max-w-4xl mx-auto pb-10">
          <div className="flex items-center justify-between mb-6 sticky top-4 z-20 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200/50 shadow-sm">
             <Button variant="ghost" onClick={() => setSelectedContent(null)} className="flex items-center text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                <ArrowLeft size={18} className="mr-2" /> Back to Folder
              </Button>
              <div className="text-sm font-bold text-slate-800 line-clamp-1">{selectedContent.title}</div>
          </div>

          {selectedContent.type === ContentType.WRITTEN && (
            <div className="animate-fade-in space-y-6">
                <article className="bg-white rounded-none md:rounded-3xl shadow-xl border border-slate-100 min-h-[80vh] relative overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full"></div>
                    
                    <div className="p-6 md:p-12 pb-24">
                        <header className="border-b border-slate-100 pb-8 mb-8">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge color="bg-indigo-50 text-indigo-700 border-indigo-100">READING MATERIAL</Badge>
                                <Badge color="bg-slate-100 text-slate-600">{selectedFolder?.name}</Badge>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 font-sans tracking-tight leading-tight">{selectedContent.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                                <span className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                    <UserCheck size={16} className="mr-2" /> Verified by EduMaster
                                </span>
                                <span className="flex items-center">
                                    <Calendar size={16} className="mr-2 text-slate-400" /> Updated Today
                                </span>
                                <span className="flex items-center">
                                    <BookOpen size={16} className="mr-2 text-slate-400" /> 5 min read
                                </span>
                            </div>
                        </header>

                        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <h3 className="font-bold text-indigo-900 mb-4 flex items-center text-lg">
                                <Bookmark className="text-indigo-600 mr-2" size={20} fill="currentColor" />
                                Key Highlights
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-800 list-disc list-inside marker:text-indigo-400">
                                <li>Comprehensive overview of {selectedContent.title}</li>
                                <li>Key definitions and important formulas</li>
                                <li>Exam-oriented explanations and examples</li>
                                <li>Prepared by expert instructors for {selectedFolder?.name}</li>
                            </ul>
                        </section>

                        <div className="prose prose-lg prose-slate max-w-none font-serif leading-loose text-slate-700">
                             {selectedContent.body?.split('\n').map((paragraph, idx) => (
                                 <p key={idx} className="mb-6">{paragraph}</p>
                             ))}
                             {(!selectedContent.body || selectedContent.body.length < 50) && (
                                 <div className="text-slate-400 italic bg-slate-50 p-12 text-center rounded-2xl border-2 border-dashed border-slate-200">
                                     [Content is currently being updated by the administrator]
                                 </div>
                             )}
                        </div>
                        
                        <div className="my-12">
                            <AdBanner slotId="CONTENT_BODY_AD" />
                        </div>

                        {/* SEO Backlink Tools */}
                        <ShareTools title={selectedContent.title} type="NOTE" />

                        {/* FAQs */}
                        <section className="mt-16 pt-10 border-t border-slate-100">
                            <h3 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                {generateFAQs(selectedContent.title, selectedFolder?.name || 'Exam').map((faq, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-indigo-200">
                                        <button 
                                            onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                                            className="w-full flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <span className="font-bold text-slate-800 text-base">{faq.question}</span>
                                            {faqOpen === idx ? <ChevronUp size={20} className="text-indigo-600"/> : <ChevronDown size={20} className="text-slate-400"/>}
                                        </button>
                                        {faqOpen === idx && (
                                            <div className="p-5 bg-slate-50 text-slate-600 leading-relaxed border-t border-slate-100 text-sm">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </article>

                <div className="flex justify-center mt-8">
                    <button 
                        onClick={() => openAppealModal(selectedContent.id, `Document: ${selectedContent.title}`)}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-red-200 shadow-sm"
                    >
                        <Flag size={16} className="mr-2" /> Report Issue
                    </button>
                </div>
            </div>
          )}

          {selectedContent.type === ContentType.MCQ && (
              <div className="space-y-8 animate-fade-in pb-10">
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                      <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-4 opacity-90">
                              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                                  <CheckSquare size={14} className="mr-2" /> MCQ Quiz
                              </span>
                          </div>
                          <h1 className="text-3xl md:text-4xl font-black mb-4">{selectedContent.title}</h1>
                          <p className="text-indigo-100 text-lg max-w-2xl">
                              Test your knowledge on {selectedContent.title}. Review the questions below to prepare for your exams.
                          </p>
                      </div>
                  </div>

                  {getDisplayQuestions(selectedContent).map((q, index) => (
                      <Card key={q.id || index} className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                          <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-start gap-4">
                              <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-900 text-white font-bold rounded-xl text-lg shadow-md">
                                  {index + 1}
                              </span>
                              <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug pt-1">
                                  {q.questionText}
                              </h3>
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {q.options.map((opt, optIdx) => {
                                  const isCorrect = q.correctOptionIndex === optIdx;
                                  return (
                                      <div 
                                        key={optIdx} 
                                        className={`relative p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                                            isCorrect 
                                            ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                      >
                                          <div className="flex items-center gap-4">
                                              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border transition-colors ${
                                                  isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-500 border-slate-200'
                                              }`}>
                                                  {String.fromCharCode(65 + optIdx)}
                                              </span>
                                              <span className={`text-base font-medium ${isCorrect ? 'text-emerald-900' : ''}`}>
                                                  {opt}
                                              </span>
                                          </div>
                                          
                                          {isCorrect && (
                                              <div className="text-emerald-600">
                                                  <CheckCircle2 size={24} fill="currentColor" className="text-white bg-emerald-500 rounded-full" />
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                          
                          <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
                              <button 
                                onClick={() => openAppealModal(q.id, `Question #${index+1}: ${q.questionText.substring(0, 30)}...`)}
                                className="flex items-center text-xs font-bold text-slate-400 hover:text-amber-600 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                              >
                                  <AlertTriangle size={14} className="mr-2" /> Report Error
                              </button>
                          </div>
                      </Card>
                  ))}
                  
                  {/* Share/Backlink Tool for Quiz */}
                  <ShareTools title={`${selectedContent.title} (MCQ Set)`} type="NOTE" />

                  <div className="text-center mt-12 pb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                          <Bookmark size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">You've reached the end!</h3>
                      <p className="text-slate-500">Practice makes perfect.</p>
                  </div>
                  
                  <AdBanner slotId="STUDY_MCQ_BOTTOM_AD" />
              </div>
          )}
        </div>
      )}

      {/* Appeal Modal */}
      <Modal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} title="Submit Report">
        <form onSubmit={handleAppealSubmit}>
          <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-sm mb-5 flex items-start border border-amber-200">
             <AlertTriangle size={20} className="mr-3 mt-0.5 shrink-0 text-amber-600" />
             <div>
                 <span className="font-bold block mb-1">You are reporting:</span>
                 <span className="block font-medium">{appealTarget?.title}</span>
             </div>
          </div>
          
          <label className="block text-sm font-bold text-slate-700 mb-2">Describe the issue</label>
          <textarea required className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-5 text-sm" placeholder="e.g. The answer to question 5 seems incorrect because..." value={appealText} onChange={(e) => setAppealText(e.target.value)} />
          
          <div className="mb-6">
             <label className="block text-sm font-bold text-slate-700 mb-2">Attach Screenshot (Optional)</label>
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                 <span className="text-sm text-slate-500 pointer-events-none">Click to upload image</span>
             </div>
             {appealImage && (
                 <div className="mt-3 relative inline-block">
                     <img src={appealImage} alt="preview" className="h-24 rounded-lg border border-slate-200 shadow-sm" />
                     <button type="button" onClick={() => setAppealImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><X size={14} /></button>
                 </div>
             )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsAppealModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudyContentPage;
