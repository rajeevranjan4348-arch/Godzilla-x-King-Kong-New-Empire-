import { useState, useEffect, Suspense, lazy, useRef } from 'react'
import AskIrisView from '../views/AskIris'
import { motion, AnimatePresence } from 'motion/react'
import {
  RiWifiLine,
  RiShieldFlashLine,
  RiLayoutGridLine,
  RiBrainLine,
  RiFolderOpenLine,
  RiPhoneLine,
  RiSettings4Line,
  RiBatteryChargeLine,
  RiCameraLine,
  RiCameraOffLine,
  RiComputerLine,
  RiCloseLine,
  RiImageLine,
  RiUploadCloudLine,
  RiHistoryLine,
  RiSearchLine,
  RiFocus3Line,
  RiMicLine,
  RiMicOffLine,
  RiNotification3Line,
  RiFileTextLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiSwapBoxLine,
  RiRobot2Line,
  RiCheckLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiCalendarEventLine,
  RiCodeBoxLine,
  RiSoundModuleLine,
  RiTimeLine,
  RiApps2Line,
  RiTerminalBoxLine,
  RiSendPlane2Line,
  RiUserLine,
  RiQuestionLine,
  RiQuestionAnswerLine,
  RiZoomInLine,
  RiPhoneFill,
  RiGlobalLine,
  RiCpuLine,
  RiPlugLine,
  RiChat1Line
} from 'react-icons/ri'
import ViewSkeleton from './ViewSkelrton'
import DashboardView from '../views/Dashboard'
import PhoneView from '../views/Phone'
import HistoryView from '../views/History'
import { GoogleGenAI, Type } from '@google/genai'
import Fuse from 'fuse.js'
import { playClick, playTabSwitch, playNotification } from '../utils/audio'
import { GlobalSearch } from './GlobalSearch'
import NotificationBell from './NotificationBell'
import NotificationOverlay from './NotificationOverlay'
import { PermissionManager } from './PermissionManager'
import { WaveformIndicator } from './WaveformIndicator'
import { PermissionsPanel } from './PermissionsPanel'
import { usePermissionStore } from '../store/permissionStore'
import { useAuditStore } from '../store/auditStore'
import { MessageFeed } from './MessageFeed'

const WorkFlowEditorView = lazy(() => import('../views/WorkFlowEditor'))
const NotesView = lazy(() => import('../views/Notes'))
const SettingsView = lazy(() => import('../views/Settings'))
const GalleryView = lazy(() => import('../views/Gallery'))
const DocumentsView = lazy(() => import('../views/Documents'))
const CalendarView = lazy(() => import('../views/Calendar'))
const TasksView = lazy(() => import('../views/Tasks'))
const GooseView = lazy(() => import('../views/Goose'))
const RemindersView = lazy(() => import('../views/Reminders'))
const ProfileView = lazy(() => import('../views/Profile'))
const AboutView = lazy(() => import('../views/About'))
const HelpView = lazy(() => import('../views/Help'))
const TerminalView = lazy(() => import('../views/Terminal'))
const WorkflowsView = lazy(() => import('../views/Workflows'))
const AgentView = lazy(() => import('../views/Agent'))
const BrowserView = lazy(() => import('../views/Browser'))
const SystemView = lazy(() => import('../views/System'))
const PluginsView = lazy(() => import('../views/Plugins'))

export interface IrisProps {
  isSystemActive: boolean
  toggleSystem: () => void
  isMicMuted: boolean
  toggleMic: () => void
  handleMicTrigger?: () => Promise<void> | void
  isVideoOn: boolean
  visionMode: string
  startVision: (mode: 'camera' | 'screen', quality?: { width: number, height: number, frameRate: number }) => void
  stopVision: () => void
  isVisionPaused?: boolean
  toggleVisionPause?: () => void
  isNoiseReductionEnabled?: boolean
  toggleNoiseReduction?: () => void
  activeStream: MediaStream | null
  uploadImage: (file: File) => void
  uploadedImageUrl?: string | null
  ocrText?: string
  onTranscript?: (role: string, text: string) => void
  registerTranscriptHandler?: (handler: (role: string, text: string) => void) => void
  registerCommandHandler?: (handler: (command: string, args: any) => void) => void
  registerSetActiveTab?: (handler: (tab: string) => void) => void
  registerGetActiveTab?: (handler: () => string) => void
  sendText?: (text: string) => void
  messages?: any[]
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>
}

import AppsView, { APPS } from '../views/Apps'
import { APP_SYNONYMS } from '../hooks/useVoiceCommands'
import MemoryView from '../views/Memory'
import CodingView from '../views/Coding'
import ChatView from '../views/Chat'

const glassPanel = 'bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl'

const TABS = [
  { id: 'DASHBOARD' },
  { id: 'APPS' },
  { id: 'CODING' },
  { id: 'SETTINGS' }
]

import { useNotificationStore } from '../store/notificationStore'

