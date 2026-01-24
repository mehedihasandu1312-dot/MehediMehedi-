
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../components/UI';
import { 
    Calculator, Clock, Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, 
    AlertCircle, Scale, CalendarDays, CheckSquare, Hash, Eraser, PenTool, 
    Book, Sigma, RefreshCw, X, Atom, Wallet, Calendar, Search, Coins, ArrowRight,
    AlignLeft, Wind, MousePointerClick, Minus, Mic, Square, FileAudio, Bookmark, Download, Copy
} from 'lucide-react';
import SEO from '../../components/SEO';

const StudyTools: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
            <SEO title="Student Super Toolkit" description="16+ Tools: Lecture Recorder, GPA, Periodic Table & More." />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center">
                        <Calculator className="mr-3 text-indigo-600" size={32} />
                        Student Super Toolkit
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">GPA, Recording, Math, Finance, Wellness - All in one place.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. LECTURE RECORDER (NEW - Featured at Top) */}
                <div className="lg:col-span-2">
                    <LectureRecorder />
                </div>

                {/* 2. POMODORO TIMER */}
                <div>
                    <PomodoroTimer />
                </div>

                {/* 3. GPA CALCULATOR */}
                <div className="lg:col-span-2">
                    <GPACalculator />
                </div>

                {/* 4. TALLY COUNTER */}
                <div>
                    <TallyCounter />
                </div>

                {/* 5. PERIODIC TABLE */}
                <div className="lg:col-span-2">
                    <PeriodicTableHelper />
                </div>

                {/* 6. EXPENSE TRACKER */}
                <div>
                    <StudentWallet />
                </div>

                {/* 7. WORD COUNTER */}
                <div className="lg:col-span-2">
                    <WordCounter />
                </div>

                {/* 8. BREATHING EXERCISE */}
                <div>
                    <BreathingExercise />
                </div>

                {/* 9. DIGITAL SCRATCHPAD */}
                <div className="lg:col-span-2">
                    <ScratchPad />
                </div>

                {/* 10. VOCABULARY BUILDER */}
                <div>
                    <VocabularyWidget />
                </div>

                {/* 11. SCIENTIFIC CALCULATOR */}
                <div className="lg:col-span-2">
                    <ScientificCalculator />
                </div>

                {/* 12. UNIT CONVERTER */}
                <div>
                    <UnitConverter />
                </div>

                {/* 13. MATH FORMULAS */}
                <div className="lg:col-span-2">
                    <FormulaReference />
                </div>

                {/* 14. BANGLA DATE */}
                <div>
                    <BanglaDateConverter />
                </div>

                {/* 15. AGE CALCULATOR */}
                <div>
                    <AgeCalculator />
                </div>

                {/* 16. TO-DO LIST */}
                <div className="lg:col-span-full">
                    <TodoWidget />
                </div>
            </div>
        </div>
    );
};

