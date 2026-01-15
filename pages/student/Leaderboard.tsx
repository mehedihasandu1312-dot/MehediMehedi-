import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { Card, Badge, Button } from '../../components/UI';
import { Trophy, Crown, Medal, TrendingUp, Globe, Search, ArrowUp } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser }) => {
  const [view, setView] = useState<'WORLD' | 'WEEKLY'>('WORLD');
  const [searchTerm, setSearchTerm] = useState('');

  // --- LEADERBOARD LOGIC ---
  const sortedUsers = useMemo(() => {
    let data = [...users];

    if (view === 'WORLD') {
      // Sort by Total Points
      data.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else {
      // WEEKLY SIMULATION 
      // (In a real app, this would come from a 'weeklyPoints' field in DB)
      // Here we simulate weekly points based on total points to ensure consistency but slightly different order
      data = data.map(u => ({
          ...u,
          weeklyPoints: Math.round((u.points || 0) * 0.15) + (u.name.length * 5) // Mock logic
      }));
      data.sort((a, b) => ((b as any).weeklyPoints) - ((a as any).weeklyPoints));
    }

    return data.map((u, index) => ({ ...u, rank: index + 1 }));
  }, [users, view]);

  // Filter for search
  const filteredList = sortedUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Find Current User Stats
  const myRankData = sortedUsers.find(u => u.id === currentUser.id);

  // Top 3 Users
  const topThree = sortedUsers.slice(0, 3);
  const restUsers = filteredList.filter(u => u.rank > 3);

  // Helper for Podium Styles
  const getPodiumStyle = (index: number) => {
    if (index === 0) return { height: 'h-40', color: 'bg-yellow-400', border: 'border-yellow-500', iconColor: 'text-yellow-600', scale: 'scale-110 z-10' }; // 1st
    if (index === 1) return { height: 'h-32', color: 'bg-slate-300', border: 'border-slate-400', iconColor: 'text-slate-600', scale: 'scale-100 mt-8' }; // 2nd
    if (index === 2) return { height: 'h-24', color: 'bg-orange-300', border: 'border-orange-400', iconColor: 'text-orange-700', scale: 'scale-95 mt-16' }; // 3rd
    return { height: 'h-20', color: 'bg-gray-200', border: 'border-gray-300', iconColor: 'text-gray-500', scale: '' };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative min-h-screen">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center">
             <Trophy className="mr-3 text-indigo-600" size={28} />
             Leaderboard
           </h1>
           <p className="text-sm text-slate-500">See where you stand among the best learners.</p>
        </div>

        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
           <button 
             onClick={() => setView('WORLD')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
               view === 'WORLD' 
               ? 'bg-indigo-600 text-white shadow-md' 
               : 'text-slate-500 hover:bg-slate-50'
             }`}
           >
             <Globe size={16} className="mr-2" /> World Rank
           </button>
           <button 
             onClick={() => setView('WEEKLY')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
               view === 'WEEKLY' 
               ? 'bg-emerald-600 text-white shadow-md' 
               : 'text-slate-500 hover:bg-slate-50'
             }`}
           >
             <TrendingUp size={16} className="mr-2" /> Weekly Top
           </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md mx-auto">
         <Search className="absolute left-3 top-3 text-slate-400" size={20} />
         <input 
           type="text" 
           placeholder="Search student..."
           className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      {/* PODIUM SECTION (Only if no search filter) */}
      {!searchTerm && sortedUsers.length >= 3 && (
        <div className="flex justify-center items-end gap-2 md:gap-6 py-8 mb-4">
           {/* 2nd Place */}
           <div className={`flex flex-col items-center transition-transform duration-500 ${getPodiumStyle(1).scale}`}>
              <div className="relative mb-2">
                 <img src={topThree[1].avatar} alt={topThree[1].name} className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-lg" />
                 <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-slate-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                 </div>
              </div>
              <div className="text-center mb-2">
                  <p className="font-bold text-slate-700 text-sm line-clamp-1 w-20">{topThree[1].name.split(' ')[0]}</p>
                  <p className="text-xs text-indigo-600 font-bold">{(topThree[1] as any).weeklyPoints || topThree[1].points} XP</p>
              </div>
              <div className={`w-20 md:w-24 ${getPodiumStyle(1).height} ${getPodiumStyle(1).color} rounded-t-lg border-t-4 ${getPodiumStyle(1).border} shadow-inner flex items-end justify-center pb-4`}>
                 <Medal size={32} className={`${getPodiumStyle(1).iconColor} opacity-50`} />
              </div>
           </div>

           {/* 1st Place */}
           <div className={`flex flex-col items-center transition-transform duration-500 ${getPodiumStyle(0).scale}`}>
               <Crown size={32} className="text-yellow-500 mb-1 animate-bounce" fill="currentColor" />
               <div className="relative mb-2">
                 <img src={topThree[0].avatar} alt={topThree[0].name} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-xl" />
                 <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                    <span className="bg-yellow-600 text-white text-sm font-bold px-3 py-0.5 rounded-full shadow-sm">1</span>
                 </div>
              </div>
              <div className="text-center mb-2">
                  <p className="font-bold text-slate-800 text-base">{topThree[0].name}</p>
                  <p className="text-sm text-indigo-600 font-bold">{(topThree[0] as any).weeklyPoints || topThree[0].points} XP</p>
              </div>
              <div className={`w-24 md:w-32 ${getPodiumStyle(0).height} ${getPodiumStyle(0).color} rounded-t-lg border-t-4 ${getPodiumStyle(0).border} shadow-inner flex items-end justify-center pb-4`}>
                 <Trophy size={40} className={`${getPodiumStyle(0).iconColor} opacity-50`} />
              </div>
           </div>

           {/* 3rd Place */}
           <div className={`flex flex-col items-center transition-transform duration-500 ${getPodiumStyle(2).scale}`}>
              <div className="relative mb-2">
                 <img src={topThree[2].avatar} alt={topThree[2].name} className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg" />
                 <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                 </div>
              </div>
              <div className="text-center mb-2">
                  <p className="font-bold text-slate-700 text-sm line-clamp-1 w-20">{topThree[2].name.split(' ')[0]}</p>
                  <p className="text-xs text-indigo-600 font-bold">{(topThree[2] as any).weeklyPoints || topThree[2].points} XP</p>
              </div>
              <div className={`w-20 md:w-24 ${getPodiumStyle(2).height} ${getPodiumStyle(2).color} rounded-t-lg border-t-4 ${getPodiumStyle(2).border} shadow-inner flex items-end justify-center pb-4`}>
                 <Medal size={32} className={`${getPodiumStyle(2).iconColor} opacity-50`} />
              </div>
           </div>
        </div>
      )}

      {/* RANK LIST (4th onwards or Search Results) */}
      <div className="max-w-2xl mx-auto space-y-3">
         {restUsers.length === 0 && searchTerm ? (
             <div className="text-center py-10 text-slate-400">No student found.</div>
         ) : (
            restUsers.map((user) => (
                <div 
                    key={user.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                        user.id === currentUser.id 
                        ? 'bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200' 
                        : 'bg-white border-slate-200 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center space-x-4">
                        <span className={`font-bold w-6 text-center ${user.rank <= 10 ? 'text-slate-800' : 'text-slate-400'}`}>
                            #{user.rank}
                        </span>
                        <img src={user.avatar} alt="av" className="w-10 h-10 rounded-full border border-slate-100" />
                        <div>
                            <h4 className={`font-bold text-sm ${user.id === currentUser.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {user.name} {user.id === currentUser.id && '(You)'}
                            </h4>
                            <p className="text-xs text-slate-400">{user.institute || 'Student'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-indigo-600">{(user as any).weeklyPoints || user.points} XP</span>
                        {user.id === currentUser.id && (
                             <span className="text-[10px] text-emerald-600 flex items-center justify-end">
                                 <ArrowUp size={10} className="mr-0.5" /> Top 5%
                             </span>
                        )}
                    </div>
                </div>
            ))
         )}
      </div>

      {/* STICKY FOOTER FOR CURRENT USER RANK */}
      {myRankData && (
          <div className="fixed bottom-4 md:bottom-8 left-0 right-0 z-40 px-4">
              <div className="max-w-2xl mx-auto bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-slide-up">
                  <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center justify-center w-10">
                            <span className="text-xs text-slate-400 uppercase">Rank</span>
                            <span className="font-bold text-xl text-yellow-400">#{myRankData.rank}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-600"></div>
                        <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500" alt="me" />
                        <div>
                            <p className="font-bold text-sm">Your Position</p>
                            <p className="text-xs text-slate-400">{view === 'WORLD' ? 'All Time' : 'This Week'}</p>
                        </div>
                  </div>
                  <div className="text-right">
                      <span className="block font-bold text-xl text-indigo-400">{(myRankData as any).weeklyPoints || myRankData.points} XP</span>
                      <span className="text-xs text-slate-400">Keep learning to rise up! 🚀</span>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Leaderboard;