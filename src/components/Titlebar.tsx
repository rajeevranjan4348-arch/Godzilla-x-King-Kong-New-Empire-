import { useState, useEffect } from 'react'
import {
  RiSubtractLine,
  RiCloseLine,
  RiCheckboxBlankLine,
  RiCheckboxMultipleBlankLine
} from 'react-icons/ri'
import { playClick } from '../utils/audio'

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'))
  }, [])

  const minimize = () => {
    playClick()
    // Mock minimize
    console.log('Minimize')
  }

  const toggleMaximize = () => {
    playClick()
    setIsMaximized(!isMaximized)
    console.log('Toggle Maximize')
  }

  const close = () => {
    playClick()
    // Mock close
    console.log('Close')
  }

  return (
    <div className="w-full h-8 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800 select-none z-[100] shrink-0">
      {isMac && (
        <div className="flex items-center gap-2 z-50">
          <button
            onClick={close}
            aria-label="Close"
            title="Close"
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-600 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
          >
            <span className="hidden group-hover:block text-[8px] text-red-900 font-bold" aria-hidden="true">×</span>
          </button>
          <button
            onClick={minimize}
            aria-label="Minimize"
            title="Minimize"
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 border border-yellow-600 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
          >
            <span className="hidden group-hover:block text-[8px] text-yellow-900 font-bold" aria-hidden="true">−</span>
          </button>
          <button
            onClick={toggleMaximize}
            aria-label={isMaximized ? "Restore" : "Maximize"}
            title={isMaximized ? "Restore" : "Maximize"}
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900"
          >
            <span className="hidden group-hover:block text-[6px] text-emerald-900 font-bold" aria-hidden="true">
              ■
            </span>
          </button>
        </div>
      )}
      {/* Removed IRIS OS // SYSTEM text */}
      {!isMac && (
        <div className="flex h-full ml-auto -mr-4 z-50">
          <button
            onClick={minimize}
            aria-label="Minimize"
            title="Minimize window"
            className="w-12 h-full flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:bg-white/10"
          >
            <RiSubtractLine size={16} aria-hidden="true" />
          </button>
          <button
            onClick={toggleMaximize}
            aria-label={isMaximized ? "Restore" : "Maximize"}
            title={isMaximized ? "Restore window" : "Maximize window"}
            className="w-12 h-full flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:bg-white/10"
          >
            {isMaximized ? (
              <RiCheckboxMultipleBlankLine size={14} aria-hidden="true" />
            ) : (
              <RiCheckboxBlankLine size={14} aria-hidden="true" />
            )}
          </button>
          <button
            onClick={close}
            aria-label="Close"
            title="Close window"
            className="w-12 h-full flex items-center justify-center text-zinc-400 hover:bg-red-600 hover:text-white transition-colors focus-visible:outline-none focus-visible:bg-red-600 focus-visible:text-white"
          >
            <RiCloseLine size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default TitleBar
