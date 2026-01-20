
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Exam, Folder, StudentResult, ExamSubmission, User } from '../../types';
import { Clock, AlertCircle, Folder as FolderIcon, ChevronRight, PlayCircle, Calendar, ArrowLeft, Zap, BookOpen, FileQuestion, Target, Layers, History, CheckCircle, MessageSquare, X, Lock, Crown, Timer, Award, BarChart2, List, FileText, Grid } from 'lucide-react';
import ExamLiveInterface from './ExamLiveInterface';
import AdModal from '../../components/AdModal'; 
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO'; 

interface ExamsPageProps {
    exams: Exam[];
    folders: Folder[];
    onExamComplete: (result: StudentResult) => void;
    submissions?: ExamSubmission[]; 
    onSubmissionCreate?: (submission: ExamSubmission) => void; 
    currentUser?: User | null; 
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

// Modern Status Badge Logic
const getExamStatus = (exam: Exam) => {
    if (exam.type === 'GENERAL') return { status: 'OPEN', label: 'PRACTICE', color: 'bg-emerald-500', text: 'text-white' };
    
    if (!exam.startTime) return { status: 'ERROR', label: 'NO TIME', color: 'bg-slate-400', text: 'text-white' };
    
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + exam.durationMinutes * 60000);

    if (now < start) {
        return { status: 'UPCOMING', label: 'UPCOMING', color: 'bg-blue-500', text: 'text-white' };
    } else if (now >= start && now <= end) {
        return { status: 'LIVE', label: 'LIVE NOW', color: 'bg-red-600', text: 'text-white', animate: true };
    } else {
        return { status: 'ENDED', label: 'ENDED', color: 'bg-slate-500', text: 'text-white' };
    }
};

