import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/UI';
import { Exam, Folder, StudentResult } from '../../types';
import { Clock, AlertCircle, Folder as FolderIcon, ChevronRight, PlayCircle, Calendar, ArrowLeft, Zap, BookOpen } from 'lucide-react';
import ExamLiveInterface from './ExamLiveInterface';

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
  
  const handleStartExam = (exam: Exam) => {
      const { status } = getExamStatus(exam);
      if (status === 'UPCOMING') {
          alert(`This exam starts at ${new Date(exam.startTime!).toLocaleString()}`);
          return;
      }
      setActiveExam(exam);
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

  // --- FOLDER VIEW ---
  if (!selectedFolderId) {
      return (
          <div className="space-y-6 animate-fade-in">
              <h1 className="text-2xl font-bold text-slate-800">Exams & Model Tests</h1>
              <p className="text-slate-500">Select a folder to view available Live and General exams.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.length === 0 ? (
                      <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                          <FolderIcon size={40} className="mx-auto mb-2 opacity-20" />
                          <p>No exam folders available.</p>
                      </div>
                  ) : (
                    folders.map(folder => {
                        // Show all folders, just like Admin panel
                        // Filter exams for this folder AND ensure they are published for students
                        const examCount = exams.filter(e => e.folderId === folder.id && e.isPublished).length;
                        return (
                            <Card 
                                key={folder.id} 
                                className="cursor-pointer hover:border-indigo-400 transition-all hover:shadow-md group bg-white border-slate-200"
                            >
                                <div onClick={() => setSelectedFolderId(folder.id)} className="flex items-center space-x-4">
                                    <div className="p-4 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-500">
                                        <FolderIcon size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{folder.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">{folder.description || 'Exam Category'}</p>
                                        <div className="mt-2 flex items-center text-xs font-medium text-slate-400">
                                            {examCount} Exams Inside <ChevronRight size={14} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                  )}
              </div>

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
          <div className="flex items-center mb-6">
              <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="mr-4 bg-white hover:bg-slate-50">
                  <ArrowLeft size={16} />
              </Button>
              <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                      <FolderIcon className="mr-2 text-amber-500" /> {currentFolder?.name}
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