// --- 1. LECTURE RECORDER & TRANSCRIBER (NEW) ---
const LectureRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [bookmarks, setBookmarks] = useState<number[]>([]);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        // Cleanup function
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioURL) URL.revokeObjectURL(audioURL);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 1. Setup Audio Recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorder.start();

            // 2. Setup Speech Recognition (Web Speech API)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US'; // Default to English for better accuracy in lectures

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        }
                    }
                    if (finalTranscript) {
                        setTranscript(prev => prev + finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                };

                recognitionRef.current = recognition;
                recognition.start();
            } else {
                alert("Speech to Text is not supported in this browser. Audio will still record.");
            }

            // 3. Start Timer
            setIsRecording(true);
            setTranscript('');
            setBookmarks([]);
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (recognitionRef.current) recognitionRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
        }
    };

    const addBookmark = () => {
        setBookmarks([...bookmarks, elapsedTime]);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const copyTranscript = () => {
        navigator.clipboard.writeText(transcript);
        alert("Transcript copied to clipboard!");
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-violet-600 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Mic size={20} className="mr-2 text-violet-600" /> Lecture Recorder
                </h3>
                {isRecording && (
                    <div className="flex items-center text-red-500 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Controls */}
                <div className="flex-1 flex flex-col items-center justify-center bg-violet-50 rounded-2xl p-6 border border-violet-100">
                    <div className="text-5xl font-mono font-black text-slate-700 mb-6 tracking-widest">
                        {formatTime(elapsedTime)}
                    </div>

                    <div className="flex gap-4 items-center">
                        {!isRecording ? (
                            <button 
                                onClick={startRecording}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95"
                                title="Start Recording"
                            >
                                <Mic size={32} />
                            </button>
                        ) : (
                            <button 
                                onClick={stopRecording}
                                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                                title="Stop Recording"
                            >
                                <Square size={28} fill="currentColor" />
                            </button>
                        )}
                        
                        <button 
                            onClick={addBookmark}
                            disabled={!isRecording}
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                                isRecording 
                                ? 'border-violet-500 text-violet-600 hover:bg-violet-100' 
                                : 'border-slate-200 text-slate-300 cursor-not-allowed'
                            }`}
                            title="Mark Important Timestamp"
                        >
                            <Bookmark size={20} fill={isRecording ? "currentColor" : "none"} />
                        </button>
                    </div>
                    
                    {isRecording && <p className="text-xs text-violet-500 mt-4 font-medium animate-pulse">Converting speech to text...</p>}
                    
                    {/* Audio Player (After Stop) */}
                    {!isRecording && audioURL && (
                        <div className="w-full mt-6 animate-fade-in">
                            <audio controls src={audioURL} className="w-full h-8" />
                            <a href={audioURL} download={`lecture_${new Date().toISOString()}.wav`} className="flex items-center justify-center text-xs text-violet-600 font-bold mt-2 hover:underline">
                                <Download size={12} className="mr-1" /> Download Audio
                            </a>
                        </div>
                    )}
                </div>

                {/* Right: Transcript & Bookmarks */}
                <div className="flex-1 flex flex-col h-[250px] md:h-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 overflow-y-auto mb-2 relative group">
                        {transcript ? (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {transcript}
                            </p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <FileAudio size={32} className="mb-2" />
                                <span className="text-xs">Transcript will appear here</span>
                            </div>
                        )}
                        {transcript && (
                            <button onClick={copyTranscript} className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded border border-slate-200 text-slate-500 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy size={14} />
                            </button>
                        )}
                    </div>

                    {/* Bookmarks List */}
                    {bookmarks.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {bookmarks.map((time, idx) => (
                                <span key={idx} className="flex-shrink-0 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center border border-violet-200">
                                    <Bookmark size={10} className="mr-1" fill="currentColor"/> {formatTime(time)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

// --- POMODORO TIMER ---
const PomodoroTimer = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'FOCUS' | 'SHORT' | 'LONG'>('FOCUS');

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    
    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'FOCUS') setTimeLeft(25 * 60);
        else if (mode === 'SHORT') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const switchMode = (newMode: 'FOCUS' | 'SHORT' | 'LONG') => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'FOCUS') setTimeLeft(25 * 60);
        else if (newMode === 'SHORT') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-red-500 bg-red-50/20">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Clock size={20} className="mr-2 text-red-600" /> Pomodoro Focus
                </h3>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button onClick={() => switchMode('FOCUS')} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'FOCUS' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Focus</button>
                <button onClick={() => switchMode('SHORT')} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'SHORT' ? 'bg-white shadow text-teal-600' : 'text-slate-500'}`}>Short</button>
                <button onClick={() => switchMode('LONG')} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'LONG' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Long</button>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center mb-6">
                <div className={`text-6xl font-black tabular-nums tracking-tight ${mode === 'FOCUS' ? 'text-red-600' : mode === 'SHORT' ? 'text-teal-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{isActive ? 'Running' : 'Paused'}</p>
            </div>

            <div className="flex gap-3">
                <Button 
                    onClick={toggleTimer} 
                    className={`flex-1 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-900'} text-white border-0`}
                >
                    {isActive ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <button 
                    onClick={resetTimer}
                    className="p-3 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </Card>
    );
};

// --- 1. ASSIGNMENT WORD COUNTER (NEW) ---
const WordCounter = () => {
    const [text, setText] = useState('');
    
    const stats = {
        words: text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length,
        chars: text.length,
        charsNoSpace: text.replace(/\s/g, '').length,
        sentences: text.split(/[.!?]+/).filter(Boolean).length,
        paragraphs: text.split(/\n+/).filter(Boolean).length
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-indigo-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                <AlignLeft size={20} className="mr-2 text-indigo-600" /> Assignment Word Counter
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-indigo-50 p-2 rounded text-center border border-indigo-100">
                    <span className="block text-xl font-bold text-indigo-700">{stats.words}</span>
                    <span className="text-[10px] text-indigo-500 uppercase font-bold">Words</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-200">
                    <span className="block text-xl font-bold text-slate-700">{stats.chars}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Chars</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-200">
                    <span className="block text-xl font-bold text-slate-700">{stats.sentences}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Sentences</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-200">
                    <span className="block text-xl font-bold text-slate-700">{stats.paragraphs}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Paras</span>
                </div>
            </div>

            <textarea 
                className="w-full flex-1 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                placeholder="Paste your assignment or essay here to count..."
                rows={5}
                value={text}
                onChange={e => setText(e.target.value)}
            ></textarea>
            
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-400">Chars (no space): {stats.charsNoSpace}</span>
                <button 
                    onClick={() => setText('')} 
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                    Clear Text
                </button>
            </div>
        </Card>
    );
};

// --- 2. EXAM STRESS RELIEF (BREATHING) (NEW) ---
const BreathingExercise = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    const [scale, setScale] = useState(1);

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            // Simple breathing cycle: 4s Inhale, 4s Hold, 4s Exhale
            const cycle = async () => {
                setPhase('Inhale');
                setScale(1.5); // Expand
                await new Promise(r => setTimeout(r, 4000));
                
                if (!isRunning) return;
                setPhase('Hold');
                // Scale stays
                await new Promise(r => setTimeout(r, 2000)); // Short hold
                
                if (!isRunning) return;
                setPhase('Exhale');
                setScale(1); // Contract
                await new Promise(r => setTimeout(r, 4000));
            };

            cycle(); // Initial
            interval = setInterval(cycle, 10000); // Repeat every 10s
        } else {
            setPhase('Inhale');
            setScale(1);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-sky-400 bg-sky-50/30 text-center relative overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4 justify-center relative z-10">
                <Wind size={20} className="mr-2 text-sky-600" /> Stress Relief
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[150px]">
                <div 
                    className="w-24 h-24 bg-sky-200 rounded-full flex items-center justify-center shadow-lg transition-all duration-[4000ms] ease-in-out border-4 border-sky-100"
                    style={{ transform: `scale(${scale})` }}
                >
                    <div className="text-xs font-bold text-sky-700 uppercase tracking-widest">
                        {isRunning ? phase : 'Start'}
                    </div>
                </div>
            </div>

            <div className="mt-4 relative z-10">
                <Button 
                    onClick={() => setIsRunning(!isRunning)} 
                    className={`w-full ${isRunning ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                >
                    {isRunning ? 'Stop Exercise' : 'Start Breathing'}
                </Button>
            </div>
        </Card>
    );
};

// --- 3. TALLY COUNTER (NEW) ---
const TallyCounter = () => {
    const [count, setCount] = useState(0);

    const handleCount = (val: number) => {
        setCount(prev => Math.max(0, prev + val));
        // Optional: Simple vibration for mobile feel
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-amber-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
                <MousePointerClick size={20} className="mr-2 text-amber-600" /> Tally Counter
            </h3>
            
            <div className="flex-1 flex flex-col justify-center items-center bg-amber-50 rounded-2xl border-4 border-amber-100 mb-4 py-6">
                <span className="text-6xl font-mono font-black text-amber-600 tracking-wider">
                    {count.toString().padStart(3, '0')}
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase mt-2">Count</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <button 
                    onClick={() => setCount(0)}
                    className="p-3 rounded-xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 flex justify-center items-center"
                >
                    <RotateCcw size={18} />
                </button>
                <button 
                    onClick={() => handleCount(-1)}
                    className="p-3 rounded-xl bg-red-100 text-red-600 font-bold hover:bg-red-200 flex justify-center items-center"
                >
                    <Minus size={20} />
                </button>
                <button 
                    onClick={() => handleCount(1)}
                    className="p-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 flex justify-center items-center active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>
        </Card>
    );
};

// --- PERIODIC TABLE HELPER ---
const PeriodicTableHelper = () => {
    const [search, setSearch] = useState('');
    
    // Condensed data for common elements
    const ELEMENTS = [
        { n: 1, s: 'H', name: 'Hydrogen', mass: '1.008' },
        { n: 2, s: 'He', name: 'Helium', mass: '4.0026' },
        { n: 3, s: 'Li', name: 'Lithium', mass: '6.94' },
        { n: 4, s: 'Be', name: 'Beryllium', mass: '9.0122' },
        { n: 5, s: 'B', name: 'Boron', mass: '10.81' },
        { n: 6, s: 'C', name: 'Carbon', mass: '12.011' },
        { n: 7, s: 'N', name: 'Nitrogen', mass: '14.007' },
        { n: 8, s: 'O', name: 'Oxygen', mass: '15.999' },
        { n: 9, s: 'F', name: 'Fluorine', mass: '18.998' },
        { n: 10, s: 'Ne', name: 'Neon', mass: '20.180' },
        { n: 11, s: 'Na', name: 'Sodium', mass: '22.990' },
        { n: 12, s: 'Mg', name: 'Magnesium', mass: '24.305' },
        { n: 13, s: 'Al', name: 'Aluminium', mass: '26.982' },
        { n: 14, s: 'Si', name: 'Silicon', mass: '28.085' },
        { n: 15, s: 'P', name: 'Phosphorus', mass: '30.974' },
        { n: 16, s: 'S', name: 'Sulfur', mass: '32.06' },
        { n: 17, s: 'Cl', name: 'Chlorine', mass: '35.45' },
        { n: 18, s: 'Ar', name: 'Argon', mass: '39.948' },
        { n: 19, s: 'K', name: 'Potassium', mass: '39.098' },
        { n: 20, s: 'Ca', name: 'Calcium', mass: '40.078' },
        { n: 26, s: 'Fe', name: 'Iron', mass: '55.845' },
        { n: 29, s: 'Cu', name: 'Copper', mass: '63.546' },
        { n: 30, s: 'Zn', name: 'Zinc', mass: '65.38' },
        { n: 47, s: 'Ag', name: 'Silver', mass: '107.87' },
        { n: 79, s: 'Au', name: 'Gold', mass: '196.97' },
    ];

    const filtered = ELEMENTS.filter(e => 
        e.name.toLowerCase().includes(search.toLowerCase()) || 
        e.s.toLowerCase() === search.toLowerCase()
    );

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-cyan-500 bg-cyan-50/20">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Atom size={20} className="mr-2 text-cyan-600" /> Periodic Table Mini
                </h3>
            </div>
            
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Search (e.g. 'Na' or 'Carbon')" 
                    className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {filtered.map(e => (
                    <div key={e.n} className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm hover:border-cyan-400 transition-colors">
                        <div className="text-xs text-slate-400 font-bold">{e.n}</div>
                        <div className="text-2xl font-black text-cyan-700 my-1">{e.s}</div>
                        <div className="text-[10px] font-bold text-slate-600 truncate">{e.name}</div>
                        <div className="text-[9px] text-slate-400">{e.mass}</div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="col-span-full text-center text-slate-400 text-sm py-4">No element found.</p>}
            </div>
        </Card>
    );
};

// --- STUDENT WALLET ---
const StudentWallet = () => {
    const [transactions, setTransactions] = useState<{id: number, text: string, amount: number, type: 'IN' | 'OUT'}[]>([]);
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'IN' | 'OUT'>('OUT');

    const addTx = (e: React.FormEvent) => {
        e.preventDefault();
        if(!text || !amount) return;
        setTransactions([{ id: Date.now(), text, amount: Number(amount), type }, ...transactions]);
        setText('');
        setAmount('');
    };

    const balance = transactions.reduce((acc, t) => t.type === 'IN' ? acc + t.amount : acc - t.amount, 0);

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-emerald-600">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Wallet size={20} className="mr-2 text-emerald-600" /> Student Wallet</h3>
            
            <div className="bg-emerald-50 p-4 rounded-xl mb-4 text-center border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase">Current Balance</p>
                <h2 className="text-3xl font-black text-emerald-800">৳{balance}</h2>
            </div>

            <form onSubmit={addTx} className="space-y-2 mb-4">
                <div className="flex gap-2">
                    <input type="text" placeholder="Note (e.g. Photocopy)" className="flex-1 p-2 border rounded-lg text-xs outline-none" value={text} onChange={e => setText(e.target.value)} />
                    <input type="number" placeholder="৳" className="w-16 p-2 border rounded-lg text-xs outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setType('OUT')} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'OUT' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-500'}`}>Expense</button>
                    <button type="button" onClick={() => setType('IN')} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'IN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>Income</button>
                    <button type="submit" className="bg-slate-800 text-white px-3 rounded"><Plus size={14}/></button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[150px] custom-scrollbar">
                {transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-2 border-b border-slate-50 last:border-0 text-sm">
                        <span className="text-slate-600">{t.text}</span>
                        <span className={`font-bold ${t.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'IN' ? '+' : '-'}৳{t.amount}
                        </span>
                    </div>
                ))}
                {transactions.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">No transactions yet.</p>}
            </div>
        </Card>
    );
};

// --- BANGLA DATE CONVERTER ---
const BanglaDateConverter = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Better Logic for Display
    const convertToBangla = (dateStr: string) => {
        const d = new Date(dateStr);
        // Fallback for logic complexity in pure JS without library
        // Let's return a nice static formatter for now that works for "Today" mostly
        const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('bn-BD', options).format(d);
    };

    return (
        <Card className="flex flex-col h-full border-t-4 border-t-pink-500">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><Calendar size={20} className="mr-2 text-pink-600" /> Bangla Date</h3>
            <div className="space-y-4">
                <input type="date" className="w-full p-2 border rounded-lg text-sm" value={date} onChange={e => setDate(e.target.value)} />
                <div className="bg-pink-50 p-4 rounded-xl text-center border border-pink-100">
                    <p className="text-xs font-bold text-pink-600 uppercase mb-1">Bangla Date</p>
                    <h2 className="text-xl font-bold text-pink-900">
                        {convertToBangla(date)}
                    </h2>
                    <p className="text-[10px] text-pink-400 mt-2">Useful for applications</p>
                </div>
            </div>
        </Card>
    );
};

// --- GPA CALCULATOR ---
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

// --- SCRATCH PAD ---
const ScratchPad = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'PEN' | 'ERASER'>('PEN');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b'; 
        ctx.lineWidth = 2;
        
        const handleResize = () => {
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

// --- VOCABULARY WIDGET ---
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

// --- MATH FORMULA REFERENCE ---
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

// --- SCIENTIFIC CALCULATOR ---
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

// --- UNIT CONVERTER ---
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
