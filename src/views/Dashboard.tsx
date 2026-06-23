import { useEffect, useCallback, useRef, useState } from 'react'
import Sphere from '../components/Sphere'
import { motion, AnimatePresence } from 'motion/react'
import {
  RiCpuLine,
  RiCameraLine,
  RiTerminalBoxLine,
  RiSwapBoxLine,
  RiLayoutGridLine,
  RiMicLine,
  RiMicOffLine,
  RiPhoneFill,
  RiHistoryLine,
  RiPulseLine,
  RiWifiLine,
  RiServerLine,
  RiBrainLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiStopCircleLine,
  RiImageAddLine,
  RiComputerLine,
  RiQuestionAnswerLine,
  RiCloseLine,
  RiSendPlaneFill,
  RiArrowUpLine,
  RiSettings4Line,
  RiCheckLine
} from 'react-icons/ri'
import { FaMemory } from 'react-icons/fa6'
import { GiTinker } from 'react-icons/gi'
import { HiComputerDesktop } from 'react-icons/hi2'
import { IrisProps } from '../components/IRIS'
import { playClick, playAction } from '../utils/audio'

interface DashboardViewProps {
  props: IrisProps
  stats: any
  chatHistory: any[]
  onVisionClick: () => void
  onAskIris?: (text: string) => void
  isGenerating?: boolean
}

const glassPanel = 'bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl'

const TypingText = ({ text, isLatest }: { text: string, isLatest: boolean }) => {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : text)
  
  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text)
      return
    }
    
    let i = 0
    setDisplayedText('')
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 15)
    
    return () => clearInterval(timer)
  }, [text, isLatest])

  return <span>{displayedText}</span>
}

