
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { Folder, StudyContent, ContentType, MCQQuestion } from '../../types';
import { Folder as FolderIcon, FileText, CheckSquare, AlertTriangle, ArrowLeft, CheckCircle2, Bookmark, Flag, X, Lock, Crown, Calendar, UserCheck, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../../components/AdBanner'; 
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO'; 
import ShareTools from '../../components/ShareTools'; // NEW IMPORT

interface StudyContentPageProps {
    folders: Folder[];
    contents: StudyContent[];
    onAppealSubmit?: (data: { contentId: string; contentTitle: string; text: string; image?: string }) => void;
}

// Helper for deterministic gradient colors
const getGradientClass = (index: number) => {
    const gradients = [
        'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-200',       // Red
        'bg-gradient-to-br from-amber-500 to-orange-700 shadow-orange-200', // Orange/Gold
        'bg-gradient-to-br from-lime-500 to-green-700 shadow-lime-200',    // Green
        'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-200', // Teal
        'bg-gradient-to-br from-blue-500 to-indigo-700 shadow-blue-200',    // Blue
        'bg-gradient-to-br from-violet-500 to-purple-700 shadow-purple-200', // Purple
        'bg-gradient-to-br from-fuchsia-600 to-pink-700 shadow-pink-200',   // Pink
    ];
    return gradients[index % gradients.length];
};

const StudyContentPage: React.FC<StudyContentPageProps> = ({ folders, contents, onAppealSubmit }) => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedContent, setSelectedContent] = useState<StudyContent | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0); // Default open first FAQ
  
  // Appeal State
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealTarget, setAppealTarget] = useState<{ id: string, title: string } | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealImage, setAppealImage] = useState<string>(''); 

  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isPro = user?.subscription?.status === 'ACTIVE';

  // --- HELPER: Generate Dummy Questions ---
  const getDisplayQuestions = (content: StudyContent): MCQQuestion[] => {
    if (content.questionList && content.questionList.length > 0) {
      return content.questionList;
    }
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `demo_q_${i}`,
      questionText: `This is a sample question #${i + 1} for '${content.title}'. In a real scenario, the admin enters this text.`,
      options: [
        "This is an incorrect option",
        "This is the CORRECT answer",
        "Another distraction option",
        "Totally wrong answer"
      ],
      correctOptionIndex: 1
    }));
  };

  // --- HELPER: Generate Smart FAQs for SEO ---
  const generateFAQs = (title: string, folderName: string) => [
      {
          question: `What is covered in ${title}?`,
          answer: `This study material covers all key concepts of ${title}, including important definitions, formulas, and explanations suitable for ${folderName} students.`
      },
      {
          question: `Is this content helpful for exams?`,
          answer: `Yes, "${title}" is designed specifically for exam preparation, focusing on common questions and critical topics required for high scores.`
      },
      {
          question: `Can I download ${title} as PDF?`,
          answer: `Currently, you can read this content online. Premium users may have options to download offline resources via the EduMaster app.`
      }
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
              if (event.target?.result) {
                  setAppealImage(event.target.result as string);
              }
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
    } else {
        alert(`Appeal submitted for: ${appealTarget?.title}\nIssue: ${appealText}`);
        setIsAppealModalOpen(false);
        setAppealTarget(null);
    }
  };

  const handleContentClick = (item: StudyContent) => {
      if (item.isPremium && !isPro) {
          if (confirm("This content is Premium. Would you like to upgrade your plan?")) {
              navigate('/student/subscription');
          }
          return;
      }
      setSelectedContent(item);
      window.scrollTo(0,0);
  };

  const displayFolders = folders.filter(f => !f.type || f.type === 'CONTENT');

  // --- DYNAMIC SEO LOGIC ---
  const seoData = useMemo(() => {
      if (selectedContent) {
          const isMCQ = selectedContent.type === ContentType.MCQ;
          const folderName = selectedFolder?.name || "General";
          const generatedFAQs = generateFAQs(selectedContent.title, folderName);
          
          const activeSchema: any[] = [];

          // 1. FAQ Schema
          activeSchema.push({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": generatedFAQs.map(f => ({
                  "@type": "Question",
                  "name": f.question,
                  "acceptedAnswer": {
                      "@type": "Answer",
                      "text": f.answer
                  }
              }))
          });

          if (isMCQ) {
              const questions = getDisplayQuestions(selectedContent);
              activeSchema.push({
                  "@context": "https://schema.org",
                  "@type": "Quiz",
                  "name": selectedContent.title,
                  "description": `Online MCQ test for ${selectedContent.title}.`,
                  "hasPart": questions.slice(0, 5).map(q => ({
                      "@type": "Question",
                      "name": q.questionText,
                      "acceptedAnswer": { "@type": "Answer", "text": q.options[q.correctOptionIndex] }
                  }))
              });
          } else {
              activeSchema.push({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  "headline": selectedContent.title,
                  "author": { "@type": "Organization", "name": "EduMaster Team" },
                  "datePublished": new Date().toISOString(),
                  "dateModified": new Date().toISOString(),
                  "publisher": {
                      "@type": "Organization",
                      "name": "EduMaster Pro",
                      "logo": { "@type": "ImageObject", "url": window.location.origin + "/vite.svg" }
                  }
              });
          }

          return {
              title: `${selectedContent.title} - ${folderName} | EduMaster`,
              desc: isMCQ 
                  ? `Take free online MCQ test on ${selectedContent.title}. Important questions for ${folderName} exams.`
                  : `Read detailed notes on ${selectedContent.title}. Best study material for ${folderName} students.`,
              keywords: [selectedContent.title, folderName, "Study Notes", "Bangla Suggestion", "Exam Prep"],
              type: isMCQ ? 'website' : 'article',
              schema: activeSchema,
              breadcrumbs: [
                  { name: 'Home', url: '/' },
                  { name: 'Study Content', url: '/#/student/content' },
                  { name: folderName, url: '/#/student/content' },
                  { name: selectedContent.title, url: `/#/student/content?id=${selectedContent.id}` }
              ],
              modifiedTime: new Date().toISOString()
          };
      } 
      
      if (selectedFolder) {
          return {
              title: `${selectedFolder.name} Notes & Suggestions`,
              desc: `Access all study materials, notes, and question banks for ${selectedFolder.name}. Updated for current syllabus.`,
              keywords: [selectedFolder.name, "Syllabus", "Notes", "PDF"],
              type: 'course',
              breadcrumbs: [
                  { name: 'Home', url: '/' },
                  { name: 'Study Content', url: '/#/student/content' },
                  { name: selectedFolder.name, url: `/#/student/content` }
              ]
          };
      }

      return {
          title: "Study Material Library - Best Education Resources",
          desc: "EduMaster Pro Library: Access thousands of notes, PDF suggestions, and quizzes for Class 6 to Masters.",
          keywords: ["Study Library", "Free Notes", "Education BD"],
          type: 'website'
      };
  }, [selectedContent, selectedFolder]);


  const FolderList = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {displayFolders.map((folder, index) => {
        const itemCount = contents.filter(c => c.folderId === folder.id).length;
        
        return (
            <div 
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`relative overflow-hidden rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg h-40 md:h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white`}
            >
                <div className="absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 opacity-20 transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500 pointer-events-none">
                    {folder.icon ? (
                        <img src={folder.icon} className="w-24 h-24 md:w-40 md:h-40 object-contain drop-shadow-md grayscale invert brightness-200" alt="" />
                    ) : (
                        <FolderIcon className="w-24 h-24 md:w-40 md:h-40" fill="currentColor" />
                    )}
                </div>

                <div className="relative z-10">
                    <h3 className="text-base md:text-2xl font-bold leading-tight mb-1 md:mb-2 drop-shadow-sm font-serif tracking-wide line-clamp-2">
                        {folder.name}
                    </h3>
                    <p className="text-white/90 text-xs md:text-sm font-medium line-clamp-1 md:line-clamp-2">
                        {folder.description || 'Lecture Notes & Materials'}
                    </p>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1 md:space-x-2 bg-black/20 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border border-white/10 hover:bg-black/30 transition-colors">
                        <FileText size={12} className="text-white/90" />
                        <span>{itemCount}</span>
                    </div>
                    
                    <span className="flex items-center text-xs font-bold bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors group-hover:translate-x-1 duration-300">
                        <ArrowLeft className="rotate-180" size={14} />
                    </span>
                </div>
            </div>
        );
      })}
    </div>
  );

  const ContentList = () => {
    const items = contents.filter(c => c.folderId === selectedFolder?.id && !c.isDeleted);

    if (selectedContent) {
      return (
        <div className="max-w-4xl mx-auto pb-10">
          <div className="flex items-center justify-between mb-6">
             <Button variant="outline" onClick={() => setSelectedContent(null)} className="flex items-center text-sm bg-white border-slate-300 hover:bg-slate-50">
                <ArrowLeft size={16} className="mr-2" /> Back to Folder
              </Button>
          </div>

          {selectedContent.type === ContentType.WRITTEN && (
            <div className="animate-fade-in space-y-6">
                <article className="bg-white rounded-none md:rounded-xl shadow-xl border border-slate-200 min-h-[80vh] relative overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 w-full"></div>
                    
                    <div className="p-6 md:p-12 pb-24">
                        <header className="border-b-2 border-slate-100 pb-6 mb-8">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge color="bg-blue-50 text-blue-700 border-blue-100">READING MATERIAL</Badge>
                                <Badge color="bg-slate-100 text-slate-600">{selectedFolder?.name}</Badge>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 font-serif leading-tight">{selectedContent.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="flex items-center text-indigo-700">
                                    <UserCheck size={16} className="mr-1.5" /> Verified by EduMaster
                                </span>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <span className="flex items-center">
                                    <Calendar size={16} className="mr-1.5" /> Updated: {new Date().toLocaleDateString()}
                                </span>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <span className="flex items-center">
                                    <BookOpen size={16} className="mr-1.5" /> 5 min read
                                </span>
                            </div>
                        </header>

                        <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-8">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center">
                                <Bookmark className="text-blue-500 mr-2" size={18} fill="currentColor" />
                                Key Highlights
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 list-disc list-inside">
                                <li>Comprehensive overview of {selectedContent.title}</li>
                                <li>Key definitions and important formulas</li>
                                <li>Exam-oriented explanations and examples</li>
                                <li>Prepared by expert instructors for {selectedFolder?.name}</li>
                            </ul>
                        </section>

                        <div className="prose prose-lg prose-slate max-w-none font-serif leading-loose text-slate-700">
                             {selectedContent.body?.split('\n').map((paragraph, idx) => (
                                 <p key={idx} className="mb-4">{paragraph}</p>
                             ))}
                             {(!selectedContent.body || selectedContent.body.length < 50) && (
                                 <div className="text-slate-400 italic bg-slate-50 p-8 text-center rounded-lg">
                                     [Content is being updated by the administrator]
                                 </div>
                             )}
                        </div>
                        
                        <div className="my-8">
                            <AdBanner slotId="CONTENT_BODY_AD" />
                        </div>

                        {/* --- AUTO BACKLINK GENERATOR --- */}
                        <ShareTools title={selectedContent.title} type="NOTE" />

                        <section className="mt-12 pt-8 border-t border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h3>
                            <div className="space-y-3">
                                {generateFAQs(selectedContent.title, selectedFolder?.name || 'Exam').map((faq, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <button 
                                            onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                                            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                                        >
                                            <span className="font-bold text-slate-700 text-sm">{faq.question}</span>
                                            {faqOpen === idx ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                                        </button>
                                        {faqOpen === idx && (
                                            <div className="p-4 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="absolute bottom-0 w-full bg-slate-50 border-t border-slate-100 py-3 px-8 flex justify-between text-xs text-slate-400">
                        <span>© EduMaster Pro Content</span>
                        <span>Page 1 of 1</span>
                    </div>
                </article>

                <div className="flex justify-center">
                    <button 
                        onClick={() => openAppealModal(selectedContent.id, `Document: ${selectedContent.title}`)}
                        className="flex items-center text-sm text-slate-500 hover:text-red-600 transition-colors px-4 py-2 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100"
                    >
                        <Flag size={14} className="mr-2" /> Report an issue with this document
                    </button>
                </div>
            </div>
          )}

          {selectedContent.type === ContentType.MCQ && (
              <div className="space-y-8 animate-fade-in pb-10">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                      <div className="flex items-center space-x-3 mb-2 opacity-90 relative z-10">
                          <CheckSquare size={20} />
                          <span className="text-sm font-bold tracking-wider uppercase">Online Quiz</span>
                      </div>
                      <h1 className="text-3xl font-bold relative z-10">{selectedContent.title}</h1>
                      <p className="mt-2 text-purple-100 relative z-10 max-w-xl">
                          Test your knowledge on {selectedContent.title}. Review the questions below to prepare for your exams.
                      </p>
                  </div>

                  {getDisplayQuestions(selectedContent).map((q, index) => (
                      <Card key={q.id || index} className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-start gap-4">
                              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 text-white font-bold rounded-lg text-sm">
                                  {index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-slate-800 leading-snug pt-0.5">
                                  {q.questionText}
                              </h3>
                          </div>

                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, optIdx) => {
                                  const isCorrect = q.correctOptionIndex === optIdx;
                                  return (
                                      <div 
                                        key={optIdx} 
                                        className={`relative p-4 rounded-lg border-2 flex items-center justify-between transition-all ${
                                            isCorrect 
                                            ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                                            : 'bg-white border-slate-100 text-slate-500'
                                        }`}
                                      >
                                          <div className="flex items-center gap-3">
                                              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border ${
                                                  isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-500 border-slate-200'
                                              }`}>
                                                  {String.fromCharCode(65 + optIdx)}
                                              </span>
                                              <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-800' : ''}`}>
                                                  {opt}
                                              </span>
                                          </div>
                                          
                                          {isCorrect && (
                                              <div className="text-emerald-600 flex items-center text-xs font-bold bg-white px-2 py-1 rounded-full shadow-sm border border-emerald-100">
                                                  <CheckCircle2 size={14} className="mr-1" /> Answer
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                          
                          <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-end">
                              <button 
                                onClick={() => openAppealModal(q.id, `Question #${index+1}: ${q.questionText.substring(0, 30)}...`)}
                                className="flex items-center text-xs text-slate-400 hover:text-amber-600 px-3 py-1 rounded hover:bg-amber-50 transition-colors"
                              >
                                  <AlertTriangle size={12} className="mr-1" /> Report Error
                              </button>
                          </div>
                      </Card>
                  ))}
                  
                  {/* --- AUTO BACKLINK GENERATOR FOR MCQS --- */}
                  <ShareTools title={`${selectedContent.title} (MCQ Set)`} type="NOTE" />

                  <div className="text-center text-slate-400 text-sm mt-8">
                      <Bookmark size={20} className="mx-auto mb-2" />
                      End of Study Set
                  </div>
                  
                  <AdBanner slotId="STUDY_MCQ_BOTTOM_AD" />
              </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm inline-flex">
          <button onClick={() => setSelectedFolder(null)} className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">All Folders</button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-indigo-700 flex items-center">
            {selectedFolder?.icon ? (
                <img src={selectedFolder.icon} alt="icon" className="w-5 h-5 mr-2 object-contain" />
            ) : (
                <FolderIcon size={16} className="mr-2" />
            )}
            {selectedFolder?.name}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No study materials in this folder yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map(item => {
                const isLocked = item.isPremium && !isPro;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleContentClick(item)}
                    className={`group flex items-center justify-between p-5 border rounded-xl transition-all cursor-pointer ${
                        isLocked 
                        ? 'bg-slate-50 border-slate-200 opacity-80 hover:border-amber-300' 
                        : 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`p-3 rounded-xl transition-colors ${
                        isLocked 
                        ? 'bg-amber-100 text-amber-600'
                        : item.type === ContentType.WRITTEN 
                            ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' 
                            : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                      }`}>
                        {isLocked ? <Lock size={24} /> : (item.type === ContentType.WRITTEN ? <FileText size={24} /> : <CheckSquare size={24} />)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-lg transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-700'}`}>{item.title}</h4>
                            {item.isPremium && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center border border-amber-200">
                                    <Crown size={10} className="mr-1" fill="currentColor"/> Premium
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 capitalize flex items-center mt-1">
                            {item.type === ContentType.WRITTEN ? 'Document' : 'MCQ Set'} 
                            <span className="mx-2 text-slate-300">•</span>
                            {item.type === ContentType.WRITTEN ? 'Read Only' : `${item.questions || 'Multiple'} Questions`}
                        </p>
                      </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-1">
                      {isLocked ? <Lock size={20} className="text-slate-400" /> : <ArrowLeft className="rotate-180" size={20} />}
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
        schema={seoData.schema}
        breadcrumbs={seoData.breadcrumbs}
        modifiedTime={seoData.modifiedTime}
      />

      {!selectedContent && (
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <span className="bg-indigo-600 w-2 h-8 rounded-full mr-3"></span>
                Study Material
            </h1>
            <p className="text-slate-500 text-sm ml-5 mt-1">Browse notes and study resources.</p>
        </div>
      )}
      {!selectedFolder ? <FolderList /> : <ContentList />}

      <Modal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} title="Submit Appeal">
        <form onSubmit={handleAppealSubmit}>
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4 flex items-start border border-amber-200">
             <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0" />
             <div>You are reporting: <br/><strong>{appealTarget?.title}</strong></div>
          </div>
          <textarea required className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4" placeholder="Describe the error or issue clearly..." value={appealText} onChange={(e) => setAppealText(e.target.value)} />
          <div className="mb-4">
             <label className="block text-sm font-medium text-slate-700 mb-1">Attach Screenshot (Optional)</label>
             <input type="file" className="text-sm text-slate-500" onChange={handleImageUpload} accept="image/*" />
             {appealImage && (
                 <div className="mt-2 relative inline-block">
                     <img src={appealImage} alt="preview" className="h-20 rounded border" />
                     <button type="button" onClick={() => setAppealImage('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                 </div>
             )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAppealModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudyContentPage;
