import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import ExamCreationForm from '../../components/ExamCreationForm';
import { Exam, Folder } from '../../types';
import { 
    Plus, Trash2, Clock, Calendar, FileQuestion, 
    Eye, EyeOff, Folder as FolderIcon, Users, FolderPlus, 
    FolderOpen, ArrowLeft 
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

interface ExamCreationProps {
    exams: Exam[];
    setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
}

const ExamCreation: React.FC<ExamCreationProps> = ({ exams, setExams, folders, setFolders }) => {
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Folder Creation State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
      const totalExams = exams.length;
      const liveExams = exams.filter(e => e.type === 'LIVE' && e.isPublished).length;
      const totalAttempts = exams.reduce((sum, e) => sum + (e.attempts || 0), 0);
      
      const chartData = exams.map(e => ({
          name: e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title,
          attempts: e.attempts || 0
      })).slice(0, 5); 

      return { totalExams, liveExams, totalAttempts, chartData };
  }, [exams]);

  // --- HANDLERS ---

  const handleExamSubmit = (data: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      ...data,
      attempts: 0,
      isPublished: false // Default to draft
    };

    setExams([newExam, ...exams]);
    setIsCreating(false);
    alert("Exam created successfully! You can publish it when ready.");
  };

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      
      const newFolder: Folder = {
          id: `exam_folder_${Date.now()}`,
          name: newFolderName,
          description: 'Exam Category'
      };
      
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const hasExams = exams.some(e => e.folderId === id);
      if (hasExams) {
          alert("Cannot delete folder because it contains exams.");
          return;
      }
      if (confirm("Delete this folder?")) {
          setFolders(folders.filter(f => f.id !== id));
      }
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
      setExams(exams.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  // --- VIEW LOGIC ---

  // 1. Creation View
  if (isCreating) {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex items-center mb-4">
                  <Button variant="outline" className="mr-4 bg-white" onClick={() => setIsCreating(false)}>
                      <ArrowLeft size={16} className="mr-2" /> Cancel
                  </Button>
                  <h1 className="text-2xl font-bold text-slate-800">Set New Exam</h1>
              </div>
              <Card>
                  <ExamCreationForm 
                    onSubmit={handleExamSubmit} 
                    folders={folders}
                    fixedFolderId={currentFolderId || undefined}
                  />
              </Card>
          </div>
      );
  }

  // 2. Folder Detail View
  if (currentFolderId) {
      const currentFolder = folders.find(f => f.id === currentFolderId);
      const folderExams = exams.filter(e => e.folderId === currentFolderId);

      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <Button variant="outline" className="mr-4 bg-white shadow-sm hover:bg-slate-50" onClick={() => setCurrentFolderId(null)}>
                          <ArrowLeft size={16} />
                      </Button>
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                              <FolderOpen className="mr-2 text-amber-500" size={28} />
                              {currentFolder?.name}
                          </h1>
                          <p className="text-sm text-slate-500 ml-9">{folderExams.length} Exams in this folder</p>
                      </div>
                  </div>
                  <Button onClick={() => setIsCreating(true)} className="flex items-center">
                      <Plus size={18} className="mr-2" /> Create Exam
                  </Button>
              </div>

              {folderExams.length === 0 ? (
                  <Card className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200">
                      <FileQuestion size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="mb-4">No exams in this folder yet.</p>
                      <Button variant="outline" onClick={() => setIsCreating(true)}>Set First Exam</Button>
                  </Card>
              ) : (
                  <div className="space-y-4">
                      {folderExams.map(exam => (
                          <Card key={exam.id} className={`flex flex-col md:flex-row md:items-center justify-between group transition-colors border-l-4 ${exam.isPublished ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
                              <div className="flex-1">
                                  <div className="flex items-center justify-between md:justify-start mb-2 md:mb-1">
                                      <h4 className="font-bold text-slate-800 text-lg mr-3">{exam.title}</h4>
                                      <div className="flex space-x-2">
                                          <Badge color={exam.type === 'LIVE' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}>
                                              {exam.type}
                                          </Badge>
                                          <Badge color={exam.examFormat === 'WRITTEN' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}>
                                              {exam.examFormat}
                                          </Badge>
                                      </div>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                                      <span className="flex items-center"><Clock size={14} className="mr-1" /> {exam.durationMinutes} min</span>
                                      <span className="flex items-center"><FileQuestion size={14} className="mr-1" /> {exam.questionsCount} Qs</span>
                                      <span className="flex items-center"><Users size={14} className="mr-1" /> {exam.attempts || 0} Attended</span>
                                      {exam.type === 'LIVE' && exam.startTime && (
                                          <span className="flex items-center text-red-600 font-medium">
                                              <Calendar size={14} className="mr-1" /> {new Date(exam.startTime).toLocaleString()}
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center mt-4 md:mt-0 space-x-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                  <Button 
                                      variant={exam.isPublished ? 'secondary' : 'outline'} 
                                      className="flex items-center text-xs"
                                      onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                                  >
                                      {exam.isPublished ? <EyeOff size={16} className="mr-1"/> : <Eye size={16} className="mr-1"/>}
                                      {exam.isPublished ? "Unpublish" : "Publish"}
                                  </Button>
                                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </Card>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // 3. Dashboard / Root View
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
              <p className="text-slate-500 text-sm">Select a folder to manage or set exams.</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => setIsFolderModalOpen(true)} className="flex items-center">
                  <FolderPlus size={18} className="mr-2" /> New Folder
              </Button>
          </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card className="flex items-center p-4 border-l-4 border-l-indigo-500">
              <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mr-4"><FileQuestion size={24} /></div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Exams</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalExams}</h3>
              </div>
          </Card>
          <Card className="flex items-center p-4 border-l-4 border-l-emerald-500">
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mr-4"><Users size={24} /></div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Attempts</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalAttempts}</h3>
              </div>
          </Card>
          <Card className="flex items-center p-4 border-l-4 border-l-red-500">
              <div className="p-3 bg-red-50 rounded-full text-red-600 mr-4"><Clock size={24} /></div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Live Now</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.liveExams}</h3>
              </div>
          </Card>
          <Card className="p-2 md:col-span-3 lg:col-span-1 h-24 flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1 ml-2">Recent Attendance</p>
                <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData}>
                          <Bar dataKey="attempts" fill="#6366f1" radius={[2, 2, 0, 0]} />
                          <Tooltip cursor={{fill: 'transparent'}} />
                      </BarChart>
                  </ResponsiveContainer>
                </div>
          </Card>
      </div>

      {/* Folder Grid */}
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FolderIcon size={20} className="mr-2 text-amber-500" /> Exam Folders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map(folder => {
                  const examCount = exams.filter(e => e.folderId === folder.id).length;
                  return (
                    <div 
                        key={folder.id} 
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-amber-300 cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <FolderIcon className="text-amber-400 fill-amber-50" size={28} />
                            <button 
                                onClick={(e) => handleDeleteFolder(e, folder.id)} 
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <h4 className="font-bold text-slate-700 text-sm truncate" title={folder.name}>{folder.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{examCount} Exams</p>
                    </div>
                  );
              })}
              <button 
                  onClick={() => setIsFolderModalOpen(true)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-300 transition-all"
              >
                  <Plus size={24} className="mb-1" />
                  <span className="text-xs font-bold">Add Folder</span>
              </button>
          </div>
      </div>

      {/* Modal for Folder Creation */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create Exam Folder">
          <form onSubmit={handleCreateFolder}>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Model Tests 2024"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
              </div>
              <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Folder</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default ExamCreation;