import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Exam, Folder, StudentResult, ExamSubmission, User } from '../../types';
import { Clock, AlertCircle, Folder as FolderIcon, ChevronRight, PlayCircle, Calendar, ArrowLeft, Zap, BookOpen, FileQuestion, Target, Layers, History, CheckCircle, MessageSquare, X } from 'lucide-react';
import ExamLiveInterface from './ExamLiveInterface';
import AdModal from '../../components/AdModal'; // Import Ad Modal

interface ExamsPageProps {
    exams: Exam[];
    folders: Folder[];
    onExamComplete: (result: StudentResult) => void;
    submissions?: ExamSubmission[]; 
    onSubmissionCreate?: (submission: ExamSubmission) => void; 
    currentUser?: User | null; 
}

// Helper function moved outside component
const getExamStatus = (exam: Exam) => {
    if (exam.type === 'GENERAL') return { status: 'OPEN', label: 'Practice', color: 'bg-emerald-100 text-emerald-700' };
    
    if (!exam.startTime) return { status: 'ERROR', label: 'No Time', color: 'bg-slate-100' };
    
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(start.getTime() + exam.durationMinutes * 60000);

    if (now < start) {
        return { status: 'UPCOMING', label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    } else if (now >= start && now <= end) {
        return { status: 'LIVE', label: 'LIVE NOW', color: 'bg-red-500 text-white animate-pulse' };
    } else {
        return { status: 'ENDED', label: 'Ended', color: 'bg-slate-100 text-slate-600' };
    }
};

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

interface ExamCardProps {
    exam: Exam;
    onStart: (exam: Exam) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onStart }) => {
    const { status, label, color } = getExamStatus(exam);
    return (
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow border border-slate-200">
          {/* Status Badge */}
          <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg ${color}`}>
              {label}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-1">
              <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                      {exam.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                      <Badge color={exam.examFormat === 'MCQ' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}>
                          {exam.examFormat}
                      </Badge>
                      <span className="flex items-center"><Clock size={14} className="mr-1"/> {exam.durationMinutes} min</span>
                      <span className="text-slate-300">|</span>
                      <span>{exam.totalMarks} Marks</span>
                      {exam.negativeMarks && exam.negativeMarks > 0 && (
                          <span className="text-red-500 text-xs">(-{exam.negativeMarks} Neg)</span>
                      )}
                  </div>
                  {status === 'UPCOMING' && (
                      <p className="text-sm text-blue-600 mt-2 font-medium flex items-center bg-blue-50 w-fit px-2 py-1 rounded">
                          <Calendar size={14} className="mr-1"/> Starts: {new Date(exam.startTime!).toLocaleString()}
                      </p>
                  )}
              </div>
              <div className="flex items-center">
                  <Button 
                      variant={status === 'UPCOMING' ? "outline" : "primary"}
                      onClick={() => onStart(exam)}
                      className={`w-full md:w-auto ${status === 'LIVE' ? 'bg-red-600 hover:bg-red-700 border-transparent text-white' : ''}`}
                  >
                      {status === 'UPCOMING' ? (
                          <span className="flex items-center justify-center">Wait for Start</span>
                      ) : (
                          <span className="flex items-center justify-center">
                              <PlayCircle size={16} className="mr-2"/> 
                              {status === 'ENDED' ? 'Practice Now' : 'Start Exam'}
                          </span>
                      )}
                  </Button>
              </div>
          </div>
      </Card>
    );
};

const ExamsPage: React.FC<ExamsPageProps> = ({ exams, folders, onExamComplete, submissions = [], onSubmissionCreate, currentUser }) => {
  // --- 1. DEFINE ALL HOOKS FIRST (Order must not change) ---
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'HISTORY'>('AVAILABLE');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  
  // Feedback Modal State
  const [selectedResult, setSelectedResult] = useState<ExamSubmission | null>(null);

  // Ad State
  const [showExamAd, setShowExamAd] = useState(false);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  
  // --- MEMOIZED VALUES (HOOKS) ---
  
  // Filter only EXAM type folders
  const examFolders = useMemo(() => folders.filter(f => f.type === 'EXAM'), [folders]);

  // Grouping Logic
  const foldersByClass = useMemo(() => {
      const groups: Record<string, Folder[]> = {};
      examFolders.forEach(folder => {
          const key = folder.targetClass || 'General / Uncategorized';
          if (!groups[key]) groups[key] = [];
          groups[key].push(folder);
      });
      return groups;
  }, [examFolders]);

  const sortedClassKeys = useMemo(() => Object.keys(foldersByClass).sort((a, b) => {
      if (a.includes('General')) return 1;
      if (b.includes('General')) return -1;
      return a.localeCompare(b);
  }), [foldersByClass]);

  // History Logic
  const myHistory = useMemo(() => submissions.filter(sub => sub.studentId === currentUser?.id), [submissions, currentUser]);

  // --- HANDLERS (Not Hooks) ---
  const handleStartExam = (exam: Exam) => {
      const { status } = getExamStatus(exam);
      if (status === 'UPCOMING') {
          alert(`This exam starts at ${new Date(exam.startTime!).toLocaleString()}`);
          return;
      }
      
      // TRIGGER MANDATORY AD BEFORE EXAM
      setPendingExam(exam);
      setShowExamAd(true);
  };

  const onAdComplete = () => {
      setShowExamAd(false);
      if (pendingExam) {
          setActiveExam(pendingExam); // Actually start the exam now
          setPendingExam(null);
      }
  };

  // --- 2. CONDITIONAL RETURN (MUST BE AFTER ALL HOOKS) ---
  // If taking an exam, show the interface
  if (activeExam) {
      return (
        <ExamLiveInterface 
            exam={activeExam} 
            onExit={() => setActiveExam(null)} 
            onComplete={onExamComplete}
            onSubmissionCreate={onSubmissionCreate}
        />
      );
  }

  // --- RENDER CONTENT ---
  return (
      <div className="space-y-6 animate-fade-in pb-10">
          
          {/* TAB HEADER */}
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Exam Portal</h1>
              
              <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                  <button 
                    onClick={() => setActiveTab('AVAILABLE')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${activeTab === 'AVAILABLE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <Zap size={16} className="mr-2" /> Exams
                  </button>
                  <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${activeTab === 'HISTORY' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <History size={16} className="mr-2" /> My Results
                  </button>
              </div>
          </div>

          {/* VIEW: AVAILABLE EXAMS */}
          {activeTab === 'AVAILABLE' && (
              <>
                  <AdModal 
                    isOpen={showExamAd} 
                    onClose={onAdComplete} 
                    title="Unlock Exam Access" 
                    timerSeconds={5} 
                  />

                  {/* FOLDER LEVEL */}
                  {!selectedFolderId && (
                      <div className="space-y-8">
                          {examFolders.length === 0 ? (
                              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                  <FolderIcon size={40} className="mx-auto mb-2 opacity-20" />
                                  <p>No exam folders available.</p>
                              </div>
                          ) : (
                              sortedClassKeys.map(className => (
                                  <div key={className} className="mb-8">
                                      <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center border-b border-slate-100 pb-2">
                                          <Target size={16} className="mr-2 text-indigo-500" /> {className}
                                      </h3>
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                          {foldersByClass[className].map((folder, index) => {
                                              const examCount = exams.filter(e => e.folderId === folder.id && e.isPublished).length;
                                              const hasLive = exams.some(e => e.folderId === folder.id && e.isPublished && e.type === 'LIVE');
                                              
                                              return (
                                                  <div 
                                                      key={folder.id} 
                                                      onClick={() => setSelectedFolderId(folder.id)}
                                                      className={`relative overflow-hidden rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg h-40 md:h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white`}
                                                  >
                                                      {hasLive && (
                                                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-bl-xl shadow-sm flex items-center z-20">
                                                              <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></div> LIVE
                                                          </div>
                                                      )}
                                                      <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 transition-transform group-hover:rotate-6 duration-500">
                                                          <FolderIcon className="w-24 h-24 md:w-40 md:h-40" fill="currentColor" />
                                                      </div>
                                                      <div className="relative z-10">
                                                          <h3 className="text-lg md:text-2xl font-bold leading-tight mb-2 drop-shadow-sm font-serif">{folder.name}</h3>
                                                          <p className="text-white/90 text-xs font-medium">{folder.description}</p>
                                                      </div>
                                                      <div className="relative z-10 flex items-center justify-between mt-2">
                                                          <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10">
                                                              <FileQuestion size={12} />
                                                              <span>{examCount}</span>
                                                          </div>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  )}

                  {/* EXAM LIST LEVEL */}
                  {selectedFolderId && (
                      <div className="space-y-6">
                          <div className="flex items-center mb-6">
                              <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="mr-4 bg-white hover:bg-slate-50">
                                  <ArrowLeft size={16} />
                              </Button>
                              <div>
                                  <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                                      {folders.find(f=>f.id===selectedFolderId)?.name}
                                  </h1>
                                  <p className="text-slate-500 text-sm">Select an exam to begin</p>
                              </div>
                          </div>

                          {exams.filter(e => e.folderId === selectedFolderId && e.isPublished).length === 0 ? (
                              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                  <p className="text-slate-500 font-medium">No exams currently active in this folder.</p>
                              </div>
                          ) : (
                              <div className="space-y-8">
                                  <div className="grid gap-4">
                                      {exams.filter(e => e.folderId === selectedFolderId && e.isPublished).map(exam => (
                                          <ExamCard key={exam.id} exam={exam} onStart={handleStartExam} />
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </>
          )}

          {/* VIEW: MY HISTORY (RESULTS) */}
          {activeTab === 'HISTORY' && (
              <div className="space-y-6">
                  {myHistory.length === 0 ? (
                      <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <History size={48} className="mx-auto mb-4 text-slate-300" />
                          <h3 className="text-lg font-bold text-slate-600">No Exam History</h3>
                          <p className="text-slate-500">You haven't participated in any exams yet.</p>
                      </div>
                  ) : (
                      <div className="grid gap-4">
                          {myHistory.map(sub => {
                              const exam = exams.find(e => e.id === sub.examId);
                              return (
                                  <Card key={sub.id} className="border-l-4 border-l-slate-400 hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-center">
                                          <div>
                                              <h4 className="font-bold text-slate-800 text-lg">{exam?.title || 'Unknown Exam'}</h4>
                                              <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                  <Calendar size={12} className="mr-1"/> {new Date(sub.submittedAt).toLocaleDateString()}
                                                  <span className="mx-2">•</span>
                                                  <Clock size={12} className="mr-1"/> {new Date(sub.submittedAt).toLocaleTimeString()}
                                              </p>
                                          </div>
                                          
                                          <div className="text-right">
                                              {sub.status === 'PENDING' ? (
                                                  <div className="flex flex-col items-end">
                                                      <Badge color="bg-amber-100 text-amber-700 mb-1">Checking Pending</Badge>
                                                      <span className="text-xs text-slate-400">Result will be published soon</span>
                                                  </div>
                                              ) : (
                                                  <div className="flex flex-col items-end">
                                                      <div className="text-xl font-bold text-indigo-600">
                                                          {sub.obtainedMarks} <span className="text-sm text-slate-400 font-normal">/ {exam?.totalMarks}</span>
                                                      </div>
                                                      <Badge color="bg-emerald-100 text-emerald-700 mt-1">Graded</Badge>
                                                      <button 
                                                        onClick={() => setSelectedResult(sub)}
                                                        className="text-xs font-bold text-indigo-600 mt-2 flex items-center hover:underline"
                                                      >
                                                          <MessageSquare size={12} className="mr-1" /> View Feedback
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </Card>
                              )
                          })}
                      </div>
                  )}
              </div>
          )}

          {/* FEEDBACK MODAL */}
          <Modal isOpen={!!selectedResult} onClose={() => setSelectedResult(null)} title="Exam Feedback">
              {selectedResult && (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                      <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center border border-indigo-100">
                          <div>
                              <h3 className="font-bold text-indigo-900 text-lg">{exams.find(e => e.id === selectedResult.examId)?.title}</h3>
                              <p className="text-xs text-indigo-600 mt-1">Evaluated by: {selectedResult.gradedBy || 'Teacher'}</p>
                          </div>
                          <div className="text-center">
                              <span className="block text-2xl font-bold text-indigo-700">{selectedResult.obtainedMarks}</span>
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">Total Marks</span>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {selectedResult.answers.map((ans, idx) => {
                              const exam = exams.find(e => e.id === selectedResult.examId);
                              const question = exam?.questionList?.find(q => q.id === ans.questionId);
                              
                              return (
                                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                                      <div className="bg-slate-50 p-3 border-b border-slate-100">
                                          <p className="font-bold text-slate-700 text-sm">Q{idx + 1}: {question?.text}</p>
                                          <div className="text-xs text-slate-500 mt-1">Max Marks: {question?.marks}</div>
                                      </div>
                                      
                                      <div className="p-4 space-y-3">
                                          {/* Student Answer Images */}
                                          {ans.writtenImages && ans.writtenImages.length > 0 ? (
                                              <div className="flex gap-2 overflow-x-auto pb-2">
                                                  {ans.writtenImages.map((img, i) => (
                                                      <a key={i} href={img} target="_blank" rel="noreferrer" className="block border rounded-lg overflow-hidden h-24 w-auto shrink-0">
                                                          <img src={img} alt="Ans" className="h-full object-contain" />
                                                      </a>
                                                  ))}
                                              </div>
                                          ) : (
                                              <p className="text-xs text-slate-400 italic">No image answer uploaded.</p>
                                          )}

                                          {/* Teacher Feedback */}
                                          {ans.feedback && (
                                              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-sm">
                                                  <strong className="text-emerald-700 block text-xs uppercase mb-1">Teacher's Remark:</strong>
                                                  <p className="text-emerald-900">{ans.feedback}</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      
                      <div className="pt-2">
                          <Button className="w-full" onClick={() => setSelectedResult(null)}>Close</Button>
                      </div>
                  </div>
              )}
          </Modal>

      </div>
  );
};

export default ExamsPage;