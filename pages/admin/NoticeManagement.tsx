
import React, { useState, useRef, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { Notice, CalendarEvent } from '../../types';
import { Plus, Trash2, Calendar as CalendarIcon, Image as ImageIcon, X, Upload, AlertTriangle, Target, Megaphone, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  educationLevels: { REGULAR: string[], ADMISSION: string[] }; 
  calendarEvents?: CalendarEvent[];
  setCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

const NoticeManagement: React.FC<Props> = ({ notices, setNotices, educationLevels, calendarEvents = [], setCalendarEvents }) => {
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'CALENDAR'>('NOTICES');
  
  // Notice Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    priority: 'LOW' as 'HIGH' | 'MEDIUM' | 'LOW',
    targetClass: '' 
  });
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [eventForm, setEventForm] = useState<{ title: string; description: string; type: 'EXAM' | 'HOLIDAY' | 'CLASS' | 'EVENT'; targetClass: string }>({
      title: '', description: '', type: 'EVENT', targetClass: ''
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; type: 'NOTICE' | 'EVENT' }>({ isOpen: false, id: null, type: 'NOTICE' });
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CALENDAR LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDate = (day: number) => {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return d.toISOString().split('T')[0];
  };

  const getEventsForDate = (dateStr: string) => {
      return calendarEvents.filter(e => e.date === dateStr);
  };

  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!setCalendarEvents || !selectedDate) return;

      const newEvent: CalendarEvent = {
          id: `evt_${Date.now()}`,
          date: selectedDate,
          title: eventForm.title,
          description: eventForm.description,
          type: eventForm.type,
          targetClass: eventForm.targetClass || undefined
      };

      setCalendarEvents([newEvent, ...calendarEvents]);
      setEventForm({ title: '', description: '', type: 'EVENT', targetClass: '' });
      setInfoModal({ isOpen: true, title: "Success", message: "Event added to calendar!" });
  };

  // --- NOTICE LOGIC ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotice: Notice = {
      id: `notice_${Date.now()}`,
      title: formData.title,
      content: formData.content,
      image: formData.image || undefined,
      priority: formData.priority,
      targetClass: formData.targetClass || undefined, 
      date: new Date().toISOString()
    };
    // Prepend to top
    setNotices([newNotice, ...notices]);
    setFormData({ title: '', content: '', image: '', priority: 'LOW', targetClass: '' });
    
    setInfoModal({
        isOpen: true,
        title: 'Success',
        message: 'Notice posted successfully!'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setFormData(prev => ({ ...prev, image: event.target?.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const initiateDelete = (id: string, type: 'NOTICE' | 'EVENT') => {
      setDeleteModal({ isOpen: true, id, type });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          if (deleteModal.type === 'NOTICE') {
              setNotices(notices.filter(n => n.id !== deleteModal.id));
          } else if (setCalendarEvents) {
              setCalendarEvents(calendarEvents.filter(e => e.id !== deleteModal.id));
          }
          setDeleteModal({ isOpen: false, id: null, type: 'NOTICE' });
      }
  };

  const getPriorityColor = (p: string) => {
      if(p === 'HIGH') return 'bg-red-100 text-red-700';
      if(p === 'MEDIUM') return 'bg-amber-100 text-amber-700';
      return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <Megaphone className="mr-3 text-indigo-600" size={28} />
              Communication Center
          </h1>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                  onClick={() => setActiveTab('NOTICES')}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'NOTICES' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Notices
              </button>
              <button 
                  onClick={() => setActiveTab('CALENDAR')}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'CALENDAR' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Calendar
              </button>
          </div>
      </div>

      {activeTab === 'NOTICES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1">
              <Card>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Plus size={20} className="mr-2 text-indigo-600" /> Post New Notice
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Notice Headline" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
                        <div className="relative">
                            <Target size={14} className="absolute left-2.5 top-3 text-slate-400" />
                            <select 
                                className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.targetClass}
                                onChange={e => setFormData({...formData, targetClass: e.target.value})}
                            >
                                <option value="">All Students</option>
                                <optgroup label="Regular & Job Prep">
                                    {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                                <optgroup label="Admission">
                                    {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                                </optgroup>
                            </select>
                        </div>
                      </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                    <textarea required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={4}
                      value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Details..." />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleImageUpload} 
                          accept="image/*"
                      />
                      <div className="flex flex-col gap-2">
                          <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center justify-center w-full"
                          >
                              <Upload size={16} className="mr-2" /> Upload Image
                          </Button>
                          
                          {formData.image && (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-200">
                                  <img src={formData.image} alt="Preview" className="w-full h-32 object-cover" />
                                  <button 
                                      type="button" 
                                      onClick={() => setFormData(prev => ({...prev, image: ''}))}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  <Button type="submit" className="w-full">Post Notice</Button>
                </form>
              </Card>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              {notices.length === 0 && <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No notices active.</div>}
              {notices.map(notice => (
                <Card key={notice.id} className={`flex flex-col border-l-4 ${notice.priority === 'HIGH' ? 'border-l-red-500' : 'border-l-slate-200'}`}>
                   <div className="flex justify-between items-start mb-2">
                      <div>
                          <h3 className="font-bold text-slate-800 text-lg">{notice.title}</h3>
                          <div className="flex gap-2 mt-1">
                              <Badge color={getPriorityColor(notice.priority)}>{notice.priority}</Badge>
                              {notice.targetClass ? (
                                  <Badge color="bg-indigo-100 text-indigo-700">{notice.targetClass}</Badge>
                              ) : (
                                  <Badge color="bg-slate-100 text-slate-600">Public (All)</Badge>
                              )}
                          </div>
                      </div>
                      <button onClick={() => initiateDelete(notice.id, 'NOTICE')} className="text-slate-400 hover:text-red-500 p-1 bg-slate-50 rounded"><Trash2 size={16} /></button>
                   </div>
                   <p className="text-xs text-slate-400 mb-3 flex items-center">
                     <CalendarIcon size={12} className="mr-1" /> {new Date(notice.date).toLocaleDateString()}
                   </p>
                   <p className="text-slate-600 text-sm mb-2 whitespace-pre-wrap">{notice.content}</p>
                   
                   {/* Image Preview in Admin List */}
                   {notice.image && (
                       <div className="mt-2 relative inline-block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center">
                               <ImageIcon size={12} className="mr-1" /> Attached Image
                           </div>
                           <img src={notice.image} alt="Notice Attachment" className="h-20 w-auto rounded border border-slate-200 object-cover" />
                       </div>
                   )}
                </Card>
              ))}
            </div>
          </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'CALENDAR' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Calendar Widget */}
              <div className="lg:col-span-2">
                  <Card className="p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                          <div className="flex gap-2">
                              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                              <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 rounded">Today</button>
                              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
                          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const dateStr = formatDate(day);
                              const events = getEventsForDate(dateStr);
                              const isSelected = selectedDate === dateStr;
                              const isToday = new Date().toISOString().split('T')[0] === dateStr;

                              return (
                                  <div 
                                      key={day} 
                                      onClick={() => setSelectedDate(dateStr)}
                                      className={`h-24 border rounded-lg p-2 cursor-pointer transition-all hover:border-indigo-400 relative flex flex-col ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/30' : 'border-slate-100'} ${isToday ? 'bg-slate-50' : ''}`}
                                  >
                                      <span className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{day}</span>
                                      <div className="flex-1 overflow-y-auto mt-1 space-y-1 custom-scrollbar">
                                          {events.map(ev => (
                                              <div key={ev.id} className={`text-[9px] px-1 py-0.5 rounded truncate ${
                                                  ev.type === 'EXAM' ? 'bg-purple-100 text-purple-700' : 
                                                  ev.type === 'HOLIDAY' ? 'bg-red-100 text-red-700' : 
                                                  ev.type === 'CLASS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                                  {ev.title}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </Card>
              </div>

              {/* Event Editor */}
              <div className="lg:col-span-1 space-y-6">
                  <Card>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Plus size={20} className="mr-2 text-indigo-600" /> 
                          {selectedDate ? `Add Event for ${selectedDate}` : 'Select a date'}
                      </h3>
                      {selectedDate ? (
                          <form onSubmit={handleAddEvent} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                                  <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                      value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="e.g. Physics Quiz" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                      <select className="w-full p-2 border rounded-lg text-sm bg-white"
                                          value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})}>
                                          <option value="EVENT">Event</option>
                                          <option value="EXAM">Exam</option>
                                          <option value="CLASS">Class</option>
                                          <option value="HOLIDAY">Holiday</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Audience</label>
                                      <select className="w-full p-2 border rounded-lg text-sm bg-white"
                                          value={eventForm.targetClass} onChange={e => setEventForm({...eventForm, targetClass: e.target.value})}>
                                          <option value="">All</option>
                                          {educationLevels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                                          {educationLevels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                  <textarea className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" rows={2}
                                      value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} placeholder="Optional details..." />
                              </div>
                              <Button type="submit" className="w-full h-9 text-sm">Add to Calendar</Button>
                          </form>
                      ) : (
                          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                              <CalendarIcon size={32} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">Click on a calendar cell to add an event.</p>
                          </div>
                      )}
                  </Card>

                  {/* Selected Date Events List */}
                  {selectedDate && getEventsForDate(selectedDate).length > 0 && (
                      <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-500 uppercase">Events on {selectedDate}</h4>
                          {getEventsForDate(selectedDate).map(ev => (
                              <div key={ev.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm">{ev.title}</p>
                                      <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{ev.type}</span>
                                          {ev.targetClass && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{ev.targetClass}</span>}
                                      </div>
                                  </div>
                                  <button onClick={() => initiateDelete(ev.id, 'EVENT')} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, type: 'NOTICE' })} title="Confirm Deletion">
          <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start text-red-800">
                  <AlertTriangle size={24} className="mr-3 shrink-0 mt-1" />
                  <div>
                      <p className="font-bold">Permanently delete this {deleteModal.type === 'NOTICE' ? 'notice' : 'event'}?</p>
                      <p className="text-xs mt-1">This action cannot be undone.</p>
                  </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, id: null, type: 'NOTICE' })}>Cancel</Button>
                  <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
              </div>
          </div>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal isOpen={infoModal.isOpen} onClose={() => setInfoModal({ ...infoModal, isOpen: false })} title={infoModal.title}>
          <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start text-emerald-800">
                  <CheckCircle size={24} className="mr-3 shrink-0" />
                  <p>{infoModal.message}</p>
              </div>
              <div className="flex justify-end pt-2">
                  <Button onClick={() => setInfoModal({ ...infoModal, isOpen: false })}>OK</Button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default NoticeManagement;
