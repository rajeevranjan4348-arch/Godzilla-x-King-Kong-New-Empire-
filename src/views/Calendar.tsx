import React, { useState, useEffect } from 'react';
import { RiCalendarEventLine, RiAddLine, RiDeleteBinLine, RiRefreshLine, RiGoogleFill, RiCheckLine, RiCloseLine, RiMapPinLine, RiGroupLine, RiTimeLine, RiAlignLeft } from 'react-icons/ri';
import { motion, AnimatePresence } from 'motion/react';
import { initGoogleCalendar, handleAuthClick, handleSignoutClick, listUpcomingEvents, addEvent, deleteEvent } from '../services/googleCalendar';

interface CalendarViewProps {
  glassPanel: string;
}

export default function CalendarView({ glassPanel }: CalendarViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00'
  });

  useEffect(() => {
    initGoogleCalendar((authStatus) => {
      setIsAuthenticated(authStatus);
      if (authStatus) {
        fetchEvents();
      }
    });
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    const upcomingEvents = await listUpcomingEvents();
    setEvents(upcomingEvents);
    setIsLoading(false);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.summary) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}:00`).toISOString();
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}:00`).toISOString();
      
      await addEvent(newEvent.summary, newEvent.description, startDateTime, endDateTime);
      await fetchEvents();
      setIsAdding(false);
      setNewEvent({
        ...newEvent,
        summary: '',
        description: ''
      });
    } catch (error) {
      console.error("Failed to add event", error);
      setErrorMsg("Failed to add event. Please check your inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await deleteEvent(eventId);
      await fetchEvents();
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Failed to delete event", error);
      setErrorMsg("Failed to delete event.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto scrollbar-small animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-widest text-emerald-500 flex items-center gap-3">
            <RiCalendarEventLine /> GOOGLE CALENDAR
          </h2>
          
          <div className="flex gap-3">
            {!isAuthenticated ? (
              <button 
                onClick={handleAuthClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-bold tracking-widest"
              >
                <RiGoogleFill /> CONNECT GOOGLE ACCOUNT
              </button>
            ) : (
              <>
                <button 
                  onClick={fetchEvents}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors text-xs font-bold tracking-widest disabled:opacity-50"
                >
                  <RiRefreshLine className={isLoading ? "animate-spin" : ""} /> REFRESH
                </button>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-bold tracking-widest"
                >
                  <RiAddLine /> {isAdding ? 'CANCEL' : 'NEW EVENT'}
                </button>
                <button 
                  onClick={() => handleSignoutClick(setIsAuthenticated)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-bold tracking-widest"
                >
                  DISCONNECT
                </button>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {isAuthenticated && isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddEvent}
            className={`${glassPanel} p-5 flex flex-col gap-4`}
          >
            <h3 className="text-xs font-bold tracking-widest text-emerald-400 border-b border-white/10 pb-2">ADD NEW EVENT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500">EVENT TITLE</label>
                <input 
                  type="text" 
                  required
                  value={newEvent.summary}
                  onChange={e => setNewEvent({...newEvent, summary: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                  placeholder="Meeting with team"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500">DATE</label>
                <input 
                  type="date" 
                  required
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500">START TIME</label>
                <input 
                  type="time" 
                  required
                  value={newEvent.startTime}
                  onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500">END TIME</label>
                <input 
                  type="time" 
                  required
                  value={newEvent.endTime}
                  onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-mono text-zinc-500">DESCRIPTION (OPTIONAL)</label>
                <textarea 
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 min-h-[80px]"
                  placeholder="Event details..."
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-emerald-500 text-black font-bold text-xs tracking-widest rounded hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'SAVING...' : 'SAVE EVENT'}
              </button>
            </div>
          </motion.form>
        )}

        {isAuthenticated ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400">UPCOMING EVENTS</h3>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-4 border border-white/5 rounded-2xl bg-white/5">
                <RiCalendarEventLine size={32} className="opacity-50" />
                <p className="font-mono text-sm tracking-widest">NO UPCOMING EVENTS</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {events.map((event, idx) => {
                  const start = event.start.dateTime || event.start.date;
                  const end = event.end.dateTime || event.end.date;
                  const startDate = new Date(start);
                  const endDate = new Date(end);
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`${glassPanel} p-4 flex items-center justify-between group cursor-pointer hover:border-emerald-500/30 transition-colors`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white">{event.summary || '(No title)'}</span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {event.description && (
                          <span className="text-xs text-zinc-400 mt-1 line-clamp-2">{event.description}</span>
                        )}
                      </div>
                      {confirmDeleteId === event.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-red-400 font-bold">SURE?</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                            aria-label="Confirm delete"
                          >
                            <RiCheckLine />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-1.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded transition-colors"
                            aria-label="Cancel delete"
                          >
                            <RiCloseLine />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(event.id); }}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Delete event"
                        >
                          <RiDeleteBinLine />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-4 border border-white/5 rounded-2xl bg-white/5">
            <RiGoogleFill size={48} className="opacity-50" />
            <p className="font-mono text-sm tracking-widest text-center max-w-md">
              CONNECT YOUR GOOGLE ACCOUNT TO VIEW AND MANAGE YOUR CALENDAR EVENTS DIRECTLY FROM IRIS.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${glassPanel} w-full max-w-lg overflow-hidden flex flex-col`}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                <h3 className="text-sm font-bold text-white truncate pr-4">
                  {selectedEvent.summary || '(No title)'}
                </h3>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto scrollbar-small">
                <div className="flex items-start gap-4 text-zinc-300">
                  <RiTimeLine className="mt-1 text-emerald-500 flex-shrink-0" size={18} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-zinc-400 mt-1">
                      {new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedEvent.end.dateTime || selectedEvent.end.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start gap-4 text-zinc-300">
                    <RiMapPinLine className="mt-1 text-blue-500 flex-shrink-0" size={18} />
                    <span className="text-sm">{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="flex items-start gap-4 text-zinc-300">
                    <RiAlignLeft className="mt-1 text-purple-500 flex-shrink-0" size={18} />
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-start gap-4 text-zinc-300">
                    <RiGroupLine className="mt-1 text-amber-500 flex-shrink-0" size={18} />
                    <div className="flex flex-col gap-2 w-full">
                      <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Attendees ({selectedEvent.attendees.length})</span>
                      <div className="flex flex-col gap-2">
                        {selectedEvent.attendees.map((attendee: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
                            <div className="flex flex-col truncate pr-2">
                              {attendee.displayName && <span className="text-sm text-white truncate">{attendee.displayName}</span>}
                              <span className="text-xs text-zinc-400 truncate">{attendee.email}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase flex-shrink-0 ${
                              attendee.responseStatus === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                              attendee.responseStatus === 'declined' ? 'bg-red-500/20 text-red-400' :
                              attendee.responseStatus === 'tentative' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {attendee.responseStatus || 'needs action'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedEvent.htmlLink && (
                <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                  <a 
                    href={selectedEvent.htmlLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                  >
                    VIEW IN GOOGLE CALENDAR <RiGoogleFill />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
