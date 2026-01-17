import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { Exam, Folder, StudentResult } from '../../types';
import { Clock, AlertCircle, Folder as FolderIcon, ChevronRight, PlayCircle, Calendar, ArrowLeft, Zap, BookOpen, FileQuestion, Target, Layers } from 'lucide-react';
import ExamLiveInterface from './ExamLiveInterface';
import AdModal from '../../components/AdModal'; // Import Ad Modal

interface ExamsPageProps {
    exams: Exam[];
    folders: Folder[];
    onExamComplete: (result: StudentResult) => void;
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

const ExamsPage: React.FC<ExamsPageProps> = ({ exams, folders, onExamComplete }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  
  // Ad State
  const [showExamAd, setShowExamAd] = useState(false);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  
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

  // If taking an exam, show the interface
  if (activeExam) {
      return (
        <ExamLiveInterface 
            exam={activeExam} 
            onExit={() => setActiveExam(null)} 
            onComplete={onExamComplete}
        />
      );
  }

  // Filter only EXAM type folders
  const examFolders = folders.filter(f => f.type === 'EXAM');

  // --- GROUPING LOGIC ---
  const foldersByClass = useMemo(() => {
      const groups: Record<string, Folder[]> = {};
      
      examFolders.forEach(folder => {
          const key = folder.targetClass || 'General / Uncategorized';
          if (!groups[key]) groups[key] = [];
          groups[key].push(folder);
      });
      
      return groups;
  }, [examFolders]);

  const sortedClassKeys = Object.keys(foldersByClass).sort((a, b) => {
      if (a.includes('General')) return 1;
      if (b.includes('General')) return -1;
      return a.localeCompare(b);
  });

  // --- FOLDER VIEW ---
  if (!selectedFolderId) {
      return (
          <div className="space-y-6 animate-fade-in pb-10">
              {/* MANDATORY EXAM AD */}
              <AdModal 
                isOpen={showExamAd} 
                onClose={onAdComplete} 
                title="Unlock Exam Access" 
                timerSeconds={5} 
              />

              <h1 className="text-2xl font-bold text-slate-800">Exams & Model Tests</h1>
              <p className="text-slate-500">Select a category to view available Live and General exams.</p>
              
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
                                  // Filter exams for this folder AND ensure they are published for students
                                  const examCount = exams.filter(e => e.folderId === folder.id && e.isPublished).length;
                                  const hasLive = exams.some(e => e.folderId === folder.id && e.isPublished && e.type === 'LIVE');
                                  
                                  return (
                                      <div 
                                          key={folder.id} 
                                          onClick={() => setSelectedFolderId(folder.id)}
                                          className={`relative overflow-hidden rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg h-40 md:h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white`}
                                      >
                                          {/* Live Badge */}
                                          {hasLive && (
                                              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-bl-xl shadow-sm flex items-center z-20">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></div> LIVE
                                              </div>
                                          )}

                                          {/* Background Decoration - Adjusted for mobile */}
                                          <div className="absolute -right-4 -bottom-4 md:-right-6 md:-bottom-6 opacity-20 transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500 pointer-events-none">
                                              {folder.icon ? (
                                                  <img src={folder.icon} className="w-24 h-24 md:w-40 md:h-40 object-contain drop-shadow-md grayscale invert brightness-200" alt="" />
                                              ) : (
                                                  <FolderIcon className="w-24 h-24 md:w-40 md:h-40" fill="currentColor" />
                                              )}
                                          </div>

                                          {/* Content */}
                                          <div className="relative z-10">
                                              <h3 className="text-lg md:text-2xl font-bold leading-tight mb-1 md:mb-2 drop-shadow-sm font-serif tracking-wide line-clamp-2">{folder.name}</h3>
                                              <p className="text-white/90 text-xs md:text-sm font-medium line-clamp-1 md:line-clamp-2">{folder.description || 'Practice Exams'}</p>
                                          </div>

                                          {/* Footer Info */}
                                          <div className="relative z-10 flex items-center justify-between mt-2">
                                              <div className="flex items-center space-x-1 md:space-x-2 bg-black/20 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border border-white/10 hover:bg-black/30 transition-colors">
                                                  <FileQuestion size={12} className="text-white/90" />
                                                  <span>{examCount}</span>
                                              </div>
                                              
                                              <div className="flex items-center text-[10px] md:text-xs font-bold text-white/80">
                                                  <Calendar size={12} className="mr-1" />
                                                  <span>2025</span>
                                              </div>
                                          </div>
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  ))
              )}

              <Card className="bg-blue-50 border-blue-100 mt-8">
                <div className="flex items-start">
                    <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-blue-800">Exam Instructions</h4>
                        <ul className="text-sm text-blue-700 list-disc list-inside mt-1 space-y-1">
                            <li>Check the <strong>Live Exams</strong> section for scheduled tests.</li>
                            <li>Use <strong>General Exams</strong> for unlimited practice.</li>
                            <li>Written exam results are published after Admin review.</li>
                        </ul>
                    </div>
                </div>
              </Card>
          </div>
      );
  }

  // --- EXAM LIST VIEW (INSIDE FOLDER) ---
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  // Filter: Must match folder AND be published
  const allExamsInFolder = exams.filter(e => e.folderId === selectedFolderId && e.isPublished);
  
  // Split into Categories
  const liveExams = allExamsInFolder.filter(e => e.type === 'LIVE');
  const generalExams = allExamsInFolder.filter(e => e.type === 'GENERAL');

  return (
      <div className="space-y-6 animate-fade-in">
          {/* MANDATORY EXAM AD (Render here as well just in case) */}
          <AdModal 
            isOpen={showExamAd} 
            onClose={onAdComplete} 
            title="Unlock Exam Access" 
            timerSeconds={5} 
          />

          <div className="flex items-center mb-6">
              <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="mr-4 bg-white hover:bg-slate-50">
                  <ArrowLeft size={16} />
              </Button>
              <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                      {currentFolder?.icon ? (
                          <img src={currentFolder.icon} alt="icon" className="w-8 h-8 mr-2 object-contain" />
                      ) : (
                          <FolderIcon className="mr-2 text-amber-500" />
                      )}
                      {currentFolder?.name}
                  </h1>
                  <p className="text-slate-500 text-sm">Choose an exam to participate</p>
              </div>
          </div>

          {allExamsInFolder.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 font-medium">No active exams available in this folder yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Check back later or contact admin.</p>
              </div>
          ) : (
              <div className="space-y-8">
                  {/* LIVE EXAMS SECTION */}
                  {liveExams.length > 0 && (
                      <div className="space-y-3">
                          <h3 className="font-bold text-red-600 flex items-center border-b border-red-100 pb-2">
                              <Zap size={18} className="mr-2 fill-current" /> Live & Scheduled Exams
                          </h3>
                          <div className="grid gap-4">
                              {liveExams.map(exam => (
                                <ExamCard 
                                    key={exam.id} 
                                    exam={exam} 
                                    onStart={handleStartExam} 
                                />
                              ))}
                          </div>
                      </div>
                  )}

                  {/* GENERAL EXAMS SECTION */}
                  {generalExams.length > 0 && (
                      <div className="space-y-3">
                          <h3 className="font-bold text-slate-700 flex items-center border-b border-slate-200 pb-2">
                              <BookOpen size={18} className="mr-2 text-emerald-600" /> Practice & General Exams
                          </h3>
                          <div className="grid gap-4">
                              {generalExams.map(exam => (
                                <ExamCard 
                                    key={exam.id} 
                                    exam={exam} 
                                    onStart={handleStartExam} 
                                />
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
  );
};

export default ExamsPage;