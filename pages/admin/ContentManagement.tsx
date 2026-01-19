
import React, { useState, useMemo, useRef } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import WrittenContentForm from '../../components/WrittenContentForm';
import McqContentForm from '../../components/McqContentForm';
import VideoContentForm from '../../components/VideoContentForm'; // NEW IMPORT
import { StudyContent, ContentType, Folder } from '../../types';
import { 
    Plus, 
    FileText, 
    CheckSquare, 
    Trash2, 
    Folder as FolderIcon, 
    FolderPlus, 
    FilePlus, 
    Home, 
    ChevronRight, 
    HardDrive, 
    Layers, 
    PieChart, 
    Search,
    FolderOpen,
    ArrowUp,
    Edit,
    Target,
    Image as ImageIcon,
    X,
    Upload,
    AlertTriangle,
    CheckCircle,
    PlayCircle,
    Youtube,
    Filter
} from 'lucide-react';

// Custom Large Modal for Content Editing
const LargeModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] md:h-auto overflow-hidden animate-fade-in flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1 transition-colors">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ContentManagementProps {
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    contents: StudyContent[];
    setContents: React.Dispatch<React.SetStateAction<StudyContent[]>>;
    educationLevels: { REGULAR: string[], ADMISSION: string[] }; 
}

const ContentManagement: React.FC<ContentManagementProps> = ({ folders, setFolders, contents, setContents, educationLevels }) => {
  // Navigation State (Explorer)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<'ALL' | ContentType>('ALL');

  // Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentTypeToAdd, setContentTypeToAdd] = useState<ContentType>(ContentType.WRITTEN);
  const [editingContent, setEditingContent] = useState<StudyContent | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  
  // Delete State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'FOLDER' | 'CONTENT' }>({ isOpen: false, id: null, type: 'CONTENT' });

  // Info Modal State
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'SUCCESS' | 'ERROR' }>({ isOpen: false, title: '', message: '', type: 'SUCCESS' });

  // Form Data
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderTargetClass, setNewFolderTargetClass] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper
  const showInfo = (title: string, message: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
      setInfoModal({ isOpen: true, title, message, type });
  };

  // --- DASHBOARD STATISTICS ---
  const stats = useMemo(() => {
    const contentFolders = folders.filter(f => !f.type || f.type === 'CONTENT');
    
    const totalFolders = contentFolders.length;
    const totalFiles = contents.filter(c => !c.isDeleted).length;
    const writtenCount = contents.filter(c => !c.isDeleted && c.type === ContentType.WRITTEN).length;
    const mcqCount = contents.filter(c => !c.isDeleted && c.type === ContentType.MCQ).length;
    const videoCount = contents.filter(c => !c.isDeleted && c.type === ContentType.VIDEO).length;
    const storageUsed = ((writtenCount * 1.5) + (mcqCount * 0.5) + (videoCount * 0.1)).toFixed(1); // Videos are links, so low storage

    return { totalFolders, totalFiles, writtenCount, mcqCount, videoCount, storageUsed };
  }, [folders, contents]);

  // --- EXPLORER LOGIC ---
  const currentFolder = folders.find(f => f.id === currentFolderId);

  const getBreadcrumbs = (folderId: string | null): Folder[] => {
    if (!folderId) return [];
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return [...getBreadcrumbs(folder.parentId || null), folder];
  };

  const breadcrumbs = useMemo(() => getBreadcrumbs(currentFolderId), [currentFolderId, folders]);

  const displayedFolders = folders.filter(f => 
    ((currentFolderId === null && !f.parentId) || f.parentId === currentFolderId) &&
    (!f.type || f.type === 'CONTENT')
  );
  
  // Apply Type Filter here
  const displayedContents = contents.filter(c => {
    const folderMatch = c.folderId === (currentFolderId || 'root_unsupported_in_demo');
    const deleteMatch = !c.isDeleted;
    const typeMatch = filterType === 'ALL' || c.type === filterType;
    return folderMatch && deleteMatch && typeMatch;
  });

  const foldersByClass = useMemo(() => {
      const groups: Record<string, Folder[]> = {};
      
      displayedFolders.forEach(folder => {
          const key = folder.targetClass || 'General / Uncategorized';
          if (!groups[key]) groups[key] = [];
          groups[key].push(folder);
      });
      
      return groups;
  }, [displayedFolders]);

  const sortedClassKeys = Object.keys(foldersByClass).sort((a, b) => {
      if (a === 'General / Uncategorized') return 1;
      if (b === 'General / Uncategorized') return -1;
      return a.localeCompare(b);
  });


  // --- HANDLERS ---

  const openCreateFolderModal = () => {
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderDesc('');
      setNewFolderTargetClass('');
      setNewFolderIcon('');
      setIsFolderModalOpen(true);
  };

  const openEditFolderModal = (folder: Folder) => {
      setEditingFolder(folder);
      setNewFolderName(folder.name);
      setNewFolderDesc(folder.description);
      setNewFolderTargetClass(folder.targetClass || '');
      setNewFolderIcon(folder.icon || '');
      setIsFolderModalOpen(true);
  };

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    if (editingFolder) {
        // Update
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? {
            ...f,
            name: newFolderName,
            description: newFolderDesc,
            targetClass: newFolderTargetClass || undefined,
            icon: newFolderIcon || undefined
        } : f));
        showInfo("Success", "Folder updated successfully!");
    } else {
        // Create
        const newFolder: Folder = {
            id: `folder_${Date.now()}`,
            name: newFolderName,
            description: newFolderDesc,
            parentId: currentFolderId || undefined,
            targetClass: newFolderTargetClass || undefined,
            type: 'CONTENT', // Hardcoded for this page
            icon: newFolderIcon || undefined
        };
        setFolders([newFolder, ...folders]);
        showInfo("Success", "Folder created successfully!");
    }

    setNewFolderName('');
    setNewFolderDesc('');
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

  const handleSaveContent = (data: any) => {
    const isMcq = 'questions' in data || 'questionList' in data;
    const isVideo = 'videoUrl' in data;
    
    let type = ContentType.WRITTEN;
    if (isMcq) type = ContentType.MCQ;
    if (isVideo) type = ContentType.VIDEO;

    if (editingContent) {
        // Update Existing
        setContents(prev => prev.map(c => 
            c.id === editingContent.id 
            ? { 
                ...c, 
                title: data.title, 
                folderId: data.folderId, 
                body: data.body,
                questions: data.questions,
                questionList: data.questionList,
                videoUrl: data.videoUrl // Add this
              } 
            : c
        ));
        showInfo("Success", `Content updated successfully!`);
    } else {
        // Create New
        const newContent: StudyContent = {
            id: `content_${Date.now()}`,
            folderId: data.folderId,
            title: data.title,
            type: type,
            body: data.body,
            questions: data.questions,
            questionList: data.questionList,
            videoUrl: data.videoUrl, // Add this
            isDeleted: false
        };
        setContents([newContent, ...contents]);
        
        if (currentFolderId !== data.folderId) {
             showInfo("Success", `Content added to selected folder!`);
        } else {
            showInfo("Success", `Content added successfully!`);
        }
    }

    handleCloseContentModal();
  };

  const handleEditContent = (content: StudyContent) => {
      setEditingContent(content);
      setContentTypeToAdd(content.type);
      setIsContentModalOpen(true);
  };

  const handleCloseContentModal = () => {
      setIsContentModalOpen(false);
      setEditingContent(null);
      setContentTypeToAdd(ContentType.WRITTEN); 
  };

  const initiateDeleteFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const hasChildren = folders.some(f => f.parentId === id) || contents.some(c => c.folderId === id && !c.isDeleted);
    if (hasChildren) {
        showInfo("Cannot Delete", "Cannot delete non-empty folder. Remove contents first.", "ERROR");
        return;
    }
    setDeleteModal({ isOpen: true, id, type: 'FOLDER' });
  };

  const initiateDeleteContent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, id, type: 'CONTENT' });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          if (deleteModal.type === 'FOLDER') {
              setFolders(folders.filter(f => f.id !== deleteModal.id));
          } else {
              setContents(contents.map(c => c.id === deleteModal.id ? { ...c, isDeleted: true } : c));
          }
          setDeleteModal({ isOpen: false, id: null, type: 'CONTENT' });
      }
  };

  const handleNavigateUp = () => {
      if (currentFolder?.parentId) {
          setCurrentFolderId(currentFolder.parentId);
      } else {
          setCurrentFolderId(null);
      }
  };

  const renderFolderCard = (folder: Folder) => (
      <div 
          key={folder.id}
          onDoubleClick={() => setCurrentFolderId(folder.id)}
          className="group p-4 bg-amber-50/50 border border-amber-100 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all relative select-none flex flex-col h-36"
      >
          <div className="flex justify-between items-start mb-2">
              <div className="relative">
                  {folder.icon ? (
                      <img src={folder.icon} alt="icon" className="w-10 h-10 object-contain" />
                  ) : (
                      <div className="p-2 bg-amber-200 text-amber-700 rounded-lg">
                          <FolderIcon size={20} />
                      </div>
                  )}
              </div>
              <div className="flex space-x-1">
                    <button 
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="text-amber-600 hover:text-amber-800 p-1 bg-white/50 rounded hover:bg-white"
                      title="Open Folder"
                  >
                      <FolderOpen size={16} />
                  </button>
                  <button 
                      onClick={() => openEditFolderModal(folder)}
                      className="text-indigo-400 hover:text-indigo-600 p-1 hover:bg-white/50 rounded"
                      title="Rename/Edit Folder"
                  >
                      <Edit size={16} />
                  </button>
                  <button 
                      onClick={(e) => initiateDeleteFolder(e, folder.id)}
                      className="text-amber-400 hover:text-red-500 p-1 hover:bg-white/50 rounded"
                      title="Delete Folder"
                  >
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
          <div className="flex-1 min-h-0">
              <h4 className="font-bold text-slate-800 truncate" title={folder.name}>{folder.name}</h4>
              <p className="text-xs text-slate-500 truncate">{folder.description || 'No description'}</p>
          </div>
          <div className="text-[10px] text-amber-700 font-medium uppercase tracking-wide mt-1 flex justify-between">
              <span>Folder</span>
              {folder.targetClass && <span className="text-indigo-600 bg-white px-1 rounded">{folder.targetClass}</span>}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Content Library</h1>
      </div>

      {/* 1. DASHBOARD STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ... Stats Cards ... */}
        <Card className="flex items-center p-4 border-l-4 border-l-indigo-500">
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 mr-4">
                <HardDrive size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Storage</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.storageUsed} MB</h3>
            </div>
        </Card>
        <Card className="flex items-center p-4 border-l-4 border-l-emerald-500">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 mr-4">
                <FileText size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Text Notes</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.writtenCount}</h3>
            </div>
        </Card>
        <Card className="flex items-center p-4 border-l-4 border-l-red-500">
            <div className="bg-red-50 p-3 rounded-lg text-red-600 mr-4">
                <Youtube size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Videos</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.videoCount}</h3>
            </div>
        </Card>
        <Card className="flex items-center p-4 border-l-4 border-l-purple-500">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600 mr-4">
                <CheckSquare size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">MCQ Sets</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.mcqCount}</h3>
            </div>
        </Card>
      </div>

      {/* 2. FILE EXPLORER */}
      <Card className="flex-1 flex flex-col min-h-[500px]">
        {/* Explorer Header / Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
            
            {/* Breadcrumbs */}
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
                {currentFolderId !== null && (
                    <button 
                        onClick={handleNavigateUp}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 mr-2 transition-colors"
                        title="Go Up"
                    >
                        <ArrowUp size={16} />
                    </button>
                )}

                <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
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

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    className="flex items-center text-sm"
                    onClick={openCreateFolderModal}
                >
                    <FolderPlus size={16} className="mr-2" /> New Folder
                </Button>
                <Button 
                    className="flex items-center text-sm"
                    onClick={() => setIsContentModalOpen(true)}
                    title="Add Content"
                >
                    <FilePlus size={16} className="mr-2" /> Add Content
                </Button>
            </div>
        </div>

        {/* Filter Tabs (Added in this change) */}
        {currentFolderId && (
            <div className="flex gap-2 mb-6 border-b border-slate-50 pb-2 overflow-x-auto">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === 'ALL' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    All Files
                </button>
                <button 
                    onClick={() => setFilterType(ContentType.WRITTEN)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === ContentType.WRITTEN ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Notes Only
                </button>
                <button 
                    onClick={() => setFilterType(ContentType.VIDEO)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === ContentType.VIDEO ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Videos Only
                </button>
                <button 
                    onClick={() => setFilterType(ContentType.MCQ)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === ContentType.MCQ ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Quizzes Only
                </button>
            </div>
        )}

        {/* Explorer Grid */}
        <div className="flex-1">
            {currentFolderId === null && displayedFolders.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <FolderPlus size={48} className="text-slate-300" />
                    </div>
                    <p>Root directory is empty.</p>
                    <Button variant="outline" className="mt-4" onClick={openCreateFolderModal}>Create First Folder</Button>
                 </div>
            ) : (
                <div className="space-y-8">
                    {/* Render Grouped Folders (Only show if filtering is set to ALL to avoid confusion, or handle nicely. 
                        Usually folders don't have types like MCQ/Written, so we show them only if filter is ALL) 
                    */}
                    {filterType === 'ALL' && sortedClassKeys.length > 0 && (
                        sortedClassKeys.map(className => (
                            <div key={className}>
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-1 flex items-center">
                                    <Target size={14} className="mr-2" />
                                    {className}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {foldersByClass[className].map(folder => renderFolderCard(folder))}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Content Files */}
                    {displayedContents.length > 0 && (
                        <div>
                            {/* Visual Separator if we have folders above */}
                            {filterType === 'ALL' && displayedFolders.length > 0 && <div className="my-6 border-t border-slate-100"></div>}
                            
                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center">
                                <FileText size={14} className="mr-2" /> 
                                {filterType === 'ALL' ? 'Files' : 
                                 filterType === ContentType.WRITTEN ? 'Written Notes' :
                                 filterType === ContentType.VIDEO ? 'Videos' : 'Quizzes'}
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {displayedContents.map(content => (
                                    <div 
                                        key={content.id}
                                        className={`group p-4 border rounded-xl hover:shadow-md cursor-default transition-all relative h-36 flex flex-col ${
                                            content.type === ContentType.WRITTEN 
                                            ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-100 hover:border-blue-300' 
                                            : content.type === ContentType.MCQ
                                            ? 'bg-purple-50/50 border-purple-100 hover:bg-purple-100 hover:border-purple-300'
                                            : 'bg-red-50/50 border-red-100 hover:bg-red-100 hover:border-red-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-2 rounded-lg ${
                                                content.type === ContentType.WRITTEN ? 'bg-blue-200 text-blue-700' : 
                                                content.type === ContentType.MCQ ? 'bg-purple-200 text-purple-700' :
                                                'bg-red-200 text-red-700'
                                            }`}>
                                                {content.type === ContentType.WRITTEN ? <FileText size={20} /> : 
                                                 content.type === ContentType.MCQ ? <CheckSquare size={20} /> :
                                                 <Youtube size={20} />}
                                            </div>
                                            <div className="flex space-x-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditContent(content); }}
                                                    className="text-indigo-400 hover:text-indigo-600 p-1 hover:bg-white/50 rounded"
                                                    title="Edit Content"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => initiateDeleteContent(e, content.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1 hover:bg-white/50 rounded"
                                                    title="Delete Content"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0">
                                            <h4 className="font-bold text-slate-800 truncate" title={content.title}>{content.title}</h4>
                                            <p className="text-xs text-slate-500 truncate">
                                                {content.type === ContentType.WRITTEN ? 'Read Only Note' : 
                                                 content.type === ContentType.MCQ ? `${content.questions} Questions` :
                                                 'Video Tutorial'}
                                            </p>
                                        </div>
                                        <div className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                                            content.type === ContentType.WRITTEN ? 'text-blue-700' : 
                                            content.type === ContentType.MCQ ? 'text-purple-700' :
                                            'text-red-700'
                                        }`}>
                                            {content.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {displayedFolders.length === 0 && displayedContents.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Filter size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No content found in this view.</p>
                            {filterType !== 'ALL' && (
                                <Button variant="outline" size="sm" onClick={() => setFilterType('ALL')} className="mt-2">Clear Filters</Button>
                            )}
                            {filterType === 'ALL' && (
                                <div className="flex justify-center gap-3 mt-4">
                                    <Button variant="outline" size="sm" onClick={openCreateFolderModal}>
                                        <FolderPlus size={14} className="mr-2"/> Add Sub-folder
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setIsContentModalOpen(true)}>
                                        <FilePlus size={14} className="mr-2"/> Add File
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </Card>

      {/* --- MODALS --- */}

      {/* Create/Edit Folder Modal */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title={editingFolder ? "Edit Folder" : "Create New Folder"}>
        <form onSubmit={handleFolderSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
                <input 
                    autoFocus
                    type="text" 
                    required 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Chapter 3"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Optional description"
                    value={newFolderDesc}
                    onChange={e => setNewFolderDesc(e.target.value)}
                />
            </div>

            {/* Target Class Selection */}
            <div>
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
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folder Icon/Image (Optional)</label>
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
            
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100">
                {currentFolderId ? (
                     <>Creating sub-folder inside: <span className="font-bold text-indigo-600">{currentFolder?.name}</span></>
                ) : (
                     <>Creating folder at: <span className="font-bold text-indigo-600">Content Root</span></>
                )}
            </div>

            <Button type="submit" className="w-full">{editingFolder ? "Update Folder" : "Create Folder"}</Button>
        </form>
      </Modal>

      {/* Add/Edit Content Large Modal - Updated with Video Option */}
      <LargeModal isOpen={isContentModalOpen} onClose={handleCloseContentModal} title={editingContent ? "Edit Study Content" : "Add Study Content"}>
        <div className="space-y-6">
            {/* Type Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg max-w-lg mx-auto">
                <button 
                    disabled={!!editingContent}
                    onClick={() => setContentTypeToAdd(ContentType.WRITTEN)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        contentTypeToAdd === ContentType.WRITTEN ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    } ${editingContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Written Note
                </button>
                <button 
                    disabled={!!editingContent}
                    onClick={() => setContentTypeToAdd(ContentType.MCQ)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        contentTypeToAdd === ContentType.MCQ ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    } ${editingContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    MCQ Builder
                </button>
                <button 
                    disabled={!!editingContent}
                    onClick={() => setContentTypeToAdd(ContentType.VIDEO)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        contentTypeToAdd === ContentType.VIDEO ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    } ${editingContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Video
                </button>
            </div>

            {/* Forms */}
            {contentTypeToAdd === ContentType.WRITTEN ? (
                <WrittenContentForm 
                    folders={folders.filter(f => !f.type || f.type === 'CONTENT')} 
                    fixedFolderId={editingContent ? editingContent.folderId : (currentFolderId || '')} 
                    initialData={editingContent && editingContent.type === ContentType.WRITTEN ? {
                        title: editingContent.title,
                        folderId: editingContent.folderId,
                        body: editingContent.body || ''
                    } : undefined}
                    onSubmit={handleSaveContent} 
                />
            ) : contentTypeToAdd === ContentType.MCQ ? (
                <McqContentForm 
                    folders={folders.filter(f => !f.type || f.type === 'CONTENT')}
                    fixedFolderId={editingContent ? editingContent.folderId : (currentFolderId || '')}
                    initialData={editingContent && editingContent.type === ContentType.MCQ ? {
                        title: editingContent.title,
                        folderId: editingContent.folderId,
                        questionList: editingContent.questionList
                    } : undefined}
                    onSubmit={handleSaveContent} 
                />
            ) : (
                <VideoContentForm 
                    folders={folders.filter(f => !f.type || f.type === 'CONTENT')}
                    fixedFolderId={editingContent ? editingContent.folderId : (currentFolderId || '')}
                    initialData={editingContent && editingContent.type === ContentType.VIDEO ? {
                        title: editingContent.title,
                        folderId: editingContent.folderId,
                        videoUrl: editingContent.videoUrl || '',
                        body: editingContent.body || '',
                        isPremium: editingContent.isPremium
                    } : undefined}
                    onSubmit={handleSaveContent}
                />
            )}
        </div>
      </LargeModal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Are you sure you want to delete this {deleteModal.type === 'FOLDER' ? 'Folder' : 'Item'}?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
          </div>
      </Modal>

      {/* SUCCESS/INFO MODAL */}
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

export default ContentManagement;
