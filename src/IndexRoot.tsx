import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RiErrorWarningLine } from 'react-icons/ri'
import TitleBar from './components/Titlebar'
import IRIS from './components/IRIS'
import { irisService } from './services/Iris-voice-ai'
import { playSystemOn, playSystemOff, playClick } from './utils/audio'
import { useVoiceCommands } from './hooks/useVoiceCommands'
import { testConnection } from './utils/firebaseHelpers'

import AppLockScreen from './components/AppLockScreen'

export type VisionMode = 'camera' | 'screen' | 'image' | 'none'

const IndexRoot = () => {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: 'assistant', content: 'IRIS System Initialized. Awaiting input.' }
  ])
  const [isAppLocked, setIsAppLocked] = useState(() => {
    return localStorage.getItem('iris_app_lock_type') && localStorage.getItem('iris_app_lock_type') !== 'none';
  });
  const [isOverlay, setIsOverlay] = useState(false)
  const [isSystemActive, setIsSystemActive] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [visionMode, setVisionMode] = useState<VisionMode>('none')
  const [isVisionPaused, setIsVisionPaused] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isNoiseReductionEnabled, setIsNoiseReductionEnabled] = useState(irisService.isNoiseReductionEnabled)

  const toggleNoiseReduction = () => {
    const newState = !isNoiseReductionEnabled;
    setIsNoiseReductionEnabled(newState);
    irisService.setNoiseReduction(newState);
  }

  const processingVideoRef = useRef<HTMLVideoElement>(Object.assign(document.createElement('video'), {
    autoplay: true,
    playsInline: true,
    muted: true
  }))
  const activeStreamRef = useRef<MediaStream | null>(null)
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const ocrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const [ocrText, setOcrText] = useState('')
  const workerRef = useRef<any>(null)
  const ocrRunningRef = useRef(false)

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    let active = true;
    import('tesseract.js').then((Tesseract) => {
      if (!active) return;
      Tesseract.createWorker('eng', 1, {
         workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.1.1/dist/worker.min.js',
         langPath: 'https://tessdata.projectnaptha.com/4.0.0',
         corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
      }).then(worker => {
         if (active) {
           workerRef.current = worker;
           console.log("OCR worker loaded successfully.");
         } else {
           Promise.resolve(worker.terminate()).catch(() => {});
         }
      }).catch(err => {
         console.warn("Tesseract worker failed to initialize. OCR capability is offline.", err);
      });
    }).catch(err => {
      console.warn("Tesseract library failed to load dynamically.", err);
    });

    return () => {
      active = false;
      if (workerRef.current) {
        Promise.resolve(workerRef.current.terminate()).catch(() => {});
        workerRef.current = null;
      }
    }
  }, [])

  const [voiceCommandToast, setVoiceCommandToast] = useState<{ action: string, command: string } | null>(null);

  const [showPermissionsModal, setShowPermissionsModal] = useState(() => {
    return localStorage.getItem('iris_permissions_granted') !== 'true';
  });
  const [permissionDeniedReason, setPermissionDeniedReason] = useState<string | null>(null);

  const requestPermissions = async () => {
    try {
      let hasAudio = true;
      let hasVideo = true;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasAudio = devices.some(d => d.kind === 'audioinput');
        hasVideo = devices.some(d => d.kind === 'videoinput');
        
        if (devices.length > 0 && !hasAudio && !hasVideo) {
          throw new Error("No camera or microphone hardware was detected on your machine.");
        }
      } catch (e) {
        console.warn("Device enumeration failed or blocked:", e);
      }

      const constraints: MediaStreamConstraints = {};
      if (hasAudio) {
        constraints.audio = {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        };
      }
      if (hasVideo) {
        constraints.video = { width: 640, height: 480 };
      }

      // Fallback if structure ended up empty
      if (Object.keys(constraints).length === 0) {
        constraints.audio = true;
        constraints.video = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      localStorage.setItem('iris_permissions_granted', 'true');
      setShowPermissionsModal(false);
      setPermissionDeniedReason(null);
      playClick();
    } catch (error: any) {
      console.error("Permission request failed", error);
      
      const inIframe = window.self !== window.top;
      if (inIframe) {
        setPermissionDeniedReason("Browsers deny microphone and camera hardware access inside nested preview frames. Please click the 'Open in New Tab' icon at the top-right of your preview pane to launch IRIS in a dedicated tab and grant permissions, or click skip.");
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message?.toLowerCase().includes('not allowed')) {
        setPermissionDeniedReason("The browser or operating system has blocked media access. Please verify your browser's page permissions (near the address bar) and System Settings.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError' || error.message?.toLowerCase().includes('no camera')) {
        setPermissionDeniedReason("No camera or microphone hardware was detected connected to your system.");
      } else {
        setPermissionDeniedReason(`Permission request failed: ${error.message || error}`);
      }
    }
  };

  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string, command: string }>;
      setVoiceCommandToast(customEvent.detail);
      setTimeout(() => setVoiceCommandToast(null), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-modals'));
        setShowPermissionsModal(false);
      }
    };

    window.addEventListener('voice-command-recognized', handleVoiceCommand);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('voice-command-recognized', handleVoiceCommand);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSystem = async () => {
    if (!isSystemActive) {
      try {
        await irisService.connect()
        setIsSystemActive(true)
        playSystemOn()
        
        if (irisService.hasMicrophone) {
          setIsMicMuted(false)
          irisService.setMute(false)
        } else {
          setIsMicMuted(true)
          irisService.setMute(true)
          console.log("Microphone access was denied or is unavailable. Continuing in text/vision mode.");
        }
      } catch (err: any) {
        console.error("Connection failed:", err)
        alert(`Connection failed: ${err.message}`)
      }
    } else {
      irisService.disconnect()
      setIsSystemActive(false)
      playSystemOff()
      setIsMicMuted(true)
      irisService.setMute(true)
      stopVision()
    }
  }

  const toggleMic = () => {
    playClick()
    if (!irisService.hasMicrophone) {
      alert("Microphone is not available. Please check your permissions.");
      return;
    }
    const s = !isMicMuted
    setIsMicMuted(s)
    irisService.setMute(s)
  }

  const handleMicTrigger = async () => {
    const isGranted = localStorage.getItem('iris_permissions_granted') === 'true';
    if (!isGranted) {
      await requestPermissions();
      if (localStorage.getItem('iris_permissions_granted') === 'true') {
        if (!isSystemActive) {
          await toggleSystem();
        }
      }
    } else {
      if (!isSystemActive) {
        await toggleSystem();
      } else {
        toggleMic();
      }
    }
  }

  const startVision = async (mode: 'camera' | 'screen', quality?: { width: number, height: number, frameRate: number }) => {
    if (!isSystemActive) {
      try {
        await toggleSystem();
      } catch (err) {
        console.error('Failed to auto-start system for vision:', err);
        return;
      }
    }
    try {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      
      let stream: MediaStream
      const videoConstraints: MediaTrackConstraints = quality ? {
        width: { ideal: quality.width },
        height: { ideal: quality.height },
        frameRate: { ideal: quality.frameRate }
      } : { width: 640, height: 480 }

      if (mode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints
        })
      } else {
        // For screen sharing, we use getDisplayMedia
        // Some browsers prefer simpler constraints or video: true
        stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: mode === 'screen' ? {
            cursor: 'always',
            displaySurface: 'monitor'
          } : videoConstraints,
          audio: false // We're only sharing screen vision, audio handled by separate service
        })
      }
      
      activeStreamRef.current = stream
      processingVideoRef.current.srcObject = stream
      await processingVideoRef.current.play()
      
      setVisionMode(mode)
      setIsVideoOn(true)
      setIsVisionPaused(false)
      startAIProcessing()
      
      stream.getVideoTracks()[0].onended = () => stopVision()
    } catch (e: any) {
      console.error('Vision Error:', e)
      
      const inIframe = window.self !== window.top;
      if (mode === 'screen' && inIframe && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.name === 'InvalidStateError')) {
        alert("⚠️ SCREEN SHARE BLOCKED\n\nBrowsers block Screen Sharing inside iframes for security.\n\nPlease click the 'Open in New Tab' arrow icon at the top right of the AI Studio preview window to use Screen Share.");
      } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        alert(`Permission denied for ${mode === 'screen' ? 'Screen Share' : 'Camera'}.\n\nPlease ensure you have granted the browser permissions. If you are on a Mac, you may need to enable Screen Recording permissions in System Settings -> Privacy & Security.`)
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        alert(mode === 'camera' ? 'No camera device found on your system.' : 'Screen sharing is not supported or no screen found.')
      } else {
        alert(`Failed to start vision: ${e.message}`)
      }
      stopVision()
    }
  }

  const toggleVisionPause = () => {
    setIsVisionPaused(prev => !prev)
  }

  const uploadImage = async (file: File) => {
    if (!isSystemActive) {
      try {
        await toggleSystem();
      } catch (err) {
        console.error('Failed to auto-start system for image upload:', err);
        return;
      }
    }
    
    // Stop any active camera/screen stream
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => t.stop())
      activeStreamRef.current = null
    }
    if (processingVideoRef.current) {
      processingVideoRef.current.srcObject = null
    }
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current)
      aiIntervalRef.current = null
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setUploadedImageUrl(result)
        setVisionMode('image')
        setIsVideoOn(true)
        setIsVisionPaused(false)
        
        const mimeType = result.split(';')[0].split(':')[1] || 'image/jpeg'
        const base64 = result.split(',')[1]
        irisService.sendVideoFrame(base64, mimeType)
        irisService.sendText("I have uploaded an image. Please analyze it and tell me what you see.")
      }
    }
    reader.readAsDataURL(file)
  }

  const stopVision = () => {
    setIsVideoOn(false)
    setVisionMode('none')
    setIsVisionPaused(false)
    setUploadedImageUrl(null)
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => t.stop())
      activeStreamRef.current = null
    }
    if (processingVideoRef.current) {
      processingVideoRef.current.srcObject = null
    }
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current)
      aiIntervalRef.current = null
    }
  }

  const runOCR = (triggerReadOutLoud = false) => {
    if (!workerRef.current || ocrRunningRef.current) return;
    const vid = processingVideoRef.current;
    if (!vid || vid.readyState < 2) return;
    
    ocrRunningRef.current = true;
    
    const ocrMaxDim = 1920;
    let ocrWidth = vid.videoWidth || 1920;
    let ocrHeight = vid.videoHeight || 1080;
    
    if (ocrWidth > ocrMaxDim || ocrHeight > ocrMaxDim) {
      const ratio = ocrWidth / ocrHeight;
      if (ratio > 1) {
        ocrWidth = ocrMaxDim;
        ocrHeight = Math.round(ocrMaxDim / ratio);
      } else {
        ocrHeight = ocrMaxDim;
        ocrWidth = Math.round(ocrMaxDim * ratio);
      }
    }

    if (!ocrCanvasRef.current) {
      ocrCanvasRef.current = document.createElement('canvas');
    }
    if (ocrCanvasRef.current.width !== ocrWidth || ocrCanvasRef.current.height !== ocrHeight) {
      ocrCanvasRef.current.width = ocrWidth;
      ocrCanvasRef.current.height = ocrHeight;
    }
    
    const ocrCanvas = ocrCanvasRef.current;
    const ocrCtx = ocrCanvas.getContext('2d', { willReadFrequently: true });
    
    if (ocrCtx) {
      ocrCtx.drawImage(vid, 0, 0, ocrWidth, ocrHeight);
      const imageData = ocrCtx.getImageData(0, 0, ocrWidth, ocrHeight);
      const data = imageData.data;
      
      let minGray = 255;
      let maxGray = 0;
      const grays = new Uint8Array(data.length / 4);
      
      let j = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        grays[j++] = gray;
        if (gray < minGray) minGray = gray;
        if (gray > maxGray) maxGray = gray;
      }
      
      const range = maxGray - minGray || 1;
      j = 0;
      for (let i = 0; i < data.length; i += 4) {
        const stretched = ((grays[j++] - minGray) / range) * 255;
        data[i] = stretched;
        data[i + 1] = stretched;
        data[i + 2] = stretched;
      }
      
      ocrCtx.putImageData(imageData, 0, 0);
      const ocrDataUrl = ocrCanvas.toDataURL('image/png');
      
      workerRef.current.recognize(ocrDataUrl).then(({ data: { text } }: any) => {
        const cleanedText = text?.trim();
        setOcrText(cleanedText || '');
        if (triggerReadOutLoud) {
          if (cleanedText && cleanedText.length > 2) {
             irisService.sendText(`User requested to read the text on the screen. Please read this text out loud to the user exactly: ${cleanedText}`);
          } else {
             irisService.sendText(`User requested to read the text on the screen, but I couldn't detect any text right now.`);
          }
        } else if (cleanedText && cleanedText.length > 5) {
           irisService.sendText(`[System Context - OCR detected on screen: ${cleanedText.substring(0, 500)}]`);
        }
        ocrRunningRef.current = false;
      }).catch(() => {
        ocrRunningRef.current = false;
      });
    } else {
      ocrRunningRef.current = false;
    }
  };

  const startAIProcessing = () => {
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current)

    if (!processingCanvasRef.current) {
      processingCanvasRef.current = document.createElement('canvas')
      processingCanvasRef.current.width = 640 // Lower resolution for faster processing/upload
      processingCanvasRef.current.height = 480
    }

    aiIntervalRef.current = setInterval(() => {
      // Don't send frames if vision is paused or system is inactive
      if (isVisionPaused || !isSystemActive) return;
      
      const vid = processingVideoRef.current
      if (vid && vid.readyState >= 2) {
        const canvas = processingCanvasRef.current!
        
        // Match source aspect ratio but cap resolution for performance
        const MAX_DIM = visionMode === 'screen' ? 1024 : 640;
        let targetWidth = vid.videoWidth || 640;
        let targetHeight = vid.videoHeight || 480;
        
        if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
          const ratio = targetWidth / targetHeight;
          if (ratio > 1) {
            targetWidth = MAX_DIM;
            targetHeight = Math.round(MAX_DIM / ratio);
          } else {
            targetHeight = MAX_DIM;
            targetWidth = Math.round(MAX_DIM * ratio);
          }
        }
        
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
          // Adjust quality/format for optimal real-time performance
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
          const base64 = dataUrl.split(',')[1]
          irisService.sendVideoFrame(base64)

          // Background OCR task - process less frequently than vision frames
          if (workerRef.current && !ocrRunningRef.current && Math.random() > 0.7) {
            runOCR(false);
          }
        }
      }
    }, 500) // 2 FPS for smoother real-time "seeing"
  }

  // Effect to handle pausing/resuming the interval when isVisionPaused changes
  useEffect(() => {
    if (isVideoOn) {
      startAIProcessing()
    }
  }, [isVisionPaused, isVideoOn])

  const transcriptHandlerRef = useRef<(role: string, text: string) => void>(() => {})
  const commandHandlerRef = useRef<(command: string, args: any) => void>(() => {})
  const setActiveTabRef = useRef<(tab: string) => void>(() => {})
  const getActiveTabRef = useRef<() => string>(() => 'DASHBOARD')

  useVoiceCommands({
    toggleSystem,
    isSystemActive,
    toggleMic,
    isMicMuted,
    startVision,
    stopVision,
    isVideoOn,
    setActiveTab: (tab) => setActiveTabRef.current(tab),
    getActiveTab: () => getActiveTabRef.current(),
    triggerOCR: () => runOCR(true)
  });

  useEffect(() => {
    irisService.onTranscript = (role, text) => {
      if (transcriptHandlerRef.current) {
        transcriptHandlerRef.current(role, text)
      }
    }
    irisService.onCommand = (command, args) => {
      if (commandHandlerRef.current) {
        commandHandlerRef.current(command, args)
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-[100dvh] w-screen min-w-[320px] bg-black overflow-hidden relative border border-emerald-500/20 rounded-xl">
      {isAppLocked && <AppLockScreen onUnlock={() => setIsAppLocked(false)} />}
      <div className="flex-1 relative">
        <IRIS
          isSystemActive={isSystemActive}
          toggleSystem={toggleSystem}
          isMicMuted={isMicMuted}
          toggleMic={toggleMic}
          handleMicTrigger={handleMicTrigger}
          isVideoOn={isVideoOn}
          visionMode={visionMode}
          startVision={startVision}
          stopVision={stopVision}
          isVisionPaused={isVisionPaused}
          toggleVisionPause={toggleVisionPause}
          isNoiseReductionEnabled={isNoiseReductionEnabled}
          toggleNoiseReduction={toggleNoiseReduction}
          activeStream={activeStreamRef.current}
          uploadImage={uploadImage}
          uploadedImageUrl={uploadedImageUrl}
          ocrText={ocrText}
          sendText={(text) => {
            if (isSystemActive) {
              irisService.sendText(text)
            }
          }}
          onTranscript={(role, text) => {}}
          registerTranscriptHandler={(handler) => {
            transcriptHandlerRef.current = handler
          }}
          registerCommandHandler={(handler) => {
            commandHandlerRef.current = handler
          }}
          registerSetActiveTab={(handler) => {
            setActiveTabRef.current = handler
          }}
          registerGetActiveTab={(handler) => {
            getActiveTabRef.current = handler
          }}
          messages={messages}
          setMessages={setMessages}
        />
        
        {/* Full-Screen Permissions Modal */}
        <AnimatePresence>
          {showPermissionsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 xs:p-4 sm:p-6"
            >
              <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl max-w-sm w-full min-w-[280px] max-h-[92vh] overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 flex flex-col items-center text-center shadow-2xl mx-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6 shrink-0">
                  <div className="text-emerald-400">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="28" width="28" className="sm:w-8 sm:h-8" xmlns="http://www.w3.org/2000/svg"><path d="M21 13V11H18.9136C18.4357 8.35405 16.3262 6.24458 13.6803 5.76672C13.2505 3.6186 11.3364 2 9 2C6.23858 2 4 4.23858 4 7V17C4 19.7614 6.23858 22 9 22C11.3364 22 13.2505 20.3814 13.6803 18.2333C16.3262 17.7554 18.4357 15.6459 18.9136 13H21ZM12.0125 10.9786C11.9616 11.6425 11.6703 12.2594 11.1969 12.7328L10 13.9297V17C10 17.5523 9.55228 18 9 18C8.44772 18 8 17.5523 8 17V7C8 6.44772 8.44772 6 9 6C9.55228 6 10 6.44772 10 7V10.0703L11.1969 11.2672C11.6703 11.7406 11.9616 12.3575 12.0125 13.0214H16.8998C16.446 14.8624 14.9392 16.3055 13.0475 16.6808C12.5938 15.228 11.2825 14.159 10.6698 13.565L12.5693 11.6655C13.0381 11.1967 13.3362 10.551 13.4116 9.85191C13.5852 9.578 13.8016 9.33081 14.0537 9.12195L15.3371 10.4054L14.6299 11.1125L15.3371 11.8196L16.7513 10.4054L15.3371 8.99114L14.6299 9.69824L15.3371 10.4054C15.085 10.6143 14.8686 10.8615 14.6949 11.1354H16.8998C16.446 9.29446 14.9392 7.85139 13.0475 7.47607C12.8091 8.23933 12.4566 8.94827 12.0125 9.57143Z"></path></svg>
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 leading-tight">Access Required</h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-4 sm:mb-6">
                  Request camera and microphone access to enable voice-first interactions and real-time analysis.
                </p>
                {window.self !== window.top && (
                  <div className="mb-4 sm:mb-6 w-full p-2.5 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] sm:text-xs text-left leading-normal sm:leading-relaxed">
                    <span className="font-bold block mb-1 text-amber-400">⚠️ Sandbox Environment Active</span>
                    Browsers block microphone/camera access in nested previews. Click <strong className="text-white font-semibold">"Open in New Tab"</strong> (top-right of preview pane) to launch IRIS in a dedicated window, or click SKIP.
                  </div>
                )}
                {permissionDeniedReason && (
                  <div className="mb-4 sm:mb-6 w-full p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-xs text-left leading-normal sm:leading-relaxed">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                      <RiErrorWarningLine size={14} className="sm:w-4 sm:h-4" /> Permission Denied
                    </div>
                    {permissionDeniedReason}
                  </div>
                )}
                <div className="w-full flex flex-col xs:flex-row gap-2 sm:gap-3 mt-auto shrink-0">
                  <button 
                    onClick={() => setShowPermissionsModal(false)}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold tracking-widest text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors uppercase"
                  >
                    SKIP
                  </button>
                  <button 
                    onClick={requestPermissions}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold tracking-widest text-black bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase"
                  >
                    GRANT ACCESS
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Command UI Overlay */}
        <AnimatePresence>
          {voiceCommandToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-full px-4 pointer-events-none"
            >
              <div className="bg-[#0a0a0c]/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(16,185,129,0.15)] flex flex-col items-center text-center gap-1">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Voice Command Executed</span>
                <span className="text-white text-sm font-medium">{voiceCommandToast.action}</span>
                <span className="text-zinc-500 text-xs font-mono italic">"{voiceCommandToast.command}"</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default IndexRoot

