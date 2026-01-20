
import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Badge } from './UI';
import { Folder, MCQQuestion } from '../types';
import { Plus, Trash2, CheckCircle, AlertCircle, Save, Crown, BookOpen, Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface McqContentFormProps {
  folders: Folder[];
  fixedFolderId?: string;
  initialData?: { title: string; folderId: string; questionList?: MCQQuestion[]; isPremium?: boolean };
  onSubmit: (data: { title: string; folderId: string; questions: number; questionList: MCQQuestion[]; isPremium: boolean }) => void;
}

const McqContentForm: React.FC<McqContentFormProps> = ({ folders, fixedFolderId, initialData, onSubmit }) => {
  // Basic Info
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(fixedFolderId || '');
  const [isPremium, setIsPremium] = useState(false);

  // Question Builder State
  const [questions, setQuestions] = useState<MCQQuestion[]>([
    { id: 'q1', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }
  ]);

  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setFolderId(initialData.folderId);
      setIsPremium(initialData.isPremium || false);
      if (initialData.questionList && initialData.questionList.length > 0) {
        setQuestions(initialData.questionList);
      } else {
         setQuestions([{ id: `q${Date.now()}`, questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }]);
      }
    } else {
      setTitle('');
      setFolderId(fixedFolderId || '');
      setIsPremium(false);
      setQuestions([{ id: `q${Date.now()}`, questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }]);
    }
  }, [initialData, fixedFolderId]);

  // Handlers
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { 
        id: `q${Date.now()}`, 
        questionText: '', 
        options: ['', '', '', ''], 
        correctOptionIndex: 0,
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
        alert("You must have at least one question.");
        return;
    }
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQ = [...questions];
    newQ[index].questionText = text;
    setQuestions(newQ);
  };

  const updateExplanation = (index: number, text: string) => {
    const newQ = [...questions];
    newQ[index].explanation = text;
    setQuestions(newQ);
  };

  const updateExplanationImage = (index: number, url: string) => {
    const newQ = [...questions];
    newQ[index].explanationImage = url;
    setQuestions(newQ);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex] = text;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].correctOptionIndex = optIndex;
    setQuestions(newQ);
  };

  // Image Upload Logic
  const triggerImageUpload = (index: number) => {
      setActiveUploadIndex(index);
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || activeUploadIndex === null) return;

      setIsUploading(true);

      if (file.size < 500 * 1024) {
          // Base64 for small files
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  updateExplanationImage(activeUploadIndex, event.target.result as string);
                  setIsUploading(false);
                  setActiveUploadIndex(null);
              }
          };
          reader.readAsDataURL(file);
      } else {
          // Storage for larger files
          const storageRef = ref(storage, `explanation_images/${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on('state_changed', null, 
              (error) => {
                  console.error(error);
                  alert("Upload failed.");
                  setIsUploading(false);
                  setActiveUploadIndex(null);
              },
              async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  updateExplanationImage(activeUploadIndex, downloadURL);
                  setIsUploading(false);
                  setActiveUploadIndex(null);
              }
          );
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !folderId) {
      alert("Please fill in the title and select a folder.");
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].questionText.trim()) {
            alert(`Question ${i + 1} is empty.`);
            return;
        }
        if (questions[i].options.some(opt => !opt.trim())) {
            alert(`All 4 options for Question ${i + 1} must be filled.`);
            return;
        }
    }

    onSubmit({
        title,
        folderId,
        questions: questions.length,
        questionList: questions,
        isPremium
    });

    if (!initialData) {
        setTitle('');
        setQuestions([{ id: `q_${Date.now()}`, questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' }]);
        setIsPremium(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in h-[70vh] flex flex-col">
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

      {/* 1. Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MCQ Set Title</label>
            <input 
            type="text"
            required
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. Physics Chapter 1 Quiz"
            value={title}
            onChange={e => setTitle(e.target.value)}
            />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Folder</label>
            {fixedFolderId ? (
                <div className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 truncate">
                    {folders.find(f => f.id === fixedFolderId)?.name || 'Selected Folder'}
                </div>
            ) : (
                <select 
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={folderId}
                    onChange={e => setFolderId(e.target.value)}
                >
                    <option value="">Choose a folder...</option>
                    {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Premium Toggle */}
        <div className="flex items-end">
            <label className={`w-full flex items-center justify-between p-2 rounded-lg border-2 cursor-pointer transition-all ${isPremium ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center">
                    <div className={`p-1 rounded-full mr-2 ${isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Crown size={16} fill={isPremium ? "currentColor" : "none"} />
                    </div>
                    <span className={`text-sm font-bold ${isPremium ? 'text-amber-700' : 'text-slate-500'}`}>
                        {isPremium ? 'Premium / Paid' : 'Free Content'}
                    </span>
                </div>
                <input 
                    type="checkbox" 
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    checked={isPremium}
                    onChange={e => setIsPremium(e.target.checked)}
                />
            </label>
        </div>
      </div>

      <div className="border-t border-slate-200 my-2"></div>

      {/* 2. Questions List (Scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800">Questions ({questions.length})</h3>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus size={16} className="mr-2" /> Add Question
            </Button>
        </div>

        {questions.map((q, qIndex) => (
            <Card key={q.id} className="relative border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4">
                    <button 
                        type="button" 
                        onClick={() => removeQuestion(qIndex)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Question"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                
                <div className="mb-4 pr-8">
                    <label className="block text-xs font-bold text-indigo-600 mb-1">QUESTION {qIndex + 1}</label>
                    <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        rows={2}
                        placeholder="Type the question here..."
                        value={q.questionText}
                        onChange={e => updateQuestionText(qIndex, e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="relative">
                            <div className="flex items-center mb-1">
                                <span className={`text-xs font-bold w-6 ${q.correctOptionIndex === optIdx ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <input 
                                    type="text"
                                    className={`w-full p-2 text-sm border rounded-lg focus:outline-none ${
                                        q.correctOptionIndex === optIdx
                                        ? 'border-emerald-400 bg-emerald-50 focus:ring-2 focus:ring-emerald-500' 
                                        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                                    }`}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    value={opt}
                                    onChange={e => updateOptionText(qIndex, optIdx, e.target.value)}
                                />
                            </div>
                            <div className="ml-6 flex items-center">
                                <input 
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={q.correctOptionIndex === optIdx}
                                    onChange={() => setCorrectOption(qIndex, optIdx)}
                                    className="mr-1.5 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={`text-[10px] cursor-pointer ${q.correctOptionIndex === optIdx ? 'text-emerald-600 font-bold' : 'text-slate-400'}`} onClick={() => setCorrectOption(qIndex, optIdx)}>
                                    {q.correctOptionIndex === optIdx ? 'Correct Answer' : 'Mark as Correct'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* EXPLANATION SECTION */}
                <div className="pt-4 border-t border-slate-100 bg-indigo-50/50 p-3 rounded-b-lg -mx-6 -mb-6 px-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                        <BookOpen size={14} className="mr-1" /> Answer Explanation (SEO Optimized)
                    </label>
                    <textarea 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm resize-none"
                        rows={3}
                        placeholder="Explain why the answer is correct (optional)..."
                        value={q.explanation || ''}
                        onChange={e => updateExplanation(qIndex, e.target.value)}
                    />
                    
                    <div className="mt-2 flex items-center gap-2">
                        {q.explanationImage ? (
                            <div className="relative group inline-block">
                                <img src={q.explanationImage} alt="Exp" className="h-16 rounded border border-slate-300 bg-white" />
                                <button 
                                    type="button" 
                                    onClick={() => updateExplanationImage(qIndex, '')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <Button 
                                type="button" 
                                size="sm" 
                                variant="outline" 
                                onClick={() => triggerImageUpload(qIndex)}
                                disabled={isUploading}
                                className="text-xs h-8"
                            >
                                {isUploading && activeUploadIndex === qIndex ? <Loader2 size={12} className="animate-spin mr-1"/> : <ImageIcon size={14} className="mr-1" />}
                                Add Explanation Image
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        ))}
        
        <div className="flex justify-center pt-4 pb-8">
             <Button type="button" variant="outline" onClick={addQuestion} className="w-full border-dashed border-2">
                <Plus size={16} className="mr-2" /> Add Another Question
            </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <Button type="submit" className="w-full py-3 flex items-center justify-center">
             <Save size={18} className="mr-2" /> {initialData ? 'Update MCQ Set' : 'Save MCQ Set'}
        </Button>
      </div>
    </form>
  );
};

export default McqContentForm;
