import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from '../../constants';
import { ExamSubmission } from '../../types';
import { CheckSquare, Search, Eye, CheckCircle, Save } from 'lucide-react';

const ExamGrading: React.FC = () => {
    const [submissions, setSubmissions] = useState<ExamSubmission[]>(MOCK_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
    const [marksInput, setMarksInput] = useState<Record<string, number>>({}); // questionId -> marks

    const handleOpenGrading = (sub: ExamSubmission) => {
        setSelectedSubmission(sub);
        // Initialize marks with 0 or existing
        const initialMarks: Record<string, number> = {};
        sub.answers.forEach(ans => initialMarks[ans.questionId] = 0);
        setMarksInput(initialMarks);
    };

    const handleSaveGrade = () => {
        if (!selectedSubmission) return;

        const totalObtained = Object.values(marksInput).reduce((sum: number, current: number) => sum + current, 0);

        // Update local state mock
        setSubmissions(prev => prev.map(s => 
            s.id === selectedSubmission.id 
            ? { ...s, status: 'GRADED', obtainedMarks: totalObtained } 
            : s
        ));

        alert(`Grading Complete! Total Marks Given: ${totalObtained}`);
        setSelectedSubmission(null);
    };

    const getExamTitle = (id: string) => MOCK_EXAMS.find(e => e.id === id)?.title || 'Unknown Exam';

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800">Exam Grading (Written)</h1>

            {/* Submission List */}
            <div className="grid gap-4">
                {submissions.length === 0 ? (
                    <Card className="text-center py-10 text-slate-400">
                        No submissions pending for grading.
                    </Card>
                ) : (
                    submissions.map(sub => (
                        <Card key={sub.id} className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800">{sub.studentName}</h3>
                                <p className="text-sm text-slate-500">{getExamTitle(sub.examId)}</p>
                                <p className="text-xs text-slate-400">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge color={sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                    {sub.status}
                                </Badge>
                                {sub.status === 'PENDING' && (
                                    <Button onClick={() => handleOpenGrading(sub)} size="sm" className="flex items-center">
                                        <CheckSquare size={16} className="mr-2" /> Grade Now
                                    </Button>
                                )}
                                {sub.status === 'GRADED' && (
                                    <div className="text-xl font-bold text-indigo-600">
                                        {sub.obtainedMarks} Marks
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Grading Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800">Grading: {selectedSubmission.studentName}</h3>
                                <p className="text-xs text-slate-500">{getExamTitle(selectedSubmission.examId)}</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-slate-200 rounded-full">X</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 space-y-8">
                            {selectedSubmission.answers.map((ans, idx) => {
                                // Find question details from MOCK_EXAMS
                                const exam = MOCK_EXAMS.find(e => e.id === selectedSubmission.examId);
                                const question = exam?.questionList?.find(q => q.id === ans.questionId);

                                return (
                                    <Card key={idx} className="p-0 overflow-hidden">
                                        <div className="p-4 bg-white border-b border-slate-200">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-indigo-600">Question {idx + 1}</span>
                                                <Badge color="bg-slate-100">Max Marks: {question?.marks || 0}</Badge>
                                            </div>
                                            <p className="text-slate-800 font-medium">{question?.text}</p>
                                        </div>

                                        <div className="p-4 bg-slate-50 space-y-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Student Answer Images:</p>
                                            <div className="flex overflow-x-auto gap-4 pb-2">
                                                {ans.writtenImages?.map((img, i) => (
                                                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block w-64 h-64 shrink-0 border rounded-lg overflow-hidden relative group">
                                                        <img src={img} alt="Answer" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold">
                                                            View Full Size
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
                                            <label className="text-sm font-bold text-slate-700">Marks Awarded:</label>
                                            <input 
                                                type="number" 
                                                max={question?.marks}
                                                min="0"
                                                className="w-24 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                value={marksInput[ans.questionId] || 0}
                                                onChange={(e) => setMarksInput({...marksInput, [ans.questionId]: Number(e.target.value)})}
                                            />
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                            <Button onClick={handleSaveGrade} className="flex items-center">
                                <Save size={18} className="mr-2" /> Finalize Grades
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamGrading;