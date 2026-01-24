
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../components/UI';
import { 
    Calculator, Clock, Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, 
    AlertCircle, Scale, CalendarDays, CheckSquare, Hash, Eraser, PenTool, 
    Book, Sigma, RefreshCw, X
} from 'lucide-react';
import SEO from '../../components/SEO';

const StudyTools: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
            <SEO title="Student Super Toolkit" description="GPA Calculator, Scratchpad, Vocab & More." />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center">
                        <Calculator className="mr-3 text-indigo-600" size={32} />
                        Student Super Toolkit
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">All the utility tools you need for your academic life in one place.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. GPA CALCULATOR */}
                <div className="lg:col-span-2">
                    <GPACalculator />
                </div>

                {/* 2. POMODORO TIMER */}
                <div>
                    <PomodoroTimer />
                </div>

                {/* 3. DIGITAL SCRATCHPAD (NEW) */}
                <div className="lg:col-span-2">
                    <ScratchPad />
                </div>

                {/* 4. VOCABULARY BUILDER (NEW) */}
                <div>
                    <VocabularyWidget />
                </div>

                {/* 5. SCIENTIFIC CALCULATOR */}
                <div className="lg:col-span-2">
                    <ScientificCalculator />
                </div>

                {/* 6. UNIT CONVERTER */}
                <div>
                    <UnitConverter />
                </div>

                {/* 7. MATH FORMULAS (NEW) */}
                <div className="lg:col-span-2">
                    <FormulaReference />
                </div>

                {/* 8. AGE CALCULATOR */}
                <div>
                    <AgeCalculator />
                </div>

                {/* 9. TO-DO LIST */}
                <div className="lg:col-span-full">
                    <TodoWidget />
                </div>
            </div>
        </div>
    );
};

// --- 1. GPA CALCULATOR ---
const GPACalculator = () => {
    const [mode, setMode] = useState<'SSC_HSC' | 'HONOURS'>('SSC_HSC');
    const [subjects, setSubjects] = useState<{ id: string, grade: string, credit: number, isOptional: boolean }[]>([
        { id: '1', grade: 'A+', credit: 3, isOptional: false },
        { id: '2', grade: 'A+', credit: 3, isOptional: false },
        { id: '3', grade: 'A', credit: 3, isOptional: false },
        { id: '4', grade: 'A-', credit: 3, isOptional: false },
        { id: '5', grade: 'A+', credit: 3, isOptional: false },
        { id: '6', grade: 'A+', credit: 3, isOptional: true }, 
    ]);
    const [result, setResult] = useState<number | null>(null);
    const [resultDetails, setResultDetails] = useState<string>('');

    const GRADES: Record<string, number> = { 'A+': 5.00, 'A': 4.00, 'A-': 3.50, 'B': 3.00, 'C': 2.00, 'D': 1.00, 'F': 0.00 };

    useEffect(() => {
        setResult(null);
        setResultDetails('');
        if (mode === 'SSC_HSC') {
            setSubjects(prev => prev.map(s => ({ ...s, credit: 1 }))); 
        }
    }, [mode]);

    const addSubject = () => setSubjects([...subjects, { id: Date.now().toString(), grade: 'A+', credit: mode === 'HONOURS' ? 3 : 1, isOptional: false }]);
    const removeSubject = (id: string) => subjects.length > 1 && setSubjects(subjects.filter(s => s.id !== id));
    
    const updateSubject = (id: string, field: 'grade' | 'credit' | 'isOptional', value: any) => {
        if (field === 'isOptional' && value === true) {
            setSubjects(subjects.map(s => s.id === id ? { ...s, isOptional: true } : { ...s, isOptional: false }));
        } else {
            setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
        }
    };

    const calculateResult = () => {
        let finalGPA = 0, details = "";
        if (mode === 'SSC_HSC') {
            let totalPoints = 0, mainSubjectCount = 0, hasMainFail = false, optionalPointsAdded = 0;
            const optionalSub = subjects.find(s => s.isOptional);
            const mainSubs = subjects.filter(s => !s.isOptional);

            mainSubs.forEach(s => {
                const gp = GRADES[s.grade];
                if (gp === 0) hasMainFail = true;
                totalPoints += gp;
                mainSubjectCount++;
            });

            if (hasMainFail) { setResult(0.00); setResultDetails("Failed in Main Subject(s)"); return; }

            if (optionalSub) {
                const gp = GRADES[optionalSub.grade];
                if (gp > 2.00) {
                    optionalPointsAdded = gp - 2.00;
                    totalPoints += optionalPointsAdded;
                }
            }

            if (mainSubjectCount > 0) {
                finalGPA = totalPoints / mainSubjectCount;
                if (finalGPA > 5.00) finalGPA = 5.00;
            }
            details = optionalSub ? `Main Pts: ${(totalPoints - optionalPointsAdded).toFixed(2)} + 4th Sub: ${optionalPointsAdded.toFixed(2)}` : "No Optional Subject";
        } else {
            let totalPoints = 0, totalCredits = 0, hasFail = false;
            subjects.forEach(s => {
                const point = GRADES[s.grade];
                if (point === 0) hasFail = true;
                totalPoints += point * s.credit;
                totalCredits += Number(s.credit);
            });
            if (hasFail) { setResult(0.00); setResultDetails("Failed in courses"); return; }
            finalGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
            details = `Weighted Avg of ${totalCredits} Credits`;
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
                    <button onClick={() => setMode('SSC_HSC')} className={`px-3 py-1 text-xs font-bold rounded ${mode === 'SSC_HSC' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}>SSC/HSC</button>
                    <button onClick={() => setMode('HONOURS')} className={`px-3 py-1 text-xs font-bold rounded ${mode === 'HONOURS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}>Honours</button>
                </div>
            </div>
            {mode === 'SSC_HSC' && (
                <div className="mb-3 bg-amber-50 p-2 rounded border border-amber-100 flex items-center text-xs text-amber-800">
                    <AlertCircle size={12} className="mr-2 shrink-0" />
                    <span>Select <strong>4th Subject</strong> via radio button. Points &gt; 2.00 will add.</span>
                </div>
            )}
            <div className="flex-1 space-y-2 mb-4 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex gap-2 text-[10px] font-bold text-slate-400 px-2 uppercase">
                    <span className="w-6">#</span>
                    <span className="flex-1">Grade</span>
                    <span className="w-20 text-center">{mode === 'HONOURS' ? 'Credit' : '4th Sub?'}</span>
                    <span className="w-6"></span>
                </div>
                {subjects.map((sub, idx) => (
                    <div key={sub.id} className={`flex gap-2 items-center p-2 rounded-lg border transition-colors ${sub.isOptional ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-xs font-bold text-slate-500 w-6">{idx + 1}</span>
                        <div className="flex-1">
                            <select className="w-full p-1.5 text-sm border rounded bg-white focus:outline-none" value={sub.grade} onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}>
                                {Object.keys(GRADES).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="w-20 flex justify-center">
                            {mode === 'HONOURS' ? (
                                <input type="number" min="1" max="6" className="w-14 p-1.5 text-sm border rounded text-center" value={sub.credit} onChange={(e) => updateSubject(sub.id, 'credit', Number(e.target.value))} />
                            ) : (
                                <input type="radio" name="optional_subject" className="w-4 h-4 text-indigo-600" checked={sub.isOptional} onChange={() => updateSubject(sub.id, 'isOptional', true)} />
                            )}
                        </div>
                        <button onClick={() => removeSubject(sub.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="mt-auto">
                <Button size="sm" variant="outline" onClick={addSubject} className="w-full border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 mb-4">
                    <Plus size={14} className="mr-1" /> Add Subject
                </Button>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Result</p>
                        <h2 className={`text-3xl font-black ${result === null ? 'text-slate-200' : result >= 5 ? 'text-emerald-600' : result === 0 ? 'text-red-600' : 'text-indigo-800'}`}>
                            {result !== null ? result.toFixed(2) : '-.--'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono">{resultDetails}</p>
                    </div>
                    <Button onClick={calculateResult} className="px-6 bg-indigo-600 hover:bg-indigo-700">Calculate</Button>
                </div>
            </div>
        </Card>
    );
};

// --- 2. POMODORO TIMER (Existing) ---
const PomodoroTimer = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            alert(mode === 'FOCUS' ? "Focus time over! Take a break." : "Break over! Back to work.");
            switchMode(mode === 'FOCUS' ? 'BREAK' : 'FOCUS');
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60); };
    const switchMode = (newMode: 'FOCUS' | 'BREAK') => { setMode(newMode); setIsActive(false); setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60); };
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };
    const progress = ((mode === 'FOCUS' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'FOCUS' ? 25 * 60 : 5 * 60) * 100;

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-emerald-500 text-center relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 z-10 relative">
                <h3 className="text-lg font-bold text-slate-800 flex items-center"><Clock size={20} className="mr-2 text-emerald-600" /> Focus Timer</h3>
                <div className="bg-slate-100 p-1 rounded-lg flex text-[10px] font-bold">
                    <button onClick={() => switchMode('FOCUS')} className={`px-2 py-1 rounded transition-colors ${mode === 'FOCUS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Focus</button>
                    <button onClick={() => switchMode('BREAK')} className={`px-2 py-1 rounded transition-colors ${mode === 'BREAK' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Break</button>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-slate-100">
                    <div className={`absolute inset-0 rounded-full border-8 border-transparent ${mode === 'FOCUS' ? 'border-t-emerald-500 border-r-emerald-500' : 'border-t-blue-500 border-r-blue-500'} transition-all duration-1000`} style={{ transform: `rotate(${progress * 3.6}deg)` }}></div>
                    <div className="z-10 text-center">
                        <div className="text-5xl font-mono font-bold text-slate-800 tracking-tighter">{formatTime(timeLeft)}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{mode === 'FOCUS' ? 'Work' : 'Chill'}</p>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-center gap-4 z-10 relative">
                <button onClick={toggleTimer} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 ${isActive ? 'bg-amber-100 text-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                    {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={resetTimer} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200"><RotateCcw size={18} /></button>
            </div>
        </Card>
    );
};

// --- 3. DIGITAL SCRATCHPAD (NEW) ---
const ScratchPad = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'PEN' | 'ERASER'>('PEN');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set actual size in memory (scaled to account for high DPI if needed, sticking to simple here)
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b'; // Slate-800
        ctx.lineWidth = 2;
        
        const handleResize = () => {
            // Optional: Handle resize logic (clears canvas currently)
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getPos(e, canvas);
        
        if (tool === 'ERASER') {
            ctx.clearRect(x - 10, y - 10, 20, 20);
        } else {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#1e293b';
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    return (
        <Card className="flex flex-col h-[400px] border-t-4 border-t-slate-600 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <PenTool size={20} className="mr-2 text-slate-600" /> Scratchpad (Rough)
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setTool('PEN')} className={`p-2 rounded ${tool === 'PEN' ? 'bg-slate-200 text-slate-800' : 'text-slate-400'}`}><PenTool size={16}/></button>
                    <button onClick={() => setTool('ERASER')} className={`p-2 rounded ${tool === 'ERASER' ? 'bg-slate-200 text-slate-800' : 'text-slate-400'}`}><Eraser size={16}/></button>
                    <button onClick={clearCanvas} className="p-2 rounded text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                </div>
            </div>
            <div className="flex-1 border-2 border-slate-100 rounded-xl overflow-hidden bg-[#fdfdfd] cursor-crosshair relative touch-none">
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <canvas 
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </Card>
    );
};

// --- 4. VOCABULARY WIDGET (NEW) ---
const VocabularyWidget = () => {
    const WORDS = [
        { word: "Resilient", mean: "Able to withstand or recover quickly from difficult conditions.", ex: "She is resilient in the face of failure." },
        { word: "Pragmatic", mean: "Dealing with things sensibly and realistically.", ex: "We need a pragmatic solution to this problem." },
        { word: "Ambiguous", mean: "Open to more than one interpretation; having a double meaning.", ex: "The instructions were ambiguous." },
        { word: "Diligent", mean: "Having or showing care and conscientiousness in one's work.", ex: "A diligent student always succeeds." },
        { word: "Inevitable", mean: "Certain to happen; unavoidable.", ex: "Change is inevitable." }
    ];

    const [idx, setIdx] = useState(0);

    const nextWord = () => {
        setIdx((prev) => (prev + 1) % WORDS.length);
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-pink-500 bg-pink-50/30">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Book size={20} className="mr-2 text-pink-600" /> Daily Vocab
                </h3>
                <button onClick={nextWord} className="text-pink-500 hover:bg-pink-100 p-2 rounded-full transition-colors"><RefreshCw size={16}/></button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                <h2 className="text-3xl font-black text-pink-700 mb-2">{WORDS[idx].word}</h2>
                <p className="text-sm font-medium text-slate-600 mb-4 italic">"{WORDS[idx].mean}"</p>
                <div className="bg-white p-3 rounded-lg border border-pink-100 text-xs text-slate-500 w-full">
                    <span className="font-bold text-pink-600">Ex: </span>{WORDS[idx].ex}
                </div>
            </div>
        </Card>
    );
};

// --- 5. MATH FORMULA REFERENCE (NEW) ---
const FormulaReference = () => {
    const [tab, setTab] = useState<'ALGEBRA' | 'TRIG' | 'GEOMETRY'>('ALGEBRA');

    const FORMULAS: any = {
        ALGEBRA: [
            { name: "(a + b)²", val: "a² + 2ab + b²" },
            { name: "(a - b)²", val: "a² - 2ab + b²" },
            { name: "a² - b²", val: "(a - b)(a + b)" },
            { name: "Quadratic", val: "x = [-b ± √(b² - 4ac)] / 2a" }
        ],
        TRIG: [
            { name: "sin²θ + cos²θ", val: "1" },
            { name: "tanθ", val: "sinθ / cosθ" },
            { name: "sin(2θ)", val: "2sinθcosθ" },
            { name: "Euler", val: "e^ix = cos(x) + i·sin(x)" }
        ],
        GEOMETRY: [
            { name: "Circle Area", val: "πr²" },
            { name: "Sphere Vol", val: "4/3 πr³" },
            { name: "Triangle Area", val: "1/2 × base × height" },
            { name: "Trapezoid", val: "1/2 (a + b)h" }
        ]
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-teal-500">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Sigma size={20} className="mr-2 text-teal-600" /> Math Cheat Sheet
                </h3>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                {['ALGEBRA', 'TRIG', 'GEOMETRY'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded ${tab === t ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[250px] pr-1">
                {FORMULAS[tab].map((f: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">{f.name}</span>
                        <span className="text-sm font-mono font-bold text-teal-700">{f.val}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// --- 6. SCIENTIFIC CALCULATOR ---
const ScientificCalculator = () => {
    const [display, setDisplay] = useState('');
    
    const handleBtn = (val: string) => {
        if (val === 'C') setDisplay('');
        else if (val === 'DEL') setDisplay(display.slice(0, -1));
        else if (val === '=') {
            try {
                // Safer evaluation for math expressions
                // eslint-disable-next-line no-new-func
                const res = new Function('return ' + display
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/log/g, 'Math.log10')
                    .replace(/ln/g, 'Math.log')
                    .replace(/sqrt/g, 'Math.sqrt')
                    .replace(/π/g, 'Math.PI')
                    .replace(/\^/g, '**')
                )();
                setDisplay(String(Number(res).toFixed(4)).replace(/\.?0+$/, '')); // Format nicely
            } catch {
                setDisplay('Error');
            }
        } else {
            setDisplay(display + val);
        }
    };

    const btns = [
        ['sin(', 'cos(', 'tan(', 'log(', 'ln('],
        ['(', ')', '^', 'sqrt(', 'DEL'],
        ['7', '8', '9', '/', 'C'],
        ['4', '5', '6', '*', '-'],
        ['1', '2', '3', '+', 'π'],
        ['.', '0', '=', '']
    ];

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-purple-500 bg-slate-900 text-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center"><Hash size={20} className="mr-2 text-purple-400" /> Scientific Calc</h3>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl mb-4 text-right h-20 flex items-center justify-end overflow-x-auto">
                <span className="text-3xl font-mono tracking-widest">{display || '0'}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 flex-1">
                {btns.flat().map((btn, i) => (
                    btn === '' ? <div key={i}/> :
                    <button
                        key={i}
                        onClick={() => handleBtn(btn)}
                        className={`p-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${
                            btn === '=' ? 'bg-purple-600 col-span-2' : 
                            btn === 'C' || btn === 'DEL' ? 'bg-red-500/80' : 
                            ['+', '-', '*', '/', '^'].includes(btn) ? 'bg-slate-700 text-purple-300' :
                            'bg-slate-800 hover:bg-slate-700'
                        }`}
                    >
                        {btn.replace('(', '')}
                    </button>
                ))}
            </div>
        </Card>
    );
};

// --- 7. UNIT CONVERTER ---
const UnitConverter = () => {
    const [category, setCategory] = useState<'LENGTH' | 'WEIGHT' | 'TEMP'>('LENGTH');
    const [val, setVal] = useState<number>(1);
    const [fromUnit, setFromUnit] = useState('m');
    const [toUnit, setToUnit] = useState('ft');
    const [result, setResult] = useState<string>('');

    const UNITS: any = {
        LENGTH: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, inch: 0.0254, mile: 1609.34 },
        WEIGHT: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
        TEMP: { C: 'C', F: 'F', K: 'K' } // Special handling
    };

    useEffect(() => {
        if (category === 'TEMP') {
            let res = val;
            if (fromUnit === 'C' && toUnit === 'F') res = (val * 9/5) + 32;
            else if (fromUnit === 'C' && toUnit === 'K') res = val + 273.15;
            else if (fromUnit === 'F' && toUnit === 'C') res = (val - 32) * 5/9;
            else if (fromUnit === 'F' && toUnit === 'K') res = (val - 32) * 5/9 + 273.15;
            else if (fromUnit === 'K' && toUnit === 'C') res = val - 273.15;
            else if (fromUnit === 'K' && toUnit === 'F') res = (val - 273.15) * 9/5 + 32;
            setResult(res.toFixed(2));
        } else {
            const baseVal = val * UNITS[category][fromUnit];
            const targetVal = baseVal / UNITS[category][toUnit];
            setResult(targetVal.toFixed(4));
        }
    }, [val, fromUnit, toUnit, category]);

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-orange-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Scale size={20} className="mr-2 text-orange-600" /> Unit Converter</h3>
            
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                {['LENGTH', 'WEIGHT', 'TEMP'].map(c => (
                    <button key={c} onClick={() => { setCategory(c as any); setFromUnit(Object.keys(UNITS[c])[0]); setToUnit(Object.keys(UNITS[c])[1]); }} 
                    className={`flex-1 py-1 text-[10px] font-bold rounded ${category === c ? 'bg-white shadow text-orange-700' : 'text-slate-500'}`}>
                        {c}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 border rounded-lg p-2 bg-slate-50">
                    <input type="number" className="w-full bg-transparent outline-none font-bold text-slate-800" value={val} onChange={e => setVal(Number(e.target.value))} />
                    <select className="bg-transparent text-sm font-bold text-slate-500 outline-none" value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
                        {Object.keys(UNITS[category]).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div className="text-center text-slate-400 font-bold">=</div>
                <div className="flex items-center gap-2 border rounded-lg p-2 bg-orange-50 border-orange-200">
                    <div className="w-full font-bold text-orange-800">{result}</div>
                    <select className="bg-transparent text-sm font-bold text-orange-700 outline-none" value={toUnit} onChange={e => setToUnit(e.target.value)}>
                        {Object.keys(UNITS[category]).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
        </Card>
    );
};

// --- 8. AGE CALCULATOR ---
const AgeCalculator = () => {
    const [dob, setDob] = useState('');
    const [age, setAge] = useState<{y: number, m: number, d: number} | null>(null);

    const calculateAge = () => {
        if (!dob) return;
        const birthDate = new Date(dob);
        const today = new Date();
        
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        setAge({ y: years, m: months, d: days });
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-blue-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><CalendarDays size={20} className="mr-2 text-blue-600" /> Age Calculator</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth</label>
                    <input type="date" className="w-full p-2 border rounded-lg outline-none text-sm" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <Button onClick={calculateAge} className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm">Calculate Age</Button>
                
                {age && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center animate-fade-in">
                        <div className="flex justify-center gap-4">
                            <div><span className="block text-2xl font-black text-blue-700">{age.y}</span><span className="text-[10px] text-blue-500 uppercase">Years</span></div>
                            <div><span className="block text-2xl font-black text-blue-700">{age.m}</span><span className="text-[10px] text-blue-500 uppercase">Months</span></div>
                            <div><span className="block text-2xl font-black text-blue-700">{age.d}</span><span className="text-[10px] text-blue-500 uppercase">Days</span></div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

// --- 9. TO-DO LIST ---
const TodoWidget = () => {
    const [tasks, setTasks] = useState<{id: number, text: string, done: boolean}[]>([]);
    const [newTask, setNewTask] = useState('');

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
        setNewTask('');
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-red-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><CheckSquare size={20} className="mr-2 text-red-600" /> Study Tasks</h3>
            
            <form onSubmit={addTask} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200" 
                    placeholder="Add new task..." 
                    value={newTask} 
                    onChange={e => setNewTask(e.target.value)}
                />
                <button type="submit" className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"><Plus size={20} /></button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[250px] custom-scrollbar">
                {tasks.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No tasks pending.</p>}
                {tasks.map(task => (
                    <div key={task.id} className={`flex items-center justify-between p-2 rounded-lg border group ${task.done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-red-400'}`}>
                                {task.done && <CheckCircle2 size={14} />}
                            </button>
                            <span className={`text-sm truncate ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</span>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default StudyTools;
