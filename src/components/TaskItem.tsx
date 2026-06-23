import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Bell, Pencil, Trash2, CheckCircle2, Circle, Check } from 'lucide-react';
import { playTone } from '../utils/audio';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderTime?: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  createdAt: number;
  notified?: boolean;
  dueNotified?: boolean;
  imageUrl?: string;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const CONFETTI_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'];

export default function TaskItem({ task, onToggleComplete, onEdit, onDelete, isSelected = false, onSelect = () => {} }: TaskItemProps) {
  const [showBurst, setShowBurst] = useState(false);
  const [particles, setParticles] = useState<{ id: number; angle: number; distance: number; size: number; color: string; delay: number }[]>([]);

  const triggerCompletionFeedback = () => {
    // Generate new particles
    const newParticles = Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const distance = 35 + Math.random() * 45;
      const size = 4 + Math.random() * 5;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const delay = Math.random() * 0.08;
      return { id: i, angle, distance, size, color, delay };
    });

    setParticles(newParticles);
    setShowBurst(true);

    // Play pleasant progressive completion chime
    playTone(523.25, 'sine', 0.08, 0.02); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.08, 0.02), 65); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.16, 0.02), 130); // G5

    // Automatically clean up burst state
    setTimeout(() => {
      setShowBurst(false);
    }, 1000);
  };

  const handleToggle = () => {
    if (!task.completed) {
      triggerCompletionFeedback();
    } else {
      // Play a quick normal check/click tone when un-checking
      playTone(400, 'sine', 0.06, 0.02);
    }
    onToggleComplete(task);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: task.completed ? 0.65 : 1,
        y: 0,
        scale: task.completed ? 0.985 : 1,
        backgroundColor: task.completed ? 'rgba(24, 24, 27, 0.4)' : 'rgba(24, 24, 27, 0.95)'
      }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      className={`p-4 rounded-xl border flex items-center gap-4 relative overflow-hidden transition-colors duration-300 card-hover group ${
        task.completed ? 'border-zinc-800' : 'border-zinc-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
      }`}
    >
      {/* Background emerald diagonal shimmer sweep */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ left: "-100%", opacity: 0.7 }}
            animate={{ left: "200%", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Confetti Explosion Burst */}
      <AnimatePresence>
        {showBurst && (
          <div className="absolute left-[26px] top-[26px] pointer-events-none z-50">
            {particles.map(p => {
              const x = Math.cos(p.angle) * p.distance;
              const y = Math.sin(p.angle) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: x,
                    y: y,
                    scale: [1, 1.3, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.1, 0.8, 0.3, 1], // satisfying decel
                    delay: p.delay
                  }}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Select Checkbox */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(task.id, e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-emerald-500 rounded border-zinc-700 bg-zinc-900"
          aria-label={`Select task "${task.title}"`}
        />
      </div>

      {/* Checkbox button with micro-animations */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.88 }}
        onClick={handleToggle}
        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
            : 'border-zinc-500 hover:border-emerald-500 bg-black/20'
        }`}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
          />
        )}
        <AnimatePresence mode="wait">
          {task.completed ? (
            <motion.div
              key="checked"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 30 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-black"
            >
              <Check size={12} strokeWidth={4} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.button>

      {/* Task labels & content with strike-through line builder */}
      <div className="flex-1 overflow-hidden relative">
        <div className="flex items-center gap-2">
          <div className="relative inline-block max-w-full">
            <h3 className={`font-bold truncate transition-colors duration-300 text-sm sm:text-base leading-tight ${
              task.completed ? 'text-zinc-500/80 font-normal' : 'text-zinc-100'
            }`}>
              {task.title}
            </h3>
            {/* Smooth Left-to-Right Draw Strike-through */}
            <AnimatePresence>
              {task.completed && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  exit={{ width: 0 }}
                  className="absolute left-0 top-[52%] h-[1.5px] bg-emerald-500/40 pointer-events-none"
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                />
              )}
            </AnimatePresence>
          </div>

          {!task.completed && task.dueDate && new Date(task.dueDate).getTime() < Date.now() && (
            <span className="text-[8px] sm:text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              Overdue
            </span>
          )}
        </div>

        {task.description && (
          <p className={`text-xs mt-1 truncate transition-colors duration-300 ${
            task.completed ? 'text-zinc-600' : 'text-zinc-400'
          }`}>
            {task.description}
          </p>
        )}

        {task.imageUrl && (
          <div className={`mt-2 w-16 h-16 rounded-lg overflow-hidden border border-white/5 transition-opacity duration-300 ${
            task.completed ? 'opacity-40' : 'opacity-80 hover:opacity-100'
          }`}>
            <img src={task.imageUrl} alt="Task attachment" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono flex-wrap">
          {task.dueDate && (
            <span className={`flex items-center gap-1 transition-colors ${
              task.completed 
                ? 'text-zinc-600' 
                : !task.completed && new Date(task.dueDate).getTime() < Date.now() 
                  ? 'text-red-400/90' 
                  : 'text-blue-400/90'
            }`}>
              <Clock size={10} /> Due: {new Date(task.dueDate).toLocaleString()}
            </span>
          )}
          {task.reminderTime && (
            <span className={`flex items-center gap-1 transition-colors ${task.completed ? 'text-zinc-600' : 'text-purple-400/90'}`}>
              <Bell size={10} /> Reminder: {new Date(task.reminderTime).toLocaleString()}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full transition-all text-[9px] ${
            task.completed
              ? 'bg-zinc-800/20 text-zinc-600 border border-zinc-850'
              : task.priority === 'High' 
                ? 'bg-red-500/10 text-red-400 border border-red-500/10' 
                : task.priority === 'Medium' 
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
          }`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Action buttons (Edit, Delete, Complete button alternates) */}
      <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          className={`p-1.5 rounded-lg transition-all ${
            task.completed 
            ? 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10' 
            : 'text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/15'
          }`}
          title={task.completed ? "Mark as Active" : "Mark as Completed"}
        >
          {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
          title="Edit Task"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}
