import React, { useState, useEffect } from 'react';
import { RiHistoryLine, RiDeleteBinLine, RiChat3Line, RiRobot2Line } from 'react-icons/ri';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { playClick, playAction } from '../utils/audio';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function HistoryView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('iris_chat_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const clearHistory = () => {
    playClick();
    if (confirm('Are you sure you want to clear all chat history?')) {
      localStorage.removeItem('iris_chat_sessions');
      setSessions([]);
      setSummary('');
      playAction();
    }
  };

  const summarizeHistory = async () => {
    if (sessions.length === 0) return;
    playClick();
    setIsSummarizing(true);
    try {
      const allMessages = sessions.flatMap(s => s.messages).map(m => `${m.role}: ${m.content || m.parts?.[0]?.text}`).join('\n');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Please provide a concise summary of the following chat history. Highlight the main topics discussed and any important conclusions or action items.\n\nChat History:\n${allMessages.substring(0, 30000)}`
      });
      setSummary(response.text || 'No summary generated.');
      playAction();
    } catch (error) {
      console.error('Error summarizing history:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto scrollbar-small animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black tracking-widest text-emerald-500 flex items-center gap-3">
            <RiHistoryLine /> CHAT HISTORY
          </h2>
          <div className="flex gap-3">
            {sessions.length > 0 && (
              <button 
                onClick={summarizeHistory}
                disabled={isSummarizing}
                aria-label="Summarize chat history"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors text-xs font-bold tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                <RiRobot2Line aria-hidden="true" /> {isSummarizing ? 'SUMMARIZING...' : 'SUMMARIZE'}
              </button>
            )}
            {sessions.length > 0 && (
              <button 
                onClick={clearHistory}
                aria-label="Clear all chat history"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-bold tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <RiDeleteBinLine aria-hidden="true" /> CLEAR ALL
              </button>
            )}
          </div>
        </div>

        {summary && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5"
          >
            <h3 className="text-xs font-bold tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
              <RiRobot2Line /> AI SUMMARY
            </h3>
            <div className="text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </motion.div>
        )}

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-4 border border-white/5 rounded-2xl bg-white/5">
            <RiChat3Line size={48} className="opacity-50" />
            <p className="font-mono text-sm tracking-widest">NO PAST CONVERSATIONS</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={session.id || idx} 
                className="bg-zinc-900/50 border border-white/5 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-zinc-400 tracking-widest">
                    SESSION: {new Date(session.timestamp).toLocaleString()}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-mono">
                    {session.messages?.length || 0} MESSAGES
                  </span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-small pr-2">
                  {session.messages?.map((msg: any, mIdx: number) => (
                    <div key={mIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] py-2 px-3 rounded-lg text-[11px] leading-relaxed border font-mono ${msg.role === 'user' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-black/50 border-white/5 text-zinc-300'}`}>
                        <span className="text-[8px] opacity-50 block mb-1 uppercase tracking-widest">{msg.role}</span>
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
                                    <code {...props} className={`${className} bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs`}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {msg.content || msg.parts?.[0]?.text}
                            </Markdown>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content || msg.parts?.[0]?.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
