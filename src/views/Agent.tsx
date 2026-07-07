import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { RiTerminalBoxLine, RiBookOpenLine, RiUploadCloudLine, RiSettings4Line, RiDownloadCloudLine, RiMicLine, RiSendPlaneFill, RiMicOffLine } from 'react-icons/ri';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AgentView = () => {
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      let baseText = '';
      setInputText(prev => {
        baseText = prev;
        return prev;
      });

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentSpeech = finalTranscript || interimTranscript;
        if (currentSpeech) {
          const prefix = baseText.trim() ? `${baseText.trim()} ` : '';
          setInputText(prefix + currentSpeech.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.error("Agent Speech error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {}
      }
    };
  }, []);

  const handleSend = async () => {
      if (!inputText.trim()) return;

      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
        setIsListening(false);
      }

      const newHistory = [...chatHistory, { role: 'user', content: inputText }];
      setChatHistory(newHistory);
      const currentInput = inputText;
      setInputText('');
      
      try {
          const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          
          const contents = newHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
          }));
          
          const res = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents,
              config: {
                  systemInstruction: "You are NanoClaw Agent, a highly capable AI assistant running in an explicit container. Provide concise, helpful responses to console commands. If the user asks for realtime facts, use Google Search.",
                  tools: [{ googleSearch: {} }]
              }
          });
          
          const reply = res.text;
          setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
          
          // Voice Chat response
          const utterance = new SpeechSynthesisUtterance(reply);
          window.speechSynthesis.speak(utterance);
      } catch (err) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: '[Error] Unable to communicate with agent service.' }]);
      }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-widest flex items-center gap-2">
                <RiTerminalBoxLine className="text-emerald-500" /> HERMES / OPENCLAW AGENT
            </h2>
            <div className="flex gap-2">
                <button className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg p-2 text-xs font-bold tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LEARNING LOOP: ACTIVE
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
            <div className="col-span-1 border border-zinc-800 bg-zinc-950 rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 mb-4">SYSTEM ARCHITECTURE</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Procedural Memory</span>
                        <span className="text-emerald-400 px-2 py-0.5 bg-emerald-500/20 rounded">~/.hermes/skills/</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Declarative Memory</span>
                        <span className="text-indigo-400 px-2 py-0.5 bg-indigo-500/20 rounded">USER.md Tracker</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Episodic Search</span>
                        <span className="text-yellow-400 px-2 py-0.5 bg-yellow-500/20 rounded">SQLite FTS5</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Cron Scheduler</span>
                        <span className="text-blue-400 px-2 py-0.5 bg-blue-500/20 rounded">Background</span>
                    </div>
                </div>

                <h3 className="text-xs font-bold tracking-widest text-zinc-500 mt-6 mb-4">AGENT CONFIGURATION</h3>
                <div className="flex gap-2 mb-2">
                    <select className="bg-zinc-900 border border-zinc-800 rounded p-1 text-xs text-white w-full">
                        <option>Model: Gemini 3.1 Pro (Default)</option>
                        <option>Model: Claude 3.5 Sonnet</option>
                        <option>Model: GPT-4o (codex)</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <select className="bg-zinc-900 border border-zinc-800 rounded p-1 text-xs text-white w-full">
                        <option>Tools: All Allowed</option>
                        <option>Tools: Read-only File System</option>
                        <option>Tools: Web Browse Only</option>
                    </select>
                </div>

                <div className="mt-auto">
                    <button className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                        <RiDownloadCloudLine /> Install Skill
                    </button>
                    <p className="text-[10px] text-zinc-600 mt-2 text-center">
                        e.g. /add-telegram, /add-discord
                    </p>
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 border border-zinc-800 bg-zinc-950 rounded-xl p-4 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-none">
                    {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                             <RiTerminalBoxLine size={48} className="mb-4 opacity-50" />
                             <p className="text-sm font-bold tracking-widest">AGENT TERMINAL READY</p>
                             <p className="text-xs mt-2 text-center max-w-sm">
                                Talk to the assistant using the console below. 
                                Agents run in Linux containers with explicit filesystem mounts.
                             </p>
                        </div>
                    ) : (
                        chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100' 
                                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                                }`}>
                                    {msg.role === 'assistant' ? (
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
                                                {msg.content}
                                            </Markdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="relative flex items-center gap-2 mt-auto">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask anything or use agent commands..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-16 text-sm focus:outline-none focus:border-emerald-500 text-white font-mono"
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter' && inputText.trim()) {
                                handleSend();
                            }
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={toggleSpeech}
                            className={`p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full ${
                                isListening 
                                    ? 'text-red-500 bg-red-500/10 animate-pulse scale-110' 
                                    : 'text-zinc-400 hover:text-emerald-400'
                            }`}
                            aria-label={isListening ? "Stop voice listening" : "Dictate via microphone"}
                            title={isListening ? "Stop Listening" : "Speak your query"}
                        >
                            <RiMicLine size={18} className={isListening ? 'text-red-500 animate-pulse' : ''} aria-hidden="true" />
                        </button>
                        <button
                            onClick={handleSend}
                            className="text-emerald-400 hover:text-emerald-300 p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
                            aria-label="Send message"
                        >
                            <RiSendPlaneFill size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AgentView;
