import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RiTerminalBoxLine, 
  RiCodeBoxLine, 
  RiNodeTree, 
  RiSendPlaneFill,
  RiPlayCircleLine,
  RiSettings4Line,
  RiDatabase2Line
} from 'react-icons/ri';
import { playClick, playAction, playTabSwitch } from '../utils/audio';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface GooseProps {
  glassPanel: string;
  chatHistory: any[];
}

const GooseView = ({ glassPanel, chatHistory }: GooseProps) => {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'terminal' | 'recipes' | 'mcp'>('terminal');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    playAction();
    // For now, we just clear the input. In a real integration, this would send to the agent.
    setInput('');
  };

  return (
    <div className="flex-1 p-4 bg-white/2 flex flex-col lg:grid lg:grid-cols-12 gap-4 h-full overflow-y-auto lg:overflow-hidden relative animate-in fade-in zoom-in duration-300 scrollbar-small">
      
      {/* Left Panel: Goose Status & MCP */}
      <div className="order-2 lg:order-none flex col-span-12 lg:col-span-3 flex-col gap-4 h-auto lg:h-full z-40">
        {/* Goose Info */}
        <div className={`${glassPanel} p-4 flex flex-col gap-3 shrink-0`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-sm font-black tracking-[0.2em] text-white flex items-center gap-2">
              <RiTerminalBoxLine className="text-blue-400" /> GOOSE
            </h2>
            <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">v1.30.0</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Your Native Open-Source AI Agent. Built in Rust for performance and portability.
          </p>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 space-y-1.5">
            <div className="flex justify-between items-center">
              <span>Core Agent</span>
              <span className="text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">Rust 2021</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Provider</span>
              <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Google (Gemini)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Protocol</span>
              <span className="text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">ACP sacp 11</span>
            </div>
          </div>
        </div>

        {/* MCP Extensions */}
        <div className={`${glassPanel} flex-1 p-4 flex flex-col gap-3 overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-300 flex items-center gap-2">
              <RiNodeTree className="text-emerald-400" /> MCP EXTENSIONS
            </h3>
            <span className="text-[9px] font-mono text-zinc-500">70+ Available</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-small pr-2">
            {['file-system', 'shell', 'memory', 'browser', 'developer-tools', 'github', 'postgres', 'puppeteer'].map(ext => (
              <div key={ext} className="bg-black/40 border border-white/5 rounded p-2 text-[10px] font-mono text-zinc-400 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" /> 
                  {ext}
                </div>
                <RiSettings4Line className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" onClick={playClick} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel: Terminal/Chat */}
      <div className="order-1 lg:order-none col-span-12 lg:col-span-9 flex flex-col h-[60vh] lg:h-full z-40 shrink-0">
        <div className={`${glassPanel} flex-1 flex flex-col overflow-hidden relative`}>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black/20">
            {[
              { id: 'terminal', label: 'TERMINAL', icon: <RiCodeBoxLine /> },
              { id: 'recipes', label: 'RECIPES', icon: <RiDatabase2Line /> },
              { id: 'mcp', label: 'MCP CONFIG', icon: <RiSettings4Line /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { playTabSwitch(); setActiveTab(tab.id as any); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
            <AnimatePresence mode="wait">
              {activeTab === 'terminal' && (
                <motion.div 
                  key="terminal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-4 scrollbar-small">
                    <div className="text-zinc-500 mb-6">
                      <div>Goose CLI v1.30.0 initialized.</div>
                      <div>Type a command or ask a coding question.</div>
                      <div className="mt-2 text-blue-400/50">----------------------------------------</div>
                    </div>
                    
                    {chatHistory.filter(m => m.role !== 'system').map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg border ${
                          msg.role === 'user' 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-100' 
                            : 'bg-zinc-900 border-white/10 text-zinc-300'
                        }`}>
                          <div className="text-[9px] opacity-50 mb-1.5 font-bold tracking-widest">
                            {msg.role === 'user' ? 'USER' : 'GOOSE'}
                          </div>
                          <div className="leading-relaxed">
                            {msg.role !== 'user' ? (
                                <div className="markdown-body prose prose-invert prose-sm max-w-none">
                                    <Markdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <div className="relative group overflow-hidden rounded-xl border border-white/10 my-4">
                                                        <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-white/10">
                                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{match[1]}</span>
                                                        </div>
                                                        <SyntaxHighlighter
                                                            {...props}
                                                            children={String(children).replace(/\n$/, '')}
                                                            style={vscDarkPlus as any}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', background: 'transparent' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <code {...props} className={`${className} bg-zinc-800 px-1.5 py-0.5 rounded text-blue-400 font-mono text-xs`}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.parts?.[0]?.text || msg.content}
                                    </Markdown>
                                </div>
                            ) : (
                                <span className="whitespace-pre-wrap">{msg.parts?.[0]?.text || msg.content}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Input Area */}
                  <div className="p-3 bg-black/40 border-t border-white/5">
                    <form onSubmit={handleSend} className="relative flex items-center">
                      <span className="absolute left-3 text-blue-500 font-bold">❯</span>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Goose to code, debug, or run a recipe..."
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg py-2.5 pl-8 pr-12 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <RiSendPlaneFill size={14} />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'recipes' && (
                <motion.div 
                  key="recipes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 p-4 overflow-y-auto scrollbar-small"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Scaffold React App', desc: 'Creates a new React app with Vite, Tailwind, and standard structure.', time: '2m' },
                      { name: 'Analyze Logs', desc: 'Reads recent system logs and identifies potential anomalies or errors.', time: '30s' },
                      { name: 'Generate Tests', desc: 'Writes unit tests for the currently active file using Jest/Vitest.', time: '1m' },
                      { name: 'Refactor Component', desc: 'Breaks down a large React component into smaller, reusable pieces.', time: '45s' }
                    ].map((recipe, i) => (
                      <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={playClick}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xs font-bold text-zinc-200">{recipe.name}</h4>
                          <span className="text-[9px] font-mono text-zinc-500 bg-black/50 px-1.5 py-0.5 rounded">{recipe.time}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mb-4 line-clamp-2">{recipe.desc}</p>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <RiPlayCircleLine size={14} /> RUN RECIPE
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'mcp' && (
                <motion.div 
                  key="mcp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 p-4 flex items-center justify-center"
                >
                  <div className="text-center text-zinc-500 font-mono text-xs">
                    <RiSettings4Line size={32} className="mx-auto mb-3 opacity-50" />
                    <div>MCP Configuration Panel</div>
                    <div className="text-[10px] mt-2 opacity-60">Manage your Model Context Protocol servers here.</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default GooseView;
