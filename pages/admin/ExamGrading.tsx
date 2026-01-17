import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { MOCK_SUBMISSIONS } from '../../constants';
import { ExamSubmission, Exam, User } from '../../types';
import { CheckSquare, Save, FolderOpen, ChevronDown, ChevronRight, FileCheck, Clock, CheckCircle2, UserCheck, Target, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
    exams?: Exam[]; 
    currentUser?: User | null;
}

const ExamGrading: React.FC<Props> = ({ exams = [], currentUser }) => {
    const [submissions, setSubmissions] = useState<ExamSubmission[]>(MOCK_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
    
    // Grading State
    const [marksInput, setMarksInput] = useState<Record<string, number>>({}); 
    const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
    
    // UI State
    const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
    const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>({});
    const [filterClass, setFilterClass] = useState<string>('ALL');

    // Info Modal State
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

    // --- ANALYTICS DASHBOARD ---
    const stats = useMemo(() => {
        const total = submissions.length;
        const pending = submissions.filter(s => s.status === 'PENDING').length;
        const graded = submissions.filter(s => s.status === 'GRADED').length;
        return { total, pending, graded };
    }, [submissions]);

    // --- DATA GROUPING LOGIC ---
    const groupedSubmissions = useMemo(() => {
        const groups: Record<string, Record<string, ExamSubmission[]>> = {};

        submissions.forEach(sub => {
            const exam = exams.find(e => e.id === sub.examId);
            const className = exam?.targetClass || 'Uncategorized';

            // Filter Check
            if (filterClass !== 'ALL' && className !== filterClass) return;

            if (!groups[className]) groups[className] = {};
            if (!groups[className][sub.examId]) groups[className][sub.examId] = [];
            
            groups[className][sub.examId].push(sub);
        });

        return groups;
    }, [submissions, exams, filterClass]);

    const availableClasses = useMemo(() => {
        const classes = new Set<string>();
        exams.forEach(e => classes.add(e.targetClass || 'Uncategorized'));
        return Array.from(classes).sort();
    }, [exams]);

    // --- ACTIONS ---

    const handleOpenGrading = (sub: ExamSubmission) => {
        setSelectedSubmission(sub);
        const initialMarks: Record<string, number> = {};
        const initialFeedback: Record<string, string> = {};
        
        sub.answers.forEach(ans => {
            initialMarks[ans.questionId] = 0;
            initialFeedback[ans.questionId] = ans.feedback || '';
        });
        
        setMarksInput(initialMarks);
        setFeedbackInput(initialFeedback);
    };

    const handleSaveGrade = () => {
        if (!selectedSubmission) return;

        const totalObtained = Object.values(marksInput).reduce((sum: number, current: number) => sum + current, 0);

        setSubmissions(prev => prev.map(s => 
            s.id === selectedSubmission.id 
            ? { 
                ...s, 
                status: 'GRADED', 
                obtainedMarks: totalObtained,
                gradedBy: currentUser?.name || 'Admin', 
                answers: s.answers.map(ans => ({
                    ...ans,
                    feedback: feedbackInput[ans.questionId] 
                }))
              } 
            : s
        ));

        setInfoModal({
            isOpen: true,
            title: "Grading Complete",
            message: `Total Marks Given: ${totalObtained}`
        });
        setSelectedSubmission(null);
    };

    const toggleClass = (className: string) => {
        setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }));
    };

    const toggleExam = (examId: string) => {
        setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
    };

    const getExamName = (id: string) => exams.find(e => e.id === id)?.title || 'Unknown Exam';

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            
            {/* 1. HEADER & MINI DASHBOARD */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center mb-6">
                    <CheckSquare className="mr-3 text-indigo-600" size={28} />
                    Written Exam Grading
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="flex items-center p-4 border-l-4 border-l-blue-500">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600 mr-4">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Submissions</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                        </div>
                    </Card>
                    <Card className="flex items-center p-4 border-l-4 border-l-amber-500">
                        <div className="p-3 bg-amber-50 rounded-full text-amber-600 mr-4">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending Review</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.pending}</h3>
                        </div>
                    </Card>
                    <Card className="flex items-center p-4 border-l-4 border-l-emerald-500">
                        <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mr-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Graded & Published</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.graded}</h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* 2. FILTER BAR */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Target size={18} className="text-slate-400" />
                    <select 
                        className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700 min-w-[200px]"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="ALL">All Classes</option>
                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="text-xs text-slate-400">
                    Showing submissions for {filterClass === 'ALL' ? 'all classes' : filterClass}
                </div>
            </div>

            {/* 3. GROUPED SUBMISSION LIST */}
            <div className="space-y-4">
                {Object.keys(groupedSubmissions).length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                        <FolderOpen size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No submissions found for the selected criteria.</p>
                    </div>
                ) : (
                    Object.keys(groupedSubmissions).map(className => (
                        <Card key={className} className="p-0 overflow-hidden border border-slate-200">
                            {/* Class Header */}
                            <div 
                                onClick={() => toggleClass(className)}
                                className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <h3 className="font-bold text-slate-700 flex items-center">
                                    {expandedClasses[className] ? <ChevronDown size={18} className="mr-2"/> : <ChevronRight size={18} className="mr-2"/>}
                                    {className}
                                </h3>
                                <Badge color="bg-white text-slate-500 border border-slate-200">
                                    {Object.keys(groupedSubmissions[className]).length} Exams
                                </Badge>
                            </div>

                            {/* Exam List within Class */}
                            {expandedClasses[className] && (
                                <div className="divide-y divide-slate-100">
                                    {Object.keys(groupedSubmissions[className]).map(examId => {
                                        const examSubmissions = groupedSubmissions[className][examId];
                                        const pendingCount = examSubmissions.filter(s => s.status === 'PENDING').length;
                                        const examName = getExamName(examId);

                                        return (
                                            <div key={examId} className="bg-white">
                                                {/* Exam Header */}
                                                <div 
                                                    onClick={() => toggleExam(examId)}
                                                    className="p-3 pl-8 flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 transition-colors border-l-4 border-l-transparent hover:border-l-indigo-500"
                                                >
                                                    <div className="flex items-center">
                                                        <FolderOpen size={16} className="text-indigo-400 mr-2" />
                                                        <span className="text-sm font-bold text-slate-700">{examName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {pendingCount > 0 && (
                                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center">
                                                                <Clock size={10} className="mr-1" /> {pendingCount} Pending
                                                            </span>
                                                        )}
                                                        <Badge color="bg-slate-100 text-slate-500">{examSubmissions.length} Papers</Badge>
                                                    </div>
                                                </div>

                                                {/* Submissions List */}
                                                {expandedExams[examId] && (
                                                    <div className="bg-slate-50/50 p-3 pl-12 grid gap-2">
                                                        {examSubmissions.map(sub => (
                                                            <div key={sub.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-800">{sub.studentName}</p>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="text-xs text-slate-400">ID: {sub.studentId.substring(0, 6)}...</span>
                                                                        <span className="text-xs text-slate-400 flex items-center">
                                                                            <Clock size={10} className="mr-1"/> {new Date(sub.submittedAt).toLocaleDateString()}
                                                                        </span>
                                                                        {sub.gradedBy && (
                                                                            <span className="text-xs text-emerald-600 font-medium flex items-center bg-emerald-50 px-1.5 rounded">
                                                                                <UserCheck size={10} className="mr-1"/> Checked by: {sub.gradedBy}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-3">
                                                                    <Badge color={sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                                                        {sub.status}
                                                                    </Badge>
                                                                    
                                                                    {sub.status === 'PENDING' ? (
                                                                        <Button onClick={() => handleOpenGrading(sub)} size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
                                                                            Grade Now
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-lg font-bold text-indigo-700">{sub.obtainedMarks} Marks</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* GRADING MODAL */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-scale-up">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                                    <CheckSquare size={18} className="mr-2 text-indigo-600"/> 
                                    Grading: {selectedSubmission.studentName}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Exam: {getExamName(selectedSubmission.examId)}</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-6">
                            {selectedSubmission.answers.map((ans, idx) => {
                                const exam = exams.find(e => e.id === selectedSubmission.examId);
                                const question = exam?.questionList?.find(q => q.id === ans.questionId);

                                return (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                            <div className="flex-1 pr-4">
                                                <span className="text-xs font-bold text-indigo-600 uppercase mb-1 block">Question {idx + 1}</span>
                                                <p className="text-slate-800 font-medium text-sm">{question?.text}</p>
                                            </div>
                                            <Badge color="bg-slate-200 text-slate-600">Max: {question?.marks || 0}</Badge>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Answer Images */}
                                            <div className="flex overflow-x-auto gap-4 pb-2">
                                                {ans.writtenImages?.map((img, i) => (
                                                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block w-48 h-64 shrink-0 border rounded-lg overflow-hidden relative group bg-slate-100">
                                                        <img src={img} alt="Answer" className="w-full h-full object-contain" />
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs cursor-zoom-in">
                                                            Click to Zoom
                                                        </div>
                                                    </a>
                                                ))}
                                                {(!ans.writtenImages || ans.writtenImages.length === 0) && (
                                                    <div className="text-slate-400 text-sm italic p-4">No images uploaded for this answer.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Feedback & Scoring Section */}
                                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                {/* Feedback Input */}
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                                                        <MessageCircle size={12} className="mr-1" /> Feedback / Remarks
                                                    </label>
                                                    <textarea 
                                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm resize-none h-20"
                                                        placeholder="Write specific feedback here (e.g. calculation error in line 2)..."
                                                        value={feedbackInput[ans.questionId] || ''}
                                                        onChange={(e) => setFeedbackInput({...feedbackInput, [ans.questionId]: e.target.value})}
                                                    />
                                                </div>

                                                {/* Marks Input */}
                                                <div className="w-full md:w-32">
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Marks Awarded</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            max={question?.marks}
                                                            min="0"
                                                            className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center font-bold text-xl text-indigo-700 outline-none"
                                                            value={marksInput[ans.questionId] || 0}
                                                            onChange={(e) => setMarksInput({...marksInput, [ans.questionId]: Number(e.target.value)})}
                                                        />
                                                        <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-slate-400 font-medium">/{question?.marks}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                            <div className="text-sm text-slate-500">
                                Total: <span className="font-bold text-indigo-600">{Object.values(marksInput).reduce((a: number, b: number)=>a+b,0)}</span> Marks
                            </div>
                            <Button onClick={handleSaveGrade} className="flex items-center px-6 bg-indigo-600 hover:bg-indigo-700">
                                <Save size={18} className="mr-2" /> Finalize & Publish
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
                <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start text-emerald-800">
                        <CheckCircle size={24} className="mr-3 shrink-0" />
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

export default ExamGrading;