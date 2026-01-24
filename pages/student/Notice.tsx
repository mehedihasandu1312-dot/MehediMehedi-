
import React, { useState } from 'react';
import { Badge, Card, Modal, Button } from '../../components/UI';
import { Notice as NoticeType, CalendarEvent } from '../../types';
import { Bell, Calendar, AlertCircle, ChevronRight, ArrowLeft, ImageIcon, Target, ChevronLeft, FileText, Download, ExternalLink, CalendarPlus } from 'lucide-react';

interface Props {
    notices?: NoticeType[];
    readIds?: string[];
    onMarkRead?: (id: string) => void;
    calendarEvents?: CalendarEvent[];
    userClass?: string;
}

const Notice: React.FC<Props> = ({ notices = [], readIds = [], onMarkRead, calendarEvents = [], userClass }) => {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'CALENDAR'>('BOARD');
  const [selectedNotice, setSelectedNotice] = useState<NoticeType | null>(null);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // --- CALENDAR HELPERS ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const formatDate = (day: number) => new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];

  const getEventsForDate = (dateStr: string) => {
      return calendarEvents.filter(e => {
          const dateMatch = e.date === dateStr;
          const classMatch = !e.targetClass || e.targetClass === 'ALL' || e.targetClass === userClass;
          return dateMatch && classMatch;
      });
  };

  const handleDateClick = (dateStr: string) => {
      setSelectedDate(dateStr);
      setIsDateModalOpen(true);
  };

  // --- GOOGLE CALENDAR SYNC ---
  const addToGoogleCalendar = (event: CalendarEvent) => {
      const title = encodeURIComponent(event.title);
      const details = encodeURIComponent(event.description || "Event from EduMaster Pro");
      
      // Format Date: YYYYMMDD (Google Calendar requires this format)
      // Since our events are YYYY-MM-DD, we just remove dashes.
      const dateStr = event.date.replace(/-/g, '');
      
      // For all-day event, start and end dates are the same (or end date is next day)
      // Construct URL
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${dateStr}`;
      
      window.open(url, '_blank');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleSelectNotice = (notice: NoticeType) => {
      setSelectedNotice(notice);
      if (onMarkRead) {
          onMarkRead(notice.id);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 mb-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Bell className="mr-3 text-indigo-600" size={28} />
          Updates
        </h1>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
            <button 
                onClick={() => setActiveTab('BOARD')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'BOARD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Notice Board
            </button>
            <button 
                onClick={() => setActiveTab('CALENDAR')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'CALENDAR' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Academic Calendar
            </button>
        </div>
      </div>

      {activeTab === 'BOARD' && (
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
                         notices.map(notice => {
                            const isRead = readIds.includes(notice.id);
                            return (
                                <div 
                                    key={notice.id}
                                    onClick={() => handleSelectNotice(notice)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${
                                        selectedNotice?.id === notice.id 
                                        ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50 z-10' 
                                        : isRead 
                                            ? 'bg-white border-slate-200 hover:border-indigo-300' 
                                            : 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                                    }`}
                                >
                                    {/* Priority Indicator Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                        notice.priority === 'HIGH' ? 'bg-red-500' : notice.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}></div>

                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center">
                                                {/* Unread Dot */}
                                                {!isRead && (
                                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 shrink-0 animate-pulse"></span>
                                                )}
                                                <h3 className={`text-base line-clamp-1 ${!isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'} ${selectedNotice?.id === notice.id ? 'text-indigo-900' : ''}`}>
                                                    {notice.title}
                                                </h3>
                                            </div>
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {new Date(notice.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        
                                        {notice.targetClass && (
                                            <div className="mb-2">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center w-fit">
                                                    <Target size={10} className="mr-1" /> {notice.targetClass} Only
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center text-xs text-slate-500 mb-2">
                                            <p className={`line-clamp-2 leading-relaxed flex-1 mr-2 ${!isRead ? 'text-slate-600 font-medium' : ''}`}>
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
                            );
                         })
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
                                  <div className="mb-6 flex gap-2">
                                      <Badge color={getPriorityColor(selectedNotice.priority)}>
                                          {selectedNotice.priority} PRIORITY
                                      </Badge>
                                      {selectedNotice.targetClass && (
                                          <Badge color="bg-indigo-100 text-indigo-700">For {selectedNotice.targetClass}</Badge>
                                      )}
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
      )}

      {activeTab === 'CALENDAR' && (
          <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-slate-800 text-lg">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                  <div className="flex gap-2">
                      <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                      <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100">Today</button>
                      <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
                      <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = formatDate(day);
                          const events = getEventsForDate(dateStr);
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;

                          return (
                              <div 
                                  key={day} 
                                  onClick={() => handleDateClick(dateStr)}
                                  className={`min-h-[100px] border rounded-xl p-2 cursor-pointer transition-all hover:border-indigo-300 ${isToday ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'border-slate-100 hover:bg-slate-50'}`}
                              >
                                  <div className="flex justify-between items-center mb-1">
                                      <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{day}</span>
                                      {events.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                  </div>
                                  
                                  <div className="flex-1 overflow-hidden space-y-1">
                                      {events.slice(0, 3).map(ev => (
                                          <div key={ev.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                                              ev.type === 'EXAM' ? 'bg-purple-100 text-purple-700' : 
                                              ev.type === 'HOLIDAY' ? 'bg-red-100 text-red-700' : 
                                              ev.type === 'CLASS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                          }`}>
                                              {ev.title}
                                          </div>
                                      ))}
                                      {events.length > 3 && (
                                          <div className="text-[9px] text-slate-400 pl-1">+{events.length - 3} more</div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* DATE DETAILS MODAL */}
      <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} title={`Events on ${selectedDate ? new Date(selectedDate).toLocaleDateString() : ''}`} size="md">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {selectedDate && getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                      <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                      <p>No events scheduled for this day.</p>
                  </div>
              ) : (
                  selectedDate && getEventsForDate(selectedDate).map(ev => (
                      <Card key={ev.id} className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-base">{ev.title}</h4>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        ev.type === 'EXAM' ? 'bg-purple-100 text-purple-700' : 
                                        ev.type === 'HOLIDAY' ? 'bg-red-100 text-red-700' : 
                                        ev.type === 'CLASS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {ev.type}
                                    </span>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => addToGoogleCalendar(ev)}
                                className="text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center hover:bg-indigo-100 transition-colors"
                                title="Add to Google Calendar"
                              >
                                  <CalendarPlus size={14} className="mr-1.5" /> Sync
                              </button>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-3 leading-relaxed">{ev.description || 'No additional details.'}</p>
                          
                          {/* Attachment Display */}
                          {ev.attachment && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                  {ev.attachmentType === 'IMAGE' ? (
                                      <div className="rounded-lg overflow-hidden border border-slate-200">
                                          <img src={ev.attachment} alt="Event Attachment" className="w-full h-auto max-h-48 object-cover" />
                                      </div>
                                  ) : (
                                      <a 
                                          href={ev.attachment} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="flex items-center justify-center w-full p-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-bold text-sm border border-indigo-200"
                                      >
                                          <ExternalLink size={16} className="mr-2"/> View Attached File / Link
                                      </a>
                                  )}
                              </div>
                          )}
                      </Card>
                  ))
              )}
          </div>
          <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsDateModalOpen(false)}>Close</Button>
          </div>
      </Modal>
    </div>
  );
};

export default Notice;