const IRIS = (props: IrisProps) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD')
  const [focusedTab, setFocusedTab] = useState('DASHBOARD')
  const [activePanel, setActivePanel] = useState<'memory' | 'calendar' | 'terminal' | 'macros' | 'permissions' | null>(null)
  
  const addSysNotification = useNotificationStore(state => state.addNotification)
  
  const activeTabRef = useRef(activeTab)
  const commandHandlerRef = useRef<((command: string, args: any) => any) | null>(null)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    if (props.isSystemActive) {
      setIsFeedVisible(true)
    }
  }, [props.isSystemActive])
  
  const [stats, setStats] = useState<any>(null)
  const [time, setTime] = useState<Date>(new Date())
  const [localChatHistory, setLocalChatHistory] = useState<any[]>([
    { role: 'assistant', content: 'IRIS System Initialized. Awaiting input.' }
  ])
  const chatHistory = props.messages !== undefined ? props.messages : localChatHistory
  const setChatHistory = props.setMessages !== undefined ? props.setMessages : setLocalChatHistory
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFeedVisible, setIsFeedVisible] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [globalInput, setGlobalInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Notifications
  const [notifications, setNotifications] = useState<{id: string, message: string, type: string}[]>([])
  
  const notify = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setNotifications(prev => [...prev, { id, message, type }])
    
    // Check if the user is switched away OR if it's a critical action like a success/warning
    if (document.hidden || type === 'success' || type === 'warning') {
      addSysNotification({
        title: type === 'warning' ? 'IRIS Alert' : type === 'success' ? 'IRIS Update' : 'IRIS Update',
        message,
        type: type as "info" | "success" | "warning" | "error"
      })
    }

    playNotification()
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }
  
  // Reminders
  const [reminders, setReminders] = useState<{id: string, message: string, time: string, notified: boolean}[]>(() => {
    const saved = localStorage.getItem('iris_reminders')
    return saved ? JSON.parse(saved) : []
  })

  // Zoom Controls state
  const [zoomSupported, setZoomSupported] = useState(false)
  const [zoomLimit, setZoomLimit] = useState({ min: 1, max: 1, step: 0.1 })
  const [currentZoom, setCurrentZoom] = useState(1)

  useEffect(() => {
    if (props.activeStream && props.isVideoOn && props.visionMode === 'camera') {
      const videoTrack = props.activeStream.getVideoTracks()[0];
      if (videoTrack) {
        // Some browsers return capabilities from getCapabilities(), some don't.
        // Also cast to any because TS might not have full MediaTrackCapabilities
        const capabilities = (videoTrack.getCapabilities as any)?.();
        if (capabilities && 'zoom' in capabilities) {
          setZoomSupported(true);
          setZoomLimit({
            min: capabilities.zoom.min || 1,
            max: capabilities.zoom.max || 5,
            step: capabilities.zoom.step || 0.1
          });
          const settings = (videoTrack.getSettings as any)?.();
          if (settings && 'zoom' in settings) {
             setCurrentZoom(settings.zoom);
          }
        } else {
          setZoomSupported(false);
        }
      }
    } else {
      setZoomSupported(false);
    }
  }, [props.activeStream, props.isVideoOn, props.visionMode]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    setCurrentZoom(newZoom);
    if (props.activeStream) {
      const videoTrack = props.activeStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.applyConstraints({
          advanced: [{ zoom: newZoom }]
        } as any).catch(err => console.error("Zoom constraint failed", err));
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now)
      setStats({
        cpu: (Math.random() * 10).toFixed(1),
        memory: { usedPercentage: (Math.random() * 50 + 20).toFixed(1) },
        temperature: (Math.random() * 10 + 40).toFixed(0),
        os: { type: 'Web OS' }
      })

      // Check reminders
      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          if (!r.notified && new Date(r.time) <= now) {
            notify(`REMINDER: ${r.message}`, 'warning')
            changed = true;
            return { ...r, notified: true }
          }
          return r;
        })
        if (changed) {
          localStorage.setItem('iris_reminders', JSON.stringify(updated))
          return updated;
        }
        return prev;
      })

      // Check tasks
      try {
        const savedTasks = localStorage.getItem('iris_tasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          let tasksChanged = false;
          const updatedTasks = tasks.map((t: any) => {
            if (!t.completed && !t.notified) {
              const triggerTime = t.reminderTime ? new Date(t.reminderTime).getTime() : (t.dueDate ? new Date(t.dueDate).getTime() : null);
              if (triggerTime && now.getTime() >= triggerTime) {
                if (t.imageUrl) {
                  notify(`bhai tere task ka samey ho gaya hai: ${t.title}`, 'warning');
                } else {
                  notify(`TASK DUE: ${t.title}`, 'warning');
                }
                
                // Show native browser notification
                if (Notification.permission === 'granted') {
                  new Notification(`Task Due: ${t.title}`, {
                    body: t.description || 'This task is due now.',
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification(`Task Due: ${t.title}`, {
                        body: t.description || 'This task is due now.',
                      });
                    }
                  });
                }

                tasksChanged = true;
                return { ...t, notified: true };
              }
            }
            return t;
          });
          if (tasksChanged) {
            localStorage.setItem('iris_tasks', JSON.stringify(updatedTasks));
            window.dispatchEvent(new Event('iris_tasks_updated'));
          }
        }
      } catch (e) {
        console.error("Error checking tasks", e);
      }
    }, 1000)
    
    const handleCloseMods = () => setShowSourceModal(false)
    window.addEventListener('close-modals', handleCloseMods)
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('close-modals', handleCloseMods)
    }
  }, [])

  // Hook up transcript and commands
  useEffect(() => {
    if (props.registerSetActiveTab) {
      props.registerSetActiveTab(setActiveTab)
    }
    if (props.registerGetActiveTab) {
      props.registerGetActiveTab(() => activeTabRef.current)
    }

    const transcriptHandler = (role: string, text: string) => {
      setChatHistory(prev => {
        const newHistory = [...prev, { role, content: text }]
        // Save to sessions
        const saved = localStorage.getItem('iris_chat_sessions')
        let sessions = saved ? JSON.parse(saved) : []
        if (sessions.length === 0 || new Date().getTime() - new Date(sessions[0].timestamp).getTime() > 3600000) {
          sessions.unshift({ id: Date.now(), timestamp: new Date().toISOString(), messages: newHistory })
        } else {
          sessions[0].messages = newHistory
        }
        localStorage.setItem('iris_chat_sessions', JSON.stringify(sessions))
        return newHistory
      })
    }
    
    if (props.registerTranscriptHandler) {
      props.registerTranscriptHandler(transcriptHandler)
    } else {
      props.onTranscript = transcriptHandler
    }

    const commandHandler = (command: string, args: any) => {
      switch (command) {
        case 'clearHistory':
          setChatHistory([{ role: 'assistant', content: 'IRIS System Initialized. Awaiting input.' }])
          localStorage.removeItem('iris_chat_sessions')
          notify('Chat history cleared', 'success')
          break
        case 'openNotes':
          setActiveTab('NOTES')
          notify('Opened Memory Bank', 'info')
          break
        case 'openGallery':
          setActiveTab('GALLERY')
          notify('Opened Visual Vault', 'info')
          break
        case 'openDashboard':
          setActiveTab('DASHBOARD')
          notify('Opened Dashboard', 'info')
          break
        case 'openSettings':
          setActiveTab('SETTINGS')
          notify('Opened Command Center', 'info')
          break
        case 'openApp':
          const targetApp = args.appName?.toLowerCase() || '';
          // Check if it's a main system tab first
          const systemTabMap: Record<string, string> = {
            chat: 'CHAT', messages: 'CHAT', conversation: 'CHAT', talk: 'CHAT', chatting: 'CHAT',
            notes: 'MEMORY', memory: 'MEMORY', notepad: 'MEMORY', journal: 'MEMORY', diary: 'MEMORY', brain: 'MEMORY', remember: 'MEMORY', keep: 'MEMORY',
            tasks: 'TASKS', todo: 'TASKS', reminders: 'TASKS', list: 'TASKS', chores: 'TASKS', errands: 'TASKS',
            gallery: 'GALLERY', vault: 'GALLERY', photos: 'GALLERY', images: 'GALLERY', pictures: 'GALLERY', pics: 'GALLERY', album: 'GALLERY',
            phone: 'PHONE', calls: 'PHONE', dialer: 'PHONE', contacts: 'PHONE', call: 'PHONE',
            settings: 'SETTINGS', command_center: 'SETTINGS', preferences: 'SETTINGS', options: 'SETTINGS', config: 'SETTINGS', setup: 'SETTINGS',
            dashboard: 'DASHBOARD', home: 'DASHBOARD', main: 'DASHBOARD', menu: 'DASHBOARD', overview: 'DASHBOARD',
            apps: 'APPS', applications: 'APPS', programs: 'APPS', software: 'APPS', tools: 'APPS',
            coding: 'CODING', code: 'CODING', programming: 'CODING', dev: 'CODING', development: 'CODING', scripting: 'CODING', editor: 'CODING',
            workflows: 'WORKFLOWS', workflow: 'WORKFLOWS', automations: 'WORKFLOWS', scripts: 'WORKFLOWS', macros: 'WORKFLOWS',
            calendar: 'CALENDAR', schedule: 'CALENDAR', agenda: 'CALENDAR', events: 'CALENDAR', meetings: 'CALENDAR', planner: 'CALENDAR',
            documents: 'DOCUMENTS', files: 'DOCUMENTS', docs: 'DOCUMENTS', folders: 'DOCUMENTS', pdfs: 'DOCUMENTS',
            terminal: 'TERMINAL', console: 'TERMINAL', shell: 'TERMINAL', prompt: 'TERMINAL', cmd: 'TERMINAL', command_line: 'TERMINAL',
            ask_iris: 'ASK_IRIS', ask: 'ASK_IRIS', query: 'ASK_IRIS', queries: 'ASK_IRIS', question: 'ASK_IRIS', answers: 'ASK_IRIS', ask_assistant: 'ASK_IRIS',
            browser: 'BROWSER', web: 'BROWSER', internet: 'BROWSER', chrome: 'BROWSER', explorer: 'BROWSER', safari: 'BROWSER', firefox: 'BROWSER', web_browser: 'BROWSER',
            system_status: 'SYSTEM', system_info: 'SYSTEM', system: 'SYSTEM', cpu: 'SYSTEM', hardware: 'SYSTEM', performance: 'SYSTEM', resources: 'SYSTEM', diagnostics: 'SYSTEM',
            plugin: 'PLUGINS', plugins: 'PLUGINS', addons: 'PLUGINS', integrations: 'PLUGINS', extensions: 'PLUGINS', connections: 'PLUGINS',
            agent: 'AGENT', autonomous_agent: 'AGENT', goose: 'AGENT', bot: 'AGENT', robot: 'AGENT', ai_model: 'AGENT',
            profile: 'PROFILE', my_profile: 'PROFILE', user_profile: 'PROFILE', user_info: 'PROFILE', me: 'PROFILE', account: 'PROFILE', avatar: 'PROFILE',
            about_iris: 'ABOUT', about: 'ABOUT', version: 'ABOUT', credits: 'ABOUT', system_details: 'ABOUT',
            help: 'HELP', guide: 'HELP', manual: 'HELP', tutorial: 'HELP', support: 'HELP', how_to_use: 'HELP', instructions: 'HELP'
          };

          const cleanTargetApp = targetApp.replace(/[\s\-_]+/g, '_');
          if (systemTabMap[cleanTargetApp] || systemTabMap[targetApp]) {
            const destTab = systemTabMap[cleanTargetApp] || systemTabMap[targetApp];
            setActiveTab(destTab);
            notify(`Opening ${destTab.charAt(0) + destTab.slice(1).toLowerCase()}`, 'info');
            return { status: 'success', opened: destTab };
          }

          // Check sub-apps list
          const matchedApp = APPS.find((a: any) => 
            a.id.toLowerCase() === targetApp || 
            a.name.toLowerCase() === targetApp ||
            (APP_SYNONYMS[a.id] && APP_SYNONYMS[a.id].some((syn: string) => syn.toLowerCase() === targetApp))
          );

          if (matchedApp) {
            setActiveTab('APPS');
            localStorage.setItem('iris_active_app', matchedApp.id);
            window.dispatchEvent(new CustomEvent('launch-app', { detail: { appId: matchedApp.id } }));
            notify(`Opening ${matchedApp.name}`, 'success');
            return { status: 'success', opened: matchedApp.name };
          } else {
            // Fallback: search general tab or open App Tab itself
            setActiveTab('APPS');
            notify(`Opening Apps list`, 'info');
            return { status: 'success', opened: 'Apps' };
          }
        case 'adjustVolume':
          notify(`System volume adjusted to ${args.level}%`, 'success')
          break
        case 'changeBrightness':
          notify(`Display brightness changed to ${args.level}%`, 'success')
          break
        case 'toggleNetwork':
          notify(`Network connectivity turned ${args.state}`, 'info')
          break
        case 'openUrl':
          window.open(args.url.startsWith('http') ? args.url : `https://${args.url}`, '_blank')
          notify(`Opening ${args.url} in Chrome`, 'success')
          break
        case 'startVideoCall':
          setActiveTab('PHONE')
          // Simulate WhatsApp video call
          setTimeout(() => {
            notify(`Starting WhatsApp video call with ${args.contact}...`, 'info')
          }, 500)
          break
        case 'deactivateSystem':
          notify('System deactivated by voice command', 'warning')
          props.toggleSystem()
          break
        case 'muteMic':
          notify('Microphone muted by voice command', 'info')
          if (!props.isMicMuted) props.toggleMic()
          break
        case 'startCamera':
          usePermissionStore.getState().requestPermission('camera', 'Camera Access', 'Allow IRIS to view and analyze your camera feed.')
            .then(granted => {
              if (granted) {
                useAuditStore.getState().logAction('Camera Access', null, 'success');
                notify('Starting camera feed', 'info')
                props.startVision('camera')
              } else {
                useAuditStore.getState().logAction('Camera Access', null, 'denied');
                notify('Camera permission denied.', 'warning');
              }
            });
          break
        case 'startScreenShare':
          usePermissionStore.getState().requestPermission('screen', 'Screen Share', 'Allow IRIS to view and analyze your screen content.')
            .then(granted => {
              if (granted) {
                useAuditStore.getState().logAction('Screen Share', null, 'success');
                notify('Starting screen share', 'info')
                props.startVision('screen')
              } else {
                useAuditStore.getState().logAction('Screen Share', null, 'denied');
                notify('Screen Share permission denied.', 'warning');
              }
            });
          break
        case 'stopVision':
          notify('Stopping vision feed', 'info')
          props.stopVision()
          break
        case 'openGoogleApp':
          const appUrls: Record<string, string> = {
            gmail: 'https://mail.google.com',
            calendar: 'https://calendar.google.com',
            drive: 'https://drive.google.com',
            maps: 'https://maps.google.com',
            docs: 'https://docs.google.com',
            sheets: 'https://sheets.google.com',
            youtube: 'https://youtube.com',
            meet: 'https://meet.google.com',
            photos: 'https://photos.google.com',
            keep: 'https://keep.google.com',
            translate: 'https://translate.google.com'
          }
          const appName = args.appName.toLowerCase()
          const url = appUrls[appName] || `https://google.com/search?q=${args.appName}`
          window.open(url, '_blank')
          notify(`Opening Google ${args.appName}`, 'success')
          break
        case 'openCalendarTab':
          setActiveTab('CALENDAR')
          notify('Opening Calendar', 'info')
          break
        case 'listCalendarEvents':
          import('../services/googleCalendar').then(async (cal) => {
            if (!cal.gisInited || !cal.gapiInited) {
              notify('Calendar API not initialized. Please connect Google Account.', 'warning')
              return
            }
            try {
              const events = await cal.listUpcomingEvents()
              if (events.length === 0) {
                notify('No upcoming events found.', 'info')
              } else {
                notify(`Found ${events.length} upcoming events.`, 'success')
                setActiveTab('CALENDAR')
              }
            } catch (e) {
              notify('Failed to list events. Are you authenticated?', 'warning')
            }
          })
          break
        case 'addCalendarEvent':
          import('../services/googleCalendar').then(async (cal) => {
            try {
              await cal.addEvent(args.summary, args.description || '', args.startTime, args.endTime)
              notify(`Added event: ${args.summary}`, 'success')
              setActiveTab('CALENDAR')
            } catch (e) {
              notify('Failed to add event. Are you authenticated?', 'warning')
            }
          })
          break
        case 'deleteCalendarEvent':
          import('../services/googleCalendar').then(async (cal) => {
            try {
              await cal.deleteEvent(args.eventId)
              notify('Event deleted successfully.', 'success')
              setActiveTab('CALENDAR')
            } catch (e) {
              notify('Failed to delete event.', 'warning')
            }
          })
          break
        case 'getWeather':
          notify(`Checking weather for ${args.location}...`, 'info')
          return fetch(`https://wttr.in/${encodeURIComponent(args.location)}?format=j1`)
            .then(res => res.json())
            .then(data => {
              const current = data.current_condition?.[0]
              if (current) {
                notify(`${args.location} Weather: ${current.temp_C}°C, ${current.weatherDesc?.[0]?.value}`, 'success')
                window.dispatchEvent(new CustomEvent('show-weather', { detail: { location: args.location, data } }))
                return { 
                  result: "Success",
                  temperature: `${current.temp_C}C / ${current.temp_F}F`,
                  condition: current.weatherDesc?.[0]?.value,
                  humidity: current.humidity,
                  forecast: data.weather?.[1] ? `Tomorrow's high will be ${data.weather[1].maxtempC}C` : ''
                }
              } else {
                notify(`Failed to resolve weather for ${args.location}`, 'warning')
                return { error: "Failed to resolve weather" }
              }
            })
            .catch(() => {
              notify(`Failed to get weather for ${args.location}`, 'warning')
              return { error: "Network fetch failed" }
            })
        case 'setTimer':
          notify(`Timer set for ${args.minutes} minutes.`, 'success')
          break
        case 'setReminder':
          const newReminder = {
            id: Math.random().toString(36).substring(7),
            message: args.message,
            time: args.time,
            notified: false
          }
          setReminders(prev => {
            const updated = [...prev, newReminder]
            localStorage.setItem('iris_reminders', JSON.stringify(updated))
            return updated
          })
          notify(`Reminder set: ${args.message}`, 'success')
          break
        case 'playMusic':
          const platform = args.platform || 'spotify'
          let searchUrl = ''
          if (platform === 'spotify') searchUrl = `https://open.spotify.com/search/${encodeURIComponent(args.songName)}`
          else if (platform === 'jiosaavn') searchUrl = `https://www.jiosaavn.com/search/${encodeURIComponent(args.songName)}`
          
          if (searchUrl) {
             window.open(searchUrl, '_blank')
             notify(`Opening ${platform} to play ${args.songName}...`, 'success')
          } else {
             notify('Playing music...', 'success')
          }
          break
        case 'pauseMusic':
          notify('Music paused.', 'info')
          break
        case 'githubViewRepo':
          setActiveTab('CODING')
          fetch(`https://api.github.com/repos/${args.repo}`, {
            headers: localStorage.getItem('iris_github_api_key') ? { Authorization: `Bearer ${localStorage.getItem('iris_github_api_key')}` } : {}
          })
          .then(res => res.json())
          .then(data => {
             if (data.message) notify(`GitHub Error: ${data.message}`, 'warning')
             else notify(`Viewed Repo: ${data.full_name} (${data.stargazers_count} stars)`, 'success')
          }).catch(() => notify('Failed to fetch repo info', 'warning'))
          break
        case 'githubCheckIssues':
          setActiveTab('CODING')
          fetch(`https://api.github.com/repos/${args.repo}/issues?state=open&per_page=5`, {
            headers: localStorage.getItem('iris_github_api_key') ? { Authorization: `Bearer ${localStorage.getItem('iris_github_api_key')}` } : {}
          })
          .then(res => res.json())
          .then(data => {
             if (data.message) notify(`GitHub Error: ${data.message}`, 'warning')
             else notify(`Found ${data.length} recent open issues in ${args.repo}.`, 'success')
          }).catch(() => notify('Failed to fetch issues', 'warning'))
          break
        case 'githubCreatePullRequest':
          setActiveTab('CODING')
          usePermissionStore.getState().requestPermission('shell', 'Shell Execution', 'Allow IRIS to create Pull Requests via Github API.')
            .then(granted => {
              if (granted) {
                useAuditStore.getState().logAction('Create GitHub PR', args, 'success');
                fetch(`https://api.github.com/repos/${args.repo}/pulls`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('iris_github_api_key') ? { Authorization: `Bearer ${localStorage.getItem('iris_github_api_key')}` } : {})
                  },
                  body: JSON.stringify({
                    title: args.title,
                    head: args.head,
                    base: args.base,
                    body: args.body || ""
                  })
                })
                .then(res => res.json())
                .then(data => {
                   if (data.message) notify(`GitHub PR Failed: ${data.message}`, 'warning')
                   else notify(`PR Created: ${data.title} (#${data.number})`, 'success')
                }).catch(() => notify('Failed to create PR', 'warning'))
              } else {
                useAuditStore.getState().logAction('Create GitHub PR', args, 'denied');
                notify('Shell execution permission denied for github.', 'warning');
              }
            });
          break
        case 'androidPerformAction':
          usePermissionStore.getState().requestPermission('automation', 'OS Automation', 'Allow IRIS to control apps and system via ADB.')
            .then(granted => {
              if (granted) {
                usePermissionStore.getState().setAutomationActive(true);
                useAuditStore.getState().logAction('Android Action', args, 'success');
                notify(`Android Core: Action [${args.action.toUpperCase()}] executing via ADB...`, 'info')
                fetch('/api/adb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: 'action', args }) })
                  .then(res => res.json()).then(res => { if (res.success) notify(`Action [${args.action.toUpperCase()}] successful.`, 'success'); else notify('ADB failed.', 'warning') }).catch(() => notify('ADB server error', 'warning'))
              } else {
                useAuditStore.getState().logAction('Android Action', args, 'denied');
                notify('OS Automation permission denied.', 'warning');
              }
            });
          break
        case 'androidLaunchApp':
          usePermissionStore.getState().requestPermission('automation', 'OS Automation', 'Allow IRIS to launch apps.')
            .then(granted => {
              if (granted) {
                usePermissionStore.getState().setAutomationActive(true);
                useAuditStore.getState().logAction('Android Launch App', args, 'success');
                notify(`Android Core: Launching app [${args.appName}] via ADB...`, 'info')
                fetch('/api/adb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: 'launch', args }) })
                  .then(res => res.json()).then(res => { if (res.success) notify(`App launched.`, 'success'); else notify('ADB failed.', 'warning') }).catch(() => notify('ADB server error', 'warning'))
              } else {
                useAuditStore.getState().logAction('Android Launch App', args, 'denied');
                notify('OS Automation permission denied.', 'warning');
              }
            });
          break
        case 'androidInputText':
          usePermissionStore.getState().requestPermission('automation', 'OS Automation', 'Allow IRIS to inject text.')
            .then(granted => {
              if (granted) {
                usePermissionStore.getState().setAutomationActive(true);
                useAuditStore.getState().logAction('Android Input Text', args, 'success');
                notify(`Android Core: Injecting text via ADB...`, 'info')
                fetch('/api/adb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: 'input', args }) })
                  .then(res => res.json()).then(res => { if (res.success) notify(`Text injected.`, 'success'); else notify('ADB failed.', 'warning') }).catch(() => notify('ADB server error', 'warning'))
              } else {
                useAuditStore.getState().logAction('Android Input Text', args, 'denied');
                notify('OS Automation permission denied.', 'warning');
              }
            });
          break
        case 'androidTap':
          usePermissionStore.getState().requestPermission('automation', 'OS Automation', 'Allow IRIS to perform tap actions.')
            .then(granted => {
              if (granted) {
                usePermissionStore.getState().setAutomationActive(true);
                useAuditStore.getState().logAction('Android Tap', args, 'success');
                notify(`Android Core: Tapping at coords (${args.x}, ${args.y})`, 'info')
                fetch('/api/adb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: 'tap', args }) })
                  .then(res => res.json()).then(res => { if (res.success) notify(`Tap successful.`, 'success'); else notify('ADB failed.', 'warning') }).catch(() => notify('ADB server error', 'warning'))
              } else {
                useAuditStore.getState().logAction('Android Tap', args, 'denied');
                notify('OS Automation permission denied.', 'warning');
              }
            });
          break
        case 'open_app':
          notify(`System Automation: Opening ${args.app_name}...`, 'success');
          useAuditStore.getState().logAction('Open App', args, 'success');
          commandHandler('openApp', { appName: args.app_name });
          break
        case 'close_app':
          notify(`System Automation: Closing ${args.app_name}...`, 'info');
          useAuditStore.getState().logAction('Close App', args, 'success');
          break
        case 'ghost_type':
          notify(`System Ghost Keyboard: Typing "${args.text}"`, 'success');
          useAuditStore.getState().logAction('Ghost Keyboard: Type', args, 'success');
          break
        case 'execute_sequence':
          notify(`System Automation: Executing sequence macro...`, 'info');
          try {
            const parsed = JSON.parse(args.json_actions);
            notify(`Running ${parsed.length} automated steps...`, 'success');
          } catch (e) {
            notify(`Running sequence: ${args.json_actions}`, 'success');
          }
          useAuditStore.getState().logAction('Execute Sequence Macro', args, 'success');
          break
        case 'press_shortcut':
          {
            const modifiersStr = args.modifiers ? args.modifiers.join('+') + '+' : '';
            notify(`System Keyboard Shortcut: Pressing ${modifiersStr}${args.key}`, 'success');
            useAuditStore.getState().logAction('Keyboard Shortcut', args, 'success');
          }
          break
        case 'click_on_screen':
          notify(`System Ghost Mouse: Clicking coordinate ratio (X: ${args.x}, Y: ${args.y})`, 'success');
          useAuditStore.getState().logAction('Ghost Mouse Click', args, 'success');
          break
        case 'scroll_screen':
          notify(`System Ghost Mouse: Scrolling ${args.direction} by ${args.amount || 100}px`, 'success');
          useAuditStore.getState().logAction('Ghost Mouse Scroll', args, 'success');
          break
        case 'run_terminal':
          notify(`System Terminal: Running command [${args.command}] in path [${args.path || './'}]`, 'info');
          setActiveTab('TERMINAL');
          useAuditStore.getState().logAction('Terminal Command', args, 'success');
          break
        case 'send_whatsapp':
          notify(`System Automation: Sending WhatsApp message to [${args.name}]`, 'success');
          window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(args.message)}`, '_blank');
          useAuditStore.getState().logAction('Send WhatsApp', args, 'success');
          break
        case 'play_spotify_music':
          notify(`System Automation: Playing [${args.song_name}] on Spotify`, 'success');
          window.open(`https://open.spotify.com/search/${encodeURIComponent(args.song_name)}`, '_blank');
          useAuditStore.getState().logAction('Spotify Play', args, 'success');
          break
        case 'set_volume':
          notify(`System Sound Volume updated to ${args.level}%`, 'success');
          useAuditStore.getState().logAction('Set Volume', args, 'success');
          break
        case 'take_screenshot':
          notify(`System Automation: Capture screenshot. Saving frame...`, 'success');
          useAuditStore.getState().logAction('Take Screenshot', args, 'success');
          break
        default:
          console.log('Unknown command:', command)
      }
    }

    commandHandlerRef.current = commandHandler

    if (props.registerCommandHandler) {
      props.registerCommandHandler(commandHandler)
    }
  }, [props])

  const handleAskIris = async (text: string) => {
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);
    setIsGenerating(true);
    
    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: text,
        config: {
            systemInstruction: "You are IRIS, an advanced AI assistant. Keep responses brief and conversational. If asked about current events, search Google.",
            tools: [
              { googleSearch: {} },
              {
                functionDeclarations: [
                  {
                    name: 'openApp',
                    description: "Opens a specific application or tab in the system, such as Gmail, YouTube, Calendar, Notes, ChatGPT, Google Maps, Chrome, Google Drive, WhatsApp, etc.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        appName: {
                          type: Type.STRING,
                          description: "The name of the application to open, e.g. 'Gmail', 'YouTube', 'Notes', 'Calendar', 'ChatGPT'."
                        }
                      },
                      required: ['appName']
                    }
                  }
                ]
              }
            ],
            toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      const functionCalls = res.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0];
        if (fc.name === 'openApp') {
          const args = fc.args as any;
          if (commandHandlerRef.current) {
            commandHandlerRef.current('openApp', args);
          }
          const reply = `I've opened ${args.appName || 'the application'} for you.`;
          setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
          
          const isTtsEnabled = localStorage.getItem('iris_mute_ai_voice') !== 'true';
          if (isTtsEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(reply);
            window.speechSynthesis.speak(utterance);
          }
          return;
        }
      }

      const reply = res.text || 'I could not process that request.';
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      
      const isTtsEnabled = localStorage.getItem('iris_mute_ai_voice') !== 'true';
      if (isTtsEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection error while processing query.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisionClick = () => {
    if (props.isVideoOn) {
      props.stopVision()
    } else {
      setShowSourceModal(true)
    }
  }

  const toggleVisionSource = () => {
    if (!props.isSystemActive) return
    const nextMode = props.visionMode === 'camera' ? 'screen' : 'camera'
    const permissionName = nextMode === 'camera' ? 'Camera Access' : 'Screen Share';
    const permissionDesc = nextMode === 'camera' ? 'Allow IRIS to view and analyze your camera feed.' : 'Allow IRIS to view and analyze your screen content.';
    
    usePermissionStore.getState().requestPermission(nextMode, permissionName, permissionDesc)
      .then(granted => {
        if (granted) {
          useAuditStore.getState().logAction(permissionName, null, 'success');
          props.startVision(nextMode as any)
        } else {
          useAuditStore.getState().logAction(permissionName, null, 'denied');
        }
      });
  }

  return (
    <div className="h-screen w-full bg-black text-zinc-100 font-sans overflow-hidden select-none flex flex-col relative pb-5">
      <PermissionManager />
      <WaveformIndicator isActive={props.isSystemActive} isListening={!props.isMicMuted} />
      
      {/* Notifications */}
      <div className="absolute top-16 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-80 max-w-[calc(100vw-3rem)]">
        <AnimatePresence mode="popLayout">
          {notifications.map(n => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative overflow-hidden px-4 py-3 rounded-xl shadow-2xl border flex items-start gap-3 pointer-events-auto backdrop-blur-xl ${
                n.type === 'warning' ? 'bg-[#93000a]/40 border-[#ffb4ab]/30 text-[#ffdad6]' :
                n.type === 'success' ? 'bg-[#4c6500]/40 border-[#e0ff95]/30 text-[#e0ff95]' :
                'bg-[#3e0022]/40 border-[#ffb0cd]/30 text-[#ffbad3]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'warning' ? <RiErrorWarningLine size={18} /> :
                 n.type === 'success' ? <RiCheckLine size={18} /> :
                 <RiInformationLine size={18} />}
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest uppercase font-headline opacity-80">
                  {n.type}
                </span>
                <span className="text-xs font-medium leading-snug">{n.message}</span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0 p-1 rounded-md hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <RiCloseLine size={16} />
              </button>
              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${
                  n.type === 'warning' ? 'bg-[#ffb4ab]' :
                  n.type === 'success' ? 'bg-[#e0ff95]' :
                  'bg-[#ffb0cd]'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent Vision Controls Overlay */}
      <AnimatePresence>
        {props.isVideoOn && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-lg"
          >
            <div className="flex items-center gap-2 mr-2 border-r border-white/10 pr-3">
              <span className={`w-2 h-2 rounded-full ${props.isVisionPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[10px] font-bold tracking-widest text-zinc-300">
                {props.isVisionPaused ? 'VISION PAUSED' : 'VISION ACTIVE'}
              </span>
            </div>
            
            {zoomSupported && !props.isVisionPaused && props.visionMode === 'camera' && (
              <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
                <RiZoomInLine size={14} className="text-zinc-400" />
                <input 
                  type="range" 
                  min={zoomLimit.min} 
                  max={zoomLimit.max} 
                  step={zoomLimit.step} 
                  value={currentZoom} 
                  onChange={handleZoomChange}
                  title={`Zoom: ${currentZoom}`}
                  className="w-20 h-1 md:w-24 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                />
              </div>
            )}
            
            <button
              onClick={props.toggleVisionPause}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={props.isVisionPaused ? "Resume Vision" : "Pause Vision"}
              aria-label={props.isVisionPaused ? "Resume vision capability" : "Pause vision capability"}
            >
              {props.isVisionPaused ? <RiPlayCircleLine size={16} /> : <RiPauseCircleLine size={16} />}
            </button>
            
            <button
              onClick={toggleVisionSource}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={props.visionMode === 'camera' ? "Switch to Screen Share" : "Switch to Camera"}
              aria-label={props.visionMode === 'camera' ? "Switch vision to screen share" : "Switch vision to camera source"}
            >
              {props.visionMode === 'camera' ? <RiComputerLine size={16} /> : <RiCameraLine size={16} />}
            </button>

            <button
              onClick={props.stopVision}
              className="p-1.5 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              title="Stop Vision"
              aria-label="Stop vision capability"
            >
              <RiCloseLine size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OCR Results Overlay */}
      <AnimatePresence>
        {props.ocrText && props.isVideoOn && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-20 left-6 z-[150] max-w-xs bg-zinc-900/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-cyan-400">
                OCR DETECTED
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed line-clamp-4">
              {props.ocrText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex items-center justify-between px-6 py-3 bg-zinc-950/80 border-b border-white/5 z-50 pointer-events-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex flex-col leading-none">
              <span className="font-black tracking-[0.2em] text-sm text-zinc-100">IRIS AI</span>
              <span className="text-[11px] font-mono tracking-widest text-red-500/80 font-bold">
                LIVE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1 border-r border-white/10 pr-3">
              <button
                onClick={() => setIsFeedVisible(!isFeedVisible)}
                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isFeedVisible ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Toggle HUD live transcript feed"
                aria-label="Toggle HUD live transcript feed"
              >
                <RiChat1Line size={16} />
              </button>
              {[
                { id: 'memory', icon: <RiBrainLine size={16} />, label: 'Memory' },
                { id: 'terminal', icon: <RiTerminalBoxLine size={16} />, label: 'Terminal' },
                { id: 'macros', icon: <RiCodeBoxLine size={16} />, label: 'Macros' },
                { id: 'permissions', icon: <RiShieldFlashLine size={16} />, label: 'Permissions' }
              ].map(panel => (
                 <button
                   key={panel.id}
                   onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id as any)}
                   className={`p-1.5 rounded hover:bg-white/10 transition-colors ${activePanel === panel.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                   title={`Toggle ${panel.label} Panel`}
                 >
                   {panel.icon}
                 </button>
              ))}
            </div>
            <GlobalSearch onNavigate={setActiveTab} />
          </div>
        </div>
      </div>

      <div 
        className="flex md:hidden items-center gap-2 text-[9px] font-mono font-bold tracking-widest mt-1 px-4 overflow-x-auto scrollbar-none pb-2 z-50 pointer-events-auto bg-black/50"
        role="tablist"
        aria-label="Mobile Navigation Tabs"
      >
        {[
          { id: 'DASHBOARD' },
          { id: 'ASK_IRIS' },
          { id: 'APPS' },
          { id: 'CODING' },
          { id: 'TERMINAL' },
          { id: 'MEMORY' },
          { id: 'TASKS' },
          { id: 'DOCUMENTS' },
          { id: 'GALLERY' },
          { id: 'PROFILE' },
          { id: 'ABOUT' },
          { id: 'HELP' },
          { id: 'SETTINGS' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => {
              playTabSwitch()
              setActiveTab(tab.id)
            }}
            title={`Open ${tab.id}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === tab.id 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            {tab.id}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden w-full relative">
        <nav className="hidden md:flex flex-col items-center gap-4 py-6 w-16 bg-zinc-950/80 border-r border-white/5 z-40 overflow-y-auto scrollbar-none shrink-0 pointer-events-auto">
          {[
            { id: 'DASHBOARD', icon: <RiLayoutGridLine size={20} /> },
            { id: 'ASK_IRIS', icon: <RiQuestionAnswerLine size={20} /> },
            { id: 'APPS', icon: <RiApps2Line size={20} /> },
            { id: 'CODING', icon: <RiCodeBoxLine size={20} /> },
            { id: 'TERMINAL', icon: <RiTerminalBoxLine size={20} /> },
            { id: 'MEMORY', icon: <RiBrainLine size={20} /> },
            { id: 'TASKS', icon: <RiCheckLine size={20} /> },
            { id: 'DOCUMENTS', icon: <RiFileTextLine size={20} /> },
            { id: 'GALLERY', icon: <RiImageLine size={20} /> },
            { id: 'SETTINGS', icon: <RiSettings4Line size={20} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => { playTabSwitch(); setActiveTab(tab.id); setFocusedTab(tab.id); }}
              className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
              title={tab.id}
            >
              {tab.icon}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-hidden relative bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'DASHBOARD' && (
              <DashboardView
                props={props}
                stats={stats}
                chatHistory={chatHistory}
                onVisionClick={handleVisionClick}
                onAskIris={handleAskIris}
                isGenerating={isGenerating}
              />
            )}
            {activeTab === 'APPS' && <AppsView glassPanel={glassPanel} reminders={reminders} setReminders={setReminders} setActiveTab={setActiveTab} />}
            {activeTab === 'CHAT' && <ChatView setActiveTab={setActiveTab} />}
            {activeTab === 'MEMORY' && <MemoryView />}
            
            <Suspense fallback={<ViewSkeleton />}>
              {activeTab === 'ASK_IRIS' && (
                <AskIrisView 
                  onAskIris={handleAskIris} 
                  isSystemActive={props.isSystemActive} 
                  chatHistory={chatHistory} 
                  onClearHistory={() => {
                    setChatHistory([{ role: 'assistant', content: 'IRIS System Initialized. Awaiting input.' }])
                    localStorage.removeItem('iris_chat_sessions')
                  }}
                />
              )}
              {activeTab === 'CODING' && <CodingView />}
              {activeTab === 'BROWSER' && <BrowserView />}
              {activeTab === 'SYSTEM' && <SystemView />}
              {activeTab === 'PLUGINS' && <PluginsView />}
              {activeTab === 'WORKFLOWS' && <WorkflowsView />}
              {activeTab === 'TERMINAL' && <TerminalView />}
              {activeTab === 'AGENT' && <AgentView />}
              {activeTab === 'SETTINGS' && <SettingsView isSystemActive={props.isSystemActive} />}
              {activeTab === 'TASKS' && <TasksView />}
              {activeTab === 'CALENDAR' && <CalendarView glassPanel={glassPanel} />}
              {activeTab === 'DOCUMENTS' && <DocumentsView glassPanel={glassPanel} />}
              {activeTab === 'GALLERY' && <GalleryView />}
              {activeTab === 'PROFILE' && <ProfileView />}
              {activeTab === 'ABOUT' && <AboutView />}
              {activeTab === 'HELP' && <HelpView />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      </div>

      <NotificationOverlay />

      <input 
        type="file" 
        id="global-file-upload"
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => { 
          if (e.target.files?.[0]) { 
            props.uploadImage(e.target.files[0]); 
            setShowSourceModal(false); 
            e.target.value = '';
          } 
        }} 
        aria-label="Upload Image"
      />

      <AnimatePresence>
        {showSourceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${glassPanel} w-[450px] p-1 border-emerald-500/30 flex flex-col shadow-2xl`}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <span id="modal-title" className="text-xs font-bold tracking-widest text-emerald-400">
                  ESTABLISH UPLINK
                </span>
                <button
                  onClick={() => setShowSourceModal(false)}
                  className="cursor-pointer text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                  aria-label="Close modal"
                >
                  <RiCloseLine size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    usePermissionStore.getState().requestPermission('camera', 'Camera Access', 'Allow IRIS to view and analyze your camera feed.')
                      .then(granted => {
                        if (granted) {
                          useAuditStore.getState().logAction('Camera Access', null, 'success');
                          props.startVision('camera')
                          setShowSourceModal(false)
                        } else {
                          useAuditStore.getState().logAction('Camera Access', null, 'denied');
                        }
                      });
                  }}
                  aria-label="Use Camera Feed"
                  className="cursor-pointer group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                >
                  <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-emerald-500 text-zinc-400 group-hover:text-black transition-all">
                    <RiCameraLine size={28} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-300 group-hover:text-emerald-400">
                    CAMERA FEED
                  </span>
                </button>
                <button
                  onClick={() => {
                    usePermissionStore.getState().requestPermission('screen', 'Screen Share', 'Allow IRIS to view and analyze your screen content.')
                      .then(granted => {
                        if (granted) {
                          useAuditStore.getState().logAction('Screen Share', null, 'success');
                          props.startVision('screen')
                          setShowSourceModal(false)
                        } else {
                          useAuditStore.getState().logAction('Screen Share', null, 'denied');
                        }
                      });
                  }}
                  aria-label="Use Screen Share"
                  className="cursor-pointer group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                >
                  <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-emerald-500 text-zinc-400 group-hover:text-black transition-all">
                    <RiComputerLine size={28} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-300 group-hover:text-emerald-400">
                    SCREEN SHARE
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload Image"
                  className="cursor-pointer group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                >
                  <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-emerald-500 text-zinc-400 group-hover:text-black transition-all">
                    <RiUploadCloudLine size={28} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-300 group-hover:text-emerald-400 text-center">
                    UPLOAD IMAGE
                  </span>
                </button>
              </div>
              <div className="p-3 bg-black/20 text-center">
                <p className="text-[9px] text-zinc-600 font-mono">
                  SELECT INPUT SOURCE FOR NEURAL PROCESSING
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* SlideOut Panels */}
      <AnimatePresence>
        {activePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePanel(null)}
              className="absolute inset-0 z-[160] bg-black/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[400px] max-w-full z-[170] bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                <h3 className="font-bold text-xs tracking-widest text-emerald-400 uppercase">
                  {activePanel} PANEL
                </h3>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><ViewSkeleton /></div>}>
                  {activePanel === 'memory' && <MemoryView />}
                  {activePanel === 'calendar' && <CalendarView glassPanel={glassPanel} />}
                  {activePanel === 'terminal' && <TerminalView />}
                  {activePanel === 'macros' && <WorkflowsView />}
                  {activePanel === 'permissions' && <PermissionsPanel />}
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <MessageFeed
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          isSystemActive={props.isSystemActive}
          isMicMuted={props.isMicMuted}
          isVisible={isFeedVisible}
          onClose={() => setIsFeedVisible(false)}
          isGenerating={isGenerating}
        />
      </AnimatePresence>
    </div>
  )
}

export default IRIS
