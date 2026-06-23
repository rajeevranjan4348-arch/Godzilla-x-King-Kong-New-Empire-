import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  RiCloseLine,
  RiFileCopyLine,
  RiCheckLine,
  RiDeleteBin7Line,
  RiDiscussLine,
  RiVolumeUpLine,
  RiSearchLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiRobotLine,
  RiUser3Line,
  RiFileList2Line,
  RiDragMove2Line
} from 'react-icons/ri'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface MessageFeedProps {
  chatHistory: Message[]
  setChatHistory: React.Dispatch<React.SetStateAction<any[]>>
  isSystemActive: boolean
  isMicMuted: boolean
  isVisible: boolean
  onClose: () => void
  isGenerating?: boolean
}

export const MessageFeed: React.FC<MessageFeedProps> = ({
  chatHistory,
  setChatHistory,
  isSystemActive,
  isMicMuted,
  isVisible,
  onClose,
  isGenerating = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)
  const feedContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (!isMinimized && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, isMinimized, isVisible, isGenerating])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const clearHistory = () => {
    setChatHistory([{ role: 'assistant', content: 'IRIS Voice Stream initialized. Awaiting voice interface command.' }])
  }

  // Filter messages based on search query
  const filteredHistory = chatHistory.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSystemStatus = () => {
    if (!isSystemActive) return { text: 'STANDBY', color: 'text-zinc-500 border-zinc-800 bg-zinc-950/40' }
    if (isMicMuted) return { text: 'MUTED', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5' }
    return { text: 'LISTENING', color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 animate-pulse' }
  }

  const status = getSystemStatus()

  if (!isVisible) return null

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`fixed bottom-24 right-4 sm:right-6 md:bottom-28 md:right-8 z-[210] w-[calc(100vw-2.5rem)] xs:w-96 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col pointer-events-auto overflow-hidden ${
        isMinimized ? 'h-auto' : 'h-[360px] md:h-[420px]'
      }`}
    >
      {/* Header element with drag handle */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/5 cursor-grab active:cursor-grabbing select-none shrink-0 group">
        <div className="flex items-center gap-2">
          <RiDragMove2Line className="text-zinc-500 group-hover:text-emerald-400 transition-colors w-4 h-4 shrink-0" />
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-[10px] font-bold tracking-widest text-emerald-400">
              HUD TRANSCRIPT FEED
            </h3>
            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title={isMinimized ? "Expand Feed" : "Minimize Feed"}
          >
            {isMinimized ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
          </button>
          {!isMinimized && (
            <button
              onClick={clearHistory}
              className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
              title="Clear Transcript History"
            >
              <RiDeleteBin7Line size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Close Feed Overlay"
          >
            <RiCloseLine size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isMinimized ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Search filter panel */}
            <div className="px-3 py-2 bg-zinc-950/80 border-b border-white/5 flex items-center gap-2">
              <RiSearchLine className="text-zinc-500 w-3.5 h-3.5 shrink-0" />
              <input
                type="text"
                placeholder="Filter dialogue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-zinc-500 hover:text-zinc-200 uppercase font-mono tracking-wider shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Conversation Feed */}
            <div 
              ref={feedContainerRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5"
            >
              {filteredHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-600 font-mono">
                  <RiDiscussLine size={24} className="mb-2 opacity-40 text-emerald-500" />
                  <p className="text-[10px] tracking-widest uppercase">No streams recorded</p>
                  <p className="text-[9px] mt-1 text-zinc-700">Say something to feed the neural cache</p>
                </div>
              ) : (
                filteredHistory.map((msg, index) => {
                  const isUser = msg.role === 'user'
                  const isSystem = msg.role === 'system'
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono font-bold text-zinc-500 tracking-wider">
                        {isUser ? (
                          <>
                            <span>YOU</span>
                            <RiUser3Line className="w-2.5 h-2.5 text-emerald-500" />
                          </>
                        ) : isSystem ? (
                          <>
                            <RiFileList2Line className="w-2.5 h-2.5 text-zinc-500" />
                            <span>SYSTEM</span>
                          </>
                        ) : (
                          <>
                            <RiRobotLine className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-400">IRIS AI</span>
                          </>
                        )}
                      </div>

                      <div className={`relative max-w-[88%] p-3 rounded-xl border group transition-all ${
                        isUser
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100 hover:bg-emerald-950/30'
                          : isSystem
                            ? 'bg-zinc-900/40 border-zinc-500/10 text-zinc-400 font-mono text-[10px]'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-100 hover:bg-zinc-900/80 hover:border-white/10'
                      }`}>
                        <p className="text-xs font-mono leading-relaxed select-text pr-4 break-words">
                          {msg.content}
                        </p>

                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-950/80 hover:bg-zinc-900 rounded border border-white/10 text-zinc-400 hover:text-white"
                          title="Copy text"
                        >
                          {copiedIndex === index ? <RiCheckLine size={10} className="text-emerald-400" /> : <RiFileCopyLine size={10} />}
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start gap-1 shrink-0 pb-2"
                >
                  <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-[#00ffb3] uppercase font-semibold">
                    <RiRobotLine className="w-2.5 h-2.5 text-[#00ffb3] animate-pulse" />
                    <span>IRIS IS RESPONDING</span>
                  </div>
                  <div className="bg-zinc-900/60 border border-white/5 text-zinc-100 px-3 py-2 rounded-xl flex items-center gap-1.5 self-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                  </div>
                </motion.div>
              )}
              <div ref={feedEndRef} />
            </div>

            {/* Bottom active state indicator */}
            {isSystemActive && !isMicMuted && (
              <div className="px-4 py-2 border-t border-white/5 bg-emerald-500/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase animate-pulse">
                    Awaiting voice stream input...
                  </span>
                </div>
                <RiVolumeUpLine className="text-emerald-400 animate-bounce w-3.5 h-3.5" />
              </div>
            )}
          </motion.div>
        ) : (
          /* Minimized view mode */
          <div className="p-3 bg-zinc-950 border-t border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden flex-1 select-none">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.text === 'LISTENING' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
              <p className="text-[10px] font-mono text-zinc-400 truncate tracking-wide">
                Latest: <span className="text-zinc-200">{chatHistory[chatHistory.length - 1]?.content || 'None'}</span>
              </p>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 hover:text-emerald-300 uppercase shrink-0"
            >
              Expand
            </button>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
