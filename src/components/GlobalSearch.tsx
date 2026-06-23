import React, { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiCloseLine, RiStickyNoteLine, RiTaskLine, RiApps2Line, RiTerminalBoxLine } from 'react-icons/ri';
import { APPS } from '../views/Apps';

interface SearchResult {
  id: string;
  type: 'note' | 'task' | 'app' | 'chat';
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  createdAt?: number;
}

export function GlobalSearch({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'recency' | 'app' | 'note' | 'task'>('default');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setSortBy('default');
    }
  }, [isOpen]);

  const sortedResults = React.useMemo(() => {
    const sorted = [...results];
    if (sortBy === 'recency') {
      return sorted.sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      });
    } else if (sortBy === 'app') {
      return sorted.sort((a, b) => {
        if (a.type === 'app' && b.type !== 'app') return -1;
        if (a.type !== 'app' && b.type === 'app') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } else if (sortBy === 'note') {
      return sorted.sort((a, b) => {
        if (a.type === 'note' && b.type !== 'note') return -1;
        if (a.type !== 'note' && b.type === 'note') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    } else if (sortBy === 'task') {
      return sorted.sort((a, b) => {
        if (a.type === 'task' && b.type !== 'task') return -1;
        if (a.type !== 'task' && b.type === 'task') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    }
    return sorted;
  }, [results, sortBy]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [sortedResults]);

  useEffect(() => {
    if (!isOpen) return;
    const handleNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(sortedResults.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + sortedResults.length) % Math.max(sortedResults.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (sortedResults[selectedIndex]) {
          sortedResults[selectedIndex].onClick();
        }
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, sortedResults, selectedIndex]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const searchResults: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      try {
        // Search Apps
        APPS.forEach(app => {
          if (app.name.toLowerCase().includes(lowerQuery) || app.description.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              id: `app_${app.id}`,
              type: 'app',
              title: app.name,
              description: app.description,
              icon: <RiApps2Line />,
              createdAt: 0,
              onClick: () => {
                onNavigate('APPS');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('iris-search-apps', { detail: app.name }));
                }, 100);
                setIsOpen(false);
              }
            });
          }
        });

        // Search Notes
        const notesRaw = localStorage.getItem('iris_notes');
        if (notesRaw) {
          const notes = JSON.parse(notesRaw);
          notes.forEach((note: any) => {
            if (note.title?.toLowerCase().includes(lowerQuery) || note.content?.toLowerCase().includes(lowerQuery)) {
              searchResults.push({
                id: `note_${note.id || note.filename}`,
                type: 'note',
                title: note.title || 'Untitled Note',
                description: (note.content || '').substring(0, 100) + '...',
                icon: <RiStickyNoteLine />,
                createdAt: note.createdAt || 0,
                onClick: () => {
                  onNavigate('MEMORY');
                  setIsOpen(false);
                }
              });
            }
          });
        }

        // Search Tasks
        const tasksRaw = localStorage.getItem('iris_tasks');
        if (tasksRaw) {
          const tasks = JSON.parse(tasksRaw);
          tasks.forEach((task: any) => {
            if (task.title?.toLowerCase().includes(lowerQuery) || task.description?.toLowerCase().includes(lowerQuery)) {
              searchResults.push({
                id: `task_${task.id}`,
                type: 'task',
                title: task.title || 'Untitled Task',
                description: task.description || '',
                icon: <RiTaskLine />,
                createdAt: task.createdAt || 0,
                onClick: () => {
                  onNavigate('TASKS');
                  setIsOpen(false);
                }
              });
            }
          });
        }

        // Search Chat History
        const chatRaw = localStorage.getItem('rishi_chat_sessions');
        if (chatRaw) {
          const sessions = JSON.parse(chatRaw);
          sessions.forEach((session: any) => {
            let matchFound = false;
            let matchedText = '';
            
            // Check summary
            if (session.summary?.toLowerCase().includes(lowerQuery)) {
              matchFound = true;
              matchedText = session.summary;
            } else {
              // Check messages
              for (const msg of session.messages || []) {
                if (msg.content?.toLowerCase().includes(lowerQuery)) {
                  matchFound = true;
                  matchedText = msg.content;
                  break;
                }
              }
            }

            if (matchFound) {
              searchResults.push({
                id: `chat_${session.id}`,
                type: 'chat',
                title: session.summary || `Chat from ${new Date(session.timestamp).toLocaleDateString()}`,
                description: matchedText.substring(0, 100) + '...',
                icon: <RiTerminalBoxLine />,
                createdAt: session.timestamp ? new Date(session.timestamp).getTime() : 0,
                onClick: () => {
                  onNavigate('CHAT');
                  setIsOpen(false);
                }
              });
            }
          });
        }

      } catch (error) {
        console.error("Search error:", error);
      }

      setResults(searchResults);
      setIsSearching(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, onNavigate]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-black/40 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
      >
        <RiSearchLine size={16} />
        <span className="hidden md:inline text-xs font-medium tracking-widest">SEARCH</span>
        <span className="hidden md:inline text-[10px] opacity-70 ml-2 border border-zinc-600 px-1.5 py-0.5 rounded font-mono bg-white/5">⌘K</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-[90%] max-w-2xl bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl flex flex-col z-[201] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-4 border-b border-white/10 bg-black/20">
              <RiSearchLine size={20} className="text-emerald-500 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search apps, notes, tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-zinc-600"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white transition-colors">
                  <RiCloseLine size={20} />
                </button>
              )}
            </div>

            {/* Sorting controls */}
            {query.trim() && sortedResults.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-zinc-950/40 text-[10px] font-mono tracking-wider text-zinc-400">
                <span className="text-zinc-500 font-bold uppercase mr-1 shrink-0">PRIORITIZE:</span>
                <button
                  type="button"
                  onClick={() => setSortBy('default')}
                  className={`px-2 py-0.5 rounded transition-all select-none ${sortBy === 'default' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-transparent border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  DEFAULT
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('recency')}
                  className={`px-2 py-0.5 rounded transition-all select-none ${sortBy === 'recency' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-transparent border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  RECENCY
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('app')}
                  className={`px-2 py-0.5 rounded transition-all select-none ${sortBy === 'app' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-transparent border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  APPS
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('note')}
                  className={`px-2 py-0.5 rounded transition-all select-none ${sortBy === 'note' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-transparent border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  NOTES
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('task')}
                  className={`px-2 py-0.5 rounded transition-all select-none ${sortBy === 'task' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-transparent border border-transparent hover:text-white hover:bg-white/5'}`}
                >
                  TASKS
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
              {isSearching ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Searching...</div>
              ) : sortedResults.length > 0 ? (
                <div className="py-2">
                  {sortedResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={result.onClick}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-start gap-4 px-4 py-3 transition-colors text-left ${index === selectedIndex ? 'bg-zinc-800 border-l-2 border-emerald-500' : 'hover:bg-zinc-800 border-l-2 border-transparent'}`}
                    >
                      <div className="p-2 bg-black/40 rounded-lg text-emerald-500 shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-sm font-medium text-zinc-200 truncate">{result.title}</span>
                        <span className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{result.description}</span>
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-1 shrink-0 font-mono text-[9px] text-right self-center">
                        <span className="text-zinc-400 font-bold uppercase tracking-widest bg-zinc-800/40 border border-white/5 px-1.5 py-0.5 rounded text-[8px]">
                          {result.type}
                        </span>
                        {result.createdAt && result.createdAt > 0 ? (
                          <span className="text-zinc-600 font-medium">
                            {new Date(result.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No results found for "{query}"</div>
              ) : (
                <div className="p-8 text-center text-zinc-600 text-sm flex flex-col items-center gap-3">
                  <RiSearchLine size={32} className="text-zinc-700" />
                  <span>Type to start searching across IRIS</span>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-white/5 bg-black/40 text-xs text-zinc-500 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <span className="flex items-center gap-1.5"><kbd className="border border-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">↑</kbd> <kbd className="border border-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">↓</kbd> to navigate</span>
                 <span className="flex items-center gap-1.5"><kbd className="border border-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">↵</kbd> to select</span>
               </div>
               <span className="flex items-center gap-1.5"><kbd className="border border-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

