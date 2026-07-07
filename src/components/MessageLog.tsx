import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RiFileCopyLine, RiCheckLine, RiDeleteBin7Line, RiSearchLine, RiArrowDownSLine, RiArrowUpSLine, RiVolumeUpLine } from 'react-icons/ri'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { playClick, playAction } from '../utils/audio'

interface Message {
  role: 'user' | 'model' | 'assistant' | 'system'
  content: string
}

interface MessageLogProps {
  chatHistory: Message[]
  onClearHistory?: () => void
  onReaskQuestion?: (text: string) => void
  isGenerating?: boolean
  maxHeight?: string
}

export const MessageLog: React.FC<MessageLogProps> = ({
  chatHistory,
  onClearHistory,
  onReaskQuestion,
  isGenerating = false,
  maxHeight = "350px"
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of the chat list
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, isGenerating])

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    playClick()
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Filter based on search query
  const filteredHistory = chatHistory.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full flex flex-col gap-3 border border-white/5 bg-black/40 rounded-xl p-3.5 mt-4 overflow-hidden shadow-inner">
      {/* Control Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-[#00ffb3] font-bold uppercase">
            QA MESSAGE LOG ({filteredHistory.length})
          </span>
          {isGenerating && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClearHistory && chatHistory.length > 0 && (
            <button
              onClick={() => {
                playAction()
                onClearHistory()
              }}
              className="p-1.5 rounded bg-zinc-950 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center"
              title="Clear Interaction Logs"
            >
              <RiDeleteBin7Line size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {chatHistory.length > 2 && (
        <div className="relative flex items-center bg-black/50 border border-white/5 rounded-lg overflow-hidden px-2.5 h-8 shrink-0 transition-all focus-within:border-[#00ffb3]/30">
          <RiSearchLine size={12} className="text-zinc-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full bg-transparent text-white text-[11px] focus:outline-none placeholder-zinc-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-zinc-500 hover:text-white font-mono cursor-pointer"
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* Message List */}
      <div 
        ref={containerRef}
        className="overflow-y-auto px-1 py-1 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1.5"
        style={{ maxHeight }}
      >
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-zinc-600 text-xs font-mono">
              {searchQuery ? "No matching queries found." : "Awaiting user input. Type or speak to begin."}
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full group/msg`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono tracking-widest uppercase">
                    <span className={isUser ? 'text-[#00ffb3]/70' : 'text-zinc-500'}>
                      {isUser ? 'YOU / VOICE INPUT' : 'IRIS RESPONSE'}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="opacity-0 group-hover/msg:opacity-100 text-zinc-500 hover:text-white transition-opacity ml-1.5 flex items-center justify-center p-0.5 rounded cursor-pointer"
                        title="Copy Response"
                      >
                        {copiedIndex === idx ? <RiCheckLine className="text-[#00ffb3]" size={11} /> : <RiFileCopyLine size={11} />}
                      </button>
                    )}
                    {isUser && onReaskQuestion && (
                      <button
                        onClick={() => {
                          playClick();
                          onReaskQuestion(msg.content);
                        }}
                        className="opacity-0 group-hover/msg:opacity-100 text-[#00ffb3] hover:text-[#00d696] transition-opacity ml-1.5 flex items-center justify-center p-0.5 rounded cursor-pointer"
                        title="Re-ask Question"
                      >
                        <RiVolumeUpLine size={11} />
                      </button>
                    )}
                  </div>

                  <div
                    className={`px-3.5 py-2.5 border rounded-2xl text-[12px] leading-relaxed break-words whitespace-pre-wrap w-full max-w-[88%] ${
                      isUser
                        ? 'bg-zinc-900/90 border-[#00ffb3]/25 text-white rounded-tr-none ml-auto'
                        : 'bg-zinc-950/95 border-white/5 text-zinc-300 rounded-tl-none markdown-body prose prose-invert prose-sm'
                    }`}
                  >
                    {isUser ? (
                      msg.content
                    ) : (
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <div className="relative group/code overflow-hidden rounded-xl border border-white/10 my-3 bg-black">
                                <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-white/10">
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  children={String(children).replace(/\n$/, '')}
                                  style={vscDarkPlus as any}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: '0.85rem', fontSize: '10.5px', background: 'transparent' }}
                                />
                              </div>
                            ) : (
                              <code {...props} className={`${className} bg-zinc-800 px-1 py-0.5 rounded text-[#00ffb3] font-mono text-[10.5px]`}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-start w-full"
          >
            <span className="text-[9px] font-mono tracking-widest uppercase mb-1 text-purple-400 animate-pulse">
              IRIS GENERATING_
            </span>
            <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mb-2 relative border border-white/5 mt-1.5 max-w-[85%]">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#00ffb3] to-transparent"
              />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}
