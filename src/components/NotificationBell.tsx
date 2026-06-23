import { useState, useRef, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { RiNotification3Line, RiCheckDoubleLine, RiDeleteBinLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5"
      >
        <RiNotification3Line size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-emerald-500/20 rounded-xl shadow-2xl overflow-hidden z-[100]"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/20">
              <span className="text-xs font-bold tracking-widest text-emerald-400">NOTIFICATIONS</span>
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="text-zinc-500 hover:text-emerald-400 transition-colors" title="Mark all as read">
                  <RiCheckDoubleLine size={16} />
                </button>
                <button onClick={clearAll} className="text-zinc-500 hover:text-red-400 transition-colors" title="Clear all">
                  <RiDeleteBinLine size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs font-mono">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${!notification.read ? 'bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold ${!notification.read ? 'text-emerald-300' : 'text-zinc-400'}`}>
                        {notification.title}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
