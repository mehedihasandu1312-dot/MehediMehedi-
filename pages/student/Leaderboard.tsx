import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { Badge, Button, Modal } from '../../components/UI';
import { 
  Trophy, Crown, Medal, TrendingUp, Globe, Search, 
  ArrowUp, ChevronLeft, ChevronRight,
  Calendar, Star, School, Award
} from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
}

const ITEMS_PER_PAGE = 10;

const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser }) => {
  const [view, setView] = useState<'WORLD' | 'WEEKLY'>('WORLD');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // --- LEADERBOARD LOGIC ---
  const sortedUsers = useMemo(() => {
    // 1. Safety Filter: Ensure user object exists
    let data = users.filter(u => u && typeof u === 'object');

    if (view === 'WORLD') {
      // Sort by Total Points
      data.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else {
      // WEEKLY SIMULATION 
      data = data.map(u => ({
          ...u,
          // Safety check for name length to prevent NaN
          weeklyPoints: Math.round((u.points || 0) * 0.15) + ((u.name || '').length * 5) 
      }));
      data.sort((a, b) => ((b as any).weeklyPoints) - ((a as any).weeklyPoints));
    }

    // 2. Map with Rank and Default Values (Prevents Crash on null name/avatar)
    return data.map((u, index) => ({ 
        ...u, 
        name: u.name || 'Anonymous Student', 
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name || 'User'}`,
        rank: index + 1 
    }));
  }, [users, view]);

  // Filter for search (Case Safe)
  const filteredList = sortedUsers.filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find Current User Stats
  const myRankData = sortedUsers.find(u => u.id === currentUser.id);

  // Top 3 Users (For Podium)
  const topThree = sortedUsers.slice(0, 3);

  // --- PAGINATION & VISIBILITY LOGIC ---
  
  // Show podium ONLY on Page 1, No Search, and At least 3 users exist
  const showPodium = currentPage === 1 && !searchTerm && sortedUsers.length >= 3;
  
  // Determine which list to paginate
  const listSource = useMemo(() => {
      if (searchTerm) return filteredList;
      // If showing podium, remove top 3 from the list so they don't appear twice
      if (showPodium) return sortedUsers.slice(3);
      // Otherwise show everyone (e.g. if only 2 users, show them in list)
      return sortedUsers;
  }, [searchTerm, showPodium, sortedUsers, filteredList]);

  const totalPages = Math.ceil(listSource.length / ITEMS_PER_PAGE) || 1;

  const paginatedUsers = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return listSource.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, listSource]);


  // Helper for Podium Styles
  const getPodiumStyle = (index: number) => {
    if (index === 0) return { height: 'h-40', color: 'bg-yellow-400', border: 'border-yellow-500', iconColor: 'text-yellow-600', scale: 'scale-110 z-10' }; // 1st
    if (index === 1) return { height: 'h-32', color: 'bg-slate-300', border: 'border-slate-400', iconColor: 'text-slate-600', scale: 'scale-100 mt-8' }; // 2nd
    if (index === 2) return { height: 'h-24', color: 'bg-orange-300', border: 'border-orange-400', iconColor: 'text-orange-700', scale: 'scale-95 mt-16' }; // 3rd
    return { height: 'h-20', color: 'bg-gray-200', border: 'border-gray-300', iconColor: 'text-gray-500', scale: '' };
  };

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  // Safe Name Getter
  const getSafeName = (name?: string) => name ? name.split(' ')[0] : 'User';

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
             onClick={() => { setView('WORLD'); setCurrentPage(1); }}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
               view === 'WORLD' 
               ? 'bg-indigo-600 text-white shadow-md' 
               : 'text-slate-500 hover:bg-slate-50'
             }`}
           >
             <Globe size={16} className="mr-2" /> World Rank
           </button>
           <button 
             onClick={() => { setView('WEEKLY'); setCurrentPage(1); }}
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
           placeholder="Search student by name..."
           className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
           value={searchTerm}
           onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
         />
      </div>

      {/* PODIUM SECTION (Only Page 1 & No Search & Enough Users) */}
      {showPodium && (
        <div className="flex justify-center items-end gap-2 md:gap-6 py-8 mb-4">
           {/* 2nd Place */}
           <div 
             className={`flex flex-col items-center transition-transform duration-500 cursor-pointer ${getPodiumStyle(1).scale}`}
             onClick={() => setSelectedStudent(topThree[1])}
           >
              <div className="relative mb-2">
                 <img src={topThree[1].avatar} alt={topThree[1].name} className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-lg object-cover" />
                 <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-slate-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                 </div>
              </div>
              <div className="text-center mb-2">
                  <p className="font-bold text-slate-700 text-sm line-clamp-1 w-20">{getSafeName(topThree[1].name)}</p>
                  <p className="text-xs text-indigo-600 font-bold">{(topThree[1] as any).weeklyPoints || topThree[1].points} XP</p>
              </div>
              <div className={`w-20 md:w-24 ${getPodiumStyle(1).height} ${getPodiumStyle(1).color} rounded-t-lg border-t-4 ${getPodiumStyle(1).border} shadow-inner flex items-end justify-center pb-4`}>
                 <Medal size={32} className={`${getPodiumStyle(1).iconColor} opacity-50`} />
              </div>
           </div>

           {/* 1st Place */}
           <div 
             className={`flex flex-col items-center transition-transform duration-500 cursor-pointer ${getPodiumStyle(0).scale}`}
             onClick={() => setSelectedStudent(topThree[0])}
           >
               <Crown size={32} className="text-yellow-500 mb-1 animate-bounce" fill="currentColor" />
               <div className="relative mb-2">
                 <img src={topThree[0].avatar} alt={topThree[0].name} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-xl object-cover" />
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
           <div 
             className={`flex flex-col items-center transition-transform duration-500 cursor-pointer ${getPodiumStyle(2).scale}`}
             onClick={() => setSelectedStudent(topThree[2])}
           >
              <div className="relative mb-2">
                 <img src={topThree[2].avatar} alt={topThree[2].name} className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg object-cover" />
                 <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                 </div>
              </div>
              <div className="text-center mb-2">
                  <p className="font-bold text-slate-700 text-sm line-clamp-1 w-20">{getSafeName(topThree[2].name)}</p>
                  <p className="text-xs text-indigo-600 font-bold">{(topThree[2] as any).weeklyPoints || topThree[2].points} XP</p>
              </div>
              <div className={`w-20 md:w-24 ${getPodiumStyle(2).height} ${getPodiumStyle(2).color} rounded-t-lg border-t-4 ${getPodiumStyle(2).border} shadow-inner flex items-end justify-center pb-4`}>
                 <Medal size={32} className={`${getPodiumStyle(2).iconColor} opacity-50`} />
              </div>
           </div>
        </div>
      )}

      {/* RANK LIST */}
      <div className="max-w-2xl mx-auto space-y-3">
         {paginatedUsers.length === 0 ? (
             <div className="text-center py-10 text-slate-400">
                 {searchTerm ? "No student found matching query." : "No more students in this list."}
             </div>
         ) : (
            paginatedUsers.map((user) => (
                <div 
                    key={user.id} 
                    onClick={() => setSelectedStudent(user)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer ${
                        user.id === currentUser.id 
                        ? 'bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200' 
                        : 'bg-white border-slate-200 hover:shadow-sm'
                    }`}
                >
                    <div className="flex items-center space-x-4">
                        <span className={`font-bold w-8 text-center text-lg ${user.rank <= 10 ? 'text-slate-800' : 'text-slate-400'}`}>
                            {user.rank}
                        </span>
                        <img src={user.avatar} alt="av" className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                        <div>
                            <h4 className={`font-bold text-sm ${user.id === currentUser.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {user.name} {user.id === currentUser.id && '(You)'}
                            </h4>
                            <p className="text-xs text-slate-400">{user.institute || 'Student'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-indigo-600">{(user as any).weeklyPoints || user.points} XP</span>
                        {user.rank <= 10 && (
                             <span className="text-[10px] text-emerald-600 flex items-center justify-end font-medium">
                                 <ArrowUp size={10} className="mr-0.5" /> Top Tier
                             </span>
                        )}
                    </div>
                </div>
            ))
         )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={20} className="text-slate-600" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Smart logic to show window of pages around current
                    let pNum = i + 1;
                    if (totalPages > 5) {
                        if (currentPage > 3) pNum = currentPage - 2 + i;
                        if (pNum > totalPages) pNum = totalPages - 4 + i;
                        if (pNum <= 0) pNum = 1; // Safety
                    }

                    return (
                        <button
                            key={pNum}
                            onClick={() => handlePageChange(pNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                                currentPage === pNum
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {pNum}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight size={20} className="text-slate-600" />
            </button>
        </div>
      )}

      {/* STICKY FOOTER FOR CURRENT USER RANK (If not in current view) */}
      {myRankData && (
          <div className="fixed bottom-4 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
              <div className="max-w-2xl mx-auto bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-slide-up pointer-events-auto">
                  <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center justify-center w-10">
                            <span className="text-xs text-slate-400 uppercase">Rank</span>
                            <span className="font-bold text-xl text-yellow-400">#{myRankData.rank}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-600"></div>
                        <img src={currentUser.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover" alt="me" />
                        <div>
                            <p className="font-bold text-sm">Your Position</p>
                            <p className="text-xs text-slate-400">{view === 'WORLD' ? 'All Time' : 'This Week'}</p>
                        </div>
                  </div>
                  <div className="text-right">
                      <span className="block font-bold text-xl text-indigo-400">{(myRankData as any).weeklyPoints || myRankData.points} XP</span>
                  </div>
              </div>
          </div>
      )}

      {/* STUDENT DETAILS MODAL */}
      <Modal 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        title="Student Success Profile"
      >
        {selectedStudent && (
            <div className="text-center space-y-6">
                <div className="relative inline-block mt-4">
                    <img 
                        src={selectedStudent.avatar} 
                        alt={selectedStudent.name} 
                        className="w-24 h-24 rounded-full border-4 border-indigo-100 shadow-md mx-auto object-cover" 
                    />
                    <div className="absolute bottom-0 right-0 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
                        Rank #{selectedStudent.rank}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-1 mt-1">
                        <School size={14} /> {selectedStudent.institute || 'Unknown Institute'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                        Student ID: {selectedStudent.id.substring(0,8).toUpperCase()}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total XP</p>
                        <p className="text-lg font-bold text-indigo-600">{selectedStudent.points}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Class</p>
                        <p className="text-lg font-bold text-slate-700">{selectedStudent.class || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Joined</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">
                            {new Date(selectedStudent.joinedDate).toLocaleDateString(undefined, {month:'short', year: '2-digit'})}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-800 text-left flex items-center">
                         <Award size={16} className="mr-2 text-amber-500" /> Achievements
                     </h3>
                     <div className="flex gap-2 flex-wrap">
                        {(selectedStudent.points || 0) > 1000 && (
                            <Badge color="bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <Star size={12} fill="currentColor" /> Scholar
                            </Badge>
                        )}
                        {(selectedStudent.rank || 999) <= 10 && (
                            <Badge color="bg-purple-100 text-purple-700 flex items-center gap-1">
                                <Crown size={12} /> Top 10
                            </Badge>
                        )}
                        <Badge color="bg-blue-100 text-blue-700 flex items-center gap-1">
                             <Calendar size={12} /> Active Learner
                        </Badge>
                     </div>
                </div>

                <div className="pt-2">
                    <Button className="w-full" onClick={() => setSelectedStudent(null)}>Close Profile</Button>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default Leaderboard;