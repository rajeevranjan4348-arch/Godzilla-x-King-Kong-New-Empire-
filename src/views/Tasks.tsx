import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Clock, Bell, Calendar, ImagePlus, X, Pencil, CheckCircle2, Circle, Check } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { playNotification } from '../utils/audio';
import TaskItem from '../components/TaskItem';

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

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('iris_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem('iris_task_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setDueDate(draft.dueDate || '');
        setReminderTime(draft.reminderTime || '');
        setPriority(draft.priority || 'Medium');
      } catch (e) {
        console.error('Failed to parse task draft', e);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title || description || dueDate || reminderTime || priority !== 'Medium') {
        localStorage.setItem('iris_task_draft', JSON.stringify({ title, description, dueDate, reminderTime, priority }));
      } else {
        localStorage.removeItem('iris_task_draft');
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, description, dueDate, reminderTime, priority]);

  const addNotification = useNotificationStore(state => state.addNotification);

  // Check for due reminders and due dates
  useEffect(() => {
    // Request notification permission if not already done
    if ("Notification" in window && Notification.permission !== "denied" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prevTasks => {
        let updated = false;
        const nextTasks = prevTasks.map(task => {
          let modifiedTask = { ...task };
          
          if (!modifiedTask.completed && modifiedTask.reminderTime && !modifiedTask.notified) {
            const reminderMs = new Date(modifiedTask.reminderTime).getTime();
            if (now >= reminderMs) {
              updated = true;
              addNotification({
                title: `Task Reminder: ${modifiedTask.priority}`,
                message: modifiedTask.title,
                type: 'info'
              });
              
              // Trigger browser Native notification
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`Task Reminder: ${modifiedTask.title}`, {
                  body: modifiedTask.description || `Priority: ${modifiedTask.priority}`,
                  icon: '/favicon.ico'
                });
              }

              playNotification();
              modifiedTask.notified = true;
            }
          }

          if (!modifiedTask.completed && modifiedTask.dueDate && !modifiedTask.dueNotified) {
            const dueMs = new Date(modifiedTask.dueDate).getTime();
            if (now >= dueMs) {
              updated = true;
              addNotification({
                title: `Task Due: ${modifiedTask.priority}`,
                message: modifiedTask.title,
                type: 'warning'
              });
              
              // Trigger browser Native notification
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`Task Due: ${modifiedTask.title}`, {
                  body: modifiedTask.description || `Priority: ${modifiedTask.priority}`,
                  icon: '/favicon.ico'
                });
              }

              playNotification();
              modifiedTask.dueNotified = true;
            }
          }

          return modifiedTask;
        });
        return updated ? nextTasks : prevTasks;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  const [tasksToDelete, setTasksToDelete] = useState<string[] | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');

  useEffect(() => {
    localStorage.setItem('iris_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleTasksUpdated = () => {
      const saved = localStorage.getItem('iris_tasks');
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    };
    window.addEventListener('iris_tasks_updated', handleTasksUpdated);
    return () => window.removeEventListener('iris_tasks_updated', handleTasksUpdated);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageAttachment(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddTask = () => {
    if (!title.trim()) return;

    if (editingTaskId) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        title,
        description,
        dueDate,
        reminderTime: reminderTime || undefined,
        priority,
        imageUrl: imageAttachment || undefined,
      } : t));
      setEditingTaskId(null);
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substring(7),
        title,
        description,
        dueDate,
        reminderTime: reminderTime || undefined,
        priority,
        completed: false,
        createdAt: Date.now(),
        imageUrl: imageAttachment || undefined,
      };
      setTasks(prev => [...prev, newTask]);
    }

    setTitle('');
    setDescription('');
    setDueDate('');
    setReminderTime('');
    setPriority('Medium');
    setImageAttachment(null);
    localStorage.removeItem('iris_task_draft');
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate || '');
    setReminderTime(task.reminderTime || '');
    setPriority(task.priority);
    setImageAttachment(task.imageUrl || null);
  };

  const toggleTaskCompletion = (task: Task) => {
    const isNowCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: isNowCompleted } : t));
    
    addNotification({
      title: isNowCompleted ? 'Task Completed' : 'Task Active',
      message: `"${task.title}" has been marked as ${isNowCompleted ? 'complete' : 'active'}.`,
      type: isNowCompleted ? 'success' : 'info',
      action: {
        label: 'Undo',
        onClick: () => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !isNowCompleted } : t))
      }
    });
  };

  const confirmDelete = (ids: string[]) => {
    const tasksToRemove = tasks.filter(t => ids.includes(t.id));
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    setTasksToDelete(null);
    setSelectedTaskIds(new Set());
    
    addNotification({
      title: ids.length > 1 ? 'Tasks Deleted' : 'Task Deleted',
      message: `${ids.length} task${ids.length > 1 ? 's' : ''} deleted.`,
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => setTasks(prev => [...prev, ...tasksToRemove])
      }
    });
  };

  const handleSelectTask = (id: string, selected: boolean) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkComplete = () => {
    const idsToComplete = Array.from(selectedTaskIds);
    setTasks(prev => prev.map(t => idsToComplete.includes(t.id) ? { ...t, completed: true } : t));
    setSelectedTaskIds(new Set());
    
    addNotification({
      title: 'Tasks Completed',
      message: `${idsToComplete.length} tasks marked as complete.`,
      type: 'success',
      action: {
        label: 'Undo',
        onClick: () => setTasks(prev => prev.map(t => idsToComplete.includes(t.id) ? { ...t, completed: false } : t))
      }
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ACTIVE' && task.completed) return false;
    if (filterStatus === 'COMPLETED' && !task.completed) return false;
    if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      comparison = dateA - dateB;
    } else if (sortBy === 'priority') {
      const priorityWeights = { High: 3, Medium: 2, Low: 1 };
      comparison = priorityWeights[a.priority] - priorityWeights[b.priority];
    } else {
      comparison = a.createdAt - b.createdAt;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="flex h-full bg-[#111111] p-6 gap-6 font-sans text-white relative">
      <AnimatePresence>
        {tasksToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-white mb-2">Delete {tasksToDelete.length > 1 ? 'Tasks' : 'Task'}</h3>
              <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Are you sure you want to permanently delete {tasksToDelete.length > 1 ? `these ${tasksToDelete.length} tasks` : 'this task'}? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => confirmDelete(tasksToDelete)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                  aria-label="Confirm deletion"
                >
                  Delete
                </button>
                <button
                  onClick={() => setTasksToDelete(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                  aria-label="Cancel deletion"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-1/3 flex flex-col gap-4 border-r border-white/10 pr-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-widest uppercase">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
          {editingTaskId && (
            <button
              onClick={() => {
                setEditingTaskId(null);
                setTitle('');
                setDescription('');
                setDueDate('');
                setReminderTime('');
                setPriority('Medium');
                setImageAttachment(null);
              }}
              className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider font-semibold bg-zinc-800 px-2 py-1 rounded"
            >
              Cancel
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Task Title"
          aria-label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
        />
        <textarea
          placeholder="Description"
          aria-label="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm h-24 resize-none focus:outline-none focus:border-emerald-500"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Due Date</label>
          <input
            type="datetime-local"
            aria-label="Task Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Reminder</label>
          <input
            type="datetime-local"
            aria-label="Task Reminder Time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          aria-label="Task Priority"
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
        
        {imageAttachment ? (
          <div className="relative w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group">
            <img src={imageAttachment} alt="Attachment Preview" className="w-full h-full object-cover opacity-80" />
            <button 
              onClick={() => setImageAttachment(null)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove image attachment"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
            <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-400 transition-colors flex items-center justify-center gap-2 border-dashed"
            aria-label="Attach an image to the task"
          >
            <ImagePlus size={18} /> Attach Image
          </button>
        )}
        <input 
          type="file" 
          accept="image/*"
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          aria-hidden="true"
          tabIndex={-1}
        />

        <button
          onClick={handleAddTask}
          className={`${editingTaskId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2`}
          aria-label={editingTaskId ? "Save task changes" : "Add new task"}
        >
          {editingTaskId ? <Check size={20} /> : <Plus size={20} />} {editingTaskId ? 'Save Changes' : 'Add Task'}
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-widest">TASKS</h2>
          <div className="flex gap-2 items-center flex-wrap justify-end">
            <AnimatePresence>
              {selectedTaskIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1 mr-2 px-3"
                >
                  <span className="text-xs font-bold text-emerald-400 mr-2">{selectedTaskIds.size} Selected</span>
                  <button
                    onClick={handleBulkComplete}
                    className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-md transition-colors"
                    title="Mark Selected as Complete"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => setTasksToDelete(Array.from(selectedTaskIds))}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                    title="Delete Selected"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedTaskIds(new Set())}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-md transition-colors ml-1 border-l border-white/10 pl-2"
                    title="Clear Selection"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <select
              value={filterStatus}
              aria-label="Filter tasks by status"
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={filterPriority}
              aria-label="Filter tasks by priority"
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
                    <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
              {(['dueDate', 'priority', 'createdAt'] as const).map(field => (
                <button
                  key={field}
                  onClick={() => {
                    if (sortBy === field) {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortBy(field)
                      setSortOrder('asc')
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md font-bold tracking-wider flex items-center gap-1 transition-colors ${
                    sortBy === field ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {field === 'dueDate' ? 'Due' : field === 'priority' ? 'Priority' : 'Created'}
                  {sortBy === field && (
                    <span className="text-emerald-500">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "Title,Description,Priority,Due Date,Completed\n"
                  + tasks.map(t => `"${t.title}","${t.description}","${t.priority}","${t.dueDate}","${t.completed}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "iris_tasks.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {sortedTasks.length === 0 ? (
            <div className="text-zinc-500 text-sm tracking-widest text-center mt-10">NO TASKS FOUND</div>
          ) : (
            <AnimatePresence>
              {sortedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskCompletion}
                  onEdit={handleEditTask}
                  onDelete={(id) => setTasksToDelete([id])}
                  isSelected={selectedTaskIds.has(task.id)}
                  onSelect={handleSelectTask}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