const ExamCard: React.FC<{ exam: Exam; onStart: (exam: Exam) => void; isLocked: boolean }> = ({ exam, onStart, isLocked }) => {
    const { status, label, color, text, animate } = getExamStatus(exam);
    
    return (
      <div className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col ${isLocked ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-pink-300'}`}>
          {/* Status Ribbon - Smaller on Mobile */}
          <div className={`absolute top-0 right-0 rounded-bl-xl ${color} ${text} text-[8px] md:text-[10px] font-bold px-2 py-1 z-10 flex items-center shadow-sm`}>
              {animate && <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>}
              {label}
          </div>

          <div className="p-3 md:p-5 flex flex-col h-full">
              <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 mt-2">
                      <Badge color={exam.examFormat === 'MCQ' ? 'bg-pink-50 text-pink-700 border-pink-100 text-[10px]' : 'bg-orange-50 text-orange-700 border-orange-100 text-[10px]'}>
                          {exam.examFormat}
                      </Badge>
                      {exam.isPremium && (
                          <Badge color="bg-amber-100 text-amber-700 flex items-center gap-1 border-amber-200 text-[10px]">
                              <Crown size={8} fill="currentColor"/> PRO
                          </Badge>
                      )}
                  </div>
                  
                  <h3 className="text-sm md:text-lg font-bold text-slate-800 mb-1 leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors h-[2.5em]">
                      {exam.title}
                  </h3>
                  
                  {status === 'UPCOMING' && (
                      <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mb-2 flex items-center">
                          <Calendar size={10} className="mr-1"/> 
                          {new Date(exam.startTime!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                      </p>
                  )}

                  <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-slate-100">
                      <div className="text-center">
                          <div className="flex items-center justify-center text-slate-400 mb-0.5"><Clock size={12}/></div>
                          <span className="text-[10px] font-bold text-slate-600">{exam.durationMinutes}m</span>
                      </div>
                      <div className="text-center border-l border-slate-100">
                          <div className="flex items-center justify-center text-slate-400 mb-0.5"><Target size={12}/></div>
                          <span className="text-[10px] font-bold text-slate-600">{exam.totalMarks}</span>
                      </div>
                      <div className="text-center border-l border-slate-100">
                          <div className="flex items-center justify-center text-slate-400 mb-0.5"><FileQuestion size={12}/></div>
                          <span className="text-[10px] font-bold text-slate-600">{exam.questionsCount}</span>
                      </div>
                  </div>
              </div>

              <div className="mt-3">
                  <Button 
                      size="sm"
                      variant={isLocked || status === 'UPCOMING' ? "outline" : "primary"}
                      onClick={() => onStart(exam)}
                      className={`w-full py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-sm transition-all ${
                          status === 'LIVE' && !isLocked ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' : 
                          isLocked ? 'bg-slate-50 text-slate-400 border-slate-200' : 
                          'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200'
                      }`}
                  >
                      {isLocked ? (
                          <span className="flex items-center justify-center"><Lock size={12} className="mr-1"/> Locked</span>
                      ) : status === 'UPCOMING' ? (
                          "Wait"
                      ) : (
                          <span className="flex items-center justify-center"><PlayCircle size={14} className="mr-1 fill-current"/> Start</span>
                      )}
                  </Button>
              </div>
          </div>
      </div>
    );
};

const ExamsPage: React.FC<ExamsPageProps> = ({ exams, folders, onExamComplete, submissions = [], onSubmissionCreate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'HISTORY'>('AVAILABLE');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // New Filter State
  const [filterFormat, setFilterFormat] = useState<'ALL' | 'MCQ' | 'WRITTEN'>('ALL');

  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamSubmission | null>(null);
  const [showExamAd, setShowExamAd] = useState(false);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  
  const navigate = useNavigate();
  const isPro = currentUser?.subscription?.status === 'ACTIVE';

  const examFolders = useMemo(() => folders.filter(f => f.type === 'EXAM'), [folders]);

  const handleStartExam = (exam: Exam) => {
      if (exam.isPremium && !isPro) {
          if(confirm("This exam is Premium. Upgrade now?")) navigate('/student/subscription');
          return;
      }
      const { status } = getExamStatus(exam);
      if (status === 'UPCOMING') {
          alert(`Starts at ${new Date(exam.startTime!).toLocaleString()}`);
          return;
      }
      setPendingExam(exam);
      setShowExamAd(true);
  };

  const onAdComplete = () => {
      setShowExamAd(false);
      if (pendingExam) {
          setActiveExam(pendingExam); 
          setPendingExam(null);
      }
  };

  // Filter Logic
  const filteredExams = useMemo(() => {
      return exams.filter(e => {
          const folderMatch = e.folderId === selectedFolderId;
          const publishedMatch = e.isPublished;
          const formatMatch = filterFormat === 'ALL' || e.examFormat === filterFormat;
          return folderMatch && publishedMatch && formatMatch;
      });
  }, [exams, selectedFolderId, filterFormat]);

  if (activeExam) {
      return (
        <ExamLiveInterface exam={activeExam} onExit={() => setActiveExam(null)} onComplete={onExamComplete} onSubmissionCreate={onSubmissionCreate} />
      );
  }

  return (
      <div className="space-y-6 animate-fade-in pb-10">
          <SEO title="Exam Portal" description="Take online model tests." />
          
          {/* HERO HEADER */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500"></div>
              <div className="relative z-10">
                  <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Exam Portal</h1>
                  <p className="text-slate-500">Test your skills with live model tests and practice quizzes.</p>
              </div>
              <div className="relative z-10 mt-4 md:mt-0 bg-slate-100 p-1.5 rounded-xl flex shadow-inner">
                  <button 
                    onClick={() => setActiveTab('AVAILABLE')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center ${activeTab === 'AVAILABLE' ? 'bg-white shadow text-pink-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <Zap size={16} className="mr-2" /> Exams
                  </button>
                  <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center ${activeTab === 'HISTORY' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <History size={16} className="mr-2" /> Results
                  </button>
              </div>
          </div>

          {activeTab === 'AVAILABLE' && (
              <>
                  <AdModal isOpen={showExamAd} onClose={onAdComplete} title="Exam Loading" timerSeconds={5} />

                  {!selectedFolderId ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-slide-up">
                          {examFolders.map((folder, index) => {
                              const examCount = exams.filter(e => e.folderId === folder.id && e.isPublished).length;
                              return (
                                  <div 
                                      key={folder.id} 
                                      onClick={() => setSelectedFolderId(folder.id)}
                                      className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl shadow-lg h-40 md:h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white border border-white/20`}
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
                                          <h3 className="text-lg md:text-2xl font-bold leading-tight mb-2 drop-shadow-md font-sans tracking-tight line-clamp-2">
                                              {folder.name}
                                          </h3>
                                          <p className="text-white/80 text-xs md:text-sm font-medium line-clamp-1">
                                              {folder.description || 'Access Exams'}
                                          </p>
                                      </div>

                                      <div className="relative z-10 flex items-center justify-between mt-auto">
                                          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 group-hover:bg-white/30 transition-colors">
                                              <FileQuestion size={12} className="text-white" />
                                              <span>{examCount}</span>
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
                      <div className="animate-fade-in">
                          {/* Folder Header & Filter */}
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center">
                                      <Button variant="ghost" onClick={() => { setSelectedFolderId(null); setFilterFormat('ALL'); }} className="mr-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl p-2 h-10 w-10 flex items-center justify-center">
                                          <ArrowLeft size={20} className="text-slate-600" />
                                      </Button>
                                      <div>
                                          <h2 className="text-xl font-bold text-slate-800">{folders.find(f=>f.id===selectedFolderId)?.name}</h2>
                                          <p className="text-xs text-slate-500">Browsing exams</p>
                                      </div>
                                  </div>

                                  {/* FILTER BUTTONS */}
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                      <button 
                                          onClick={() => setFilterFormat('ALL')}
                                          className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                              filterFormat === 'ALL' 
                                              ? 'bg-slate-800 text-white shadow-md' 
                                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                          }`}
                                      >
                                          <Grid size={14} className="mr-2"/> All
                                      </button>
                                      <button 
                                          onClick={() => setFilterFormat('MCQ')}
                                          className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                              filterFormat === 'MCQ'
                                              ? 'bg-pink-600 text-white shadow-md shadow-pink-200' 
                                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                          }`}
                                      >
                                          <List size={14} className="mr-2"/> MCQ
                                      </button>
                                      <button 
                                          onClick={() => setFilterFormat('WRITTEN')}
                                          className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                              filterFormat === 'WRITTEN'
                                              ? 'bg-orange-600 text-white shadow-md shadow-orange-200' 
                                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                          }`}
                                      >
                                          <FileText size={14} className="mr-2"/> Written
                                      </button>
                                  </div>
                              </div>
                          </div>

                          {filteredExams.length === 0 ? (
                              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                  <FileQuestion size={40} className="mx-auto mb-3 opacity-20"/>
                                  <p>No exams found in this category.</p>
                              </div>
                          ) : (
                              // MOBILE: 2 Columns, DESKTOP: 3/4 Columns
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {filteredExams.map(exam => (
                                      <ExamCard key={exam.id} exam={exam} onStart={handleStartExam} isLocked={(exam.isPremium || false) && !isPro} />
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
              </>
          )}

          {activeTab === 'HISTORY' && (
              <div className="space-y-4">
                  {submissions.filter(sub => sub.studentId === currentUser?.id).map(sub => (
                      <Card key={sub.id} className="border-l-4 border-l-slate-400 hover:shadow-md transition-all">
                          <div className="flex justify-between items-center">
                              <div>
                                  <h4 className="font-bold text-slate-800 text-lg">{exams.find(e => e.id === sub.examId)?.title || 'Unknown Exam'}</h4>
                                  <div className="flex items-center text-xs text-slate-500 mt-2 space-x-3">
                                      <span className="flex items-center"><Calendar size={14} className="mr-1"/> {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                      <span className="flex items-center"><Clock size={14} className="mr-1"/> {new Date(sub.submittedAt).toLocaleTimeString()}</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  {sub.status === 'PENDING' ? (
                                      <Badge color="bg-amber-100 text-amber-700">Checking...</Badge>
                                  ) : (
                                      <>
                                          <div className="text-2xl font-black text-pink-600">{sub.obtainedMarks}</div>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase">Obtained</div>
                                          <button onClick={() => setSelectedResult(sub)} className="text-xs font-bold text-pink-600 mt-2 hover:underline">View Report</button>
                                      </>
                                  )}
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          )}

          <Modal isOpen={!!selectedResult} onClose={() => setSelectedResult(null)} title="Exam Report">
              {selectedResult && (
                  <div className="space-y-6">
                      <div className="bg-pink-50 p-6 rounded-2xl text-center border border-pink-100">
                          <h2 className="text-pink-900 font-bold text-lg mb-2">{exams.find(e => e.id === selectedResult.examId)?.title}</h2>
                          <div className="text-4xl font-black text-pink-600 mb-1">{selectedResult.obtainedMarks}</div>
                          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Total Score</span>
                      </div>
                      <Button className="w-full" onClick={() => setSelectedResult(null)}>Close</Button>
                  </div>
              )}
          </Modal>
      </div>
  );
};

export default ExamsPage;
