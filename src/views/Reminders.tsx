import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RiTimeLine, RiDeleteBinLine, RiAddLine, RiCheckLine } from 'react-icons/ri'
import { playClick } from '../utils/audio'

interface Reminder {
  id: string
  message: string
  time: string
  notified: boolean
}

interface RemindersProps {
  reminders: Reminder[]
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
}

const RemindersView = ({ reminders, setReminders }: RemindersProps) => {
  const [newMessage, setNewMessage] = useState('')
  const [newTime, setNewTime] = useState('')

  const addReminder = () => {
    if (!newMessage || !newTime) return
    playClick()
    const reminder: Reminder = {
      id: Math.random().toString(36).substring(7),
      message: newMessage,
      time: new Date(newTime).toISOString(),
      notified: false
    }
    setReminders(prev => {
      const updated = [...prev, reminder].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      localStorage.setItem('iris_reminders', JSON.stringify(updated))
      return updated
    })
    setNewMessage('')
    setNewTime('')
  }

  const deleteReminder = (id: string) => {
    playClick()
    setReminders(prev => {
      const updated = prev.filter(r => r.id !== id)
      localStorage.setItem('iris_reminders', JSON.stringify(updated))
      return updated
    })
  }

  const cardClass = 'bg-[#0f0f13] border border-white/10 p-6 rounded-2xl flex flex-col gap-4 hover:border-white/20 transition-all shadow-lg'

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-16 flex flex-col items-center bg-black min-h-screen text-zinc-100 overflow-y-auto scrollbar-small">
      <motion.div
        className="w-full max-w-3xl flex flex-col gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <RiTimeLine size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white">REMINDERS</h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">Manage temporal alerts and notifications.</p>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <RiAddLine className="text-emerald-500" /> ADD NEW REMINDER
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="What to remind you about..."
              className="flex-1 bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500/50 outline-none transition-colors"
            />
            <input
              type="datetime-local"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500/50 outline-none transition-colors"
            />
            <button
              onClick={addReminder}
              disabled={!newMessage || !newTime}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SET
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-zinc-400 tracking-widest">UPCOMING & PAST</h2>
          <AnimatePresence mode="popLayout">
            {reminders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-zinc-600 font-mono text-sm border border-dashed border-white/10 rounded-xl"
              >
                No reminders set.
              </motion.div>
            ) : (
              reminders.map(reminder => (
                <motion.div
                  key={reminder.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    reminder.notified 
                      ? 'bg-white/5 border-white/5 opacity-50' 
                      : 'bg-[#0f0f13] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${reminder.notified ? 'bg-zinc-600' : 'bg-emerald-500 animate-pulse'}`} />
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${reminder.notified ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>
                        {reminder.message}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono mt-1">
                        {new Date(reminder.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reminder.notified && (
                      <span className="text-[10px] font-bold tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded">
                        NOTIFIED
                      </span>
                    )}
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Reminder"
                    >
                      <RiDeleteBinLine size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default RemindersView
