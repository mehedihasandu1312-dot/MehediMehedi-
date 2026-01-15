import React, { useState } from 'react';
import { Card, Button, Modal, Badge } from '../../components/UI';
import { Folder, StudyContent, ContentType, MCQQuestion } from '../../types';
import { Folder as FolderIcon, FileText, CheckSquare, AlertTriangle, ArrowLeft, CheckCircle2, Bookmark, Flag, X } from 'lucide-react';

interface StudyContentPageProps {
    folders: Folder[];
    contents: StudyContent[];
    onAppealSubmit?: (data: { contentId: string; contentTitle: string; text: string; image?: string }) => void;
}

// Helper for deterministic gradient colors (Consistent with Exams Page)
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
  
  // Appeal State
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealTarget, setAppealTarget] = useState<{ id: string, title: string } | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealImage, setAppealImage] = useState<string>(''); // Base64 string for image

  // --- HELPER: Generate Dummy Questions if none exist (For Demo Purposes) ---
  const getDisplayQuestions = (content: StudyContent): MCQQuestion[] => {
    if (content.questionList && content.questionList.length > 0) {
      return content.questionList;
    }
    // Fallback for legacy data that only had 'questions: 20' count
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
        // Fallback if no handler passed
        alert(`Appeal submitted for: ${appealTarget?.title}\nIssue: ${appealText}`);
        setIsAppealModalOpen(false);
        setAppealTarget(null);
    }
  };

  // Filter folders for CONTENT type only
  const displayFolders = folders.filter(f => !f.type || f.type === 'CONTENT');

  const FolderList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayFolders.map((folder, index) => {
        const itemCount = contents.filter(c => c.folderId === folder.id).length;
        
        return (
            <div 
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg h-48 flex flex-col justify-between group ${getGradientClass(index)} text-white`}
            >
                {/* Background Decoration */}
                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500">
                    {folder.icon ? (
                        <img src={folder.icon} className="w-40 h-40 object-contain drop-shadow-md grayscale invert brightness-200" alt="" />
                    ) : (
                        <FolderIcon size={160} fill="currentColor" />
                    )}
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold leading-tight mb-2 drop-shadow-sm font-serif tracking-wide line-clamp-2">
                        {folder.name}
                    </h3>
                    <p className="text-white/90 text-sm font-medium line-clamp-2">
                        {folder.description || 'Lecture Notes & Materials'}
                    </p>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 hover:bg-black/30 transition-colors">
                        <FileText size={14} className="text-white/90" />
                        <span>{itemCount} Documents</span>
                    </div>
                    
                    <span className="flex items-center text-xs font-bold bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors group-hover:translate-x-1 duration-300">
                        <ArrowLeft className="rotate-180" size={16} />
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
      // --- CONTENT DETAIL VIEW ---
      return (
        <div className="max-w-4xl mx-auto">
          {/* Navigation & Header */}
          <div className="flex items-center justify-between mb-6">
             <Button variant="outline" onClick={() => setSelectedContent(null)} className="flex items-center text-sm bg-white border-slate-300 hover:bg-slate-50">
                <ArrowLeft size={16} className="mr-2" /> Back to Folder
              </Button>
          </div>

          {/* VIEW: WRITTEN CONTENT */}
          {selectedContent.type === ContentType.WRITTEN && (
            <div className="animate-fade-in space-y-4">
                <div className="bg-white rounded-none md:rounded-lg shadow-xl border border-slate-200 min-h-[80vh] relative overflow-hidden">
                    {/* Decorative Header Bar */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full"></div>
                    
                    <div className="p-8 md:p-12 pb-24">
                        {/* Title Section */}
                        <div className="border-b-2 border-slate-100 pb-6 mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 font-serif">{selectedContent.title}</h1>
                            <div className="flex items-center space-x-2">
                                <Badge color="bg-blue-100 text-blue-700">READING MATERIAL</Badge>
                                <span className="text-slate-400 text-sm">• {selectedFolder?.name}</span>
                            </div>
                        </div>

                        {/* Body Content */}
                        <div className="prose prose-lg prose-slate max-w-none font-serif leading-loose text-slate-700">
                             {/* Simulating paragraph breaks for demo if it's a short string */}
                             {selectedContent.body?.split('\n').map((paragraph, idx) => (
                                 <p key={idx}>{paragraph}</p>
                             ))}
                             {(!selectedContent.body || selectedContent.body.length < 50) && (
                                 <div className="text-slate-400 italic">
                                     [Content Placeholder: The admin has not added detailed text for this document yet.]
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Footer / Page Number Effect */}
                    <div className="absolute bottom-0 w-full bg-slate-50 border-t border-slate-100 py-2 px-8 flex justify-between text-xs text-slate-400">
                        <span>EduMaster Content</span>
                        <span>Page 1 of 1</span>
                    </div>
                </div>

                {/* Appeal Button for Written Content (At Bottom) */}
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

          {/* VIEW: MCQ STUDY MODE */}
          {selectedContent.type === ContentType.MCQ && (
              <div className="space-y-8 animate-fade-in pb-10">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg mb-8">
                      <div className="flex items-center space-x-3 mb-2 opacity-80">
                          <CheckSquare size={20} />
                          <span className="text-sm font-bold tracking-wider uppercase">MCQ Study Set</span>
                      </div>
                      <h1 className="text-3xl font-bold">{selectedContent.title}</h1>
                      <p className="mt-2 text-purple-100">Review the questions and memorize the correct answers below.</p>
                  </div>

                  {getDisplayQuestions(selectedContent).map((q, index) => (
                      <Card key={q.id || index} className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          {/* Question Header */}
                          <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-start gap-4">
                              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 text-white font-bold rounded-lg text-sm">
                                  {index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-slate-800 leading-snug pt-0.5">
                                  {q.questionText}
                              </h3>
                          </div>

                          {/* Options Grid */}
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
                          
                          {/* Footer with Appeal Button for this specific Question */}
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
                  
                  <div className="text-center text-slate-400 text-sm mt-8">
                      <Bookmark size={20} className="mx-auto mb-2" />
                      End of Study Set
                  </div>
              </div>
          )}
        </div>
      );
    }

    // --- LIST OF CONTENT IN FOLDER ---
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
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedContent(item)}
                className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-5">
                  <div className={`p-3 rounded-xl ${
                    item.type === ContentType.WRITTEN 
                    ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                  } transition-colors`}>
                    {item.type === ContentType.WRITTEN ? <FileText size={24} /> : <CheckSquare size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 capitalize flex items-center mt-1">
                        {item.type === ContentType.WRITTEN ? 'Document' : 'MCQ Set'} 
                        <span className="mx-2 text-slate-300">•</span>
                        {item.type === ContentType.WRITTEN ? 'Read Only' : `${item.questions || 'Multiple'} Questions`}
                    </p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-1">
                  <ArrowLeft className="rotate-180" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
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
             <div>
                You are reporting: <br/>
                <strong>{appealTarget?.title}</strong>
             </div>
          </div>
          <textarea
            required
            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"
            placeholder="Describe the error or issue clearly..."
            value={appealText}
            onChange={(e) => setAppealText(e.target.value)}
          />
          <div className="mb-4">
             <label className="block text-sm font-medium text-slate-700 mb-1">Attach Screenshot (Optional)</label>
             <input type="file" className="text-sm text-slate-500" onChange={handleImageUpload} accept="image/*" />
             {appealImage && (
                 <div className="mt-2 relative inline-block">
                     <img src={appealImage} alt="preview" className="h-20 rounded border" />
                     <button 
                        type="button" 
                        onClick={() => setAppealImage('')}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                     >
                         <X size={12} />
                     </button>
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