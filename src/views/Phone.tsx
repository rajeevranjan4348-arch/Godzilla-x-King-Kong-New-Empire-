import { useState, useEffect } from 'react'
import { 
  RiWifiLine, RiCameraLensLine, RiPhoneFill, RiMicOffFill,
  RiMessage3Fill, RiGalleryFill, RiGoogleFill, RiChromeFill,
  RiMapPinFill, RiMailFill, RiYoutubeFill, RiArrowLeftLine,
  RiBattery2ChargeLine, RiSignalWifi3Fill
} from 'react-icons/ri'
import { FaWhatsapp } from 'react-icons/fa'
import Sphere from '../components/Sphere'
import { playClick } from '../utils/audio'

const APPS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: <FaWhatsapp size={28} />, color: 'bg-green-500 text-white' },
  { id: 'gallery', name: 'Gallery', icon: <RiGalleryFill size={28} />, color: 'bg-purple-500 text-white' },
  { id: 'chrome', name: 'Chrome', icon: <RiChromeFill size={28} />, color: 'bg-blue-500 text-white' },
  { id: 'maps', name: 'Maps', icon: <RiMapPinFill size={28} />, color: 'bg-green-600 text-white' },
  { id: 'gmail', name: 'Gmail', icon: <RiMailFill size={28} />, color: 'bg-red-500 text-white' },
  { id: 'youtube', name: 'YouTube', icon: <RiYoutubeFill size={28} />, color: 'bg-red-600 text-white' },
]

const PhoneView = ({ glassPanel }: { glassPanel?: string }) => {
  const [time, setTime] = useState<string>('')
  const [activeApp, setActiveApp] = useState<string | null>(null)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAppClick = (id: string) => {
    playClick()
    setActiveApp(id)
  }

  const handleBackClick = () => {
    playClick()
    setActiveApp(null)
  }

  const renderAppContent = () => {
    if (!activeApp) return null;
    const app = [...APPS, { id: 'phone', name: 'Phone' }, { id: 'messages', name: 'Messages' }, { id: 'camera', name: 'Camera' }].find(a => a.id === activeApp);
    
    return (
      <div className="absolute inset-0 bg-zinc-950 z-40 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        <div className="pt-12 pb-4 px-4 bg-zinc-900 flex items-center gap-4 border-b border-white/10">
          <button onClick={handleBackClick} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <RiArrowLeftLine size={24} />
          </button>
          <h2 className="text-lg font-semibold text-white">{app?.name}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="flex flex-col items-center gap-4 opacity-50">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center animate-pulse">
              {/* Placeholder icon */}
              <div className="w-8 h-8 border-4 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
            </div>
            <p className="text-zinc-400 font-mono text-sm">Connecting to {app?.name} services...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#050505] min-h-screen relative overflow-hidden font-sans ${glassPanel || ''}`}>
      {/* Top Status Bar */}
      <div className="absolute top-0 w-full flex items-center justify-between px-6 py-3 z-50 text-white/90 text-sm font-medium">
        <div className="flex items-center gap-1">
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <RiSignalWifi3Fill size={16} />
          <RiBattery2ChargeLine size={18} />
        </div>
      </div>

      {/* Home Screen Content */}
      <div className="flex-1 flex flex-col relative z-10 pt-20 px-6 pb-32">
        {/* Widget / Clock Area */}
        <div className="flex flex-col items-center mb-12 mt-8">
          <h1 className="text-6xl font-light text-white tracking-tight mb-2">{time}</h1>
          <p className="text-white/60 text-sm font-medium tracking-wide">Mon, Apr 6</p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-4 gap-y-8 gap-x-4 mt-auto mb-8">
          {APPS.map((app) => (
            <button 
              key={app.id} 
              onClick={() => handleAppClick(app.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 ${app.color}`}>
                {app.icon}
              </div>
              <span className="text-white/80 text-[11px] font-medium tracking-wide truncate w-full text-center">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Background Sphere (Subtle) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-96 h-96 scale-150">
          <Sphere />
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-0 w-full px-6 pb-8 pt-6 z-20">
        <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] p-4 flex items-center justify-around border border-white/10 shadow-2xl">
          <button 
            onClick={() => setActiveApp('phone')}
            className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-green-500/20"
          >
            <RiPhoneFill size={28} />
          </button>
          
          <button 
            onClick={() => setActiveApp('messages')}
            className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
          >
            <RiMessage3Fill size={28} />
          </button>

          <button 
            onClick={() => setActiveApp('camera')}
            className="w-14 h-14 rounded-2xl bg-zinc-800 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            <RiCameraLensLine size={28} />
          </button>
        </div>
      </div>

      {/* Active App View */}
      {renderAppContent()}
    </div>
  )
}

export default PhoneView
