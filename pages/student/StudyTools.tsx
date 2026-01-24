
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/UI';
import { Calculator, Clock, Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import SEO from '../../components/SEO';

const StudyTools: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
            <SEO title="Study Tools" description="BD Standard GPA Calculator and Focus Timer." />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Calculator className="mr-3 text-indigo-600" size={28} />
                        Student Toolkit
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">GPA Calculator (BD Standard) & Productivity Timer.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. ADVANCED GPA CALCULATOR */}
                <GPACalculator />

                {/* 2. POMODORO TIMER */}
                <PomodoroTimer />
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: GPA CALCULATOR ---
const GPACalculator = () => {
    const [mode, setMode] = useState<'SSC_HSC' | 'HONOURS'>('SSC_HSC');
    const [subjects, setSubjects] = useState<{ id: string, grade: string, credit: number, isOptional: boolean }[]>([
        { id: '1', grade: 'A+', credit: 3, isOptional: false },
        { id: '2', grade: 'A+', credit: 3, isOptional: false },
        { id: '3', grade: 'A', credit: 3, isOptional: false },
        { id: '4', grade: 'A-', credit: 3, isOptional: false },
        { id: '5', grade: 'A+', credit: 3, isOptional: false },
        { id: '6', grade: 'A+', credit: 3, isOptional: true }, // Default optional
    ]);
    const [result, setResult] = useState<number | null>(null);
    const [resultDetails, setResultDetails] = useState<string>('');

    const GRADES: Record<string, number> = {
        'A+': 5.00, 'A': 4.00, 'A-': 3.50, 'B': 3.00, 'C': 2.00, 'D': 1.00, 'F': 0.00
    };

    // Reset when switching modes
    useEffect(() => {
        setResult(null);
        setResultDetails('');
        if (mode === 'SSC_HSC') {
            // Default setup for SSC/HSC (usually 6-9 subjects, equal weight)
            setSubjects(prev => prev.map(s => ({ ...s, credit: 1 }))); 
        }
    }, [mode]);

    const addSubject = () => {
        setSubjects([...subjects, { id: Date.now().toString(), grade: 'A+', credit: mode === 'HONOURS' ? 3 : 1, isOptional: false }]);
    };

    const removeSubject = (id: string) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };

    const updateSubject = (id: string, field: 'grade' | 'credit' | 'isOptional', value: any) => {
        if (field === 'isOptional' && value === true) {
            // Ensure only one optional subject for SSC/HSC (Radio behavior)
            setSubjects(subjects.map(s => s.id === id ? { ...s, isOptional: true } : { ...s, isOptional: false }));
        } else {
            setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
        }
    };

    const calculateResult = () => {
        let finalGPA = 0;
        let details = "";

        if (mode === 'SSC_HSC') {
            // --- SSC/HSC LOGIC (With 4th Subject) ---
            let totalPoints = 0;
            let mainSubjectCount = 0;
            let hasMainFail = false;
            let optionalPointsAdded = 0;

            const optionalSub = subjects.find(s => s.isOptional);
            const mainSubs = subjects.filter(s => !s.isOptional);

            // 1. Check Main Subjects
            mainSubs.forEach(s => {
                const gp = GRADES[s.grade];
                if (gp === 0) hasMainFail = true;
                totalPoints += gp;
                mainSubjectCount++;
            });

            if (hasMainFail) {
                setResult(0.00);
                setResultDetails("Failed in Main Subject(s)");
                return;
            }

            // 2. Handle Optional (4th) Subject
            if (optionalSub) {
                const gp = GRADES[optionalSub.grade];
                if (gp > 2.00) {
                    optionalPointsAdded = gp - 2.00;
                    totalPoints += optionalPointsAdded;
                }
            }

            // 3. Calculate GPA
            if (mainSubjectCount > 0) {
                finalGPA = totalPoints / mainSubjectCount;
                if (finalGPA > 5.00) finalGPA = 5.00; // Cap at 5.00
            }

            details = optionalSub 
                ? `Main Pts: ${totalPoints - optionalPointsAdded} + 4th Sub Bonus: ${optionalPointsAdded.toFixed(2)}`
                : "No Optional Subject Selected";

        } else {
            // --- HONOURS/UNIVERSITY LOGIC (Weighted Average) ---
            let totalPoints = 0;
            let totalCredits = 0;
            let hasFail = false;

            subjects.forEach(s => {
                const point = GRADES[s.grade];
                if (point === 0) hasFail = true;
                totalPoints += point * s.credit;
                totalCredits += Number(s.credit);
            });

            if (hasFail) {
                setResult(0.00);
                setResultDetails("Failed in one or more courses");
                return;
            } else {
                finalGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
            }
            details = `Total Points: ${totalPoints.toFixed(2)} / Total Credits: ${totalCredits}`;
        }

        setResult(Number(finalGPA.toFixed(2)));
        setResultDetails(details);
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-indigo-500 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Calculator size={20} className="mr-2 text-indigo-600" /> GPA Calculator
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('SSC_HSC')}
                        className={`px-3 py-1 text-xs font-bold rounded ${mode === 'SSC_HSC' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        SSC / HSC
                    </button>
                    <button 
                        onClick={() => setMode('HONOURS')}
                        className={`px-3 py-1 text-xs font-bold rounded ${mode === 'HONOURS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Honours
                    </button>
                </div>
            </div>

            {mode === 'SSC_HSC' && (
                <div className="mb-3 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start text-xs text-amber-800">
                    <AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />
                    <p>Select your <strong>4th Subject</strong> using the radio button. Points above 2.00 in the 4th subject will be added to your total.</p>
                </div>
            )}

            <div className="flex-1 space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                {/* Header Row */}
                <div className="flex gap-2 text-xs font-bold text-slate-400 px-2 uppercase">
                    <span className="w-8">#</span>
                    <span className="flex-1">Grade</span>
                    <span className="w-24 text-center">{mode === 'HONOURS' ? 'Credit' : '4th Subject?'}</span>
                    <span className="w-8"></span>
                </div>

                {subjects.map((sub, idx) => (
                    <div key={sub.id} className={`flex gap-2 items-center p-2 rounded-lg border transition-colors ${sub.isOptional ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-xs font-bold text-slate-500 w-8">{idx + 1}</span>
                        
                        <div className="flex-1">
                            <select 
                                className="w-full p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={sub.grade}
                                onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                            >
                                {Object.keys(GRADES).map(g => <option key={g} value={g}>{g} ({GRADES[g]})</option>)}
                            </select>
                        </div>

                        <div className="w-24 flex justify-center">
                            {mode === 'HONOURS' ? (
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="6"
                                    className="w-16 p-2 text-sm border rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={sub.credit}
                                    onChange={(e) => updateSubject(sub.id, 'credit', Number(e.target.value))}
                                />
                            ) : (
                                <input 
                                    type="radio" 
                                    name="optional_subject"
                                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={sub.isOptional}
                                    onChange={() => updateSubject(sub.id, 'isOptional', true)}
                                    title="Mark as 4th Subject"
                                />
                            )}
                        </div>

                        <button onClick={() => removeSubject(sub.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors w-8 flex justify-center">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <Button size="sm" variant="outline" onClick={addSubject} className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 mb-4">
                    <Plus size={14} className="mr-1" /> Add Another Subject
                </Button>

                <div className="pt-4 border-t border-slate-100">
                    {result !== null && (
                        <div className="mb-4 text-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-scale-up">
                            <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Your Result</p>
                            <h2 className={`text-4xl font-black ${result >= 5.00 ? 'text-emerald-600' : result === 0 ? 'text-red-600' : 'text-indigo-800'}`}>
                                {result.toFixed(2)}
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono">{resultDetails}</p>
                        </div>
                    )}
                    <Button onClick={calculateResult} className="w-full bg-indigo-600 hover:bg-indigo-700">Calculate GPA</Button>
                </div>
            </div>
        </Card>
    );
};

// --- SUB-COMPONENT: POMODORO TIMER (Unchanged) ---
const PomodoroTimer = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound or alert here
            alert(mode === 'FOCUS' ? "Focus time over! Take a break." : "Break over! Back to work.");
            switchMode(mode === 'FOCUS' ? 'BREAK' : 'FOCUS');
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode: 'FOCUS' | 'BREAK') => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = ((mode === 'FOCUS' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'FOCUS' ? 25 * 60 : 5 * 60) * 100;

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-emerald-500 text-center">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Clock size={20} className="mr-2 text-emerald-600" /> Focus Timer
                </h3>
                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                    <button 
                        onClick={() => switchMode('FOCUS')}
                        className={`px-3 py-1 rounded transition-colors ${mode === 'FOCUS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
                    >
                        Focus
                    </button>
                    <button 
                        onClick={() => switchMode('BREAK')}
                        className={`px-3 py-1 rounded transition-colors ${mode === 'BREAK' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                    >
                        Break
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Circular Progress (Simplified CSS) */}
                <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-8 border-slate-100">
                    <div 
                        className={`absolute inset-0 rounded-full border-8 border-transparent ${mode === 'FOCUS' ? 'border-t-emerald-500 border-r-emerald-500' : 'border-t-blue-500 border-r-blue-500'} transition-all duration-1000`}
                        style={{ transform: `rotate(${progress * 3.6}deg)` }}
                    ></div>
                    <div className="z-10 text-center">
                        <div className="text-6xl font-mono font-bold text-slate-800 tracking-tighter">
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase mt-2 tracking-widest">{mode === 'FOCUS' ? 'Study Time' : 'Relax Time'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button 
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-amber-100 text-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                
                <button 
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
            
            <div className="mt-6 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
                <span>Tip: Use 25m Focus + 5m Break for best retention.</span>
            </div>
        </Card>
    );
};

export default StudyTools;