export default function DashboardView({
  props,
  stats,
  chatHistory,
  onVisionClick,
  onAskIris,
  isGenerating = false
}: DashboardViewProps) {
  const {
    isSystemActive,
    isVideoOn,
    visionMode,
    startVision,
    stopVision,
    activeStream,
    toggleMic,
    toggleSystem,
    isMicMuted,
    isVisionPaused,
    toggleVisionPause
  } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  
  const [intelligenceFeed, setIntelligenceFeed] = useState<{id: number, text: string, type: 'insight' | 'status'}[]>([])
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [quality, setQuality] = useState({ width: 1280, height: 720, frameRate: 60 })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [battery, setBattery] = useState<{ level: number, charging: boolean } | null>(null)
  const [network, setNetwork] = useState<{ online: boolean, type?: string }>({ online: navigator.onLine })
  const [weather, setWeather] = useState<{ temp: string, desc: string, location?: string } | null>(null)
  const [fullWeather, setFullWeather] = useState<any | null>(null)

  useEffect(() => {
    const handleWeather = (e: any) => {
      const data = e.detail.data;
      setFullWeather(data);
      if (data && data.current_condition) {
        setWeather({
          temp: data.current_condition[0].temp_C,
          desc: data.current_condition[0].weatherDesc[0].value,
          location: e.detail.location
        })
      }
    }
    window.addEventListener('show-weather', handleWeather)
    return () => window.removeEventListener('show-weather', handleWeather)
  }, [])

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBattery({ level: batt.level * 100, charging: batt.charging })
        batt.addEventListener('levelchange', () => setBattery((prev: any) => ({ ...prev, level: batt.level * 100 })))
        batt.addEventListener('chargingchange', () => setBattery((prev: any) => ({ ...prev, charging: batt.charging })))
      })
    }

    const updateNet = () => {
       const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
       setNetwork({ online: navigator.onLine, type: connection ? connection.effectiveType : 'unknown' })
    }
    updateNet()
    window.addEventListener('online', updateNet)
    window.addEventListener('offline', updateNet)
    return () => {
       window.removeEventListener('online', updateNet)
       window.removeEventListener('offline', updateNet)
    }
  }, [])

  useEffect(() => {
    if (isSystemActive && !fullWeather) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetch(`https://wttr.in/${pos.coords.latitude},${pos.coords.longitude}?format=j1`)
            .then(res => res.json())
            .then(data => {
              setFullWeather(data)
              setWeather({
                 temp: data.current_condition[0].temp_C,
                 desc: data.current_condition[0].weatherDesc[0].value,
                 location: 'Local'
              })
            }).catch(() => {})
        },
        () => {}
      )
    }
  }, [isSystemActive, fullWeather])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isChatExpanded && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, isChatExpanded, isGenerating])

  useEffect(() => {
    const handleCloseMods = () => setIsPopupOpen(false)
    window.addEventListener('close-modals', handleCloseMods)
    return () => window.removeEventListener('close-modals', handleCloseMods)
  }, [])

  // Simulate real-time intelligence feed
  useEffect(() => {
    if (!isSystemActive) {
      setIntelligenceFeed([])
      return
    }
    
    const insights = [
      "Analyzing ambient audio patterns...",
      "Optimizing neural pathways for ultra-fast response.",
      "Cross-referencing user context with memory bank.",
      "Vision module standing by for visual input.",
      "Detecting optimal latency route (24ms).",
      "Ready for ultra-fast command execution.",
      "Monitoring system vitals: Nominal.",
      "Context window refreshed."
    ]
    
    const addInsight = () => {
      const newInsight = {
        id: Date.now(),
        text: insights[Math.floor(Math.random() * insights.length)],
        type: Math.random() > 0.5 ? 'insight' : 'status' as 'insight' | 'status'
      }
      setIntelligenceFeed(prev => [newInsight, ...prev].slice(0, 4))
    }
    
    addInsight()
    const interval = setInterval(addInsight, 3500)
    return () => clearInterval(interval)
  }, [isSystemActive])

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoElementRef.current = node
      if (node && activeStream && isVideoOn) {
        node.srcObject = activeStream
        node.onloadedmetadata = () => node.play().catch(() => {})
      }
    },
    [activeStream, isVideoOn, visionMode]
  )

  const toggleSource = () => {
    if (!isSystemActive) return
    const nextMode = visionMode === 'camera' ? 'screen' : 'camera'
    startVision(nextMode as any)
  }

  const systemMetrics = [
    {
      icon: <RiCpuLine />,
      label: 'CPU LOAD',
      val: isSystemActive && stats ? `${stats.cpu}%` : '--'
    },
    {
      icon: <FaMemory />,
      label: 'RAM USAGE',
      val: isSystemActive && stats ? `${stats.memory.usedPercentage}%` : '--'
    },
    {
      icon: <GiTinker />,
      label: 'TEMP',
      val: isSystemActive && stats ? `${stats.temperature}°C` : '--'
    },
    {
      icon: <HiComputerDesktop />,
      label: 'OS',
      val: isSystemActive && stats ? `${stats.os.type}` : '--'
    }
  ]

  return (
    <div className="h-full w-full flex flex-col relative animate-in fade-in duration-500">
      {/* System Vitals HUD */}
      {!isVideoOn && (
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 w-48 pointer-events-none hidden md:flex">
          <div className={`p-3 rounded-xl border backdrop-blur-md card-hover ${isSystemActive ? 'bg-emerald-950/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-zinc-900/40 border-white/10'}`}>
            <div className="text-[10px] font-bold tracking-widest text-zinc-500 mb-2 border-b border-white/10 pb-1">OPENCLAW CORE</div>
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-400 font-mono">AUTONOMY</span>
                 <span className="text-emerald-400 font-bold">ONLINE</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-400 font-mono">BROWSER</span>
                 <span className="text-emerald-400 font-bold">READY</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-400 font-mono">SYSTEM</span>
                 <span className="text-emerald-400 font-bold">HOOKED</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-zinc-400 font-mono">ANDROID ADB</span>
                 <span className="text-emerald-400 font-bold">CONNECTED</span>
               </div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border backdrop-blur-md card-hover ${isSystemActive ? 'bg-emerald-950/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-zinc-900/40 border-white/10'}`}>
            <div className="text-[10px] font-bold tracking-widest text-zinc-500 mb-2 border-b border-white/10 pb-1">SYSTEM VITALS</div>
            {systemMetrics.map((sm, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1 text-zinc-400">
                  <span className="text-[10px]">{sm.icon}</span>
                  <span className="text-[10px] font-mono">{sm.label}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${isSystemActive ? 'text-emerald-400' : 'text-zinc-500'}`}>{sm.val}</span>
              </div>
            ))}
          </div>
          
          <div className={`p-3 rounded-xl border backdrop-blur-md bg-zinc-900/40 border-white/10 card-hover flex flex-col`}>
            <div className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1 border-b border-white/10 pb-1">LOCAL TIME</div>
            <div className="text-xl font-black tracking-widest text-white mt-1 text-center font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono text-center mt-1 uppercase tracking-wider">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
            </div>
          </div>

          {(weather || fullWeather) && (
            <div className={`p-3 rounded-xl border backdrop-blur-md bg-zinc-900/40 border-white/10 card-hover flex flex-col`}>
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1 border-b border-white/10 pb-1 flex justify-between">
                <span>WEATHER {weather?.location && `(${weather.location.toUpperCase()})`}</span>
              </div>
              {weather && (
                <div className="flex justify-between items-end mt-1">
                  <div className="text-2xl font-black text-white font-mono">{weather.temp}°C</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase w-20 text-right leading-tight">
                    {weather.desc}
                  </div>
                </div>
              )}
              {fullWeather && fullWeather.weather && fullWeather.weather.slice(1, 3).map((day: any, i: number) => (
                <div key={i} className="flex justify-between items-center mt-2 pt-1 border-t border-white/5 text-[10px]">
                  <span className="text-zinc-400 font-mono">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                  <div className="flex gap-2 font-mono">
                    <span className="text-zinc-500">L:{day.mintempC}°</span>
                    <span className="text-white">H:{day.maxtempC}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`p-4 rounded-xl border backdrop-blur-md card-hover ${isSystemActive ? 'bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-zinc-900/40 border-white/10'}`}>
            <div className="text-[10px] font-bold tracking-widest text-zinc-500 mb-4 border-b border-white/10 pb-2">LOCAL ENVIRONMENT & HEALTH</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">CPU LOAD</span>
                <span className={`text-lg font-mono font-bold ${isSystemActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isSystemActive && stats ? `${stats.cpu}%` : '--'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">RAM USAGE</span>
                <span className={`text-lg font-mono font-bold ${isSystemActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isSystemActive && stats ? `${stats.memory.usedPercentage}%` : '--'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">BATTERY</span>
                <span className={`text-lg font-mono font-bold ${battery ? (battery.charging ? 'text-indigo-400' : (battery.level < 20 ? 'text-red-400' : 'text-emerald-400')) : 'text-zinc-500'}`}>
                  {battery ? `${Math.round(battery.level)}%` : '--'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">NETWORK</span>
                <span className={`text-lg font-mono font-bold ${network.online ? 'text-indigo-400' : 'text-red-400'}`}>
                  {network.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">TEMP</span>
                <span className={`text-lg font-mono font-bold ${isSystemActive && stats ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isSystemActive && stats ? `${stats.temperature}°C` : '--'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">SYSTEM</span>
                <span className={`text-sm font-mono font-bold mt-1 ${isSystemActive && stats ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isSystemActive && stats ? stats.os.type : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="order-1 lg:order-none col-span-12 lg:col-span-6 relative flex-1 flex flex-col items-center justify-center min-h-[50vh] lg:min-h-0">
        
        {/* Quality Settings & Analyze Button */}
        {isVideoOn && (
          <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="text-xs font-bold text-emerald-400 mb-1">VISION CONTROLS</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Mode:</label>
              <select 
                value={visionMode}
                onChange={(e) => {
                  startVision(e.target.value as any, quality)
                }}
                className="bg-black/50 text-xs text-white border border-white/10 rounded px-1 py-0.5"
              >
                <option value="camera">Camera</option>
                <option value="screen">Screen Share</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Res:</label>
              <select 
                value={`${quality.width}x${quality.height}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number)
                  setQuality(prev => ({ ...prev, width: w, height: h }))
                  if (isVideoOn) startVision(visionMode as any, { width: w, height: h, frameRate: quality.frameRate })
                }}
                className="bg-black/50 text-xs text-white border border-white/10 rounded px-1 py-0.5"
              >
                <option value="320x240">320p</option>
                <option value="640x480">480p</option>
                <option value="1280x720">720p</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">FPS:</label>
              <select 
                value={quality.frameRate}
                onChange={(e) => {
                  const fps = Number(e.target.value)
                  setQuality(prev => ({ ...prev, frameRate: fps }))
                  if (isVideoOn) startVision(visionMode as any, { ...quality, frameRate: fps })
                }}
                className="bg-black/50 text-xs text-white border border-white/10 rounded px-1 py-0.5"
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>
            <button
              onClick={() => {
                if (isSystemActive) {
                  playAction()
                  setIsAnalyzing(true)
                  import('../services/Iris-voice-ai').then(({ irisService }) => {
                    irisService.sendText("Please analyze the current vision feed and describe what you see in detail.")
                    setTimeout(() => setIsAnalyzing(false), 3000)
                  })
                } else {
                  alert("Please activate IRIS first.")
                }
              }}
              disabled={isAnalyzing}
              aria-label={isAnalyzing ? 'Analyzing Feed' : 'Analyze Feed'}
              aria-busy={isAnalyzing}
              className={`mt-2 text-xs py-1 px-2 rounded font-bold transition-colors ${isAnalyzing ? 'bg-emerald-500/50 text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Feed'}
            </button>

            {props.ocrText && props.ocrText.length > 0 && (
              <div className="mt-2 text-[10px] w-48 max-h-32 overflow-y-auto whitespace-pre-wrap text-emerald-400/80 bg-black/40 border border-emerald-500/10 p-2 rounded custom-scrollbar font-mono leading-tight">
                <span className="text-zinc-500 block mb-1">OCR DETECTED:</span>
                {props.ocrText}
              </div>
            )}
          </div>
        )}

        {isVideoOn && visionMode !== 'image' && (
          <>
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-100"
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
              <div className="flex items-end gap-2 relative w-full pb-4 drop-shadow-xl">
                <div className="flex-1 flex flex-col justify-end bg-[#282828] rounded-[28px] min-h-[56px] relative shadow-lg shadow-black/20">
                  <div className="flex items-end">
                    <input
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Ask Gemini about this live feed..."
                      className="flex-1 bg-transparent text-white placeholder:text-zinc-400 focus:outline-none text-base px-6 py-4 min-w-0 h-14"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && questionText.trim()) {
                          playAction();
                          if (videoElementRef.current) {
                            const canvas = document.createElement('canvas');
                            canvas.width = videoElementRef.current.videoWidth || 800;
                            canvas.height = videoElementRef.current.videoHeight || 450;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
                              const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                              localStorage.setItem('pending_chat_message', questionText);
                              localStorage.setItem('pending_chat_attachment', base64);
                              localStorage.setItem('pending_chat_attachment_type', 'image/jpeg');
                              localStorage.setItem('pending_chat_attachment_name', 'live_feed_snapshot.jpg');
                            }
                          }
                          setQuestionText('');
                          const chatTab = document.getElementById('tab-CHAT') as HTMLButtonElement;
                          if (chatTab) chatTab.click();
                        }
                      }}
                    />
                    
                    <div className="flex items-center gap-1 pr-2 pb-2 shrink-0 h-10 mb-2">
                      {questionText.trim().length > 0 ? (
                        <button 
                          onClick={() => {
                            if (questionText.trim()) {
                              playAction();
                              if (videoElementRef.current) {
                                const canvas = document.createElement('canvas');
                                canvas.width = videoElementRef.current.videoWidth || 800;
                                canvas.height = videoElementRef.current.videoHeight || 450;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
                                  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                                  localStorage.setItem('pending_chat_message', questionText);
                                  localStorage.setItem('pending_chat_attachment', base64);
                                  localStorage.setItem('pending_chat_attachment_type', 'image/jpeg');
                                  localStorage.setItem('pending_chat_attachment_name', 'live_feed_snapshot.jpg');
                                }
                              }
                              setQuestionText('');
                              const chatTab = document.getElementById('tab-CHAT') as HTMLButtonElement;
                              if (chatTab) chatTab.click();
                            }
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-zinc-200 rounded-full transition-colors mr-1"
                        >
                          <RiArrowUpLine size={24} />
                        </button>
                      ) : (
                        <>
                          <button aria-label="Microphone active indicator" className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:bg-white/10 rounded-full transition-colors">
                            <RiMicLine size={24} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {visionMode === 'image' && props.uploadedImageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-sm p-4">
            <div className="relative max-w-3xl w-full flex flex-col gap-4">
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src={props.uploadedImageUrl} 
                  alt="Uploaded" 
                  className="w-full h-full object-contain"
                />
                <button 
                  onClick={() => stopVision()}
                  aria-label="Close image preview"
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/50 text-white rounded-full transition-colors"
                >
                  <RiCloseLine size={24} aria-hidden="true" />
                </button>
              </div>
              
              <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <RiQuestionAnswerLine className="text-emerald-400" size={24} />
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ask IRIS about this image..."
                    aria-label="Ask about this image"
                    className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus:outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && questionText.trim()) {
                        playAction();
                        if (isSystemActive) {
                          import('../services/Iris-voice-ai').then(({ irisService }) => {
                            irisService.sendText(questionText);
                          });
                        }
                        setQuestionText('');
                        // Teleport to chat
                        const chatTab = document.getElementById('tab-CHAT') as HTMLButtonElement;
                        if (chatTab) chatTab.click();
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (questionText.trim()) {
                        playAction();
                        if (isSystemActive) {
                          import('../services/Iris-voice-ai').then(({ irisService }) => {
                            irisService.sendText(questionText);
                          });
                        }
                        setQuestionText('');
                        // Teleport to chat
                        const chatTab = document.getElementById('tab-CHAT') as HTMLButtonElement;
                        if (chatTab) chatTab.click();
                      }
                    }}
                    aria-label="Send image question"
                    className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl transition-colors"
                  >
                    <RiSendPlaneFill size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isVideoOn && (
          <div className={`w-[90vw] h-[90vw] max-w-[80vh] max-h-[80vh] transition-all duration-1000 relative z-10 ${isSystemActive ? 'opacity-100 scale-100' : 'opacity-85 scale-90'}`}>
            <Sphere />
          </div>
        )}

        {/* Text Overlay for Live Conversation */}
        {isSystemActive && chatHistory.length > 0 && (
          <div className={`absolute w-full flex justify-center z-40 px-4 transition-all duration-300 ${isChatExpanded ? 'bottom-32 top-32' : 'bottom-32'}`}>
            <div 
              className={`max-w-2xl w-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 flex flex-col cursor-pointer ${isChatExpanded ? 'h-full rounded-3xl p-6 pointer-events-auto' : 'rounded-2xl p-4 text-center pointer-events-auto hover:bg-black/70'}`}
              onClick={() => !isChatExpanded && setIsChatExpanded(true)}
            >
              {!isChatExpanded ? (
                <>
                  <p className="text-lg md:text-xl font-medium text-white drop-shadow-md">
                    <TypingText 
                      text={chatHistory[chatHistory.length - 1].content} 
                      isLatest={true} 
                    />
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 mt-2 opacity-80 flex items-center justify-center gap-2">
                    {chatHistory[chatHistory.length - 1].role === 'user' ? 'YOU' : 'IRIS'}
                    <RiArrowUpLine size={12} className="animate-bounce" />
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10 shrink-0">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                      <RiHistoryLine size={16} /> Live Transcript
                    </h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsChatExpanded(false); }}
                      className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <RiCloseLine size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-200 border border-white/5'}`}>
                          <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 px-1">
                          {msg.role === 'user' ? 'YOU' : 'IRIS'}
                        </span>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex flex-col items-start gap-1 pb-1 animate-pulse">
                        <div className="bg-zinc-800/50 text-zinc-200 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-1.5 self-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffb3]/90 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-[#00ffb3] mt-1 px-1 font-mono font-medium">
                          IRIS is typing
                        </span>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-6 w-full flex justify-center z-50 px-4">
          <div className="w-full max-w-[95%] sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            
            {/* Gallery Add Icon */}
            <button
              onClick={() => {
                const fileInput = document.getElementById('global-file-upload') as HTMLInputElement;
                if (fileInput) fileInput.click();
              }}
              aria-label="Upload Image"
              title="Upload Image/File"
              className="relative cursor-pointer p-2 text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full hover:bg-white/5"
            >
              <RiImageAddLine size={20} className="sm:w-[24px] sm:h-[24px]" aria-hidden="true" />
            </button>

            {/* Camera Icon */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  if (isVideoOn && visionMode === 'camera') stopVision()
                  else startVision('camera', quality)
                }}
                aria-label={isVideoOn && visionMode === 'camera' ? "Stop Camera" : "Enable Camera"}
                title={isVideoOn && visionMode === 'camera' ? "Stop Camera" : "Enable Camera Vision"}
                className={`relative cursor-pointer p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full hover:bg-white/5 ${
                  isVideoOn && visionMode === 'camera' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <RiCameraLine size={20} className="sm:w-[24px] sm:h-[24px]" aria-hidden="true" />
              </button>
            </div>

            {/* Screen Share Icon */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  if (isVideoOn && visionMode === 'screen') stopVision()
                  else startVision('screen', quality)
                }}
                aria-label={isVideoOn && visionMode === 'screen' ? "Stop Screen Share" : "Enable Screen Share"}
                title={isVideoOn && visionMode === 'screen' ? "Stop Screen Share" : "Enable Screen Share"}
                className={`relative cursor-pointer p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full hover:bg-white/5 ${
                  isVideoOn && visionMode === 'screen' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <RiComputerLine size={20} className="sm:w-[24px] sm:h-[24px]" aria-hidden="true" />
              </button>
            </div>

            {/* Phone Icon */}
            <button 
              onClick={toggleSystem} 
              className="relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full active:scale-95 transition-transform"
              aria-label={isSystemActive ? "Disconnect IRIS" : "Establish Link with IRIS"}
              title={isSystemActive ? "Disconnect Voice System" : "Activate Voice System"}
            >
              <div className={`cursor-pointer w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all duration-500 border-2 ${
                isSystemActive 
                  ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20' 
                  : 'border-zinc-700 bg-transparent hover:bg-zinc-800'
              }`}>
                <RiPhoneFill size={18} className={`sm:w-[22px] sm:h-[22px] ${isSystemActive ? 'text-emerald-500' : 'text-zinc-400'}`} aria-hidden="true" />
              </div>
            </button>

            {/* Ask IRIS Icon */}
            <button
              onClick={() => setIsPopupOpen(true)}
              aria-label="Ask IRIS"
              title="Quick Text Prompt"
              className="relative cursor-pointer p-2 text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full hover:bg-white/5"
            >
              <RiQuestionAnswerLine size={20} className="sm:w-[24px] sm:h-[24px]" aria-hidden="true" />
            </button>

            {/* OpenClaw Feature Tool */}
            <button
              onClick={() => {
                const browserTab = document.getElementById('tab-BROWSER') as HTMLButtonElement;
                if (browserTab) browserTab.click();
              }}
              aria-label="OpenClaw Automation"
              title="Launch OpenClaw Browser Engine"
              className="relative cursor-pointer p-2 text-emerald-500 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full hover:bg-white/5"
            >
              <RiTerminalBoxLine size={20} className="sm:w-[24px] sm:h-[24px]" aria-hidden="true" />
            </button>

          </div>
        </div>
      </div>

      {/* Ask IRIS Popup */}
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setIsPopupOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="ask-iris-card relative select-none"
            >
              <button
                onClick={() => setIsPopupOpen(false)}
                aria-label="Close Ask IRIS popup"
                className="absolute top-4 right-4 text-zinc-500 hover:text-[#00ffb3] transition-colors"
              >
                <RiCloseLine size={24} aria-hidden="true" />
              </button>

              <h1 className="text-3xl font-bold tracking-tight">ASK IRIS</h1>

              <p className="text-zinc-300">
                Type your question below. IRIS will respond using voice if the system is active.
              </p>

              <div className="relative mt-6">
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-black text-white px-4 focus:outline-none focus:ring-2 focus:ring-[#00ffb3]/50 transition-all border border-[#00ffb3] rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (questionText.trim()) {
                        playAction();
                        if (onAskIris) {
                          onAskIris(questionText);
                        } else {
                          import('../services/Iris-voice-ai').then(({ irisService }) => {
                            irisService.sendText(questionText);
                          });
                        }
                        setQuestionText('');
                        setIsPopupOpen(false);
                      }
                    }
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (questionText.trim()) {
                    playAction();
                    if (onAskIris) {
                      onAskIris(questionText);
                    } else {
                      import('../services/Iris-voice-ai').then(({ irisService }) => {
                        irisService.sendText(questionText);
                      });
                    }
                    setQuestionText('');
                    setIsPopupOpen(false);
                  }
                }}
                disabled={!questionText.trim()}
                className="w-full h-[50px] mt-[15px] border-none rounded-xl font-bold cursor-pointer transition-all hover:bg-[#00d696] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-[#00ffb3] text-black"
              >
                Send
              </button>

              {/* Dictation options */}
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  onClick={() => {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                      const recognition = new SpeechRecognition();
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        setQuestionText(prev => prev + ' ' + transcript);
                      };
                      recognition.start();
                    } else {
                      alert("Speech recognition is not supported in this browser.");
                    }
                  }}
                  className="text-xs font-mono text-zinc-500 hover:text-[#00ffb3] transition-colors flex items-center gap-1.5"
                  title="Dictate"
                >
                  <RiMicLine size={16} /> DICTATE VOICE
                </button>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSystemActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                    {isSystemActive ? "ONLINE" : "STANDBY"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
