import React, { useState, useEffect } from 'react';
import { Button, Card, Badge } from './UI';
import { Exam, ExamQuestion, Folder } from '../types';
import { Plus, Trash2, CheckCircle, Save, FileText, List, AlertOctagon, Image as ImageIcon, Type, Bold, Divide, Target } from 'lucide-react';

interface ExamCreationFormProps {
  onSubmit: (data: Omit<Exam, 'id'>) => void;
  folders: Folder[];
  fixedFolderId?: string;
  educationLevels: { REGULAR: string[], ADMISSION: string[] }; // Added Prop
}

const ExamCreationForm: React.FC<ExamCreationFormProps> = ({ onSubmit, folders, fixedFolderId, educationLevels }) => {
  // --- BASIC INFO STATE ---
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    folderId: fixedFolderId || '',
    targetClass: '',
    type: 'GENERAL' as 'LIVE' | 'GENERAL',
    examFormat: 'MCQ' as 'MCQ' | 'WRITTEN',
    durationMinutes: 30,
    startTime: '',
    negativeMarks: 0.25 // Only applies to MCQ usually
  });

  // --- QUESTIONS STATE ---
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    { 
        id: 'q1', 
        text: '', 
        marks: 5, 
        type: 'MCQ', 
        options: ['', '', '', ''], 
        correctOption: 0,
        image: ''
    }
  ]);

  const [activeImageInputIndex, setActiveImageInputIndex] = useState<number | null>(null);

  // Derived Stats
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const questionsCount = questions.length;

  // --- HANDLERS ---

  // Update question structure when format changes
  useEffect(() => {
      setQuestions(prev => prev.map(q => ({
          ...q,
          type: basicInfo.examFormat,
          // Reset options if switching to written
          options: basicInfo.examFormat === 'WRITTEN' ? undefined : (q.options || ['', '', '', '']),
          correctOption: basicInfo.examFormat === 'WRITTEN' ? undefined : (q.correctOption ?? 0)
      })));
  }, [basicInfo.examFormat]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { 
        id: `q_${Date.now()}`, 
        text: '', 
        marks: basicInfo.examFormat === 'WRITTEN' ? 10 : 5, 
        type: basicInfo.examFormat,
        options: basicInfo.examFormat === 'MCQ' ? ['', '', '', ''] : undefined,
        correctOption: basicInfo.examFormat === 'MCQ' ? 0 : undefined,
        image: ''
      }
    ]);
  };

  const removeQuestion = (index: number) => {
      if (questions.length <= 1) return;
      setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: any) => {
      const updated = [...questions];
      updated[index] = { ...updated[index], [field]: value };
      setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, text: string) => {
      const updated = [...questions];
      if (updated[qIndex].options) {
          const newOpts = [...updated[qIndex].options!];
          newOpts[optIndex] = text;
          updated[qIndex].options = newOpts;
      }
      setQuestions(updated);
  };

  // --- EDITOR TOOLBAR HANDLERS ---
  const insertTextAtCursor = (index: number, textToInsert: string) => {
      const q = questions[index];
      const newText = q.text + textToInsert; // Simple append for demo
      updateQuestion(index, 'text', newText);
  };

  const toggleImageInput = (index: number) => {
      setActiveImageInputIndex(activeImageInputIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicInfo.title || !basicInfo.folderId) {
      alert("Please fill Title and Select a Folder");
      return;
    }
    
    if (basicInfo.type === 'LIVE' && !basicInfo.startTime) {
      alert("Start time is required for Live Exams");
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim() && !questions[i].image) {
            alert(`Question ${i+1} is empty (needs text or image).`);
            return;
        }
        if (basicInfo.examFormat === 'MCQ') {
            if (questions[i].options?.some(o => !o.trim())) {
                alert(`All options for Question ${i+1} must be filled.`);
                return;
            }
        }
    }

    onSubmit({
      title: basicInfo.title,
      folderId: basicInfo.folderId,
      targetClass: basicInfo.targetClass || undefined,
      type: basicInfo.type,
      examFormat: basicInfo.examFormat,
      durationMinutes: basicInfo.durationMinutes,
      startTime: basicInfo.type === 'LIVE' ? basicInfo.startTime : undefined,
      negativeMarks: basicInfo.examFormat === 'MCQ' ? basicInfo.negativeMarks : 0,
      totalMarks,
      questionsCount,
      questionList: questions,
      isPublished: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      
      {/* 1. BASIC CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Title</label>
                  <input 
                      type="text" required 
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. Mid-Term Physics"
                      value={basicInfo.title}
                      onChange={e => setBasicInfo({...basicInfo, title: e.target.value})}
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Folder</label>
                  {fixedFolderId ? (
                      <div className="w-full p-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg">
                          {folders.find(f => f.id === fixedFolderId)?.name || 'Selected Folder'}
                          <input type="hidden" value={basicInfo.folderId} />
                      </div>
                  ) : (
                      <select 
                          required
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={basicInfo.folderId}
                          onChange={e => setBasicInfo({...basicInfo, folderId: e.target.value})}
                      >
                          <option value="">-- Choose Folder --</option>
                          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                  )}
              </div>

              {/* Target Class Selection */}
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Audience (Class)</label>
                  <div className="relative">
                      <Target size={16} className="absolute left-3 top-3 text-slate-400" />
                      <select 
                          className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={basicInfo.targetClass}
                          onChange={e => setBasicInfo({...basicInfo, targetClass: e.target.value})}
                      >
                          <option value="">-- Same as Folder / Public --</option>
                          <optgroup label="Regular & Job Prep">
                              {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                          <optgroup label="Admission">
                              {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                      </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Min)</label>
                      <input 
                          type="number" min="1" required
                          className="w-full p-2 border rounded-lg outline-none"
                          value={basicInfo.durationMinutes}
                          onChange={e => setBasicInfo({...basicInfo, durationMinutes: Number(e.target.value)})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Exam Type</label>
                      <select 
                          className="w-full p-2 border rounded-lg outline-none"
                          value={basicInfo.type}
                          onChange={e => setBasicInfo({...basicInfo, type: e.target.value as any})}
                      >
                          <option value="GENERAL">General (Anytime)</option>
                          <option value="LIVE">Live (Scheduled)</option>
                      </select>
                  </div>
              </div>

              {basicInfo.type === 'LIVE' && (
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Start Date & Time</label>
                      <input 
                          type="datetime-local" required
                          className="w-full p-2 border rounded-lg outline-none border-red-200 bg-red-50"
                          value={basicInfo.startTime}
                          onChange={e => setBasicInfo({...basicInfo, startTime: e.target.value})}
                      />
                  </div>
              )}
          </div>

          <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Format</label>
                  <div className="flex bg-white rounded-lg border border-slate-300 p-1">
                      <button
                        type="button"
                        onClick={() => setBasicInfo({...basicInfo, examFormat: 'MCQ'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center ${basicInfo.examFormat === 'MCQ' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <List size={16} className="mr-2" /> MCQ
                      </button>
                      <button
                        type="button"
                        onClick={() => setBasicInfo({...basicInfo, examFormat: 'WRITTEN'})}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center ${basicInfo.examFormat === 'WRITTEN' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          <FileText size={16} className="mr-2" /> Written
                      </button>
                  </div>
               </div>
               
               {basicInfo.examFormat === 'MCQ' && (
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Negative Marking (per wrong answer)</label>
                      <input 
                          type="number" step="0.05" min="0"
                          className="w-full p-2 border rounded-lg outline-none"
                          value={basicInfo.negativeMarks}
                          onChange={e => setBasicInfo({...basicInfo, negativeMarks: Number(e.target.value)})}
                      />
                   </div>
               )}

               <div className="bg-white p-4 rounded-lg border border-slate-200 mt-4">
                   <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Summary</h4>
                   <div className="flex justify-between items-center mb-1">
                       <span className="text-sm text-slate-600">Total Questions:</span>
                       <span className="font-bold text-slate-800">{questionsCount}</span>
                   </div>
                   <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-600">Total Marks:</span>
                       <Badge color="bg-indigo-100 text-indigo-700">{totalMarks}</Badge>
                   </div>
               </div>
          </div>
      </div>

      {/* 2. QUESTION BUILDER */}
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Questions</h3>
              <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  <Plus size={16} className="mr-2" /> Add Question
              </Button>
          </div>

          <div className="space-y-6">
              {questions.map((q, idx) => (
                  <Card key={q.id} className="relative border border-slate-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute top-4 right-4">
                         <button 
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                         >
                             <Trash2 size={18} />
                         </button>
                      </div>

                      <div className="flex gap-4">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                              {idx + 1}
                          </div>
                          <div className="flex-1 space-y-4 pr-10">
                              
                              {/* Rich Editor Area */}
                              <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100">
                                  {/* Toolbar */}
                                  <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-2">
                                      <button type="button" onClick={() => insertTextAtCursor(idx, '**Bold** ')} className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Bold"><Bold size={14}/></button>
                                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                      <button type="button" onClick={() => insertTextAtCursor(idx, '∫ ')} className="p-1 hover:bg-slate-200 rounded text-slate-600 font-serif" title="Integral">∫</button>
                                      <button type="button" onClick={() => insertTextAtCursor(idx, '√ ')} className="p-1 hover:bg-slate-200 rounded text-slate-600 font-serif" title="Square Root">√</button>
                                      <button type="button" onClick={() => insertTextAtCursor(idx, '∑ ')} className="p-1 hover:bg-slate-200 rounded text-slate-600 font-serif" title="Sum">∑</button>
                                      <button type="button" onClick={() => insertTextAtCursor(idx, 'π ')} className="p-1 hover:bg-slate-200 rounded text-slate-600 font-serif" title="Pi">π</button>
                                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                      <button type="button" onClick={() => toggleImageInput(idx)} className={`p-1 hover:bg-slate-200 rounded ${activeImageInputIndex === idx ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`} title="Add Image"><ImageIcon size={14}/></button>
                                      <button type="button" onClick={() => insertTextAtCursor(idx, '<span style="color:red">Text</span> ')} className="p-1 hover:bg-slate-200 rounded text-red-500 font-bold" title="Red Color">A</button>
                                  </div>

                                  {/* Image Input (Toggle) */}
                                  {activeImageInputIndex === idx && (
                                      <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 animate-fade-in">
                                          <ImageIcon size={14} className="text-slate-400"/>
                                          <input 
                                            type="text" 
                                            className="flex-1 text-xs p-1.5 border rounded focus:outline-none"
                                            placeholder="Paste Image URL here..."
                                            value={q.image || ''}
                                            onChange={e => updateQuestion(idx, 'image', e.target.value)}
                                          />
                                          <button type="button" onClick={() => toggleImageInput(idx)} className="text-xs text-slate-500 hover:text-slate-800">Close</button>
                                      </div>
                                  )}

                                  {/* Text Area */}
                                  <textarea 
                                      required
                                      className="w-full p-3 outline-none text-sm min-h-[80px] resize-y"
                                      placeholder="Type your question here. Use toolbar for symbols."
                                      value={q.text}
                                      onChange={e => updateQuestion(idx, 'text', e.target.value)}
                                  />
                                  
                                  {/* Image Preview */}
                                  {q.image && (
                                      <div className="p-2 bg-slate-50 border-t border-slate-200">
                                          <img src={q.image} alt="Question Attachment" className="max-h-32 rounded border border-slate-200" />
                                      </div>
                                  )}
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marks</label>
                                  <input 
                                      type="number" min="1" required
                                      className="w-24 p-2 border rounded-lg outline-none font-bold text-center"
                                      value={q.marks}
                                      onChange={e => updateQuestion(idx, 'marks', Number(e.target.value))}
                                  />
                              </div>

                              {/* MCQ Options */}
                              {basicInfo.examFormat === 'MCQ' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                                      {q.options?.map((opt, optIdx) => (
                                          <div key={optIdx} className="flex items-center">
                                              <input 
                                                  type="radio"
                                                  name={`correct_${q.id}`}
                                                  checked={q.correctOption === optIdx}
                                                  onChange={() => updateQuestion(idx, 'correctOption', optIdx)}
                                                  className="mr-2 text-emerald-600 focus:ring-emerald-500"
                                              />
                                              <input 
                                                  type="text" required
                                                  className={`flex-1 p-2 text-sm border rounded-lg focus:outline-none ${q.correctOption === optIdx ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}
                                                  placeholder={`Option ${optIdx + 1}`}
                                                  value={opt}
                                                  onChange={e => updateOption(idx, optIdx, e.target.value)}
                                              />
                                          </div>
                                      ))}
                                      <p className="col-span-full text-xs text-slate-400 mt-1 flex items-center">
                                          <CheckCircle size={12} className="mr-1" /> Select the radio button to mark correct answer.
                                      </p>
                                  </div>
                              )}

                              {/* Written Info */}
                              {basicInfo.examFormat === 'WRITTEN' && (
                                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center text-orange-800 text-sm">
                                      <AlertOctagon size={16} className="mr-2" />
                                      Students will upload images as the answer for this question.
                                  </div>
                              )}
                          </div>
                      </div>
                  </Card>
              ))}
          </div>

          <div className="pt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={addQuestion} className="w-full border-dashed border-2 text-slate-500">
                  <Plus size={16} className="mr-2" /> Add Another Question
              </Button>
          </div>
      </div>

      <div className="pt-6 border-t border-slate-200">
          <Button type="submit" className="w-full py-3 text-lg flex items-center justify-center">
              <Save size={20} className="mr-2" /> Save Exam
          </Button>
      </div>

    </form>
  );
};

export default ExamCreationForm;