import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ExternalLink, 
  Sparkles, 
  Download, 
  Copy, 
  MessageSquare, 
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Terminal,
  Languages,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
}

interface ChatViewProps {
  setActiveTab?: (tab: string) => void;
}

export default function ChatView({ setActiveTab }: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Inline rename states
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sound feedback
  const playSfx = (freqStart = 600, freqEnd = 900, duration = 0.12) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  // Load chats on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('z_ai_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse Z. AI chat sessions:', e);
      }
    } else {
      // Bootstrap with a welcome session
      const welcomeId = crypto.randomUUID();
      const welcomeSession: ChatSession = {
        id: welcomeId,
        title: 'Welcome to Z. AI',
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `**Namaste! Main Z. AI hoon.** 👋\n\nMain aapka personal intelligence workspace assistant hoon. Aap mujhse kisi bhi sankoch ke bina sawal pooch sakte hain (in Hindi or English!).\n\n**Main kya kar sakta hoon?**\n- Coding & Debugging solutions directly\n- Writing and rewriting context\n- Detailed web planning or code generation\n- Dynamic translations & general Q&A\n\nAap is conversation box mein jo bhi likhenge, hamara direct secure API endpoint use karke aapko intelligent replies fetch karwayega. \n\n*Apne official, full functional context ke liye aap upar diye gaye **Launch Z. AI** button se sidhe open tab par bhi jaa sakte hain!*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        created_at: new Date().toISOString()
      };
      setSessions([welcomeSession]);
      setCurrentSessionId(welcomeId);
      localStorage.setItem('z_ai_sessions', JSON.stringify([welcomeSession]));
    }
  }, []);

  // Scroll to bottom when generating or when current active session messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isGenerating]);

  // Sync sessions helper
  const syncSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('z_ai_sessions', JSON.stringify(updated));
  };

  const getActiveMessages = (): Message[] => {
    const current = sessions.find(s => s.id === currentSessionId);
    return current ? current.messages : [];
  };

  // Initialize a fresh new chat session
  const startNewChat = () => {
    playSfx(500, 800, 0.1);
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: `Conversation ${sessions.length + 1}`,
      messages: [],
      created_at: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    syncSessions(updated);
    setCurrentSessionId(newId);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Send message to back-end
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    playSfx(750, 1050, 0.08);
    const userMsgText = inputText;
    setInputText('');

    // If no session exists, create one
    let targetSessionId = currentSessionId;
    let currentSessions = [...sessions];
    if (!targetSessionId) {
      targetSessionId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: targetSessionId,
        title: userMsgText.slice(0, 30) + '...',
        messages: [],
        created_at: new Date().toISOString()
      };
      currentSessions = [newSession, ...currentSessions];
      setCurrentSessionId(targetSessionId);
    }

    const matchedSession = currentSessions.find(s => s.id === targetSessionId);
    if (!matchedSession) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...matchedSession.messages, userMessage];

    // Auto update title if it's the first real question in a newly created empty conversation
    let sessionTitle = matchedSession.title;
    if (matchedSession.messages.length === 0) {
      sessionTitle = userMsgText.length > 35 ? userMsgText.slice(0, 32) + '...' : userMsgText;
    }

    const updatedSession = {
      ...matchedSession,
      title: sessionTitle,
      messages: updatedMessages
    };

    const newSessionsList = currentSessions.map(s => s.id === targetSessionId ? updatedSession : s);
    syncSessions(newSessionsList);
    setIsGenerating(true);

    try {
      // Prepare backend payload
      // We will only send the last 8 messages as context to prevent payload overflow
      const contextMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      })).slice(-8);

      const response = await fetch('/api/z-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages })
      });

      if (!response.ok) {
        throw new Error('Endpoint returned error status');
      }

      const data = await response.json();
      const generatedText = data.text || 'No response came back from the gateway.';

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage]
      };

      syncSessions(newSessionsList.map(s => s.id === targetSessionId ? finalSession : s));
      playSfx(900, 600, 0.15);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Failed to get response.** ⚠️\n\nSecurity configuration block or network problem detected. Please try again or click modern **Launch Z. AI** button to use external web gateway directly.\n\n*Error details: Server returned validation block status.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const finalSession = {
        ...updatedSession,
        messages: [...updatedMessages, errorMessage]
      };

      syncSessions(newSessionsList.map(s => s.id === targetSessionId ? finalSession : s));
    } finally {
      setIsGenerating(false);
    }
  };

  // Session management actions
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSfx(400, 200, 0.15);
    const updated = sessions.filter(s => s.id !== id);
    syncSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitleVal(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (!editingTitleVal.trim()) return;
    playSfx(600, 850, 0.08);
    const updated = sessions.map(s => s.id === id ? { ...s, title: editingTitleVal } : s);
    syncSessions(updated);
    setEditingSessionId(null);
  };

  const handleCopyCode = (text: string) => {
    playSfx(800, 1100, 0.05);
    navigator.clipboard.writeText(text);
  };

  const handleExportChat = () => {
    const activeMsgs = getActiveMessages();
    if (activeMsgs.length === 0) return;

    playSfx(700, 1000, 0.12);
    const text = activeMsgs.map(m => `### ${m.role === 'user' ? 'YOU' : 'Z. AI'} (${m.timestamp})\n\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Z_AI_Chat_Export_${new Date().toISOString().slice(0,10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="z-ai-container" className="w-full h-full flex bg-[#030303] text-zinc-100 overflow-hidden font-sans relative">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="h-full border-r border-zinc-900 bg-zinc-950/80 flex flex-col shrink-0 overflow-hidden relative z-30"
          >
            {/* Sidebar title */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between select-none shrink-0 bg-black/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                <span className="font-mono text-xs font-black tracking-widest text-[#0066ff]">CHANNELS</span>
              </div>
              <button 
                onClick={startNewChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-white hover:text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-500/20 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-[0_0_12px_rgba(30,144,255,0.2)]"
                title="Create a new workspace session"
              >
                <Plus size={14} />
                <span>NEW CHAT</span>
              </button>
            </div>

            {/* Conversation Search Bar */}
            <div className="px-3 pt-3 shrink-0">
              <div className="relative flex items-center bg-zinc-900/60 border border-zinc-800/80 focus-within:border-zinc-700/80 rounded-xl px-3 py-2 transition-all">
                <Search size={14} className="text-zinc-500 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none w-full font-mono outline-none"
                />
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              <AnimatePresence>
                {filteredSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const isEditing = session.id === editingSessionId;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        if (!isEditing) {
                          playSfx(550, 750, 0.08);
                          setCurrentSessionId(session.id);
                        }
                      }}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-mono transition-all border ${
                        isActive 
                          ? 'bg-zinc-900/90 border-[#0066ff]/30 text-white shadow-[0_2px_12px_rgba(0,102,255,0.06)]' 
                          : 'bg-transparent border-transparent hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare size={14} className={isActive ? 'text-blue-400' : 'text-zinc-600'} />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingTitleVal}
                            onChange={(e) => setEditingTitleVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-800 border border-zinc-700/80 rounded px-1.5 py-0.5 text-zinc-100 focus:outline-none text-xs w-full font-mono"
                          />
                        ) : (
                          <span className="truncate font-medium">{session.title}</span>
                        )}
                      </div>

                      {/* Side Actions (Rename / Delete) */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => startRenameSession(session.id, session.title, e)}
                            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
                            title="Rename chat"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
                            title="Delete Chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveRename(session.id); }}
                            className="p-1 text-emerald-500 hover:bg-zinc-800 rounded"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }}
                            className="p-1 text-red-400 hover:bg-zinc-800 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredSessions.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-600 font-mono text-xs select-none">
                  <Terminal size={20} className="stroke-[1.5] mb-2 opacity-50" />
                  <span>No channels found</span>
                </div>
              )}
            </div>

            {/* Sidebar Footer Info */}
            <div className="p-4 border-t border-zinc-900 bg-black/20 shrink-0 select-none flex items-center justify-between text-[10px] font-mono text-zinc-600">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Session Live</span>
              </div>
              <span className="font-semibold text-blue-500/80">API LINKED</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. MAIN DISCUSSION WINDOW */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        
        {/* TOP WORKSPACE NAVIGATION & CONTROL BAR */}
        <header className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-zinc-900 z-20 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {setActiveTab && (
              <button 
                onClick={() => { playSfx(450, 250, 0.12); setActiveTab('DASHBOARD'); }}
                className="p-2 -ml-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors focus:ring-1 focus:ring-blue-500"
                title="Return to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => { playSfx(600, 700, 0.05); setIsSidebarOpen(!isSidebarOpen); }}
                className="p-1.5 hover:bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                title={isSidebarOpen ? "Collapse drawer" : "Expand drawer"}
              >
                <Maximize2 size={14} className={isSidebarOpen ? "hidden" : "block"} />
                <Minimize2 size={14} className={isSidebarOpen ? "block" : "hidden"} />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0066ff] shadow-[0_0_10px_#0066ff] animate-pulse" />
                  <h1 className="text-sm font-bold tracking-widest text-white uppercase font-mono">
                    Z. AI GATEWAY
                  </h1>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase font-mono">
                    ONLINE
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 hidden xs:block">
                  Direct AI Terminal Engine linked securely to chat.z.ai
                </span>
              </div>
            </div>
          </div>

          {/* Quick External Actions & Direct launchers */}
          <div className="flex items-center gap-1.5">
            {getActiveMessages().length > 0 && (
              <button
                onClick={handleExportChat}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none"
                title="Export Conversation (.md)"
              >
                <Download size={16} />
              </button>
            )}
            
            <button
              onClick={() => {
                playSfx(700, 1000, 0.1);
                window.open('https://chat.z.ai/', '_blank');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 shadow-[0_2px_12px_rgba(59,130,246,0.3)] focus:ring-2 focus:ring-blue-500 font-mono"
              title="Launch Z. Ai directly in a separate safe tab"
            >
              <span>Launch Z. AI</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </header>

        {/* DIALOG AREA / WINDOW SCROLLS */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-b from-zinc-950 via-[#040404] to-[#010101] relative scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* Subtle neon glow backdrops */}
          <div className="absolute top-[10%] left-[30%] w-72 h-72 rounded-full bg-blue-900/5 filter blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[10%] w-60 h-60 rounded-full bg-indigo-950/5 filter blur-[120px] pointer-events-none" />

          {getActiveMessages().length === 0 ? (
            /* Pristine empty placeholder page */
            <div id="z-ai-empty-chat-welcome" className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center py-12 select-none">
              <div className="mb-6 relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-blue-600/10 rounded-full filter blur-xl animate-pulse" />
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/30 rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(0,102,255,0.3)]">
                  <Sparkles size={24} className="text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-sm font-bold tracking-widest text-white uppercase font-mono">
                Initiate Terminal Gateway
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-3 leading-relaxed max-w-sm">
                Enter your query below to summon Z. AI's core intelligence, or configure a customized session from the left sidebar channel list.
              </p>
              
              {/* Launcher guidelines notice */}
              <div className="mt-8 p-3 bg-zinc-900/50 border border-zinc-800/40 rounded-xl text-[10px] text-zinc-400 font-mono max-w-xs text-left leading-normal">
                💡 <span className="text-zinc-300 font-bold">External Web Access:</span> Iframe loading can sometimes fail due to web security policies. We recommend clicking <span className="text-blue-400 font-semibold cursor-pointer" onClick={() => window.open('https://chat.z.ai/', '_blank')}>Launch Z. AI</span> above to launch pages in parallel!
              </div>
            </div>
          ) : (
            /* Complete flowing interactive dialogues */
            <div className="max-w-3xl mx-auto space-y-6 pb-2">
              {getActiveMessages().map((message, idx) => {
                const isUser = message.role === 'user';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant visual profile circle indicator */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 flex items-center justify-center border border-blue-400/20 text-[10px] font-bold text-white shrink-0 shadow-[0_2px_8px_rgba(0,120,255,0.2)] select-none">
                        Z
                      </div>
                    )}

                    {/* Chat Bubble Structure */}
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-mono relative group ${
                      isUser 
                        ? 'bg-[#0a0f1d] border border-blue-900/20 text-blue-50 shadow-[inset_0_1px_3px_rgba(59,130,246,0.1)]' 
                        : 'bg-zinc-950 border border-zinc-900 text-zinc-200 shadow-xl'
                    }`}>
                      {/* Interactive Copy controls inside dialogue bubble */}
                      <div className="absolute top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleCopyCode(message.content)}
                          className="p-1 hover:bg-zinc-900 border border-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition-all"
                          title="Copy message contents"
                        >
                          <Copy size={11} />
                        </button>
                      </div>

                      {/* Header signature labels */}
                      <header className="flex items-center gap-2 mb-2 select-none border-b border-zinc-900/40 pb-1.5">
                        <span className={`text-[9px] font-black tracking-widest uppercase ${
                          isUser ? 'text-blue-400' : 'text-zinc-400'
                        }`}>
                          {isUser ? 'SECURE_USER' : 'Z_AI_GATEWAY'}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono">{message.timestamp}</span>
                      </header>

                      {/* Main contextual block */}
                      <div className="prose prose-invert prose-xs text-zinc-200 leading-relaxed font-sans max-w-none">
                        <Markdown
                          components={{
                            // Custom pre code styling for technical code outputs
                            pre: ({ node, ...props }) => (
                              <pre {...props} className="bg-black/80 border border-zinc-900 text-zinc-300 p-3 rounded-lg my-2 font-mono text-[11px] overflow-x-auto relative select-text" />
                            ),
                            code: ({ node, ...props }) => (
                              <code {...props} className="text-blue-400 font-mono text-[11px] bg-zinc-900/40 px-1 py-0.5 rounded" />
                            ),
                            h1: ({ node, ...props }) => <h1 {...props} className="text-sm font-bold tracking-wider text-white mt-3 mb-1" />,
                            h2: ({ node, ...props }) => <h2 {...props} className="text-xs font-bold tracking-wide text-zinc-300 mt-2 mb-1" />,
                            p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                          }}
                        >
                          {message.content}
                        </Markdown>
                      </div>
                    </div>

                    {/* User profile initial avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 shadow-lg select-none">
                        U
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Waiting generative state placeholder */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 justify-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 text-xs font-mono max-w-[80%] flex flex-col gap-3">
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-[9px] font-black tracking-widest text-[#0066ff] uppercase">Z_AI_CALCULATING</span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-2 w-48 bg-zinc-900 rounded animate-pulse" />
                      <div className="h-2 w-64 bg-zinc-900 rounded animate-pulse" />
                      <div className="h-2 w-36 bg-zinc-900 rounded animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM USER CONTROL BAR / FLOATING PANEL INPUT */}
        <footer className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0 relative z-20">
          
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <div className="relative flex-1 bg-zinc-900/40 border border-zinc-800 focus-within:border-zinc-700/80 rounded-2xl p-1.5 transition-all flex items-end">
              
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Z. AI anything..."
                className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 text-xs px-3.5 py-1.5 outline-none resize-none max-h-[140px] font-mono leading-relaxed min-h-[18px]"
              />

              {/* Languages icon flag accent */}
              <div className="p-2 text-zinc-600 hover:text-zinc-400 select-none hidden xs:block cursor-help" title="Supports both English and Hindi communication">
                <Languages size={14} />
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center h-11 w-11 shrink-0 ${
                inputText.trim() && !isGenerating
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                  : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
              }`}
            >
              <Send size={15} />
            </button>
          </form>

          {/* Prompt micro text instructions */}
          <div className="max-w-3xl mx-auto flex items-center justify-between text-[10px] text-zinc-600 mt-2.5 px-1 font-mono select-none">
            <span>Shift + Enter for new lines</span>
            <span>Gateway Version 3.5.0-Secure</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
