import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { playClick, playAction, playTone } from '../utils/audio'
import {
  RiMicLine,
  RiMicOffLine,
  RiHistoryLine,
  RiSettings4Line,
  RiCheckLine
} from 'react-icons/ri'
import { Typewriter } from '../components/Typewriter'
import Sphere from '../components/Sphere'
import { MessageLog } from '../components/MessageLog'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface AskIrisProps {
  onAskIris?: (text: string) => void
  isSystemActive: boolean
  chatHistory?: any[]
  onClearHistory?: () => void
}

const VoiceWaveform: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex items-center justify-between py-2.5 px-4 bg-red-500/10 border border-red-500/20 rounded-xl my-3 overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 font-mono">
          LISTENING LIVE
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-5 pr-1">
        {[8, 16, 24, 14, 20, 10, 18, 12, 16, 8].map((maxH, i) => (
          <motion.div
            key={i}
            className={`w-[3px] rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-red-400'}`}
            animate={{
              height: [4, maxH, 4]
            }}
            transition={{
              duration: 0.5 + (i * 0.08) % 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const IrisSpeakingIndicator: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex items-center justify-between py-2.5 px-4 bg-[#00ffb3]/10 border border-[#00ffb3]/20 rounded-xl my-3 overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00ffb3] animate-ping" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#00ffb3] font-mono">
          IRIS IS SPEAKING_
        </span>
      </div>
      <div className="flex items-end gap-[3.5px] h-5 pr-1">
        {[18, 8, 24, 12, 28, 16, 22, 10, 18, 8].map((maxH, i) => (
          <motion.div
            key={i}
            className={`w-[3px] rounded-full ${i % 2 === 0 ? 'bg-[#00ffb3]' : 'bg-[#00ff9d]'}`}
            animate={{
              height: [4, maxH, 4]
            }}
            transition={{
              duration: 0.4 + (i * 0.07) % 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export const AskIrisView: React.FC<AskIrisProps> = ({ onAskIris, isSystemActive, chatHistory = [], onClearHistory }) => {
  const [questionText, setQuestionText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isListeningSpeech, setIsListeningSpeech] = useState(false)
  const [isPttActive, setIsPttActive] = useState(false)
  const [isIrisSpeaking, setIsIrisSpeaking] = useState(false)

  useEffect(() => {
    let serviceInstance: any = null;
    import('../services/Iris-voice-ai').then(({ irisService }) => {
      serviceInstance = irisService;
      setIsIrisSpeaking(irisService.isSpeaking);
      irisService.onSpeakingChange = (speaking: boolean) => {
        setIsIrisSpeaking(speaking);
      };
    }).catch(err => {
      console.error("Failed to dynamically load irisService in AskIrisView", err);
    });

    return () => {
      if (serviceInstance) {
        serviceInstance.onSpeakingChange = undefined;
      }
    };
  }, []);
  
  // Settings toggle & interaction mode preferences
  const [showSettings, setShowSettings] = useState(false)
  const [interactionMode, setInteractionMode] = useState<'continuous' | 'ptt'>('continuous')
  const interactionModeRef = useRef(interactionMode)

  useEffect(() => {
    interactionModeRef.current = interactionMode
  }, [interactionMode])
  
  // Hands free states and refs
  const [isHandsFree, setIsHandsFree] = useState(false)
  const isHandsFreeRef = useRef(false)
  const handsFreeRecRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<any>(null)
  const speechTranscriptRef = useRef<string>('')

  // Past query logs
  const [showHistoryLogs, setShowHistoryLogs] = useState(false)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [supportError, setSupportError] = useState<string | null>(null)

  const isPttActiveRef = useRef(false)
  const isSendingRef = useRef(false)
  const isListeningSpeechRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const pttRecognitionRef = useRef<any>(null)
  const pttTranscriptRef = useRef<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    isListeningSpeechRef.current = isListeningSpeech;
  }, [isListeningSpeech]);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  const loadPastSessions = () => {
    const saved = localStorage.getItem('iris_chat_sessions')
    if (saved) {
      try {
        setPastSessions(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    loadPastSessions()
  }, [chatHistory])

  const startHandsFreeRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupportError("Speech recognition is not supported in this browser.")
      return
    }

    if (handsFreeRecRef.current) {
      try {
        handsFreeRecRef.current.abort()
      } catch (err) {}
    }

    let rec: any
    try {
      rec = new SpeechRecognition()
    } catch (err) {
      console.error(err)
      setSupportError("Failed to initialize speech recognition in this context.")
      return
    }
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onstart = () => {
      console.log("Hands-free recognition active")
    }

    rec.onresult = (event: any) => {
      if (isSendingRef.current) return;
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) return;

      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const merged = (finalTranscript || interimTranscript).trim()
      if (merged) {
        setQuestionText(merged)
        speechTranscriptRef.current = merged

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = setTimeout(async () => {
          if (!isSendingRef.current && speechTranscriptRef.current.trim()) {
            await handleSendDirectly(speechTranscriptRef.current.trim())
          }
        }, 1300)
      }
    }

    rec.onerror = (event: any) => {
      console.error("Hands-free Web Speech error:", event.error)
    }

    rec.onend = () => {
      if (isHandsFreeRef.current && !isSendingRef.current) {
        setTimeout(() => {
          if (isHandsFreeRef.current && !isSendingRef.current) {
            try {
              rec.start()
            } catch (err) {}
          }
        }, 400)
      }
    }

    handsFreeRecRef.current = rec
    try {
      rec.start()
    } catch (e) {
      console.error(e)
    }
  }

  const stopHandsFreeRecognition = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
    if (handsFreeRecRef.current) {
      try {
        handsFreeRecRef.current.abort()
      } catch (e) {}
      handsFreeRecRef.current = null
    }
  }

  const toggleHandsFree = () => {
    playAction()
    const newVal = !isHandsFree
    setIsHandsFree(newVal)
    if (newVal) {
      if (isListeningSpeech) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort() } catch (err) {}
        }
        setIsListeningSpeech(false)
      }
      setTimeout(() => {
        startHandsFreeRecognition()
      }, 100)
    } else {
      stopHandsFreeRecognition()
    }
  }

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (interactionModeRef.current === 'ptt' && e.key === ' ' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        startPttCore();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (interactionModeRef.current === 'ptt' && e.key === ' ' && isPttActiveRef.current) {
        e.preventDefault();
        stopPttCore();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (pttRecognitionRef.current) {
        pttRecognitionRef.current.abort();
      }
      if (handsFreeRecRef.current) {
        handsFreeRecRef.current.abort();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    }
  }, []);

  const startPttCore = () => {
    if (isSendingRef.current) return;
    if (isPttActiveRef.current) return;

    isPttActiveRef.current = true;
    setIsPttActive(true);

    // Stop toggle-based recognition if active
    if (isListeningSpeechRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.warn(err);
      }
      setIsListeningSpeech(false);
    }

    // Play high pitch sci-fi entry sweep
    playTone(720, 'sine', 0.06, 0.03);
    setTimeout(() => playTone(960, 'sine', 0.12, 0.03), 35);

    pttTranscriptRef.current = '';

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportError("Speech recognition is not supported in this browser.");
      setIsPttActive(false);
      isPttActiveRef.current = false;
      return;
    }

    let rec: any;
    try {
      rec = new SpeechRecognition();
    } catch (err) {
      console.error(err);
      setSupportError("Failed to initialize speech recognition in this context.");
      setIsPttActive(false);
      isPttActiveRef.current = false;
      return;
    }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

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
      const aggregated = finalTranscript || interimTranscript;
      if (aggregated && aggregated.trim()) {
        pttTranscriptRef.current = aggregated;
        setQuestionText(aggregated);
      }
    };

    rec.onerror = (event: any) => {
      console.error("PTT speech error:", event.error);
    };

    rec.onend = () => {
      // Completed session
    };

    pttRecognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopPttCore = () => {
    if (!isPttActiveRef.current) return;
    isPttActiveRef.current = false;
    setIsPttActive(false);

    // Play sci-fi release sweep
    playTone(960, 'sine', 0.06, 0.02);
    setTimeout(() => playTone(580, 'sine', 0.12, 0.02), 40);

    if (pttRecognitionRef.current) {
      try {
        pttRecognitionRef.current.stop();
      } catch (err) {
        console.warn("PTT stop issue:", err);
      }
      pttRecognitionRef.current = null;
    }

    // Short buffer window to allow SpeechRecognition callbacks to finalize transcription
    setTimeout(() => {
      const textToSubmit = pttTranscriptRef.current.trim();
      if (textToSubmit) {
        setQuestionText(textToSubmit);
        handleSendDirectly(textToSubmit);
      }
    }, 280);
  };

  const startPtt = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    startPttCore();
  };

  const stopPtt = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    stopPttCore();
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupportError("Speech recognition is not supported in this browser.")
      return
    }

    if (isListeningSpeech) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListeningSpeech(false)
    } else {
      playAction()
      
      // Capture the current questionText before speech recognition starts
      let baseText = ''
      setQuestionText(prev => {
        baseText = prev;
        return prev;
      });

      let recognition: any
      try {
        recognition = new SpeechRecognition()
      } catch (err) {
        console.error(err)
        setSupportError("Failed to initialize speech recognition in this context.")
        return
      }
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListeningSpeech(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        
        const currentSpeech = finalTranscript || interimTranscript;
        if (currentSpeech) {
          const prefix = baseText.trim() ? `${baseText.trim()} ` : '';
          setQuestionText(prefix + currentSpeech.trim());
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListeningSpeech(false)
      }

      recognition.onend = () => {
        setIsListeningSpeech(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    }
  }



  const handleSendDirectly = async (text: string) => {
    if (!text.trim()) return
    setIsSending(true)
    playClick()

    if (isHandsFreeRef.current) {
      stopHandsFreeRecognition()
    }

    if (onAskIris) {
      await onAskIris(text)
    } else {
      // Dynamic import to use the voice service
      const { irisService } = await import('../services/Iris-voice-ai')
      irisService.sendText(text)
    }

    setQuestionText('')
    setIsSending(false)

    // Wait for text-to-speech rendering to finish so IRIS doesn't hear itself
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(check);
            resolve();
          }
        }, 300);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 15000);
      });
    }

    if (isHandsFreeRef.current) {
      setTimeout(() => {
        if (isHandsFreeRef.current) {
          startHandsFreeRecognition();
        }
      }, 500);
    }
  }

  const handleSend = async () => {
    await handleSendDirectly(questionText)
  }

  const isListeningAny = isListeningSpeech || isPttActive || isHandsFree || isSystemActive;
  const isCurrentlyProcessing = isSending;

  const currentState: 'Listening' | 'Processing' | 'Idle' = isCurrentlyProcessing 
    ? 'Processing' 
    : isListeningAny 
      ? 'Listening' 
      : 'Idle';

  return (
    <div className="w-full h-full min-h-[70vh] flex items-center justify-center p-4 bg-black select-none pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`ask-iris-card relative overflow-hidden ${
          currentState === 'Processing' ? 'processing' :
          currentState === 'Listening' ? 'listening' :
          ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ASK IRIS
            </h1>
            <button
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                playClick();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                showSettings 
                  ? 'bg-[#00ffb3]/10 border-[#00ffb3]/30 text-[#00ffb3] shadow-[0_0_10px_rgba(0,255,179,0.15)]' 
                  : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:text-white hover:border-white/10 hover:bg-zinc-900/40'
              }`}
              title="Voice settings menu"
            >
              <RiSettings4Line size={18} className={showSettings ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentState === 'Listening' ? 'bg-[#00ffb3]' :
                currentState === 'Processing' ? 'bg-purple-400' :
                'bg-zinc-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                currentState === 'Listening' ? 'bg-[#00ffb3] shadow-[0_0_10px_rgba(0,255,179,0.8)]' :
                currentState === 'Processing' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' :
                'bg-zinc-500'
              }`}></span>
            </span>
            <span className={`text-xs font-mono font-medium tracking-wider uppercase ${
              currentState === 'Listening' ? 'text-[#00ffb3]' :
              currentState === 'Processing' ? 'text-purple-400' :
              'text-zinc-400'
            }`}>
              {currentState}
            </span>
          </div>
        </div>

        {/* Animated Settings Toggle Menu */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-4 overflow-hidden border border-white/10 bg-zinc-950/90 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#00ffb3] uppercase">
                  VOICE INTERACTION MODE_
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  CURRENT: {interactionMode.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setInteractionMode('continuous');
                    playClick();
                    if (isPttActive) stopPttCore();
                  }}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    interactionMode === 'continuous'
                      ? 'bg-[#00ffb3]/5 border-[#00ffb3]/30 text-white shadow-[0_0_10px_rgba(0,255,179,0.05)]'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${interactionMode === 'continuous' ? 'bg-[#00ffb3]' : 'bg-zinc-600'}`} />
                    <span className="text-xs font-bold tracking-wide font-mono">CONTINUOUS</span>
                    {interactionMode === 'continuous' && <RiCheckLine className="ml-auto text-[#00ffb3]" size={14} />}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">
                    Continuous voice interaction. Processes when you stop speaking.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInteractionMode('ptt');
                    playClick();
                    if (isHandsFree) {
                      setIsHandsFree(false);
                      isHandsFreeRef.current = false;
                      if (handsFreeRecRef.current) {
                        handsFreeRecRef.current.abort();
                        handsFreeRecRef.current = null;
                      }
                      if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current);
                      }
                    }
                  }}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    interactionMode === 'ptt'
                      ? 'bg-[#00ffb3]/5 border-[#00ffb3]/30 text-white shadow-[0_0_10px_rgba(0,255,179,0.05)]'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${interactionMode === 'ptt' ? 'bg-[#00ffb3]' : 'bg-zinc-600'}`} />
                    <span className="text-xs font-bold tracking-wide font-mono">PUSH-TO-TALK</span>
                    {interactionMode === 'ptt' && <RiCheckLine className="ml-auto text-[#00ffb3]" size={14} />}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">
                    Manual triggers. Hold spacebar or the ACTUATOR button below to record.
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {supportError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2"
          >
            <span>⚠️ {supportError}</span>
            <button
              onClick={() => setSupportError(null)}
              className="text-[10px] hover:text-white uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              [Dismiss]
            </button>
          </motion.div>
        )}

        {/* Toggleable Past Conversations Panel */}
        <div className="border-b border-white/5 pb-3">
          <button
            onClick={() => setShowHistoryLogs(!showHistoryLogs)}
            className="w-full flex items-center justify-between text-zinc-400 hover:text-[#00ffb3] text-xs font-mono font-medium tracking-wider transition-colors py-1 px-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <RiHistoryLine className="text-[#00ffb3]/85" size={14} />
              PREVIOUS INTERACTION LOGS ({pastSessions.length})
            </span>
            <span>{showHistoryLogs ? '▲ CLOSE' : '▼ VIEW'}</span>
          </button>
          
          <AnimatePresence>
            {showHistoryLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 max-h-[170px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent flex flex-col gap-2.5 bg-black/50 border border-white/5 rounded-xl p-3"
              >
                {pastSessions.length === 0 ? (
                  <p className="text-zinc-600 text-xs font-mono text-center py-4">No archived chats on local storage.</p>
                ) : (
                  pastSessions.map((s, idx) => (
                    <div key={s.id || idx} className="border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1.5">
                        <span>{new Date(s.timestamp).toLocaleString()}</span>
                        <span className="text-[#00ffb3] bg-white/5 px-1.5 py-0.5 rounded">{s.messages?.length || 0} MESSAGES</span>
                      </div>
                      <div className="flex flex-col gap-1 pl-1 border-l border-white/5">
                        {s.messages?.filter((m: any) => m.role === 'user').slice(0, 3).map((m: any, mIdx: number) => (
                          <button
                            key={mIdx}
                            onClick={() => {
                              setQuestionText(m.content);
                              playClick();
                            }}
                            className="text-left text-[11px] font-mono text-zinc-400 hover:text-white truncate transition-colors cursor-pointer"
                            title="Click to insert query into input field"
                          >
                            &gt; {m.content}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Sphere Visualization in the Center */}
        <div className="w-full flex justify-center items-center my-4 h-[180px] relative overflow-hidden bg-radial from-emerald-500/5 to-transparent rounded-2xl border border-white/5 shadow-inner">
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3.5">
             <span className="text-[9px] font-mono tracking-widest text-[#00ffb3]/40 uppercase">IRIS SYNCHRONICITY</span>
             <span className="text-[9px] font-mono tracking-widest text-[#00ffb3]/40 uppercase text-right">MODEL CLASSIFIER_</span>
          </div>
          <div className="w-[280px] h-[280px] flex items-center justify-center scale-90">
             <Sphere />
          </div>
        </div>

        <p className="text-zinc-400 text-xs text-center border-b border-white/5 pb-3">
          Speak or type your question. IRIS responds live.
        </p>

        {/* Dynamic scrollable message/interaction bubbles stack */}
        <MessageLog 
          chatHistory={chatHistory} 
          isGenerating={isSending} 
          onClearHistory={onClearHistory} 
          onReaskQuestion={(text) => setQuestionText(text)} 
          maxHeight="320px"
        />

        <AnimatePresence>
           {(isListeningSpeech || isPttActive || isHandsFree) && (
             <VoiceWaveform />
           )}
         </AnimatePresence>

        {/* VOICE COMMAND & HANDS-FREE ENGINE HUB */}
        <AnimatePresence>
          {isIrisSpeaking && (
            <IrisSpeakingIndicator active={isIrisSpeaking} />
          )}
        </AnimatePresence>

        {interactionMode === 'continuous' && (
          <div className="mt-4 p-4 rounded-xl border border-white/5 bg-zinc-950/40 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-[#00ffb3] uppercase flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHandsFree ? 'bg-red-500' : 'bg-zinc-500'}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isHandsFree ? 'bg-red-500' : 'bg-zinc-500'}`} />
                </span>
                VOICE CONTROL MODULE_
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">WEB SPEECH API</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white tracking-wide">Continuous Voice Interaction</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Once active, IRIS listens hands-free. Simply say your command, pause, and IRIS will automatically process and respond.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleHandsFree}
                className={`relative overflow-hidden group py-3 px-5 rounded-xl font-mono text-xs font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 border select-none cursor-pointer ${
                  isHandsFree
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500/20'
                    : 'bg-[#00ffb3]/10 hover:bg-[#00ffb3]/20 border-[#00ffb3]/30 text-[#00ffb3] shadow-[0_0_15px_rgba(0,255,179,0.1)]'
                }`}
              >
                {isHandsFree ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>STOP LISTENING</span>
                  </>
                ) : (
                  <>
                    <RiMicLine className="animate-pulse text-[#00ffb3]" size={14} />
                    <span>LISTEN [HANDS-FREE]</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 mt-4 items-stretch">
          <div className="relative flex-1">
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend()
                }
              }}
              placeholder={isListeningSpeech || isPttActive || isHandsFree ? "Listening live... Speak your query" : "Ask anything..."}
              className={`w-full bg-black text-white px-4 h-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00ffb3]/50 border transition-all ${
                isListeningSpeech || isPttActive || isHandsFree
                  ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.35)]' 
                  : 'border-[#00ffb3]/40'
              }`}
              disabled={isSending}
            />
          </div>
          
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            disabled={isSending || isPttActive || isHandsFree}
            className={`px-4 rounded-xl font-mono text-[11px] font-bold uppercase border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[100px] sm:min-w-[110px] ${
              isListeningSpeech 
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-[#00ffb3] hover:border-[#00ffb3]/30 disabled:opacity-35 disabled:cursor-not-allowed'
            }`}
            title={isListeningSpeech ? "Stop voice listening" : "Start one-time voice listening"}
          >
            {isListeningSpeech ? (
              <>
                <RiMicLine size={15} className="text-red-500 scale-110" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <RiMicOffLine size={15} />
                <span>LISTEN</span>
              </>
            )}
          </button>
        </div>

        {/* HIGH-FIDELITY PUSH-TO-TALK ACTUATOR PANEL */}
        {interactionMode === 'ptt' && (
          <div className="mt-3.5 relative overflow-hidden rounded-xl">
            <button
              id="ptt-actuator"
              type="button"
              onMouseDown={startPtt}
              onMouseUp={stopPtt}
              onMouseLeave={stopPtt}
              onTouchStart={startPtt}
              onTouchEnd={stopPtt}
              disabled={isSending || isHandsFree}
              className={`w-full h-14 rounded-xl font-mono text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 px-4 border select-none cursor-pointer active:scale-[0.985] ${
                isPttActive
                  ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : 'bg-zinc-950/80 hover:bg-zinc-900 border-white/5 hover:border-[#00ffb3]/40 text-zinc-400 hover:text-[#00ffb3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]'
              }`}
              title="Press and hold down to record voice input. Release button to stop and automatically send query."
            >
              <div className="relative flex items-center justify-center">
                {isPttActive && (
                  <span className="absolute w-4 h-4 rounded-full bg-red-500/30 animate-ping" />
                )}
                <RiMicLine 
                  size={16} 
                  className={`transition-all ${
                    isPttActive ? 'text-red-500 scale-110' : 'text-zinc-500 group-hover:text-[#00ffb3]'
                  }`} 
                  aria-hidden="true"
                />
              </div>
               <span>
                {isPttActive ? 'RELEASE TO TRANSMIT_ | LIVE_REC' : 'HOLD TO TALK [PTT] / HOLD [SPACE]'}
              </span>
            </button>
            
            {/* Decorative indicator lines */}
            {isPttActive && (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 inset-x-0 h-[2px] bg-red-500"
              />
            )}
          </div>
        )}

        <button 
          onClick={handleSend}
          disabled={isSending || !questionText.trim()}
          className="btn-iris-submit w-full mt-4 bg-[#00ffb3] text-black font-bold h-12 rounded-xl transition-all hover:bg-[#00d696] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSending ? 'SENDING...' : 'Send'}
        </button>

        {/* System Active Status Overlay Badge inside Card */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSystemActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            {isSystemActive ? "IRIS VOICE IS ONLINE" : "IRIS VOICE STANDBY"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default AskIrisView;
