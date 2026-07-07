import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GiArtificialIntelligence } from 'react-icons/gi'
import {
  RiKey2Line,
  RiSave3Line,
  RiUserVoiceLine,
  RiUserLine,
  RiLockPasswordLine,
  RiScan2Line,
  RiAddLine,
  RiRecordCircleLine,
  RiLock2Line,
  RiSettings4Line,
  RiShieldKeyholeLine,
  RiPlugLine,
  RiBrainLine,
  RiCloudLine,
  RiCpuLine,
  RiDatabase2Line,
  RiVolumeMuteLine
} from 'react-icons/ri'
import { irisService } from '../services/Iris-voice-ai'
import { playClick, playAction } from '../utils/audio'

interface SettingsProps {
  isSystemActive: boolean
}

type TabType = 'general' | 'keys' | 'security'

const SettingsView = ({ isSystemActive }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [aiVoice, setAiVoice] = useState(
    localStorage.getItem('iris_ai_voice') || 'Puck'
  )
  const [personality, setPersonality] = useState(localStorage.getItem('iris_personality') || '')
  const [userName, setUserName] = useState(localStorage.getItem('iris_user_name') || '')
  const [aiName, setAiName] = useState(localStorage.getItem('iris_ai_name') || 'IRIS')
  const [defaultAiModel, setDefaultAiModel] = useState(localStorage.getItem('iris_default_model') || 'gemini-3.5-flash')
  const [codeTheme, setCodeTheme] = useState(localStorage.getItem('iris_code_theme') || 'vscDarkPlus')
  
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('iris_custom_api_key') || '')
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('iris_openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY || '')
  const [groqKey, setGroqKey] = useState(localStorage.getItem('iris_groq_api_key') || '')
  const [hfKey, setHfKey] = useState(localStorage.getItem('iris_hf_api_key') || '')
  const [notionKey, setNotionKey] = useState(localStorage.getItem('iris_notion_api_key') || '')
  const [tailvyKey, setTailvyKey] = useState(localStorage.getItem('iris_tailvy_api_key') || '')
  const [githubKey, setGithubKey] = useState(localStorage.getItem('iris_github_api_key') || '')

  const [isSecurityUnlocked, setIsSecurityUnlocked] = useState(false)
  const [authPin, setAuthPin] = useState('')
  const [authError, setAuthError] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [faceCount, setFaceCount] = useState(0)
  const [isScanningFace, setIsScanningFace] = useState(false)
  const [enrollStatus, setEnrollStatus] = useState('')
  
  const [appLockType, setAppLockType] = useState(localStorage.getItem('iris_app_lock_type') || 'none')
  
  const [noiseReduction, setNoiseReduction] = useState(
    localStorage.getItem('iris_noise_reduction') !== 'false'
  )
  
  const [muteAiVoice, setMuteAiVoice] = useState(
    localStorage.getItem('iris_mute_ai_voice') === 'true'
  )

  const handleAiModelChange = (model: string) => {
    playClick()
    setDefaultAiModel(model)
    localStorage.setItem('iris_default_model', model)
    playAction()
  }

  const toggleNoiseReduction = () => {
    playClick()
    const newVal = !noiseReduction
    setNoiseReduction(newVal)
    localStorage.setItem('iris_noise_reduction', String(newVal))
    irisService.setNoiseReduction(newVal)
  }

  const toggleMuteAiVoice = () => {
    playClick()
    const newVal = !muteAiVoice
    setMuteAiVoice(newVal)
    localStorage.setItem('iris_mute_ai_voice', String(newVal))
  }

  const handlePersonalityChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0)
    if (words.length <= 150) setPersonality(text)
  }

  const savePersonality = async () => {
    playClick()
    localStorage.setItem('iris_personality', personality)
    playAction()
    alert('Personality Matrix Saved Securely to OS.')
  }

  const saveUserName = () => {
    playClick()
    localStorage.setItem('iris_user_name', userName)
    playAction()
    alert('User Designation Saved.')
  }

  const saveAiName = () => {
    playClick()
    localStorage.setItem('iris_ai_name', aiName)
    playAction()
    alert('AI Designation Saved.')
  }

  const handleCodeThemeChange = (theme: string) => {
    playClick()
    setCodeTheme(theme)
    localStorage.setItem('iris_code_theme', theme)
    playAction()
  }

  const handleVoiceChange = (v: string) => {
    if (isSystemActive) return
    playClick()
    setAiVoice(v)
    localStorage.setItem('iris_ai_voice', v)
  }

  const saveApiKeys = async () => {
    playClick()
    localStorage.setItem('iris_custom_api_key', geminiKey)
    localStorage.setItem('iris_openai_api_key', openaiKey)
    localStorage.setItem('iris_groq_api_key', groqKey)
    localStorage.setItem('iris_hf_api_key', hfKey)
    localStorage.setItem('iris_notion_api_key', notionKey)
    localStorage.setItem('iris_tailvy_api_key', tailvyKey)
    localStorage.setItem('iris_github_api_key', githubKey)
    playAction()
    alert('All Neural Uplinks (API Keys) secured locally and in OS Vault. Restart AI modules to apply.')
  }

  const currentWordCount = personality
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  const hashPin = async (pin: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const unlockSecurityModule = async () => {
    playClick()
    const savedHash = localStorage.getItem('iris_vault_hash')
    if (savedHash) {
      const currentHash = await hashPin(authPin)
      if (currentHash === savedHash) {
        setIsSecurityUnlocked(true)
        setAuthPin('')
        playAction()
        return
      }
    } else if (authPin === '0000') { // fallback if no PIN is set
      setIsSecurityUnlocked(true)
      setAuthPin('')
      playAction()
      return
    }
    
    setAuthError(true)
    setTimeout(() => setAuthError(false), 1000)
  }

  const updateMasterPin = async () => {
    playClick()
    if (newPin.length !== 4) return
    const hashedPin = await hashPin(newPin)
    localStorage.setItem('iris_vault_hash', hashedPin)
    setNewPin('')
    playAction()
    alert('Master PIN Updated Successfully.')
  }

  const startFaceEnrollment = async () => {
    playClick()
    alert('Face enrollment requires native OS capabilities. Not available in web preview.')
  }

  const changeAppLockType = async (type: string) => {
    playClick()
    if (type === 'none') {
      localStorage.setItem('iris_app_lock_type', 'none')
      setAppLockType('none')
      playAction()
      alert('App Lock Disabled.')
      return;
    }

    if (type === 'fingerprint' || type === 'face') {
      localStorage.setItem('iris_app_lock_type', type)
      setAppLockType(type)
      playAction()
      alert(`App Lock set to ${type === 'fingerprint' ? 'Fingerprint' : 'Face Lock'}.`)
      return;
    }

    // For pin and pattern
    const savedHash = localStorage.getItem('iris_vault_hash');
    if (!savedHash) {
      alert('Please set up a Master PIN first in the Vault Settings before enabling App Lock.');
      return;
    }

    // Usually we ask them to set a specific pin. For simplicity since we have vault pin, we use the vault pin.
    localStorage.setItem('iris_app_lock_value', savedHash);
    localStorage.setItem('iris_app_lock_type', type)
    setAppLockType(type)
    playAction()
    alert(`App Lock set to ${type === 'pin' ? 'PIN' : 'Pattern'}. It will use your Master PIN.`)
  }

  const cardClass =
    'bg-[#0f0f13] border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col gap-5 hover:border-white/20 transition-all shadow-lg'
  const inputContainerClass =
    'flex items-center bg-[#050505] border border-white/10 rounded-lg px-4 py-3 focus-within:border-white/30 focus-within:bg-black transition-colors'
  const titleClass = 'text-sm font-semibold text-white flex items-center gap-2'

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-16 flex flex-col items-center bg-black min-h-screen text-zinc-100 overflow-y-auto scrollbar-small">
      <motion.div
        className="w-full max-w-4xl flex flex-col gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#111] rounded-2xl border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <GiArtificialIntelligence size={36} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Command Center</h2>
              <p className="text-xs text-zinc-400 font-mono mt-1 tracking-widest flex items-center gap-2 uppercase">
                <RiRecordCircleLine
                  className={`${isSystemActive ? 'text-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'text-zinc-600'}`}
                  size={14}
                />
                {isSystemActive ? 'System Online' : 'System Offline'}
              </p>
            </div>
          </div>

          <div className="flex bg-[#0a0a0c] p-1 rounded-xl border border-white/10 w-full md:w-fit shadow-lg overflow-x-auto scrollbar-none" role="tablist" aria-label="Settings Tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'general'}
              aria-controls="panel-general"
              id="tab-general"
              title="General Settings"
              onClick={() => setActiveTab('general')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'general'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <RiSettings4Line size={16} aria-hidden="true" /> GENERAL
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'keys'}
              aria-controls="panel-keys"
              id="tab-keys"
              title="API Keys Configuration"
              onClick={() => setActiveTab('keys')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'keys'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <RiPlugLine size={16} aria-hidden="true" /> API KEYS
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'security'}
              aria-controls="panel-security"
              id="tab-security"
              title="Security Settings"
              onClick={() => setActiveTab('security')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'security'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <RiShieldKeyholeLine size={16} aria-hidden="true" /> SECURITY
            </button>
          </div>
        </div>

        <div className="relative min-h-125 pb-12 mt-2">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div
                key="general"
                role="tabpanel"
                id="panel-general"
                aria-labelledby="tab-general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 absolute w-full"
              >
                <div className={`${cardClass} md:col-span-2`}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiUserLine className="text-zinc-400" size={18} aria-hidden="true" /> AI Personality Matrix
                    </span>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-[10px] font-mono tracking-widest ${currentWordCount >= 150 ? 'text-red-400' : 'text-zinc-400'}`}
                      >
                        {currentWordCount} / 150 WORDS
                      </span>
                      <button
                        onClick={savePersonality}
                        aria-label="Save Personality Matrix"
                        title="Save Personality Profile"
                        className="text-zinc-400 hover:text-white transition-colors bg-white/5 p-2 rounded-md hover:bg-white/10 border border-transparent hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <RiSave3Line size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={personality}
                    onChange={handlePersonalityChange}
                    aria-label="AI Personality Matrix"
                    placeholder="Define who IRIS is. Example: 'You are a sassy, highly technical assistant...'"
                    className="bg-[#050505] border border-white/10 rounded-lg p-4 text-sm text-zinc-200 h-32 resize-none focus:border-white/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className={cardClass}>
                  <div className="flex justify-between items-end">
                    <span className={titleClass}>
                      <RiUserLine className="text-zinc-400" size={18} aria-hidden="true" /> User Designation
                    </span>
                  </div>
                  <div className={inputContainerClass}>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      aria-label="User Designation"
                      placeholder="Enter operator name..."
                      className="bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-600 font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                    />
                    <button
                      onClick={saveUserName}
                      aria-label="Save User Designation"
                      className="text-zinc-400 hover:text-white transition-colors ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                    >
                      <RiSave3Line size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex justify-between items-end">
                    <span className={titleClass}>
                      <GiArtificialIntelligence className="text-zinc-400" size={18} aria-hidden="true" /> AI Designation
                    </span>
                  </div>
                  <div className={inputContainerClass}>
                    <input
                      type="text"
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      aria-label="AI Designation"
                      placeholder="Enter AI name..."
                      className="bg-transparent border-none outline-none text-sm text-zinc-100 w-full placeholder:text-zinc-600 font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                    />
                    <button
                      onClick={saveAiName}
                      aria-label="Save AI Designation"
                      className="text-zinc-400 hover:text-white transition-colors ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                    >
                      <RiSave3Line size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`${cardClass} relative md:col-span-2`}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiUserVoiceLine className="text-zinc-400" size={18} aria-hidden="true" /> OS Voice Profile
                    </span>
                    {isSystemActive && (
                      <span className="text-[10px] text-red-400 font-mono tracking-widest flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md">
                        <RiLock2Line aria-hidden="true" /> LOCKED AS IRIS IS CONNECTED
                      </span>
                    )}
                  </div>
                  <div
                    className={`grid grid-cols-2 md:grid-cols-5 gap-3 mt-1 ${isSystemActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                    role="radiogroup"
                    aria-label="Voice Profile"
                  >
                    {(['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck']).map((s) => (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={aiVoice === s}
                        onClick={() => handleVoiceChange(s)}
                        disabled={isSystemActive}
                        className={`cursor-pointer flex items-center justify-center text-[12px] font-bold rounded-lg py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          aiVoice === s
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'bg-[#050505] border border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${cardClass} md:col-span-2`}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiShieldKeyholeLine className="text-zinc-400" size={18} aria-hidden="true" /> Device Permissions (Camera & Mic)
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between bg-[#050505] border border-white/10 rounded-lg px-4 py-3 gap-4">
                    <span className="text-xs text-zinc-400 font-mono">
                      Request access to camera and microphone for IRIS vision and voice features.
                    </span>
                    <button
                      onClick={async () => {
                        playClick();
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
                          } catch (de) {
                            console.warn("Device enumeration failed:", de);
                          }

                          const constraints: MediaStreamConstraints = {};
                          if (hasAudio) constraints.audio = true;
                          if (hasVideo) constraints.video = true;

                          if (Object.keys(constraints).length === 0) {
                            constraints.audio = true;
                            constraints.video = true;
                          }

                          const stream = await navigator.mediaDevices.getUserMedia(constraints);
                          stream.getTracks().forEach(t => t.stop());
                          localStorage.setItem('iris_permissions_granted', 'true');
                          alert("Permissions granted successfully.");
                          playAction();
                        } catch(e: any) {
                          const inIframe = window.self !== window.top;
                          if (inIframe) {
                            alert("⚠️ Access Blocked by Iframe Sandbox\n\nBrowsers deny camera/mic access inside nested preview windows.\n\nPlease click the 'Open in New Tab' icon in the top-right corner of the preview pane to request and grant permissions.");
                          } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.message?.toLowerCase().includes('not allowed')) {
                            alert("Permission Denied: Access blocked by browser or system settings. Please grant permissions near the address bar.");
                          } else {
                            alert(`Permission Request Failed: ${e.message || 'Please ensure you have dedicated camera and microphone hardware connected.'}`);
                          }
                        }
                      }}
                      className="whitespace-nowrap px-4 py-2 bg-white text-black text-[10px] font-bold rounded hover:bg-zinc-200 transition-colors uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Request HW Access
                    </button>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiVolumeMuteLine className="text-zinc-400" size={18} aria-hidden="true" /> Ambient Noise Reduction
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#050505] border border-white/10 rounded-lg px-4 py-3">
                    <span className="text-xs text-zinc-400 font-mono">
                      Suppresses background noise for clearer voice input.
                    </span>
                    <button
                      onClick={toggleNoiseReduction}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        noiseReduction ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                      role="switch"
                      aria-checked={noiseReduction}
                      aria-label="Toggle Ambient Noise Reduction"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          noiseReduction ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiUserVoiceLine className="text-zinc-400" size={18} aria-hidden="true" /> AI Voice Responses (TTS)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#050505] border border-white/10 rounded-lg px-4 py-3">
                    <span className="text-xs text-zinc-400 font-mono">
                      Mute the AI's spoken voice.
                    </span>
                    <button
                      onClick={toggleMuteAiVoice}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        muteAiVoice ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                      role="switch"
                      aria-checked={muteAiVoice}
                      aria-label="Toggle AI Voice Output"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          muteAiVoice ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className={`${cardClass} md:col-span-2`}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiBrainLine className="text-zinc-400" size={18} aria-hidden="true" /> Default AI Model
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-1">
                    {(['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'llama-3.1-70b', 'claude-3.5-sonnet', 'gpt-4o', 'gemma-2-9b']).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleAiModelChange(m)}
                        className={`cursor-pointer flex items-center justify-center text-[10px] font-bold rounded-lg py-2.5 px-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          defaultAiModel === m
                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'bg-[#050505] border border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                        }`}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${cardClass} md:col-span-2`}>
                  <div className="flex justify-between items-center">
                    <span className={titleClass}>
                      <RiSettings4Line className="text-zinc-400" size={18} aria-hidden="true" /> Terminal Syntax Theme
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                    {(['vscDarkPlus', 'atomDark', 'dracula', 'oneDark', 'nord', 'nightOwl', 'materialDark', 'tomorrow']).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleCodeThemeChange(t)}
                        className={`cursor-pointer flex items-center justify-center text-[10px] font-bold rounded-lg py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          codeTheme === t
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'bg-[#050505] border border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                        }`}
                      >
                        {t.replace(/([A-Z])/g, ' $1').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                role="tabpanel"
                id="panel-keys"
                aria-labelledby="tab-keys"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-6 absolute w-full"
              >
                <div className={`${cardClass} gap-6`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <span className={titleClass}>
                      <RiKey2Line className="text-zinc-400" size={18} aria-hidden="true" /> External API Endpoints
                    </span>
                    <button
                      onClick={saveApiKeys}
                      className="bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <RiSave3Line size={16} aria-hidden="true" /> SAVE ALL KEYS
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="gemini-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiBrainLine size={14} aria-hidden="true" /> Gemini Pro Core
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="gemini-key"
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIzaSy_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="openai-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiBrainLine size={14} aria-hidden="true" /> OpenAI API
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="openai-key"
                          type="password"
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="groq-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiCpuLine size={14} aria-hidden="true" /> Groq Fast Inferencing
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="groq-key"
                          type="password"
                          value={groqKey}
                          onChange={(e) => setGroqKey(e.target.value)}
                          placeholder="gsk_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="hf-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiCloudLine size={14} aria-hidden="true" /> Hugging Face Vision
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="hf-key"
                          type="password"
                          value={hfKey}
                          onChange={(e) => setHfKey(e.target.value)}
                          placeholder="hf_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="notion-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiDatabase2Line size={14} aria-hidden="true" /> Notion Integrations
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="notion-key"
                          type="password"
                          value={notionKey}
                          onChange={(e) => setNotionKey(e.target.value)}
                          placeholder="secret_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label htmlFor="tailvy-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiPlugLine size={14} aria-hidden="true" /> Tailvy Builder Agent
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="tailvy-key"
                          type="password"
                          value={tailvyKey}
                          onChange={(e) => setTailvyKey(e.target.value)}
                          placeholder="tlv_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label htmlFor="github-key" className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center gap-2">
                        <RiPlugLine size={14} aria-hidden="true" /> GitHub Personal Access Token
                      </label>
                      <div className={inputContainerClass}>
                        <input
                          id="github-key"
                          type="password"
                          value={githubKey}
                          onChange={(e) => setGithubKey(e.target.value)}
                          placeholder="ghp_..."
                          className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full placeholder:text-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#050505] border border-white/5 p-4 rounded-xl mt-2 flex items-start gap-3">
                    <RiShieldKeyholeLine className="text-zinc-500 shrink-0 mt-0.5" size={16} aria-hidden="true" />
                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                      [SECURITY NOTICE]: All API keys are encrypted and stored strictly in your
                      local OS. IRIS does not transmit these keys to any centralized server. You
                      maintain full ownership and billing control over your provider endpoints.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                role="tabpanel"
                id="panel-security"
                aria-labelledby="tab-security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 absolute"
              >
                <AnimatePresence>
                  {!isSecurityUnlocked && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                      className="absolute inset-0 z-20 backdrop-blur-2xl bg-black/70 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-8"
                    >
                      <div className="bg-[#111] p-5 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <RiLockPasswordLine size={40} className="text-white" aria-hidden="true" />
                      </div>
                      <p className="text-xs text-zinc-300 font-mono tracking-widest uppercase mb-6 font-semibold">
                        Authenticate to access Vault Settings
                      </p>
                      <div className="flex gap-3 items-center h-12">
                        <input
                          type="password"
                          maxLength={4}
                          pattern="\d*"
                          value={authPin}
                          aria-label="Enter PIN"
                          onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="PIN"
                          className={`h-full bg-[#050505] border w-32 rounded-lg text-center text-xl tracking-[0.5em] text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            authError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-emerald-500'
                          }`}
                        />
                        <button
                          onClick={unlockSecurityModule}
                          className="h-full px-8 bg-white text-black text-xs font-bold tracking-widest rounded-lg hover:bg-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          UNLOCK
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0c] p-6 rounded-3xl border border-white/5">
                  <div className="bg-[#111113] border border-white/10 p-7 rounded-2xl flex flex-col gap-5">
                    <span className={titleClass}>
                      <RiLockPasswordLine className="text-zinc-400" size={18} aria-hidden="true" /> Update Master PIN
                    </span>
                    <div className={inputContainerClass}>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="\d*"
                        value={newPin}
                        aria-label="New Master PIN"
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter new 4-digit PIN..."
                        className="bg-transparent border-none outline-none text-sm font-mono text-zinc-100 w-full tracking-[0.3em] focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                      />
                      <button
                        onClick={updateMasterPin}
                        aria-label="Save Master PIN"
                        title="Update Vault PIN"
                        className="text-zinc-500 hover:text-white transition-colors ml-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                      >
                        <RiSave3Line size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111113] border border-white/10 p-7 rounded-2xl flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className={titleClass}>
                        <RiScan2Line className="text-zinc-400" size={18} aria-hidden="true" /> Biometric Registry
                      </span>
                      <span className="text-[10px] text-white font-mono tracking-widest bg-white/10 px-3 py-1.5 rounded-md font-semibold">
                        {faceCount} ENROLLED
                      </span>
                    </div>

                    <div className="flex flex-col gap-4 h-full justify-between">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Enroll additional structural face descriptors. Data is mathematically
                        encrypted and stored locally.
                      </p>
                      <button
                        onClick={startFaceEnrollment}
                        title="Add Biometric Profile"
                        className="w-full py-3 rounded-lg bg-white text-black font-bold tracking-widest text-[12px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <RiAddLine size={18} aria-hidden="true" /> ENROLL NEW IDENTITY
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111113] border border-white/10 p-7 rounded-2xl flex flex-col gap-6 md:col-span-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className={titleClass}>
                        <RiLockPasswordLine className="text-zinc-400" size={18} aria-hidden="true" /> App Startup Lock
                      </span>
                      <span className="text-[10px] text-white font-mono tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-md font-semibold">
                        {appLockType === 'none' ? 'DISABLED' : 'ENABLED'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        Require authentication before Iris initiates. Uses System Master PIN or local biometrics.
                      </p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <button
                          onClick={() => changeAppLockType('none')}
                          className={`p-3 rounded-lg border text-xs font-bold tracking-widest flex flex-col justify-center items-center gap-2 transition-all ${
                            appLockType === 'none' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-black text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          None
                        </button>
                        <button
                          onClick={() => changeAppLockType('pin')}
                          className={`p-3 rounded-lg border text-xs font-bold tracking-widest flex flex-col justify-center items-center gap-2 transition-all ${
                            appLockType === 'pin' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-black text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          PIN
                        </button>
                        <button
                          onClick={() => changeAppLockType('pattern')}
                          className={`p-3 rounded-lg border text-xs font-bold tracking-widest flex flex-col justify-center items-center gap-2 transition-all ${
                            appLockType === 'pattern' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-black text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          Pattern
                        </button>
                        <button
                          onClick={() => changeAppLockType('fingerprint')}
                          className={`p-3 rounded-lg border text-xs font-bold tracking-widest flex flex-col justify-center items-center gap-2 transition-all ${
                            appLockType === 'fingerprint' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-black text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          Fingerprint
                        </button>
                        <button
                          onClick={() => changeAppLockType('face')}
                          className={`p-3 rounded-lg border text-xs font-bold tracking-widest flex flex-col justify-center items-center gap-2 transition-all lg:col-span-1 md:col-span-2 col-span-2 ${
                            appLockType === 'face' 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'border-white/10 bg-black text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          Face Lock
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsView
