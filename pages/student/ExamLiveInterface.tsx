import React, { useState, useEffect, useMemo } from 'react';
import { Exam, StudentResult, ExamSubmission } from '../../types';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Clock, CheckCircle, Upload, X, AlertOctagon, Check, ArrowLeft, HelpCircle } from 'lucide-react';
import { authService } from '../../services/authService';

interface ExamLiveInterfaceProps {
    exam: Exam;
    onExit: () => void;
    onComplete: (result: StudentResult) => void;
    onSubmissionCreate?: (submission: ExamSubmission) => void; 
}

const ExamLiveInterface: React.FC<ExamLiveInterfaceProps> = ({ exam, onExit, onComplete, onSubmissionCreate }) => {
    // --- HOOKS (Must be unconditional) ---
    const duration = exam?.durationMinutes || 30;
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({}); // questionId -> array of base64
    
    // Result State
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [negativeDeduction, setNegativeDeduction] = useState(0);

    // Safe Question List
    const questions = useMemo(() => exam?.questionList || [], [exam]);

    // Prevent accidental tab close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isSubmitted) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSubmitted]);

    // Timer Logic
    useEffect(() => {
        if (isSubmitted) return;
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted]);

    // Calculate Attempted Count (Safe)
    const attemptedCount = useMemo(() => {
        if (!exam) return 0;
        try {
            if (exam.examFormat === 'MCQ') {
                return Object.keys(answers).length;
            } else {
                // For written, count questions that have at least one uploaded file
                return Object.keys(uploadedFiles).filter(key => {
                    const files = uploadedFiles[key];
                    return Array.isArray(files) && files.length > 0;
                }).length;
            }
        } catch (e) {
            console.error("Error calculating attempted count", e);
            return 0;
        }
    }, [answers, uploadedFiles, exam]);

    // --- SAFETY CHECK: If exam prop is somehow missing after hooks ---
    if (!exam) return <div className="p-10 text-center text-slate-500 font-bold">Loading Exam Data...</div>;

    // Format Time
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- HELPER: Parse Rich Text from Admin ---
    const renderFormattedText = (text: string) => {
        if (!text) return { __html: '' };
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');
        return { __html: formatted };
    };

    // Handle MCQ Selection
    const handleOptionSelect = (qId: string, optIndex: number) => {
        setAnswers(prev => ({ ...prev, [qId]: optIndex }));
    };

    // Handle Written Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            
            // Validation
            if (files.length > 5) {
                alert("You can upload maximum 5 images per question.");
                return;
            }

            files.forEach((file: File) => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large. Max 5MB allowed.`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        const base64 = event.target.result as string;
                        setUploadedFiles(prev => {
                            const currentFiles = prev[qId] || [];
                            return { ...prev, [qId]: [...currentFiles, base64] };
                        });
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (qId: string, index: number) => {
        setUploadedFiles(prev => {
            const currentFiles = prev[qId] || [];
            return {
                ...prev,
                [qId]: currentFiles.filter((_, i) => i !== index)
            };
        });
    };

    const confirmSubmit = () => {
        setShowConfirmModal(true);
    };

    const handleSubmit = () => {
        setShowConfirmModal(false);
        setIsSubmitted(true);
        if (exam.examFormat === 'MCQ') {
            calculateMCQResult();
        } else {
            submitWrittenExam();
        }
    };

    const submitWrittenExam = () => {
        const currentUser = authService.getCurrentUser();
        
        // Create Submission Object safely
        const submission: ExamSubmission = {
            id: `sub_${Date.now()}`,
            examId: exam.id,
            studentId: currentUser?.id || 'unknown_user',
            studentName: currentUser?.name || 'Unknown Student',
            submittedAt: new Date().toISOString(),
            status: 'PENDING',
            obtainedMarks: 0,
            answers: questions.map(q => ({
                questionId: q.id,
                writtenImages: uploadedFiles[q.id] || []
            }))
        };

        if (onSubmissionCreate) {
            onSubmissionCreate(submission);
        }
    };

    const calculateMCQResult = () => {
        let correct = 0;
        let wrong = 0;
        let obtained = 0;

        questions.forEach(q => {
            const userAnswer = answers[q.id];
            if (userAnswer !== undefined) {
                if (userAnswer === q.correctOption) {
                    correct++;
                    obtained += q.marks;
                } else {
                    wrong++;
                }
            }
        });

        const neg = wrong * (exam.negativeMarks || 0);
        const finalScore = Math.max(0, obtained - neg);

        setCorrectCount(correct);
        setWrongCount(wrong);
        setNegativeDeduction(neg);
        setScore(finalScore);

        const percentage = (finalScore / exam.totalMarks) * 100;
        const resultStatus = percentage >= 80 ? 'MERIT' : percentage >= 40 ? 'PASSED' : 'FAILED';
        const currentUser = authService.getCurrentUser();

        onComplete({
            id: `res_${Date.now()}`,
            studentId: currentUser?.id || 'unknown',
            examId: exam.id,
            examTitle: exam.title,
            score: finalScore,
            totalMarks: exam.totalMarks,
            negativeDeduction: neg,
            date: new Date().toISOString(), 
            status: resultStatus
        });
    };

    // --- RESULT VIEW (MCQ) ---
    if (isSubmitted && exam.examFormat === 'MCQ') {
        const accuracy = questions.length > 0 
            ? Math.round((correctCount / questions.length) * 100) 
            : 0;

        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-8 pb-20">
                <Card className="text-center p-8 border-t-8 border-t-indigo-600 shadow-lg">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-slate-800">Exam Result</h2>
                        <p className="text-slate-500">{exam.title}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-bold ${score >= (exam.totalMarks * 0.4) ? "text-emerald-600" : "text-rose-600"}`}>
                                    {score.toFixed(1)}
                                </span>
                                <span className="text-xs text-slate-400 uppercase font-bold">Total Score</span>
                            </div>
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={score >= (exam.totalMarks * 0.4) ? "#10b981" : "#f43f5e"}
                                    strokeWidth="3"
                                    strokeDasharray={`${(score / exam.totalMarks) * 100}, 100`}
                                />
                            </svg>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                                <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
                                <div className="text-xs text-emerald-700 uppercase font-bold">Correct</div>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
                                <div className="text-2xl font-bold text-rose-600">{wrongCount}</div>
                                <div className="text-xs text-rose-700 uppercase font-bold">Wrong</div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                                <div className="text-2xl font-bold text-amber-600">-{negativeDeduction}</div>
                                <div className="text-xs text-amber-700 uppercase font-bold">Negative</div>
                            </div>
                             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <div className="text-2xl font-bold text-indigo-600">{accuracy}%</div>
                                <div className="text-xs text-indigo-700 uppercase font-bold">Accuracy</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                         <Button onClick={onExit} className="px-8">Back to Dashboard</Button>
                    </div>
                </Card>

                {/* Detailed Solution */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center">
                        <CheckCircle className="mr-2 text-indigo-600" /> Solution & Analysis
                    </h3>
                    
                    {questions.map((q, idx) => {
                         const userAnswer = answers[q.id];
                         const isSkipped = userAnswer === undefined;
                         const isCorrect = userAnswer === q.correctOption;
                         
                         let cardStyle = "border-l-4 border-slate-300"; 
                         let badge = <Badge color="bg-slate-100 text-slate-600">Skipped</Badge>;

                         if (!isSkipped) {
                             if (isCorrect) {
                                 cardStyle = "border-l-4 border-emerald-500 bg-emerald-50/20";
                                 badge = <Badge color="bg-emerald-100 text-emerald-700">Correct</Badge>;
                             } else {
                                 cardStyle = "border-l-4 border-red-500 bg-red-50/20";
                                 badge = <Badge color="bg-red-100 text-red-700">Wrong</Badge>;
                             }
                         }

                         return (
                             <Card key={q.id || idx} className={`${cardStyle} relative overflow-hidden`}>
                                 <div className="flex gap-4">
                                     <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0">
                                         {idx + 1}
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex justify-between items-start mb-3">
                                             <div className="pr-4">
                                                 <div 
                                                    className="font-medium text-slate-800 text-lg"
                                                    dangerouslySetInnerHTML={renderFormattedText(q.text)}
                                                 />
                                                 {q.image && (
                                                     <img src={q.image} alt="Question" className="mt-3 max-h-48 rounded-lg border border-slate-200" />
                                                 )}
                                             </div>
                                             <div className="shrink-0">{badge}</div>
                                         </div>

                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                             {q.options?.map((opt, optIdx) => {
                                                 const isSelected = userAnswer === optIdx;
                                                 const isRealCorrect = q.correctOption === optIdx;
                                                 
                                                 let optionClass = "border-slate-200 bg-white";
                                                 let icon = null;

                                                 if (isRealCorrect) {
                                                     optionClass = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
                                                     icon = <Check className="text-emerald-600" size={16} />;
                                                 } else if (isSelected && !isRealCorrect) {
                                                     optionClass = "border-red-500 bg-red-50";
                                                     icon = <X className="text-red-600" size={16} />;
                                                 } else if (isSelected) {
                                                     optionClass = "border-slate-400 bg-slate-100";
                                                 }

                                                 return (
                                                     <div key={optIdx} className={`p-3 rounded-lg border flex items-center justify-between ${optionClass}`}>
                                                         <div className="flex items-center">
                                                             <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 border ${
                                                                 isRealCorrect ? 'bg-emerald-600 text-white border-emerald-600' : 
                                                                 isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-slate-100 text-slate-500 border-slate-300'
                                                             }`}>
                                                                 {String.fromCharCode(65 + optIdx)}
                                                             </span>
                                                             <span className={`text-sm ${isRealCorrect ? 'font-bold text-emerald-900' : 'text-slate-700'}`}>
                                                                 {opt}
                                                             </span>
                                                         </div>
                                                         {icon}
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 </div>
                             </Card>
                         )
                    })}
                </div>
            </div>
        )
    }

    // --- SUBMISSION CONFIRMATION (WRITTEN) ---
    if (isSubmitted && exam.examFormat === 'WRITTEN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                 <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 animate-bounce">
                     <CheckCircle size={48} />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-800 mb-3">Submission Received!</h2>
                 <p className="text-slate-500 text-center max-w-md mb-8 leading-relaxed">
                     Your answer script has been uploaded successfully. <br/>
                     The results will be published on your dashboard once the admin grades your paper.
                 </p>
                 <Button onClick={onExit} size="lg">Return to Dashboard</Button>
            </div>
        )
    }

    // --- LIVE EXAM INTERFACE ---
    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in bg-slate-50/50">
             {/* Sticky Header */}
             <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
                 <div>
                     <h2 className="font-bold text-slate-800 text-lg">{exam.title}</h2>
                     <p className="text-xs text-slate-500">{exam.examFormat} • {questions.length} Questions • {exam.totalMarks} Marks</p>
                 </div>
                 
                 <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${
                     timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-700'
                 }`}>
                     <Clock size={20} className={timeLeft < 60 ? "animate-spin" : ""} />
                     <span className="font-mono font-bold text-xl tracking-widest">{formatTime(timeLeft)}</span>
                 </div>
             </div>

             {/* Question Body */}
             <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full pb-32">
                 {questions.map((q, idx) => (
                     <Card key={q.id || idx} className="relative border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                         <div className="flex gap-4">
                             {/* Question Number */}
                             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg shadow-slate-200">
                                 {idx + 1}
                             </div>
                             
                             <div className="flex-1">
                                 {/* Question Content */}
                                 <div className="mb-6">
                                     <div 
                                        className="text-lg text-slate-800 font-medium leading-relaxed"
                                        dangerouslySetInnerHTML={renderFormattedText(q.text)}
                                     />
                                     {q.image && (
                                         <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-xl inline-block">
                                             <img src={q.image} alt="Question Reference" className="max-h-80 rounded-lg" />
                                         </div>
                                     )}
                                 </div>

                                 {/* MCQ Options Area */}
                                 {exam.examFormat === 'MCQ' && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {q.options?.map((opt, optIdx) => (
                                             <label 
                                                key={optIdx} 
                                                className={`group relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                                    answers[q.id] === optIdx 
                                                    ? 'bg-indigo-50 border-indigo-600 shadow-md transform scale-[1.01]' 
                                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                                }`}
                                             >
                                                 <input 
                                                    type="radio" 
                                                    name={`q_${q.id}`} 
                                                    className="sr-only"
                                                    checked={answers[q.id] === optIdx}
                                                    onChange={() => handleOptionSelect(q.id, optIdx)}
                                                 />
                                                 
                                                 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors ${
                                                     answers[q.id] === optIdx 
                                                     ? 'border-indigo-600 bg-indigo-600 text-white' 
                                                     : 'border-slate-300 text-slate-400 group-hover:border-indigo-300'
                                                 }`}>
                                                     <span className="text-xs font-bold">{String.fromCharCode(65 + optIdx)}</span>
                                                 </div>
                                                 
                                                 <span className={`text-sm font-medium ${answers[q.id] === optIdx ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                     {opt}
                                                 </span>

                                                 {answers[q.id] === optIdx && (
                                                     <div className="absolute right-4 text-indigo-600">
                                                         <CheckCircle size={18} />
                                                     </div>
                                                 )}
                                             </label>
                                         ))}
                                     </div>
                                 )}

                                 {/* Written Upload Area */}
                                 {exam.examFormat === 'WRITTEN' && (
                                     <div className="space-y-4 mt-2">
                                         <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start text-amber-800 text-sm">
                                             <AlertOctagon size={20} className="mr-3 mt-0.5 shrink-0" />
                                             <p>Please write your answer on paper, take a clear photo, and upload it here. You can upload multiple images.</p>
                                         </div>
                                         
                                         <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white hover:bg-indigo-50/30 hover:border-indigo-300 transition-all relative cursor-pointer group">
                                             <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, q.id)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                             />
                                             <div className="flex flex-col items-center pointer-events-none">
                                                 <div className="p-4 bg-indigo-50 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                     <Upload size={28} className="text-indigo-600" />
                                                 </div>
                                                 <p className="text-base font-bold text-slate-700">Click to upload answer images</p>
                                                 <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
                                             </div>
                                         </div>

                                         {uploadedFiles[q.id] && uploadedFiles[q.id].length > 0 && (
                                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4 animate-fade-in">
                                                 {uploadedFiles[q.id].map((img, imgIdx) => (
                                                     <div key={imgIdx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] shadow-sm">
                                                         <img src={img} alt="Answer" className="w-full h-full object-cover" />
                                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                             <button 
                                                                onClick={() => removeImage(q.id, imgIdx)}
                                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-all"
                                                             >
                                                                 <X size={16} />
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>

                             {/* Marks Indicator */}
                             <div className="absolute top-4 right-4">
                                 <Badge color="bg-slate-100 text-slate-600 font-bold border border-slate-200">{q.marks} Marks</Badge>
                             </div>
                         </div>
                     </Card>
                 ))}
             </div>

             {/* Footer Actions */}
             <div className="bg-white p-4 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30 fixed bottom-0 w-full md:w-[calc(100%-256px)] right-0">
                 <div className="max-w-4xl mx-auto flex justify-between items-center">
                     <div className="text-sm text-slate-500 font-medium">
                         <span className="text-indigo-600 font-bold">{attemptedCount}</span> of {questions.length} Attempted
                     </div>
                     <Button 
                        size="lg"
                        className="px-8 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-shadow"
                        onClick={confirmSubmit}
                     >
                         Submit Exam
                     </Button>
                 </div>
             </div>

             {/* Confirmation Modal */}
             <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Submit Exam?">
                 <div className="text-center p-4">
                     <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                         <HelpCircle size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">Are you sure?</h3>
                     <p className="text-slate-500 mb-6">
                         You have answered <strong className="text-indigo-600">{attemptedCount}</strong> out of <strong className="text-slate-800">{questions.length}</strong> questions.
                         <br/>
                         Once submitted, you cannot change your answers.
                     </p>
                     <div className="flex gap-3 justify-center">
                         <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Keep Checking</Button>
                         <Button onClick={handleSubmit}>Yes, Submit Now</Button>
                     </div>
                 </div>
             </Modal>
        </div>
    );
};

export default ExamLiveInterface;