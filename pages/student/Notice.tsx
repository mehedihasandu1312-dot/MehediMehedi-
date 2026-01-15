import React, { useState } from 'react';
import { Badge } from '../../components/UI';
import { Notice as NoticeType } from '../../types';
import { Bell, Calendar, AlertCircle, ChevronRight, ArrowLeft, ImageIcon } from 'lucide-react';

interface Props {
    notices?: NoticeType[];
}

const Notice: React.FC<Props> = ({ notices = [] }) => {
  const [selectedNotice, setSelectedNotice] = useState<NoticeType | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Bell className="mr-3 text-indigo-600" size={28} />
          Notice Board
        </h1>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Left Side: Notice List */}
          <div className={`flex-1 overflow-y-auto border-r border-slate-100 bg-slate-50/50 ${selectedNotice ? 'hidden md:block' : 'block'}`}>
             <div className="p-4 space-y-3">
                 {notices.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        No notices at the moment.
                    </div>
                 ) : (
                     notices.map(notice => (
                        <div 
                            key={notice.id}
                            onClick={() => setSelectedNotice(notice)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${
                                selectedNotice?.id === notice.id 
                                ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50 z-10' 
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}
                        >
                            {/* Priority Indicator Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                 notice.priority === 'HIGH' ? 'bg-red-500' : notice.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}></div>

                            <div className="pl-3">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-base line-clamp-1 ${selectedNotice?.id === notice.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {notice.title}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-slate-500 mb-2">
                                    <p className="line-clamp-2 leading-relaxed flex-1 mr-2">
                                        {notice.content}
                                    </p>
                                    {notice.image && <ImageIcon size={14} className="text-indigo-400 shrink-0" />}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge color={getPriorityColor(notice.priority)}>
                                        {notice.priority}
                                    </Badge>
                                    <div className={`flex items-center text-xs font-medium transition-colors ${selectedNotice?.id === notice.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                                        Read More <ChevronRight size={14} className="ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                     ))
                 )}
             </div>
          </div>

          {/* Right Side / Overlay: Detail View */}
          <div className={`md:w-[60%] lg:w-[65%] bg-white flex flex-col ${selectedNotice ? 'block absolute inset-0 md:static z-20' : 'hidden md:flex'}`}>
              
              {selectedNotice ? (
                  <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
                      {/* Detail Header */}
                      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 sticky top-0">
                          <button onClick={() => setSelectedNotice(null)} className="md:hidden flex items-center text-slate-600 font-medium hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                             <ArrowLeft className="mr-2" size={18} /> Back to List
                          </button>
                          <div className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Notice Details
                          </div>
                          <div className="flex items-center text-slate-500 text-xs">
                              <Calendar size={14} className="mr-1.5" />
                              {new Date(selectedNotice.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                      </div>

                      {/* Detail Body */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                          <div className="max-w-3xl mx-auto">
                              <div className="mb-6">
                                  <Badge color={getPriorityColor(selectedNotice.priority)}>
                                      {selectedNotice.priority} PRIORITY
                                  </Badge>
                              </div>
                              
                              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 font-serif leading-tight">
                                  {selectedNotice.title}
                              </h2>

                              {/* Notice Image Display */}
                              {selectedNotice.image && (
                                  <div className="mb-8 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                      <img 
                                        src={selectedNotice.image} 
                                        alt={selectedNotice.title} 
                                        className="w-full h-auto max-h-[400px] object-contain bg-slate-50"
                                      />
                                  </div>
                              )}

                              <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-loose whitespace-pre-wrap font-sans">
                                  {selectedNotice.content}
                              </div>

                              <div className="mt-12 pt-8 border-t border-slate-100">
                                  <div className="flex items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                                      <AlertCircle size={20} className="mr-3 text-indigo-500 mt-0.5 shrink-0" />
                                      <div>
                                          <p className="text-sm font-semibold text-slate-700">Official Communication</p>
                                          <p className="text-xs text-slate-500 mt-1">This notice was issued by the Administration. For any queries, please contact the support office.</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 bg-slate-50/30">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                          <Bell size={40} className="text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-400 mb-2">No Notice Selected</h3>
                      <p className="text-slate-400 max-w-xs text-center text-sm">Select a notice from the list on the left to view its full details here.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Notice;