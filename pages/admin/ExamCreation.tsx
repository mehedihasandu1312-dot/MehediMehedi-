
import React, { useState, useMemo, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import ExamCreationForm from '../../components/ExamCreationForm';
import { Exam, Folder, ContentType } from '../../types';
import { 
    Plus, Trash2, Clock, Calendar, FileQuestion, 
    Eye, EyeOff, Folder as FolderIcon, Users, FolderPlus, 
    FolderOpen, ArrowLeft, Edit, Upload, X, Target, AlertTriangle, CheckCircle,
    List, FileText, Grid
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

interface ExamCreationProps {
    exams: Exam[];
    setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    educationLevels: { REGULAR: string[], ADMISSION: string[] }; 
}

const ExamCreation: React.FC<ExamCreationProps> = ({ exams, setExams, folders, setFolders, educationLevels }) => {
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter State
  const [filterFormat, setFilterFormat] = useState<'ALL' | 'MCQ' | 'WRITTEN'>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL'); // NEW: Class Filter

  // Folder Creation/Edit State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTargetClass, setNewFolderTargetClass] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('');
  
  // Delete State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'FOLDER' | 'EXAM' }>({ isOpen: false, id: null, type: 'EXAM' });

  // Info Modal State
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
      setInfoModal({ isOpen: true, title, message, type });
  };

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
    showInfo("Success", "Exam created successfully! You can publish it when ready.");
  };

  const openCreateFolderModal = () => {
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderTargetClass('');
      setNewFolderIcon('');
      setIsFolderModalOpen(true);
  };

  const openEditFolderModal = (folder: Folder) => {
      setEditingFolder(folder);
      setNewFolderName(folder.name);
      setNewFolderTargetClass(folder.targetClass || '');
      setNewFolderIcon(folder.icon || '');
      setIsFolderModalOpen(true);
  };

  const handleFolderSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      
      if (editingFolder) {
          // Update
          setFolders(prev => prev.map(f => f.id === editingFolder.id ? {
              ...f,
              name: newFolderName,
              targetClass: newFolderTargetClass || undefined,
              icon: newFolderIcon || undefined
          } : f));
          showInfo("Success", "Folder updated!");
      } else {
          // Create
          const newFolder: Folder = {
              id: `exam_folder_${Date.now()}`,
              name: newFolderName,
              description: 'Exam Category',
              type: 'EXAM',
              targetClass: newFolderTargetClass || undefined,
              icon: newFolderIcon || undefined
          };
          // UPDATED: Prepend new folder
          setFolders([newFolder, ...folders]);
          showInfo("Success", "Folder created!");
      }
      
      setNewFolderName('');
      setNewFolderTargetClass('');
      setNewFolderIcon('');
      setEditingFolder(null);
      setIsFolderModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setNewFolderIcon(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const initiateDeleteFolder = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const hasExams = exams.some(e => e.folderId === id);
      if (hasExams) {
          showInfo("Cannot Delete", "Cannot delete folder because it contains exams.", "ERROR");
          return;
      }
      setDeleteModal({ isOpen: true, id, type: 'FOLDER' });
  };

  const handleTogglePublish = (id: string, currentStatus: boolean) => {
      setExams(exams.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
  };

  const initiateDeleteExam = (id: string) => {
      setDeleteModal({ isOpen: true, id, type: 'EXAM' });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          if (deleteModal.type === 'FOLDER') {
              setFolders(folders.filter(f => f.id !== deleteModal.id));
          } else {
              setExams(exams.filter(e => e.id !== deleteModal.id));
          }
          setDeleteModal({ isOpen: false, id: null, type: 'EXAM' });
      }
  };

  // Filter for EXAM type folders only
  const examFolders = folders.filter(f => f.type === 'EXAM');

  const foldersByClass = useMemo(() => {
      const groups: Record<string, Folder[]> = {};
      examFolders.forEach(folder => {
          // Class Filter Logic
          if (filterClass !== 'ALL' && folder.targetClass !== filterClass) return;

          const key = folder.targetClass || 'General / Uncategorized';
          if (!groups[key]) groups[key] = [];
          groups[key].push(folder);
      });
      return groups;
  }, [examFolders, filterClass]);

  const sortedClassKeys = Object.keys(foldersByClass).sort((a, b) => {
      if (a.includes('General')) return 1;
      if (b.includes('General')) return -1;
      return a.localeCompare(b);
  });

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
                    folders={examFolders}
                    fixedFolderId={currentFolderId || undefined}
                    educationLevels={educationLevels} // Pass to Form
                  />
              </Card>
          </div>
      );
  }

  // 2. Folder Detail View
  if (currentFolderId) {
      const currentFolder = folders.find(f => f.id === currentFolderId);
      const folderExams = exams.filter(e => {
          const folderMatch = e.folderId === currentFolderId;
          const formatMatch = filterFormat === 'ALL' || e.examFormat === filterFormat;
          return folderMatch && formatMatch;
      });

      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center">
                      <Button variant="outline" className="mr-4 bg-white shadow-sm hover:bg-slate-50" onClick={() => { setCurrentFolderId(null); setFilterFormat('ALL'); }}>
                          <ArrowLeft size={16} />
                      </Button>
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                              {currentFolder?.icon ? (
                                  <img src={currentFolder.icon} className="w-8 h-8 mr-2 object-contain" alt="icon" />
                              ) : (
                                  <FolderOpen className="mr-2 text-amber-500" size={28} />
                              )}
                              {currentFolder?.name}
                          </h1>
                          <p className="text-sm text-slate-500 ml-9">
                              Managing exams
                              {currentFolder?.targetClass && <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{currentFolder.targetClass}</span>}
                          </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Button onClick={() => setIsCreating(true)} className="flex items-center">
                          <Plus size={18} className="mr-2" /> Create Exam
                      </Button>
                  </div>
              </div>

              {/* FILTER TABS */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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

              {folderExams.length === 0 ? (
                  <Card className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200">
                      <FileQuestion size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="mb-4">No exams found matching your filter.</p>
                      {filterFormat === 'ALL' && (
                          <Button variant="outline" onClick={() => setIsCreating(true)}>Set First Exam</Button>
                      )}
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
                                          {exam.targetClass && (
                                              <Badge color="bg-slate-100 text-slate-600">{exam.targetClass}</Badge>
                                          )}
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
                                  <button onClick={() => initiateDeleteExam(exam.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
              <p className="text-slate-500 text-sm">Select a folder to manage or set exams.</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
              {/* NEW CLASS FILTER */}
              <div className="relative">
                  <Target className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                  <select 
                      className="pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                  >
                      <option value="ALL">All Classes</option>
                      <optgroup label="Regular">
                          {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="Admission">
                          {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                  </select>
              </div>

              <Button variant="outline" onClick={openCreateFolderModal} className="flex items-center text-sm">
                  <FolderPlus size={16} className="mr-2" /> New Folder
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

      {/* Folder Grid - Grouped by Class */}
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FolderIcon size={20} className="mr-2 text-amber-500" /> Exam Folders
          </h3>
          
          {sortedClassKeys.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <Target size={48} className="mx-auto mb-2 opacity-20" />
                  <p>No folders found for this class.</p>
              </div>
          ) : (
              sortedClassKeys.map(className => (
                  <div key={className} className="mb-6">
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center border-b border-slate-200 pb-1">
                          <Target size={16} className="mr-2" /> {className}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {foldersByClass[className].map(folder => {
                              const examCount = exams.filter(e => e.folderId === folder.id).length;
                              return (
                                <div 
                                    key={folder.id} 
                                    onDoubleClick={() => setCurrentFolderId(folder.id)}
                                    className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-amber-300 cursor-pointer select-none h-44 flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        {folder.icon ? (
                                            <img src={folder.icon} alt="icon" className="w-10 h-10 object-contain mb-2" />
                                        ) : (
                                            <FolderIcon className="text-amber-400 fill-amber-50 mb-2" size={32} />
                                        )}
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEditFolderModal(folder); }}
                                                className="text-indigo-400 hover:text-indigo-600 p-1"
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => initiateDeleteFolder(e, folder.id)} 
                                                className="text-slate-300 hover:text-red-500 p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm truncate w-full" title={folder.name}>{folder.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{examCount} Exams</p>
                                    </div>
                                    <div className="mt-2 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded truncate">
                                        {folder.targetClass || 'Public'}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentFolderId(folder.id)}
                                        className="absolute inset-0 w-full h-full z-0"
                                    />
                                </div>
                              );
                          })}
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Modal for Folder Creation/Edit */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title={editingFolder ? "Edit Exam Folder" : "Create Exam Folder"}>
          <form onSubmit={handleFolderSubmit}>
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

              {/* Target Class Selection */}
              <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Class / Group</label>
                  <div className="relative">
                      <Target size={16} className="absolute left-3 top-3 text-slate-400" />
                      <select 
                          className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={newFolderTargetClass}
                          onChange={e => setNewFolderTargetClass(e.target.value)}
                      >
                          <option value="">-- All Classes / Public --</option>
                          <optgroup label="Regular & Job Prep">
                              {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                          <optgroup label="Admission">
                              {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                      </select>
                  </div>
              </div>

              {/* Folder Icon Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Icon (Optional)</label>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    accept="image/*"
                />
                <div className="flex items-center gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center"
                    >
                        <Upload size={14} className="mr-2" /> Upload Icon
                    </Button>
                    
                    {newFolderIcon && (
                        <div className="relative group border border-slate-200 rounded p-1">
                            <img src={newFolderIcon} alt="Preview" className="w-10 h-10 object-contain" />
                            <button 
                                type="button" 
                                onClick={() => setNewFolderIcon('')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingFolder ? "Update Folder" : "Create Folder"}</Button>
              </div>
          </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Are you sure you want to delete this {deleteModal.type === 'FOLDER' ? 'Folder' : 'Exam'}?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
          </div>
      </Modal>

      {/* INFO MODAL */}
      <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
          <div className="space-y-4">
              <div className={`p-4 rounded-lg border flex items-start ${infoModal.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {infoModal.type === 'SUCCESS' ? <CheckCircle size={24} className="mr-3 shrink-0" /> : <AlertTriangle size={24} className="mr-3 shrink-0" />}
                  <p>{infoModal.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default ExamCreation;
