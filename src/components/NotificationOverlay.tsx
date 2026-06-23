import { useEffect } from 'react';
import { useNotificationStore, Notification } from '../store/notificationStore';
import { RiCloseLine, RiInformationLine, RiCheckLine, RiAlertLine, RiErrorWarningLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ notification }: { notification: Notification }) => {
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, removeNotification]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <RiCheckLine className="text-emerald-400" size={20} />;
      case 'warning': return <RiAlertLine className="text-yellow-400" size={20} />;
      case 'error': return <RiErrorWarningLine className="text-red-400" size={20} />;
      default: return <RiInformationLine className="text-blue-400" size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-emerald-500/50';
      case 'warning': return 'border-yellow-500/50';
      case 'error': return 'border-red-500/50';
      default: return 'border-blue-500/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`bg-zinc-900/90 backdrop-blur-md border ${getBorderColor()} rounded-xl p-4 shadow-2xl flex items-start gap-3`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-zinc-100">{notification.title}</h4>
        <p className="text-xs text-zinc-400 mt-1">{notification.message}</p>
        
        {notification.action && (
          <button
            onClick={() => {
              notification.action!.onClick();
              removeNotification(notification.id);
            }}
            className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded transition-colors"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <RiCloseLine size={16} />
      </button>
    </motion.div>
  );
};

export default function NotificationOverlay() {
  const notifications = useNotificationStore((state) => state.notifications);
  // Only show the 5 most recent notifications as toasts
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="fixed bottom-20 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {recentNotifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
