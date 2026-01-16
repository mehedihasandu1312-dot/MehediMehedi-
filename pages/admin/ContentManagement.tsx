import React, { useState, useMemo, useRef } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import WrittenContentForm from '../../components/WrittenContentForm';
import McqContentForm from '../../components/McqContentForm';
import { StudyContent, ContentType, Folder } from '../../types';
import { EDUCATION_LEVELS } from '../../constants';
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
    Upload
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
}

const ContentManagement: React.FC<ContentManagementProps> = ({ folders, setFolders, contents, setContents }) => {
  // Navigation State (Explorer)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentTypeToAdd, setContentTypeToAdd] = useState<ContentType>(ContentType.WRITTEN);
  const [editingContent, setEditingContent] = useState<StudyContent | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  
  // Form Data
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderTargetClass, setNewFolderTargetClass] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DASHBOARD STATISTICS ---
  const stats = useMemo(() => {
    // Filter only CONTENT folders
    const contentFolders = folders.filter(f => !f.type || f.type === 'CONTENT');
    
    const totalFolders = contentFolders.length;
    const totalFiles = contents.filter(c => !c.isDeleted).length;
    const writtenCount = contents.filter(c => !c.isDeleted && c.type === ContentType.WRITTEN).length;
    const mcqCount = contents.filter(c => !c.isDeleted && c.type === ContentType.MCQ).length;
    // Simulated storage
    const storageUsed = ((writtenCount * 1.5) + (mcqCount * 0.5)).toFixed(1); 

    return { totalFolders, totalFiles, writtenCount, mcqCount, storageUsed };
  }, [folders, contents]);

  // --- EXPLORER LOGIC ---
  const currentFolder = folders.find(f => f.id === currentFolderId);

  // Recursive Breadcrumbs
  const getBreadcrumbs = (folderId: string | null): Folder[] => {
    if (!folderId) return [];
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return [...getBreadcrumbs(folder.parentId || null), folder];
  };

  const breadcrumbs = useMemo(() => getBreadcrumbs(currentFolderId), [currentFolderId, folders]);

  // Filter items for current view
  // IMPORTANT: Filter by type 'CONTENT' (or undefined for backward compatibility)
  const displayedFolders = folders.filter(f => 
    ((currentFolderId === null && !f.parentId) || f.parentId === currentFolderId) &&
    (!f.type || f.type === 'CONTENT')
  );
  
  const displayedContents = contents.filter(c => 
    !c.isDeleted && c.folderId === (currentFolderId || 'root_unsupported_in_demo')
  );

  // --- GROUPING LOGIC (Group by Target Class) ---
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
        alert("Folder updated successfully!");
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
        setFolders([...folders, newFolder]);
        alert("Folder created successfully!");
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
    // Determine type based on properties or context
    const isMcq = 'questions' in data || 'questionList' in data;
    
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
                questionList: data.questionList 
              } 
            : c
        ));
        alert(`${isMcq ? 'MCQ Set' : 'Written Content'} updated successfully!`);
    } else {
        // Create New
        const newContent: StudyContent = {
            id: `content_${Date.now()}`,
            folderId: data.folderId,
            title: data.title,
            type: isMcq ? ContentType.MCQ : ContentType.WRITTEN,
            body: data.body,
            questions: data.questions,
            questionList: data.questionList, // Save detailed questions
            isDeleted: false
        };
        setContents([newContent, ...contents]);
        
        // If we added content to a different folder than current, navigate there or alert
        if (currentFolderId !== data.folderId) {
            if(confirm("Content added to a different folder. Navigate there now?")) {
                setCurrentFolderId(data.folderId);
            }
        } else {
            alert(`${isMcq ? 'MCQ Set' : 'Written Content'} added successfully!`);
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
      // Reset to default
      setContentTypeToAdd(ContentType.WRITTEN); 
  };

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Check for children
    const hasChildren = folders.some(f => f.parentId === id) || contents.some(c => c.folderId === id && !c.isDeleted);
    if (hasChildren) {
        alert("Cannot delete non-empty folder. Remove contents first.");
        return;
    }
    if (confirm("Delete this folder?")) {
        setFolders(folders.filter(f => f.id !== id));
    }
  };

  const handleDeleteContent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this file?")) {
        setContents(contents.map(c => c.id === id ? { ...c, isDeleted: true } : c));
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
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
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
        <Card className="flex items-center p-4 border-l-4 border-l-indigo-500">
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 mr-4">
                <HardDrive size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Storage</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.storageUsed} MB</h3>
            </div>
        </Card>
        <Card className="flex items-center p-4 border-l-4 border-l-amber-500">
            <div className="bg-amber-50 p-3 rounded-lg text-amber-600 mr-4">
                <Layers size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Folders</p>
                <h3 className="text-xl font-bold text-slate-800">{stats.totalFolders}</h3>
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
                    {/* Render Grouped Folders (Only if there are keys to group by) */}
                    {sortedClassKeys.length > 0 ? (
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
                    ) : (
                        // Fallback if no folders
                        null
                    )}

                    {/* Content Files (Separate Section) */}
                    {displayedContents.length > 0 && (
                        <div>
                            {displayedFolders.length > 0 && <div className="my-6 border-t border-slate-100"></div>}
                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center">
                                <FileText size={14} className="mr-2" /> Files
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {displayedContents.map(content => (
                                    <div 
                                        key={content.id}
                                        className={`group p-4 border rounded-xl hover:shadow-md cursor-default transition-all relative h-36 flex flex-col ${
                                            content.type === ContentType.WRITTEN 
                                            ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-100 hover:border-blue-300' 
                                            : 'bg-purple-50/50 border-purple-100 hover:bg-purple-100 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-2 rounded-lg ${
                                                content.type === ContentType.WRITTEN ? 'bg-blue-200 text-blue-700' : 'bg-purple-200 text-purple-700'
                                            }`}>
                                                {content.type === ContentType.WRITTEN ? <FileText size={20} /> : <CheckSquare size={20} />}
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
                                                    onClick={(e) => handleDeleteContent(e, content.id)}
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
                                                {content.type === ContentType.WRITTEN ? 'Read Only Note' : `${content.questions} Questions`}
                                            </p>
                                        </div>
                                        <div className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                                            content.type === ContentType.WRITTEN ? 'text-blue-700' : 'text-purple-700'
                                        }`}>
                                            {content.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Empty State for current folder */}
                    {displayedFolders.length === 0 && displayedContents.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <p>This folder is empty.</p>
                            <div className="flex justify-center gap-3 mt-4">
                                <Button variant="outline" size="sm" onClick={openCreateFolderModal}>
                                    <FolderPlus size={14} className="mr-2"/> Add Sub-folder
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsContentModalOpen(true)}>
                                    <FilePlus size={14} className="mr-2"/> Add File
                                </Button>
                            </div>
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
                            {EDUCATION_LEVELS.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                        <optgroup label="Admission">
                            {EDUCATION_LEVELS.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
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

      {/* Add/Edit Content Large Modal */}
      <LargeModal isOpen={isContentModalOpen} onClose={handleCloseContentModal} title={editingContent ? "Edit Study Content" : "Add Study Content"}>
        <div className="space-y-6">
            {/* Type Switcher (Locked if editing) */}
            <div className="flex bg-slate-100 p-1 rounded-lg max-w-md mx-auto">
                <button 
                    disabled={!!editingContent}
                    onClick={() => setContentTypeToAdd(ContentType.WRITTEN)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        contentTypeToAdd === ContentType.WRITTEN ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    } ${editingContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Written Note (Word Editor)
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
            </div>

            <div className="text-xs text-indigo-600 bg-indigo-50 p-3 rounded border border-indigo-100 flex items-center justify-center">
                {editingContent ? (
                     <>Editing content in: <span className="font-bold ml-1">{folders.find(f => f.id === editingContent.folderId)?.name}</span></>
                ) : currentFolderId ? (
                    <>Adding to Folder: <span className="font-bold ml-1">{currentFolder?.name}</span></>
                ) : (
                    <>Adding to: <span className="font-bold ml-1">Selected Folder</span> (Choose inside form)</>
                )}
            </div>

            {/* Forms - Pass filtered folders (CONTENT Type) */}
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
            ) : (
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
            )}
        </div>
      </LargeModal>

    </div>
  );
};

export default ContentManagement;