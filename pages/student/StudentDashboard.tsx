import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, BarChart, Bar
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
  // Ensure we use the latest version of the current user from allUsers array to react to changes instantly
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
      // Filter results for this specific user
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

      // Simple Rank: Higher XP = Lower Rank Number
      // Find rank in allUsers array sorted by points
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

  // Weekly Rank Logic
  const weeklyRank = myStats.totalExams > 0 ? Math.max(1, Math.floor(myStats.rank / 5)) : 0;
  const isTopTen = weeklyRank > 0 && weeklyRank <= 10;

  // --- CHART DATA GENERATION (FIXED DATE) ---
  const performanceHistory = useMemo(() => {
      // 1. Get MY results
      const myResults = results.filter(r => r.studentId === liveUser.id);
      
      if (myResults.length === 0) return [];
      
      // 2. Sort Chronologically
      const sorted = [...myResults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 3. Take Last 7
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
  
  // 1. Friends List
  const myFriends = useMemo(() => {
      return allUsers.filter(u => liveUser.friends?.includes(u.id));
  }, [allUsers, liveUser.friends]);

  // 2. Incoming Requests (People who sent request to ME)
  const incomingRequests = useMemo(() => {
      return allUsers.filter(u => liveUser.friendRequests?.includes(u.id));
  }, [allUsers, liveUser.friendRequests]);

  // 3. Outgoing Requests (People *I* sent requests TO)
  // We check other users' friendRequests array to see if MY ID is there
  const outgoingRequests = useMemo(() => {
      return allUsers.filter(u => u.friendRequests?.includes(liveUser.id));
  }, [allUsers, liveUser.id]);

  const handleSearchFriend = (e: React.FormEvent) => {
      e.preventDefault();
      const found = allUsers.find(u => u.email.toLowerCase() === searchEmail.toLowerCase() && u.id !== liveUser.id);
      setFoundUser(found || null);
      if (!found) alert("No user found with this email.");
  };

  const sendFriendRequest = () => {
      if (!foundUser) return;
      if (liveUser.friends?.includes(foundUser.id)) {
          alert("Already friends!");
          return;
      }
      if (foundUser.friendRequests?.includes(liveUser.id)) {
          alert("Request already sent.");
          return;
      }

      // Update Found User to include My ID in their requests
      const updatedFoundUser = {
          ...foundUser,
          friendRequests: [...(foundUser.friendRequests || []), liveUser.id]
      };

      setAllUsers(prev => prev.map(u => u.id === foundUser.id ? updatedFoundUser : u));
      alert("Friend request sent!");
      setFoundUser(null);
      setSearchEmail('');
      setIsAddFriendModalOpen(false);
  };

  const handleAcceptRequest = (requesterId: string) => {
      // 1. Add Requester to My Friends
      // 2. Add Me to Requester's Friends
      // 3. Remove Requester from My Requests
      
      const meUpdated = {
          ...liveUser,
          friends: [...(liveUser.friends || []), requesterId],
          friendRequests: (liveUser.friendRequests || []).filter(id => id !== requesterId)
      };

      const requester = allUsers.find(u => u.id === requesterId);
      if (!requester) return;

      const requesterUpdated = {
          ...requester,
          friends: [...(requester.friends || []), liveUser.id]
      };

      setAllUsers(prev => prev.map(u => {
          if (u.id === liveUser.id) return meUpdated;
          if (u.id === requesterId) return requesterUpdated;
          return u;
      }));
  };

  const handleDeclineRequest = (requesterId: string) => {
      const meUpdated = {
          ...liveUser,
          friendRequests: (liveUser.friendRequests || []).filter(id => id !== requesterId)
      };
      setAllUsers(prev => prev.map(u => u.id === liveUser.id ? meUpdated : u));
  };

  const handleCancelRequest = (targetUserId: string) => {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (!targetUser) return;

      const targetUpdated = {
          ...targetUser,
          friendRequests: (targetUser.friendRequests || []).filter(id => id !== liveUser.id)
      };

      setAllUsers(prev => prev.map(u => u.id === targetUserId ? targetUpdated : u));
  };

  const handleRemoveFriend = (friendId: string) => {
      if (!confirm("Remove this friend?")) return;

      const meUpdated = {
          ...liveUser,
          friends: (liveUser.friends || []).filter(id => id !== friendId)
      };

      const friend = allUsers.find(u => u.id === friendId);
      let friendUpdated = friend;
      if (friend) {
          friendUpdated = {
              ...friend,
              friends: (friend.friends || []).filter(id => id !== liveUser.id)
          };
      }

      setAllUsers(prev => prev.map(u => {
          if (u.id === liveUser.id) return meUpdated;
          if (u.id === friendId) return friendUpdated!;
          return u;
      }));
      
      if (comparisonTarget === friendId) setComparisonTarget('');
  };

  // --- RADAR DATA ---
  const radarData = useMemo(() => {
    const friend = myFriends.find(f => f.id === comparisonTarget);
    const fStats = friend ? calculateStats(friend) : null;

    const normalize = (val: number, max: number, inverse = false) => {
        if (inverse) {
             return Math.max(0, (20 - val) / 20 * 100);
        }
        return Math.min(100, (val / max) * 100);
    };

    const metrics = [
        { label: 'Avg %', key: 'av' as keyof ComparisonStats, max: 100 },
        { label: 'Exams', key: 'totalExams' as keyof ComparisonStats, max: 50 },
        { label: 'Accuracy', key: 'accuracy' as keyof ComparisonStats, max: 100 },
        { label: 'XP', key: 'xp' as keyof ComparisonStats, max: 2000 },
        { label: 'Negative', key: 'negative' as keyof ComparisonStats, max: 5, inverse: true },
    ];

    return metrics.map(m => ({
        subject: m.label,
        You: normalize(myStats[m.key], m.max, m.inverse),
        Friend: fStats ? normalize(fStats[m.key], m.max, m.inverse) : 0,
        You_Real: myStats[m.key],
        Friend_Real: fStats ? fStats[m.key] : 0,
        fullMark: 100
    }));

  }, [comparisonTarget, myFriends, myStats, allUsers, results]);

  const comparisonFriendName = myFriends.find(f => f.id === comparisonTarget)?.name || 'Friend';

  const CustomRadarTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
                  <p className="font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
                  <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between min-w-[120px]">
                        <span className="text-indigo-600 font-semibold flex items-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mr-2"></div> You
                        </span>
                        <span className="font-bold">{Number(payload[0].payload.You_Real).toFixed(1)}</span>
                      </div>
                      {payload[1] && (
                        <div className="flex items-center justify-between min-w-[120px]">
                            <span className="text-emerald-600 font-semibold flex items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-600 mr-2"></div> {comparisonFriendName}
                            </span>
                            <span className="font-bold">{Number(payload[1].payload.Friend_Real).toFixed(1)}</span>
                        </div>
                      )}
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Hello, {liveUser.name.split(' ')[0]} 👋</h1>
           <p className="text-slate-500 text-sm mt-1">
               {myStats.totalExams === 0 ? "Start taking exams to unlock your stats!" : "Here is your academic performance overview."}
           </p>
        </div>
        
        <div className="mt-4 md:mt-0">
            {onLogout && (
                <Button variant="outline" onClick={onLogout} className="flex items-center text-sm border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                    <LogOut size={16} className="mr-2" /> Logout
                </Button>
            )}
        </div>
      </div>

      {/* SECTION 1: PERFORMANCE SNAPSHOT & RANKING */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              {myStats.totalExams > 0 ? (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
                    🚀 Active Student
                  </span>
              ) : (
                  <span className="bg-amber-400/80 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm text-indigo-900">
                    Newcomer
                  </span>
              )}
            </div>
            <h2 className="text-3xl font-bold mb-1">{liveUser.points || 0} XP</h2>
            <p className="text-indigo-100 text-sm max-w-lg mt-2 opacity-90">
              {myStats.totalExams > 0 
                ? "Rank calculated via: Avg Marks, Accuracy, XP & Negative Penalties."
                : "Complete your first exam to earn XP and get a Global Rank."}
            </p>
          </div>

          <div className="flex gap-3">
            {/* Global Rank */}
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[100px]">
                <div className="flex justify-center mb-1"><Trophy className="text-yellow-300" size={24} /></div>
                <div className="text-2xl font-bold">{myStats.rank > 0 ? `#${myStats.rank}` : '-'}</div>
                <div className="text-xs text-indigo-200">{myStats.rank > 0 ? "Global Rank" : "Unranked"}</div>
            </div>

            {/* Weekly Rank */}
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[100px] relative group">
                <div className="flex justify-center mb-1"><TrendingUp className="text-emerald-300" size={24} /></div>
                <div className="text-2xl font-bold">{weeklyRank > 0 ? `#${weeklyRank}` : '-'}</div>
                <div className="text-xs text-indigo-200">{weeklyRank > 0 ? "Weekly Rank" : "Unranked"}</div>

                {isTopTen && (
                   <div className="absolute -bottom-2 -right-2">
                      <button 
                        onClick={() => setShowCertificate(true)}
                        className="bg-amber-400 text-indigo-900 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform animate-bounce" 
                        title="Claim Certificate"
                      >
                         <Award size={16} />
                      </button>
                   </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPARISON & SOCIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <GitCompare size={18} className="mr-2 text-indigo-600" /> Metric Comparison
                      </h3>
                      <p className="text-xs text-slate-500">Visualizing your weak & strong points</p>
                  </div>
                  <div className="flex space-x-2">
                      <select 
                        className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={comparisonTarget}
                        onChange={(e) => setComparisonTarget(e.target.value)}
                        disabled={myFriends.length === 0}
                      >
                          {myFriends.length === 0 && <option>No Friends Added</option>}
                          {myFriends.map(f => (
                              <option key={f.id} value={f.id}>vs {f.name}</option>
                          ))}
                      </select>
                  </div>
              </div>

              <div className="flex-1 w-full h-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          
                          <Radar 
                            name="You" 
                            dataKey="You" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            fill="#4f46e5" 
                            fillOpacity={0.3} 
                          />
                          {comparisonTarget && (
                              <Radar 
                                name={comparisonFriendName} 
                                dataKey="Friend" 
                                stroke="#10b981" 
                                strokeWidth={2} 
                                fill="#10b981" 
                                fillOpacity={0.1} 
                              />
                          )}
                          
                          <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                          <Tooltip content={<CustomRadarTooltip />} />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </Card>

          <div className="flex flex-col gap-4">
              <Card className="flex-1 relative flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Users size={18} className="mr-2 text-indigo-600" /> My Study Circle
                      </h3>
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => setIsAddFriendModalOpen(true)}>
                          <UserPlus size={14} className="mr-1" /> Add Friend
                      </Button>
                  </div>
                  
                  {/* Requests Tabs (Incoming / Outgoing) */}
                  {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                      <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                          <button 
                            className={`flex-1 text-xs py-1.5 font-bold rounded ${requestTab === 'INCOMING' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                            onClick={() => setRequestTab('INCOMING')}
                          >
                              Incoming ({incomingRequests.length})
                          </button>
                          <button 
                            className={`flex-1 text-xs py-1.5 font-bold rounded ${requestTab === 'OUTGOING' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                            onClick={() => setRequestTab('OUTGOING')}
                          >
                              Sent ({outgoingRequests.length})
                          </button>
                      </div>
                  )}

                  {/* Requests Lists */}
                  {requestTab === 'INCOMING' && incomingRequests.length > 0 && (
                      <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-100">
                          <div className="space-y-2">
                              {incomingRequests.map(req => (
                                  <div key={req.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                      <div className="flex items-center gap-2">
                                          <img src={req.avatar} className="w-6 h-6 rounded-full" />
                                          <span className="text-xs font-bold">{req.name}</span>
                                      </div>
                                      <div className="flex gap-1">
                                          <button onClick={() => handleAcceptRequest(req.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Accept"><Check size={14} /></button>
                                          <button onClick={() => handleDeclineRequest(req.id)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Decline"><X size={14} /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {requestTab === 'OUTGOING' && outgoingRequests.length > 0 && (
                      <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="space-y-2">
                              {outgoingRequests.map(req => (
                                  <div key={req.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                      <div className="flex items-center gap-2">
                                          <img src={req.avatar} className="w-6 h-6 rounded-full" />
                                          <span className="text-xs font-bold text-slate-600">{req.name}</span>
                                      </div>
                                      <button onClick={() => handleCancelRequest(req.id)} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded hover:bg-red-50 hover:text-red-500">Cancel</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Friends List */}
                  {myFriends.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex-1 flex flex-col justify-center items-center">
                          <Users size={32} className="mb-2 opacity-20" />
                          <p className="text-sm">No friends added yet.</p>
                          <Button size="sm" variant="outline" className="mt-2" onClick={() => setIsAddFriendModalOpen(true)}>Find Peers</Button>
                      </div>
                  ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1">
                          {myFriends.map(friend => {
                              const fStats = calculateStats(friend);
                              return (
                                <div 
                                    key={friend.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                        comparisonTarget === friend.id 
                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' 
                                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                                    }`}
                                    onClick={() => setComparisonTarget(friend.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{friend.name}</p>
                                            <p className="text-xs text-slate-500">Rank: #{fStats.rank} • {fStats.xp} XP</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded bg-slate-50 hover:bg-white" title="Compare">
                                            <GitCompare size={16} />
                                        </button>
                                        <button 
                                            className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50" 
                                            title="Remove"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveFriend(friend.id); }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </Card>
          </div>
      </div>

      {/* SECTION 3: KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Exams */}
        <Card className="flex flex-col justify-center border-l-4 border-l-indigo-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileCheck size={20} /></div>
             <span className="text-slate-500 text-sm font-medium">Total Exams Taken</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800">{myStats.totalExams}</h3>
        </Card>

        {/* 2. Average Marks */}
        <Card className="flex flex-col justify-center border-l-4 border-l-emerald-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Target size={20} /></div>
             <span className="text-slate-500 text-sm font-medium">Avg. Marks</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800">{myStats.av}%</h3>
        </Card>

        {/* 3. Average Negative */}
        <Card className="flex flex-col justify-center border-l-4 border-l-red-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertOctagon size={20} /></div>
             <span className="text-slate-500 text-sm font-medium">Avg. Negative</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800">-{myStats.negative}</h3>
        </Card>

        {/* 4. Accuracy */}
        <Card className="flex flex-col justify-center border-l-4 border-l-purple-500">
           <div className="flex items-center space-x-3 mb-1">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Percent size={20} /></div>
             <span className="text-slate-500 text-sm font-medium">Accuracy Rate</span>
           </div>
           <h3 className="text-2xl font-bold text-slate-800">{myStats.accuracy}%</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 4: WEEKLY OVERVIEW & CHART */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-1 min-h-[300px] flex flex-col">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <BarChart2 size={18} className="mr-2 text-indigo-600" /> Performance Trend
                        </h3>
                        <p className="text-xs text-slate-400">Last 7 Exams Accuracy</p>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                    {performanceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={performanceHistory}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-slate-400">
                            <BarChart2 size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No exam data available for chart.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>

        {/* SECTION 5: RIGHT SIDEBAR */}
        <div className="space-y-6">
             <Card className="bg-indigo-50 border-indigo-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Calendar size={18} className="mr-2 text-indigo-600" /> Lifetime Summary
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center text-slate-600">
                            <FileCheck size={16} className="mr-2 text-indigo-400" /> Exams
                        </div>
                        <span className="font-bold text-slate-800">{results.filter(r => r.studentId === liveUser.id).length}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center text-slate-600">
                            <AlertOctagon size={16} className="mr-2 text-red-400" /> Total Neg.
                        </div>
                        <span className="font-bold text-slate-800 text-red-500">-{Math.round(myStats.negative * myStats.totalExams)}</span>
                    </div>
                </div>
             </Card>

            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                    <Target className="mr-2 text-indigo-600" size={20}/> Recommendations
                </h3>
                {myStats.totalExams > 0 ? (
                    <div className="space-y-3">
                         {myStats.negative > 2 && (
                            <div className="bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-3">
                                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-red-500"></div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-700">Reduce Negative Marks</h4>
                                        <p className="text-xs text-slate-500 mt-1">Your avg negative is high. Skip unsure questions.</p>
                                    </div>
                                </div>
                            </div>
                         )}
                         <div className="bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                                <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-blue-500"></div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-700">Consistency is Key</h4>
                                    <p className="text-xs text-slate-500 mt-1">Try to take at least 1 exam every day.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center text-slate-500 text-sm">
                        Complete exams to get personalized recommendations.
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* SECTION 6: COMPLETED EXAM HISTORY */}
      <Card>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <History size={20} className="mr-2 text-slate-500" /> Recent Exam History
            </h3>
            {results.filter(r => r.studentId === liveUser.id).length === 0 && <span className="text-xs text-slate-400">No exams taken yet</span>}
        </div>
        
        {results.filter(r => r.studentId === liveUser.id).length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded border-2 border-dashed border-slate-200 text-slate-400">
                <FileCheck size={48} className="mx-auto mb-2 opacity-20" />
                <p>You haven't participated in any exams yet.</p>
                <p className="text-xs mt-1">Go to Exams page to start practicing!</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-semibold text-slate-500 border-b border-slate-100">
                            <th className="pb-3 pl-2">Exam Title</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Score</th>
                            <th className="pb-3">Negative</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {results.filter(r => r.studentId === liveUser.id).slice(0,10).map(res => (
                            <tr key={res.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-3 pl-2 font-medium text-slate-700">{res.examTitle}</td>
                                <td className="py-3 text-slate-500">{new Date(res.date).toLocaleDateString()}</td>
                                <td className="py-3">
                                    <span className="font-bold text-slate-800">{res.score.toFixed(2)}</span>
                                    <span className="text-slate-400 text-xs">/{res.totalMarks}</span>
                                </td>
                                <td className="py-3 text-red-500 font-medium">
                                    {res.negativeDeduction > 0 ? `-${res.negativeDeduction}` : '0'}
                                </td>
                                <td className="py-3">
                                    <Badge color={res.status === 'MERIT' ? 'bg-purple-100 text-purple-700' : res.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                        {res.status}
                                    </Badge>
                                </td>
                                <td className="py-3 text-right pr-2">
                                    <button 
                                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded transition-colors" 
                                        title="View Result"
                                        onClick={() => setSelectedResult(res)}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </Card>

      {/* MODAL: ADD FRIEND */}
      <Modal isOpen={isAddFriendModalOpen} onClose={() => { setIsAddFriendModalOpen(false); setFoundUser(null); setSearchEmail(''); }} title="Connect with Friends">
          <form onSubmit={handleSearchFriend} className="space-y-4">
              <p className="text-sm text-slate-500">Enter the email address of your friend to send a connection request.</p>
              <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    placeholder="student@example.com"
                    className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
              </div>
              <Button type="submit" className="w-full">Search</Button>
          </form>

          {foundUser && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                      <img src={foundUser.avatar} className="w-10 h-10 rounded-full bg-white" />
                      <div>
                          <p className="font-bold text-slate-800 text-sm">{foundUser.name}</p>
                          <p className="text-xs text-slate-500">{foundUser.institute || 'Student'}</p>
                      </div>
                  </div>
                  <Button size="sm" onClick={sendFriendRequest}>Send Request</Button>
              </div>
          )}
      </Modal>

      {/* EXAM PREVIEW MODAL */}
      <Modal isOpen={!!selectedResult} onClose={() => setSelectedResult(null)} title="Exam Result Breakdown">
         {selectedResult && (
             <div className="space-y-6">
                 {/* Summary Header */}
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                     <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedResult.examTitle}</h2>
                     <p className="text-sm text-slate-500 mb-4">{new Date(selectedResult.date).toLocaleDateString()}</p>
                     
                     <div className="flex justify-center items-end space-x-2">
                         <span className="text-5xl font-bold text-indigo-600">{selectedResult.score.toFixed(2)}</span>
                         <span className="text-lg text-slate-400 font-medium mb-1">/ {selectedResult.totalMarks}</span>
                     </div>
                     <Badge color={selectedResult.status === 'MERIT' ? 'bg-purple-100 text-purple-700 mt-3' : selectedResult.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700 mt-3' : 'bg-red-100 text-red-700 mt-3'}>
                         Result: {selectedResult.status}
                     </Badge>
                 </div>

                 {/* Detailed Stats */}
                 <div className="grid grid-cols-2 gap-3">
                     {/* Correct/Score Impact */}
                     <div className="border border-emerald-100 bg-emerald-50 rounded-lg p-3 text-center">
                         <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                         <div className="text-xl font-bold text-emerald-700">
                             {(selectedResult.score + selectedResult.negativeDeduction).toFixed(1)} 
                         </div>
                         <div className="text-[10px] uppercase font-bold text-emerald-600">Raw Score</div>
                     </div>
                     
                     {/* Negative Impact */}
                     <div className="border border-red-100 bg-red-50 rounded-lg p-3 text-center">
                         <XCircle size={24} className="mx-auto text-red-500 mb-2" />
                         <div className="text-xl font-bold text-red-700">
                             -{selectedResult.negativeDeduction}
                         </div>
                         <div className="text-[10px] uppercase font-bold text-red-600">Penalty</div>
                     </div>
                 </div>

                 {/* Action */}
                 <Button className="w-full" onClick={() => setSelectedResult(null)}>Close Result</Button>
             </div>
         )}
      </Modal>

      {/* CERTIFICATE MODAL */}
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
                     <h3 className="text-2xl font-bold text-indigo-900 border-b-2 border-slate-200 pb-2 inline-block px-8">{liveUser.name}</h3>
                 </div>
                 
                 <p className="text-slate-700 mb-6 leading-relaxed">
                     Has secured <span className="font-bold text-amber-600">Weekly Rank #{weeklyRank}</span> in the EduMaster Weekly Leaderboard, demonstrating exceptional dedication and academic excellence.
                 </p>
                 
                 <div className="flex justify-between items-end mt-8 pt-4 border-t border-slate-200">
                     <div className="text-left">
                         <p className="font-signature text-xl text-slate-800">EduMaster Admin</p>
                         <p className="text-xs text-slate-400 uppercase tracking-wider">Authorized Signature</p>
                     </div>
                     <div className="text-right">
                         <div className="flex items-center text-amber-500 mb-1 justify-end">
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                            <Star size={12} fill="currentColor" />
                         </div>
                         <p className="text-xs text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString()}</p>
                     </div>
                 </div>
             </div>
             
             <div className="mt-6 flex gap-3 justify-center">
                 <Button className="flex items-center bg-[#1877F2] hover:bg-[#166fe5]" onClick={() => alert('Shared!')}>
                     <Share2 size={16} className="mr-2" /> Share on Social
                 </Button>
                 <Button variant="outline" className="flex items-center">
                     <Download size={16} className="mr-2" /> Download PDF
                 </Button>
             </div>
        </div>
      </Modal>

    </div>
  );
};

export default StudentDashboard;