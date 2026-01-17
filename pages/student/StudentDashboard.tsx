import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import { User, Exam, StudentResult } from '../../types';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  LogOut,
  BarChart2,
  FileCheck,
  AlertOctagon,
  History,
  Calendar,
  Clock,
  Eye,
  Users,
  GitCompare,
  UserPlus,
  X,
  Award,
  Share2,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  Check,
  Mail,
  Send,
  ArrowRight
} from 'lucide-react';

interface Props {
  user: User;
  onLogout?: () => void;
  exams: Exam[]; 
  results: StudentResult[]; // Contains ALL results
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

interface ComparisonStats {
  av: number;
  totalExams: number;
  rank: number;
  score: number;
  xp: number;
  negative: number;
  accuracy: number;
}

const StudentDashboard: React.FC<Props> = ({ user, onLogout, exams, results, allUsers, setAllUsers }) => {
  
  // --- REAL-TIME USER DATA ---
  const liveUser = useMemo(() => allUsers.find(u => u.id === user.id) || user, [allUsers, user.id]);

  // --- STATE FOR FRIENDS ---
  const [comparisonTarget, setComparisonTarget] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState('');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [requestTab, setRequestTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  
  // --- CERTIFICATE STATE ---
  const [showCertificate, setShowCertificate] = useState(false);

  // --- EXAM PREVIEW STATE ---
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  // --- HELPER: CALCULATE STATS ---
  const calculateStats = (targetUser: User): ComparisonStats => {
      const userResults = results.filter(r => r.studentId === targetUser.id);

      if (userResults.length === 0) {
          return { av: 0, totalExams: 0, rank: 0, score: 0, xp: targetUser.points || 0, negative: 0, accuracy: 0 };
      }

      const totalExams = userResults.length;
      const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
      const totalMaxMarks = userResults.reduce((sum, r) => sum + r.totalMarks, 0);
      const totalNegative = userResults.reduce((sum, r) => sum + r.negativeDeduction, 0);
      
      const avgScore = totalMaxMarks > 0 ? (totalScore / totalMaxMarks) * 100 : 0;
      const avgNegative = totalNegative / totalExams;

      const estimatedCorrectScore = userResults.reduce((sum, r) => sum + (r.score + r.negativeDeduction), 0);
      const accuracy = totalMaxMarks > 0 ? (estimatedCorrectScore / totalMaxMarks) * 100 : 0;

      const sortedUsers = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
      const rank = sortedUsers.findIndex(u => u.id === targetUser.id) + 1;

      return {
          av: Math.round(avgScore),
          totalExams: totalExams,
          rank: rank,
          score: Math.round(totalScore),
          xp: targetUser.points || 0,
          negative: parseFloat(avgNegative.toFixed(2)),
          accuracy: Math.round(accuracy)
      };
  };

  const myStats = useMemo(() => calculateStats(liveUser), [results, liveUser, allUsers]);

  const weeklyRank = myStats.totalExams > 0 ? Math.max(1, Math.floor(myStats.rank / 5)) : 0;
  const isTopTen = weeklyRank > 0 && weeklyRank <= 10;

  // --- CHART DATA GENERATION ---
  const performanceHistory = useMemo(() => {
      const myResults = results.filter(r => r.studentId === liveUser.id);
      if (myResults.length === 0) return [];
      const sorted = [...myResults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted.slice(-7).map(r => {
          const d = new Date(r.date);
          const dayName = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString(undefined, { weekday: 'short' });
          return {
              date: dayName,
              score: r.totalMarks > 0 ? ((r.score / r.totalMarks) * 100).toFixed(0) : 0
          };
      });
  }, [results, liveUser]);

  // --- FRIEND LOGIC ---
  const myFriends = useMemo(() => allUsers.filter(u => liveUser.friends?.includes(u.id)), [allUsers, liveUser.friends]);
  const incomingRequests = useMemo(() => allUsers.filter(u => liveUser.friendRequests?.includes(u.id)), [allUsers, liveUser.friendRequests]);
  const outgoingRequests = useMemo(() => allUsers.filter(u => u.friendRequests?.includes(liveUser.id)), [allUsers, liveUser.id]);

  const handleSearchFriend = (e: React.FormEvent) => {
      e.preventDefault();
      const found = allUsers.find(u => u.email.toLowerCase() === searchEmail.toLowerCase() && u.id !== liveUser.id);
      setFoundUser(found || null);
      if (!found) alert("No user found with this email.");
  };

  const sendFriendRequest = () => {
      if (!foundUser) return;
      if (liveUser.friends?.includes(foundUser.id)) return alert("Already friends!");
      if (foundUser.friendRequests?.includes(liveUser.id)) return alert("Request already sent.");

      const updatedFoundUser = { ...foundUser, friendRequests: [...(foundUser.friendRequests || []), liveUser.id] };
      setAllUsers(prev => prev.map(u => u.id === foundUser.id ? updatedFoundUser : u));
      alert("Friend request sent!");
      setFoundUser(null); setSearchEmail(''); setIsAddFriendModalOpen(false);
  };

  const handleAcceptRequest = (requesterId: string) => {
      const meUpdated = { ...liveUser, friends: [...(liveUser.friends || []), requesterId], friendRequests: (liveUser.friendRequests || []).filter(id => id !== requesterId) };
      const requester = allUsers.find(u => u.id === requesterId);
      if (!requester) return;
      const requesterUpdated = { ...requester, friends: [...(requester.friends || []), liveUser.id] };
      setAllUsers(prev => prev.map(u => { if (u.id === liveUser.id) return meUpdated; if (u.id === requesterId) return requesterUpdated; return u; }));
  };

  const handleDeclineRequest = (requesterId: string) => {
      const meUpdated = { ...liveUser, friendRequests: (liveUser.friendRequests || []).filter(id => id !== requesterId) };
      setAllUsers(prev => prev.map(u => u.id === liveUser.id ? meUpdated : u));
  };

  const handleCancelRequest = (targetUserId: string) => {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (!targetUser) return;
      const targetUpdated = { ...targetUser, friendRequests: (targetUser.friendRequests || []).filter(id => id !== liveUser.id) };
      setAllUsers(prev => prev.map(u => u.id === targetUserId ? targetUpdated : u));
  };

  const handleRemoveFriend = (friendId: string) => {
      if (!confirm("Remove this friend?")) return;
      const meUpdated = { ...liveUser, friends: (liveUser.friends || []).filter(id => id !== friendId) };
      const friend = allUsers.find(u => u.id === friendId);
      const friendUpdated = friend ? { ...friend, friends: (friend.friends || []).filter(id => id !== liveUser.id) } : friend;
      setAllUsers(prev => prev.map(u => { if (u.id === liveUser.id) return meUpdated; if (u.id === friendId) return friendUpdated!; return u; }));
      if (comparisonTarget === friendId) setComparisonTarget('');
  };

  // --- COMPARISON DATA ---
  const comparisonData = useMemo(() => {
    const friend = myFriends.find(f => f.id === comparisonTarget);
    const fStats = friend ? calculateStats(friend) : null;
    const normalize = (val: number, max: number) => Math.min(100, (val / max) * 100);

    const metrics = [
        { label: 'Avg %', key: 'av' as keyof ComparisonStats, max: 100 },
        { label: 'Exams', key: 'totalExams' as keyof ComparisonStats, max: 50 },
        { label: 'Accuracy', key: 'accuracy' as keyof ComparisonStats, max: 100 },
        { label: 'XP', key: 'xp' as keyof ComparisonStats, max: 2000 },
        { label: 'Negative', key: 'negative' as keyof ComparisonStats, max: 5 }, 
    ];

    return metrics.map(m => ({
        subject: m.label,
        You: normalize(myStats[m.key], m.max),
        Friend: fStats ? normalize(fStats[m.key], m.max) : 0,
        You_Real: myStats[m.key],
        Friend_Real: fStats ? fStats[m.key] : 0,
    }));
  }, [comparisonTarget, myFriends, myStats, allUsers, results]);

  const comparisonFriendName = myFriends.find(f => f.id === comparisonTarget)?.name || 'Friend';

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
             Hello, <span className="text-brand-600">{liveUser.name.split(' ')[0]}</span> 👋
           </h1>
           <p className="text-slate-500 mt-1 font-medium">
               {myStats.totalExams === 0 ? "Start your journey today!" : "Here's your performance summary."}
           </p>
        </div>
      </div>

      {/* SECTION 1: PERFORMANCE HERO (UPDATED BRAND GRADIENT) */}
      <div className="bg-gradient-to-br from-brand-600 to-purple-700 rounded-3xl p-8 text-white shadow-soft relative overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-brand-400 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 mb-3 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              {myStats.totalExams > 0 ? (
                  <span className="text-xs font-bold tracking-wide">🚀 ACTIVE LEARNER</span>
              ) : (
                  <span className="text-xs font-bold tracking-wide">✨ NEW STUDENT</span>
              )}
            </div>
            <h2 className="text-5xl font-black mb-2 tracking-tight">{liveUser.points || 0} <span className="text-3xl font-bold opacity-80">XP</span></h2>
            <p className="text-brand-100 text-sm opacity-90 max-w-md mx-auto md:mx-0">
              {myStats.totalExams > 0 
                ? "Your dedication is paying off. Keep pushing your limits!"
                : "Complete your first exam to earn XP and unlock your Global Rank."}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 text-center min-w-[110px] transform hover:scale-105 transition-transform">
                <div className="flex justify-center mb-2"><Trophy className="text-yellow-400 drop-shadow-sm" size={28} /></div>
                <div className="text-2xl font-bold">{myStats.rank > 0 ? `#${myStats.rank}` : '-'}</div>
                <div className="text-[10px] uppercase font-bold text-brand-100 tracking-wider">Global Rank</div>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 text-center min-w-[110px] transform hover:scale-105 transition-transform relative">
                <div className="flex justify-center mb-2"><TrendingUp className="text-emerald-400 drop-shadow-sm" size={28} /></div>
                <div className="text-2xl font-bold">{weeklyRank > 0 ? `#${weeklyRank}` : '-'}</div>
                <div className="text-[10px] uppercase font-bold text-brand-100 tracking-wider">Weekly Top</div>
                {isTopTen && (
                   <button onClick={() => setShowCertificate(true)} className="absolute -top-3 -right-3 bg-yellow-400 text-brand-900 p-2 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce">
                      <Award size={18} />
                   </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: METRICS (UPDATED COLORS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex flex-col justify-center border-l-4 border-l-brand-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600"><FileCheck size={20} /></div>
             <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Exams Taken</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 ml-1">{myStats.totalExams}</h3>
        </Card>

        <Card className="flex flex-col justify-center border-l-4 border-l-emerald-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Target size={20} /></div>
             <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. Score</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 ml-1">{myStats.av}%</h3>
        </Card>

        <Card className="flex flex-col justify-center border-l-4 border-l-red-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><AlertOctagon size={20} /></div>
             <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. Negative</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 ml-1">-{myStats.negative}</h3>
        </Card>

        <Card className="flex flex-col justify-center border-l-4 border-l-purple-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><Percent size={20} /></div>
             <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Accuracy</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 ml-1">{myStats.accuracy}%</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COMPARISON CHART */}
          <Card className="flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-slate-800 flex items-center text-lg">
                          <GitCompare size={20} className="mr-2 text-brand-600" /> Comparison
                      </h3>
                  </div>
                  <select 
                    className="text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600"
                    value={comparisonTarget}
                    onChange={(e) => setComparisonTarget(e.target.value)}
                    disabled={myFriends.length === 0}
                  >
                      {myFriends.length === 0 && <option>No Friends</option>}
                      {myFriends.map(f => <option key={f.id} value={f.id}>vs {f.name}</option>)}
                  </select>
              </div>

              <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar name="You" dataKey="You" fill="#E2136E" radius={[6, 6, 0, 0]} barSize={20} />
                          {comparisonTarget && (
                              <Bar name={comparisonFriendName} dataKey="Friend" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                          )}
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          {/* FRIENDS & REQUESTS */}
          <Card className="flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center text-lg">
                      <Users size={20} className="mr-2 text-brand-600" /> Study Circle
                  </h3>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsAddFriendModalOpen(true)}>
                      <UserPlus size={14} className="mr-1" /> Add
                  </Button>
              </div>
              
              {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                      <button className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${requestTab === 'INCOMING' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`} onClick={() => setRequestTab('INCOMING')}>
                          Incoming ({incomingRequests.length})
                      </button>
                      <button className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all ${requestTab === 'OUTGOING' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`} onClick={() => setRequestTab('OUTGOING')}>
                          Sent ({outgoingRequests.length})
                      </button>
                  </div>
              )}

              {/* Lists Logic (Simplified for brevity as structure remains same, just styling updates) */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1">
                  {requestTab === 'INCOMING' && incomingRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-brand-50 p-3 rounded-xl border border-brand-100">
                          <div className="flex items-center gap-3">
                              <img src={req.avatar} className="w-8 h-8 rounded-full border border-white" />
                              <span className="text-sm font-bold text-brand-900">{req.name}</span>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleAcceptRequest(req.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-transform"><Check size={14} /></button>
                              <button onClick={() => handleDeclineRequest(req.id)} className="p-1.5 bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50"><X size={14} /></button>
                          </div>
                      </div>
                  ))}

                  {myFriends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                          <div className="bg-slate-50 p-4 rounded-full mb-3"><Users size={24} className="opacity-50" /></div>
                          <p className="text-sm">Build your network to compete!</p>
                      </div>
                  ) : (
                      myFriends.map(friend => (
                        <div key={friend.id} onClick={() => setComparisonTarget(friend.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${comparisonTarget === friend.id ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' : 'bg-white border-slate-100 hover:border-brand-200 hover:shadow-sm'}`}>
                            <div className="flex items-center space-x-3">
                                <img src={friend.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{friend.name}</p>
                                    <p className="text-xs text-slate-500">{calculateStats(friend).xp} XP</p>
                                </div>
                            </div>
                            <div className="flex space-x-1">
                                <button className="p-1.5 text-slate-400 hover:text-brand-600 rounded bg-slate-50" title="Compare"><GitCompare size={16} /></button>
                                <button className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleRemoveFriend(friend.id); }}><X size={16} /></button>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          </Card>
      </div>

      {/* PERFORMANCE TREND CHART */}
      <Card className="min-h-[350px] flex flex-col">
          <div className="mb-6">
              <h3 className="font-bold text-slate-800 flex items-center text-lg">
                  <BarChart2 size={20} className="mr-2 text-brand-600" /> Score Trend
              </h3>
              <p className="text-xs text-slate-400">Last 7 Exams Performance</p>
          </div>
          <div className="flex-1 w-full min-h-0">
              {performanceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceHistory}>
                          <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#E2136E" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#E2136E" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1e293b', color: 'white' }}
                              itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#E2136E" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="text-center text-slate-400 py-10">
                      <BarChart2 size={48} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No exam data available.</p>
                  </div>
              )}
          </div>
      </Card>

      {/* Add Friend Modal */}
      <Modal isOpen={isAddFriendModalOpen} onClose={() => { setIsAddFriendModalOpen(false); setFoundUser(null); setSearchEmail(''); }} title="Connect with Friends">
          <form onSubmit={handleSearchFriend} className="space-y-4">
              <p className="text-sm text-slate-500">Enter the email address of your friend to send a connection request.</p>
              <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="email" required placeholder="student@example.com" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Search</Button>
          </form>
          {foundUser && (
              <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                      <img src={foundUser.avatar} className="w-10 h-10 rounded-full border-2 border-white" />
                      <div>
                          <p className="font-bold text-slate-800 text-sm">{foundUser.name}</p>
                          <p className="text-xs text-slate-500">{foundUser.institute || 'Student'}</p>
                      </div>
                  </div>
                  <Button size="sm" onClick={sendFriendRequest}>Connect</Button>
              </div>
          )}
      </Modal>

      {/* Certificate Modal */}
      <Modal isOpen={showCertificate} onClose={() => setShowCertificate(false)} title=" ">
        <div className="text-center p-2 relative">
             <div className="absolute inset-0 border-[8px] border-double border-amber-200 rounded-lg pointer-events-none m-1"></div>
             <div className="bg-[#fdfbf7] p-8 rounded shadow-inner border border-amber-100">
                 <div className="flex justify-center mb-4">
                     <div className="bg-amber-100 p-4 rounded-full border-4 border-amber-300">
                         <Award size={48} className="text-amber-600" />
                     </div>
                 </div>
                 <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2 tracking-wide uppercase">Certificate</h2>
                 <p className="text-sm font-serif italic text-slate-500 mb-6">Of Outstanding Achievement</p>
                 <div className="mb-6">
                     <p className="text-slate-500 text-sm mb-1">This is to certify that</p>
                     <h3 className="text-2xl font-bold text-brand-900 border-b-2 border-slate-200 pb-2 inline-block px-8">{liveUser.name}</h3>
                 </div>
                 <p className="text-slate-700 mb-6 leading-relaxed">
                     Has secured <span className="font-bold text-amber-600">Weekly Rank #{weeklyRank}</span> in the EduMaster Weekly Leaderboard.
                 </p>
             </div>
             <div className="mt-6 flex gap-3 justify-center">
                 <Button className="flex items-center bg-[#1877F2] hover:bg-[#166fe5]" onClick={() => alert('Shared!')}>
                     <Share2 size={16} className="mr-2" /> Share
                 </Button>
                 <Button variant="outline" className="flex items-center">
                     <Download size={16} className="mr-2" /> Download
                 </Button>
             </div>
        </div>
      </Modal>

    </div>
  );
};

export default StudentDashboard;