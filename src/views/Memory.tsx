import { useState, useEffect } from 'react';
import { 
  RiFolderOpenLine, 
  RiAddLine,
  RiSave3Line
} from 'react-icons/ri';
import { playClick, playAction } from '../utils/audio';

interface Memory {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export default function MemoryView() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const loadMemories = () => {
      const saved = localStorage.getItem('iris_memories');
      if (saved) {
        try {
          setMemories(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse memories', e);
        }
      }
    };
    
    loadMemories();

    window.addEventListener('iris_memories_updated', loadMemories);
    return () => window.removeEventListener('iris_memories_updated', loadMemories);
  }, []);

  const saveMemories = (newMemories: Memory[]) => {
    setMemories(newMemories);
    localStorage.setItem('iris_memories', JSON.stringify(newMemories));
  };

  const handleNewMemory = () => {
    playClick();
    setSelectedMemory(null);
    setEditTitle('');
    setEditContent('');
    setIsEditing(true);
  };

  const handleSelectMemory = (memory: Memory) => {
    playClick();
    setSelectedMemory(memory);
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setIsEditing(false);
  };

  const handleStoreMemory = () => {
    if (!editTitle.trim() && !editContent.trim()) return;
    
    playAction();
    
    const newMemory: Memory = {
      id: selectedMemory ? selectedMemory.id : Math.random().toString(36).substring(7),
      title: editTitle.trim() || 'Untitled Memory',
      content: editContent,
      createdAt: selectedMemory ? selectedMemory.createdAt : Date.now()
    };

    let updatedMemories;
    if (selectedMemory) {
      updatedMemories = memories.map(m => m.id === selectedMemory.id ? newMemory : m);
    } else {
      updatedMemories = [newMemory, ...memories];
    }

    saveMemories(updatedMemories);
    setSelectedMemory(newMemory);
    setIsEditing(false);
  };

  return (
    <div className="h-full w-full flex bg-[#0a0a0a] text-zinc-300">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 text-emerald-400 mb-8">
            <RiFolderOpenLine size={24} />
            <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Memory<br/>Bank</h1>
          </div>
          
          <button 
            onClick={handleNewMemory}
            className="w-full py-3 flex items-center justify-center gap-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
          >
            <RiAddLine size={18} />
            <span className="text-xs font-mono tracking-widest">New Memory</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-small">
          {memories.map(memory => (
             <button
              key={memory.id}
              onClick={() => handleSelectMemory(memory)}
              className={`p-4 rounded-xl border text-left transition-all card-hover ${
                selectedMemory?.id === memory.id 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <h3 className="text-sm font-bold text-white mb-2 truncate">{memory.title}</h3>
              <p className="text-[10px] font-mono text-zinc-500">
                {new Date(memory.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        {(isEditing || !selectedMemory) ? (
          <>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Memory Title..."
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              placeholder="Memory Content (Markdown supported)..."
              className="flex-1 w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono resize-none scrollbar-small"
            />
            <button
              onClick={handleStoreMemory}
              className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RiAddLine size={18} />
              <span className="text-xs font-bold tracking-widest uppercase">Store Memory</span>
            </button>
          </>
        ) : (
          <>
            <div className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-sm text-white font-mono flex justify-between items-center">
              <span>{selectedMemory.title}</span>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 tracking-widest uppercase"
              >
                Edit
              </button>
            </div>
            <div className="flex-1 w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-sm text-white font-mono overflow-y-auto whitespace-pre-wrap scrollbar-small">
              {selectedMemory.content}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
