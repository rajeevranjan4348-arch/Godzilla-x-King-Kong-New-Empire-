import { useState, useRef, useEffect } from 'react';
import { 
  RiAddLine,
  RiImageAddLine,
  RiStarLine,
  RiNotification3Line,
  RiMicLine,
  RiSendPlaneFill,
  RiUserLine,
  RiRobot2Line,
  RiVolumeUpLine,
  RiVolumeMuteLine,
  RiAttachment2,
  RiMenuLine,
  RiCloseLine,
  RiChat1Line,
  RiStopCircleLine,
  RiEqualizerLine,
  RiVoiceprintFill,
  RiCameraLine,
  RiGalleryLine,
  RiFileTextLine,
  RiDriveLine,
  RiBookletLine,
  RiImageLine,
  RiVideoLine,
  RiMusic2Line,
  RiLayoutMasonryLine,
  RiSearchEyeLine,
  RiBookOpenLine,
  RiCheckLine,
  RiArrowUpLine,
  RiLightbulbLine,
  RiDeleteBinLine,
  RiEditLine,
  RiArchiveLine,
  RiInboxUnarchiveLine,
  RiPaletteLine,
  RiDownloadLine,
  RiComputerLine,
  RiPlayLine
} from 'react-icons/ri';
import { playClick, playAction } from '../utils/audio';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  vscDarkPlus, 
  atomDark, 
  dracula, 
  oneDark, 
  nord, 
  nightOwl, 
  materialDark, 
  tomorrow 
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ReactMic } from 'react-mic-recorder';

const THEMES: Record<string, any> = {
  vscDarkPlus,
  atomDark,
  dracula,
  oneDark,
  nord,
  nightOwl,
  materialDark,
  tomorrow
};

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
      title="Copy code"
      aria-label="Copy code block"
    >
      {copied ? <RiCheckLine size={14} className="text-emerald-400" /> : <RiAttachment2 size={14} />}
    </button>
  );
};

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const match = /language-(\w+)/.exec(className || '');
  const currentThemeKey = localStorage.getItem('iris_code_theme') || 'vscDarkPlus';
  const activeTheme = THEMES[currentThemeKey] || vscDarkPlus;
  const content = String(children).replace(/\n$/, '');

  const handleRun = async () => {
    setIsRunning(true);
    let logs: string[] = [];
    const originalConsoleLog = console.log;
    
    // Create a custom console to capture output
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    };

    try {
      if (match && (match[1] === 'javascript' || match[1] === 'js')) {
        // eslint-disable-next-line no-new-func
        const fn = new Function(content);
        const result = await fn();
        if (result !== undefined) {
          logs.push(`Return: ${JSON.stringify(result)}`);
        }
      } else if (match && (match[1] === 'python' || match[1] === 'py')) {
        logs.push('Initializing Python environment...');
        setOutput(logs.join('\n'));
        
        let pyodide: any;
        if (!(window as any).pyodide) {
          if (!document.getElementById('pyodide-script')) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.id = 'pyodide-script';
              script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('Failed to load Pyodide'));
              document.head.appendChild(script);
            });
          }
          // @ts-ignore
          (window as any).pyodide = await (window as any).loadPyodide();
        }
        pyodide = (window as any).pyodide;
        pyodide.setStdout({ batched: (msg: string) => logs.push(msg) });
        pyodide.setStderr({ batched: (msg: string) => logs.push(`Error: ${msg}`) });
        
        // Remove the initialization message before showing actual output
        logs = []; 
        try {
          const result = await pyodide.runPythonAsync(content);
          if (result !== undefined) {
             logs.push(`Return: ${String(result)}`);
          }
        } catch (e: any) {
          logs.push(e.message || String(e));
        }
      } else {
        logs.push(`Cannot run language: ${match ? match[1] : 'unknown'}`);
      }
    } catch (err: any) {
      logs.push(`Error: ${err.message}`);
    } finally {
      console.log = originalConsoleLog;
      // Filter out empty lines that might result from trailing newlines in batched logs
      setOutput(logs.length > 0 ? logs.join('\n') : 'Executed successfully with no output.');
      setIsRunning(false);
    }
  };

  return !inline && match ? (
    <div className="relative group overflow-hidden rounded-xl border border-white/10 my-6">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10 relative">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{match[1]}</span>
        <div className="flex items-center gap-1">
          {(match[1] === 'javascript' || match[1] === 'js' || match[1] === 'python' || match[1] === 'py') && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`absolute top-2 right-10 p-1.5 rounded-md bg-white/5 hover:bg-emerald-500/20 transition-all z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold ${isRunning ? 'text-emerald-400' : 'text-zinc-400 hover:text-emerald-400'}`}
              title="Run code"
              aria-label="Run code block"
            >
              <RiPlayLine size={14} className={isRunning ? 'animate-pulse' : ''} /> 
            </button>
          )}
          <CopyButton content={content} />
        </div>
      </div>
      <SyntaxHighlighter
        {...props}
        children={content}
        style={activeTheme}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          fontSize: '0.8rem',
          background: 'transparent'
        }}
      />
      {output && (
        <div className="bg-black/80 border-t border-white/10 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase text-zinc-500 tracking-widest font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Console Output
            </span>
            <button onClick={() => setOutput(null)} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors">
              <RiCloseLine size={14} />
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  ) : (
    <code {...props} className={`${className} bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs`}>
      {children}
    </code>
  );
};

const CHAT_SYSTEM_PROMPT = `You are a smart AI assistant designed to control mobile apps using voice or text commands.

Your job is to:
1. Understand user commands clearly.
2. Identify the app and action (open, close, search, send message, etc.).
3. Execute or simulate the correct action.

Supported actions:
- Open apps (e.g., "Open WhatsApp")
- Close apps
- Send messages (e.g., "Send message to Rahul: Hello")
- Make calls
- Search on Google or YouTube
- Set alarms, reminders
- Create Calendar Events (always prompt for summary, start time, and end time before saving)
- Control settings (WiFi, Bluetooth, Flashlight)
- Make API calls to fetch real-time data like weather, news, etc.

Rules:
- Always confirm unclear commands.
- If app is not found, suggest alternatives.
- Respond in short and clear sentences.
- Prioritize speed and accuracy.
- You have the ability to open system applications if the user asks you to. If the user asks to open something like Gallery, Photos, Notes, Tasks, Dashboard, Settings, etc., use the open_app tool to launch it.
- **CRITICAL: When the user asks you to "call someone" or "message someone" (e.g. "Call Neha" or "Message Rahul"), you MUST extract their name and use the contact_action tool.**

Examples:
User: Open YouTube  
AI: Opening YouTube...

User: Call Neha
AI: Fetching contact details for Neha... (Calls contact_action)

User: Send message to Aman: I’ll call you later  
AI: Sending message to Aman... (Calls contact_action)

User: Call an API to get the weather in London.
AI: Let me check that for you... (Calls call_api)

User: Turn on WiFi  
AI: WiFi turned on.

Now wait for user command.`;

const CHAT_TOOLS = [{
  functionDeclarations: [
    {
      name: "open_app",
      description: "Opens an application or module in the system by its name. Use this when the user asks to open an app (e.g. Calendar, Notes, Memory, Camera, Chat, Settings, Tasks, Gallery, Dashboard, Documents).",
      parameters: {
         type: "OBJECT",
         properties: {
           app_name: {
             type: "STRING",
             description: "The name of the app to open. Should be one of: CHAT, MEMORY, TASKS, GALLERY, SETTINGS, DASHBOARD, APPS, CODING, WORKFLOWS, CALENDAR, DOCUMENTS, TERMINAL"
           }
         },
         required: ["app_name"]
      }
    },
    {
      name: "save_note",
      description: "Saves a note to the device's local Memory/Notes. Use this when the user asks you to 'remember this', 'take a note', or 'save this'.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "A short, descriptive title for the note" },
          content: { type: "STRING", description: "The detailed content of the note" }
        },
        required: ["title", "content"]
      }
    },
    {
      name: "create_task",
      description: "Creates a new task in the Todo/Tasks app. Use this when the user asks you to 'add a task', 'remind me to', or 'put this on my todo list'.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "The task title" },
          description: { type: "STRING", description: "The task details (optional)" }
        },
        required: ["title"]
      }
    },
    {
      name: "call_api",
      description: "Make an HTTP GET request to a specified URL (API endpoint) to fetch data like weather, news, or any other API required by the user.",
      parameters: {
         type: "OBJECT",
         properties: {
           url: { type: "STRING", description: "The full URL of the API endpoint to call." },
           summary_focus: { type: "STRING", description: "What specific information to extract or summarize from the response (e.g. 'the current temperature and weather conditions')." }
         },
         required: ["url"]
      }
    },
    {
      name: "contact_action",
      description: "Initiates a phone call or SMS message to a person. Use this when the user says 'call [name]' or 'message [name]'.",
      parameters: {
         type: "OBJECT",
         properties: {
           name: { type: "STRING", description: "The name of the person to contact (e.g. 'Neha', 'Rahul')" },
           action: { type: "STRING", description: "Either 'call' or 'message'" },
           message: { type: "STRING", description: "The message body if action is 'message'" }
         },
         required: ["name", "action"]
      }
    },
    {
      name: "addCalendarEvent",
      description: "Adds a new event to the user's Google Calendar. Use this when the user asks to schedule a meeting, add an event, or create a reminder on their calendar.",
      parameters: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING", description: "The title or summary of the event." },
          description: { type: "STRING", description: "Optional description or details for the event." },
          startTime: { type: "STRING", description: "The start time of the event in ISO 8601 format (e.g., '2023-10-27T10:00:00Z')." },
          endTime: { type: "STRING", description: "The end time of the event in ISO 8601 format (e.g., '2023-10-27T11:00:00Z')." }
        },
        required: ["summary", "startTime", "endTime"]
      }
    }
  ]
}];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: string;
    data: string; // base64
    name: string;
  };
  audio?: string; // base64 audio
  timestamp?: string;
}

interface ChatSession {
  id: number;
  timestamp: string;
  messages: Message[];
  summary?: string;
  archived?: boolean;
}

export default function ChatView({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [attachment, setAttachment] = useState<Message['attachment'] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Fast');
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [syntaxThemeKey, setSyntaxThemeKey] = useState(() => localStorage.getItem('iris_code_theme') || 'vscDarkPlus');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = (themeKey: string) => {
    setSyntaxThemeKey(themeKey);
    localStorage.setItem('iris_code_theme', themeKey);
    setShowThemeMenu(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('rishi_chat_sessions');
    if (saved) {
      const parsedSessions = JSON.parse(saved);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) {
        setMessages(parsedSessions[0].messages);
        setCurrentSessionId(parsedSessions[0].id);
      }
    }
    
    const handleCloseMods = () => {
      setIsSidebarOpen(false);
      setShowPlusMenu(false);
      setShowModelMenu(false);
      setShowThemeMenu(false);
    }
    window.addEventListener('close-modals', handleCloseMods);
    return () => window.removeEventListener('close-modals', handleCloseMods);
  }, []);

  const sessionIdRef = useRef<number | null>(null);

  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    setSessions(prevSessions => {
      let updatedSessions = [...prevSessions];
      let targetId = sessionIdRef.current;
      
      if (targetId) {
        const idx = updatedSessions.findIndex(s => s.id === targetId);
        if (idx !== -1) {
          updatedSessions[idx] = { ...updatedSessions[idx], messages: messages };
        } else {
          const newSession = {
            id: targetId,
            timestamp: new Date().toISOString(),
            messages: messages
          };
          updatedSessions.unshift(newSession);
        }
      } else {
        const newId = Date.now();
        sessionIdRef.current = newId; // prevent race condition synchronously
        const newSession = {
          id: newId,
          timestamp: new Date().toISOString(),
          messages: messages
        };
        updatedSessions.unshift(newSession);
        setTimeout(() => setCurrentSessionId(newId), 0);
      }
      
      localStorage.setItem('rishi_chat_sessions', JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  }, [messages]);

  const deleteMessage = (idx: number) => {
    setMessages(prev => prev.filter((_, i) => i !== idx));
  };
  
  const startNewChat = () => {
    playClick();
    setMessages([]);
    setCurrentSessionId(null);
    setIsSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    playClick();
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsSidebarOpen(false);
  };

  const summarizeSession = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (session.messages.length === 0) return;
    
    playAction();
    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      const ai = new GoogleGenAI({ apiKey });
      
      const chatText = session.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `Summarize the following chat conversation in one short sentence:\n\n${chatText}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      
      const summary = response.text;
      
      const updatedSessions = sessions.map(s => 
        s.id === session.id ? { ...s, summary } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem('rishi_chat_sessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error("Failed to summarize session:", error);
      alert("Failed to generate summary.");
    }
  };

  const deleteSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem('rishi_chat_sessions', JSON.stringify(updatedSessions));
    if (currentSessionId === id) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const toggleArchiveSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updatedSessions = sessions.map(s => 
      s.id === id ? { ...s, archived: !s.archived } : s
    );
    setSessions(updatedSessions);
    localStorage.setItem('rishi_chat_sessions', JSON.stringify(updatedSessions));
    if (currentSessionId === id && updatedSessions.find(s => s.id === id)?.archived) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const startRenameSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.summary || session.messages[0]?.content || 'New Chat');
  };

  const saveRenameSession = () => {
    if (editingSessionId) {
      const updatedSessions = sessions.map(s => 
        s.id === editingSessionId ? { ...s, summary: editingTitle } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem('rishi_chat_sessions', JSON.stringify(updatedSessions));
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const summarizeChatAsMessage = async () => {
    if (messages.length === 0 || isLoading) return;
    setIsLoading(true);
    playAction();
    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      if (!apiKey) throw new Error("API key not found");
      const ai = new GoogleGenAI({ apiKey });
      
      const chatText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `Summarize the following chat conversation into a concise summary of the main points and decisions:\n\n${chatText}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      
      const summaryMessage: Message = {
        role: 'assistant',
        content: `**Chat Summary:**\n\n${response.text}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Failed to summarize chat.");
    } finally {
      setIsLoading(false);
    }
  };

  const recognitionRef = useRef<any>(null);
  const inputBeforeRecordRef = useRef<string>('');

  const startListening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setIsListening(true);
      
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
             let transcript = '';
             for (let i = 0; i < event.results.length; i++) {
               transcript += event.results[i][0].transcript;
             }
             setInput(inputBeforeRecordRef.current + (inputBeforeRecordRef.current ? ' ' : '') + transcript);
          };
          
          recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
            setIsListening(false);
          };
          
          recognitionRef.current = recognition;
        }
        
        inputBeforeRecordRef.current = input;
        recognitionRef.current.start();
      } else {
        alert("Speech recognition is not supported in this browser.");
        setIsRecording(false);
        setIsListening(false);
      }
    } catch (err: any) {
      console.error("Microphone permission denied:", err);
      alert("Microphone permission denied. Please allow access to use this feature.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };
  
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' },
        audio: false
      });
      
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAttachment({
            type: 'video/webm',
            data: base64Data,
            name: 'Screen_Recording.webm'
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        setIsScreenRecording(false);
      };
      
      recorder.start();
      setIsScreenRecording(true);
      setShowPlusMenu(false);
      
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };
    } catch (err) {
      console.error("Error starting screen recording:", err);
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const onStopRecording = (recordedBlob: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(recordedBlob.blob);
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      handleSendAudio(base64Audio, recordedBlob.blob.type);
    };
  };

  const handleSendAudio = async (base64Audio: string, mimeType: string) => {
    if (!base64Audio) return;

    playAction();
    const userMessage: Message = { role: 'user', content: '🎙️ Voice Message', audio: base64Audio, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      if (!apiKey) throw new Error("API key not found");
      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = CHAT_SYSTEM_PROMPT;

      const contents = newMessages.map(msg => {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.attachment) {
          parts.push({
            inlineData: {
              data: msg.attachment.data,
              mimeType: msg.attachment.type
            }
          });
        }
        if (msg.audio) {
          parts.push({
            inlineData: {
              data: msg.audio.split(',')[1],
              mimeType: mimeType
            }
          });
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      let apiModel = 'gemini-2.5-flash';
      if (selectedModel === 'Extreme fast reply ultra pro Max') apiModel = 'gemini-2.5-flash-8b';
      else if (selectedModel === 'Extreme Fast') apiModel = 'gemini-2.5-flash-8b';
      else if (selectedModel === 'Thinking') apiModel = 'gemini-2.0-flash-thinking-exp-01-21';
      else if (selectedModel === 'Pro') apiModel = 'gemini-3.1-pro-preview';

      if (selectedModel.startsWith('GPT')) {
        const openaiKey = localStorage.getItem('iris_openai_api_key') || (import.meta && import.meta.env ? import.meta.env.VITE_OPENAI_API_KEY : '');
        if (!openaiKey) {
          setMessages(prev => [...prev, { role: 'assistant', content: "OpenAI API key missing. Go to settings to set it.", timestamp: new Date().toISOString() }]);
          setIsLoading(false);
          return;
        }
        const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
        const stream = await openai.chat.completions.create({
          model: selectedModel === 'GPT-4o' ? 'gpt-4o' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.map(m => ({ role: m.role as any, content: m.content || '(Media attachment)' }))
          ],
          stream: true
        });
        
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
        let finalResponse = '';
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            finalResponse += text;
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role === 'assistant') lastMsg.content += text;
              return updated;
            });
          }
        }
        speakText(finalResponse);
      } else {
        const responseStream = await ai.models.generateContentStream({
          model: apiModel,
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: CHAT_TOOLS as any
          }
        });

        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

        let finalResponse = '';
        for await (const chunk of responseStream) {
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            for (const call of chunk.functionCalls) {
              handleFunctionCall(call, (text) => {
                finalResponse += text + '\n';
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content = finalResponse;
                  }
                  return updated;
                });
              });
            }
            break; // Stop processing further chunks if we handled a tool
          }
          const text = chunk.text;
          if (text) {
             finalResponse += text;
             setMessages(prev => {
               const updated = [...prev];
               const lastMsg = updated[updated.length - 1];
               if (lastMsg.role === 'assistant') {
                 lastMsg.content += text;
               }
               return updated;
             });
          }
        }

        speakText(finalResponse);
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your voice message.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exportChat = (format: 'markdown' | 'json') => {
    playClick();
    if (messages.length === 0) return;
    
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';
    const dateStr = new Date().toISOString().split('T')[0];
    
    if (format === 'markdown') {
      content = `# IRIS Chat Export (${dateStr})\n\n`;
      messages.forEach(m => {
        content += `**${m.role === 'assistant' ? 'IRIS' : 'You'}**:\n${m.content}\n\n---\n\n`;
      });
      mimeType = 'text/markdown';
      ext = 'md';
    } else {
      content = JSON.stringify(messages, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iris-chat-${dateStr}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFunctionCall = (call: any, appendToResponse: (text: string) => void) => {
    if (call.name === 'open_app') {
       const appToOpen = (call.args as any)?.app_name;
       if (appToOpen) {
         appendToResponse(`Opening ${appToOpen} for you...`);
         speakText(`Opening ${appToOpen}`);
         setTimeout(() => {
           if (typeof setActiveTab === 'function') {
             setActiveTab(appToOpen.toUpperCase());
           }
         }, 1500);
       }
    } else if (call.name === 'save_note') {
       const { title, content } = call.args as any;
       if (title && content) {
          const notesRaw = localStorage.getItem('iris_notes') || '[]';
          const notes = JSON.parse(notesRaw);
          notes.push({ id: Date.now().toString(), title, content, timestamp: new Date().toISOString() });
          localStorage.setItem('iris_notes', JSON.stringify(notes));
          window.dispatchEvent(new Event('iris_notes_updated'));
          appendToResponse(`Note saved: "${title}"`);
          speakText(`I have saved the note: ${title}`);
       }
    } else if (call.name === 'create_task') {
       const { title, description } = call.args as any;
       if (title) {
          const tasksRaw = localStorage.getItem('iris_tasks') || '[]';
          const tasks = JSON.parse(tasksRaw);
          tasks.push({ id: Date.now().toString(), title, description: description || '', completed: false, createdAt: new Date().toISOString() });
          localStorage.setItem('iris_tasks', JSON.stringify(tasks));
          window.dispatchEvent(new Event('iris_tasks_updated'));
          appendToResponse(`Task created: "${title}"`);
          speakText(`Task created: ${title}`);
       }
    } else if (call.name === 'call_api') {
       const { url, summary_focus } = call.args as any;
       if (url) {
          appendToResponse(`Calling API: ${url}...`);
          fetch(url)
            .then(res => res.json().catch(() => res.text()))
            .then(async (data) => {
               const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
               const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
               const ai = new GoogleGenAI({ apiKey });
               try {
                 const res = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Summarize this API response in 1-3 short sentences, focusing specifically on: "${summary_focus || 'the most important information'}". Make it sound natural to be spoken aloud. Data: ${dataStr.substring(0, 5000)}`
                 });
                 const summary = res.text;
                 appendToResponse(`\nAPI Response Summary:\n${summary}`);
                 speakText(summary || "I have fetched the data.");
               } catch (aiErr) {
                 appendToResponse(`\nAPI called successfully but couldn't summarize data.`);
               }
            })
            .catch(e => {
               appendToResponse(`\nFailed to call API: ${e.message}`);
               speakText(`Failed to fetch data from the API.`);
            });
       }
    } else if (call.name === 'contact_action') {
       const { name, action, message } = call.args as any;
       // Mock a small dynamic contact list retrieval
       const contacts: Record<string, string> = {
         'neha': '+91 98765 43210',
         'rahul': '+91 98765 43211',
         'aman': '+91 98765 43212',
         'mom': '+91 98765 43213',
       };
       const lookName = name.toLowerCase().trim();
       const foundNumber = Object.keys(contacts).find(k => lookName.includes(k)) 
             ? contacts[Object.keys(contacts).find(k => lookName.includes(k))!] 
             : '+91 00000 00000'; // Default fallback

       if (action === 'call') {
          appendToResponse(`Searching contacts for ${name}...\nFound number: ${foundNumber}\nInitiating call to ${name}...`);
          speakText(`Calling ${name}`);
          setTimeout(() => {
            window.location.href = `tel:${foundNumber.replace(/\s+/g, '')}`;
          }, 1500);
       } else if (action === 'message') {
          appendToResponse(`Searching contacts for ${name}...\nFound number: ${foundNumber}\nPreparing message...`);
          speakText(`Messaging ${name}`);
          setTimeout(() => {
            window.location.href = `sms:${foundNumber.replace(/\s+/g, '')}?body=${encodeURIComponent(message || '')}`;
          }, 1500);
       }
    } else if (call.name === 'addCalendarEvent') {
       const { summary, description, startTime, endTime } = call.args as any;
       import('../services/googleCalendar').then(async (cal) => {
         try {
           await cal.addEvent(summary, description || '', startTime, endTime);
           appendToResponse(`Calendar event added: "${summary}" from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}`);
           speakText(`Added event: ${summary} to your calendar`);
           setTimeout(() => {
             if (typeof setActiveTab === 'function') {
               setActiveTab('CALENDAR');
             }
           }, 1500);
         } catch (e) {
           appendToResponse(`Failed to add event. Are you authenticated?`);
           speakText(`Failed to add event to your calendar.`);
         }
       });
    }
  };

  const speakText = (text: string) => {
    if (!isTtsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Indian accent for Rishi
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const data = base64.split(',')[1];
      setAttachment({
        type: file.type,
        data: data,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    const pendingMsg = localStorage.getItem('pending_chat_message');
    const pendingAtt = localStorage.getItem('pending_chat_attachment');
    if (pendingMsg || pendingAtt) {
      localStorage.removeItem('pending_chat_message');
      localStorage.removeItem('pending_chat_attachment');
      const attType = localStorage.getItem('pending_chat_attachment_type') || 'image/jpeg';
      const attName = localStorage.getItem('pending_chat_attachment_name') || 'image.jpg';
      localStorage.removeItem('pending_chat_attachment_type');
      localStorage.removeItem('pending_chat_attachment_name');
      
      const att = pendingAtt ? { data: pendingAtt, type: attType, name: attName } : undefined;
      
      setTimeout(() => {
        sendMessageDirectly(pendingMsg || '', att);
      }, 500);
    }
  }, []);

  const sendMessageDirectly = async (userMessage: string, currentAttachment?: Message['attachment']) => {
    if ((!userMessage.trim() && !currentAttachment) || isLoading) return;
    
    playAction();
    
    setMessages(prevMessages => {
      const newMessages: Message[] = [...prevMessages, { role: 'user', content: userMessage, attachment: currentAttachment || undefined, timestamp: new Date().toISOString() }];
      
      setIsLoading(true);
      
      // Async IIFE to handle the API call with the updated messages
      (async () => {
        try {
          const customKey = localStorage.getItem('iris_custom_api_key');
          const viteKey = (import.meta && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : '';
          let systemKey = '';
          try {
            const res = await fetch('/api/config');
            if (res.ok) {
               const config = await res.json();
               systemKey = config.geminiApiKey || '';
            }
          } catch(e) {}
          
          const apiKey = customKey || viteKey || systemKey;
          if (!apiKey) throw new Error("API key not found");
          const ai = new GoogleGenAI({ apiKey });
          
          const systemPrompt = CHAT_SYSTEM_PROMPT;

          const contents = newMessages.map(msg => {
            const parts: any[] = [];
            if (msg.content) parts.push({ text: msg.content });
            if (msg.attachment) {
              parts.push({
                inlineData: {
                  data: msg.attachment.data,
                  mimeType: msg.attachment.type
                }
              });
            }
            if (msg.audio) {
              parts.push({
                inlineData: {
                  data: msg.audio.split(',')[1],
                  mimeType: 'audio/webm'
                }
              });
            }
            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts
            };
          });

          let apiModel = 'gemini-2.5-flash';
          if (selectedModel === 'Extreme fast reply ultra pro Max') apiModel = 'gemini-2.5-flash-8b';
          else if (selectedModel === 'Extreme Fast') apiModel = 'gemini-2.5-flash-8b';
          else if (selectedModel === 'Thinking') apiModel = 'gemini-2.0-flash-thinking-exp-01-21';
          else if (selectedModel === 'Pro') apiModel = 'gemini-3.1-pro-preview';

          if (selectedModel.startsWith('GPT')) {
            const openaiKey = localStorage.getItem('iris_openai_api_key') || (import.meta && import.meta.env ? import.meta.env.VITE_OPENAI_API_KEY : '');
            if (!openaiKey) {
              setMessages(prev => [...prev, { role: 'assistant', content: "OpenAI API key missing. Go to settings to set it.", timestamp: new Date().toISOString() }]);
              setIsLoading(false);
              return;
            }
            const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
            const stream = await openai.chat.completions.create({
              model: selectedModel === 'GPT-4o' ? 'gpt-4o' : 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...newMessages.map(m => ({ role: m.role as any, content: m.content || '(Media attachment)' }))
              ],
              stream: true
            });
            
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
            let finalResponse = '';
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                finalResponse += text;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg.role === 'assistant') lastMsg.content += text;
                  return updated;
                });
              }
            }
            speakText(finalResponse);
          } else {
            const responseStream = await ai.models.generateContentStream({
              model: apiModel,
              contents,
              config: {
                systemInstruction: systemPrompt,
                tools: CHAT_TOOLS as any
              }
            });

            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);

            let finalResponse = '';
            for await (const chunk of responseStream) {
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                for (const call of chunk.functionCalls) {
                  handleFunctionCall(call, (text) => {
                    finalResponse += text + '\n';
                    setMessages(prev => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg.role === 'assistant') {
                        lastMsg.content = finalResponse;
                      }
                      return updated;
                    });
                  });
                }
                break; // Stop processing further chunks if we handled a tool
              }
              const text = chunk.text;
              if (text) {
                 finalResponse += text;
                 setMessages(prev => {
                   const updated = [...prev];
                   const lastMsg = updated[updated.length - 1];
                   if (lastMsg.role === 'assistant') {
                     lastMsg.content += text;
                   }
                   return updated;
                 });
              }
            }

            speakText(finalResponse);
          }
        } catch (error) {
          console.error("Failed to get response:", error);
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = "Error: Failed to connect to Gemini API.";
            } else {
              updated.push({ role: 'assistant', content: 'Error: Failed to connect to Gemini API.', timestamp: new Date().toISOString() });
            }
            return updated;
          });
        } finally {
          setIsLoading(false);
        }
      })();
      
      return newMessages;
    });
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    const currentAttachment = attachment;
    setInput('');
    setAttachment(null);
    await sendMessageDirectly(userMessage, currentAttachment || undefined);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf', 'text/plain'];
      
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        alert("Unsupported file format. Please upload an image, PDF, or text file.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachment({
          type: file.type || 'image/jpeg',
          data: base64Data,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="h-full w-full flex flex-col bg-[#0a0a0a] text-zinc-300 relative"
      onClick={() => {
        if (showPlusMenu) setShowPlusMenu(false);
        if (showModelMenu) setShowModelMenu(false);
        if (showThemeMenu) setShowThemeMenu(false);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Visual drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-emerald-500/50 rounded-2xl m-4 pointer-events-none transition-all">
          <div className="flex flex-col items-center gap-4 bg-zinc-900 shadow-2xl shadow-black p-8 rounded-3xl border border-white/10">
            <RiImageAddLine size={48} className="text-emerald-400 animate-bounce" />
            <span className="text-xl font-bold text-white tracking-wide">Drop file to attach</span>
            <span className="text-xs text-zinc-400">Supports images, PDFs, and text files</span>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <div className={`absolute top-0 left-0 bottom-0 w-64 bg-zinc-950 border-r border-white/10 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-widest text-white">HISTORY</span>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${showArchived ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
              aria-pressed={showArchived}
              aria-label={showArchived ? "Show Active Sessions" : "Show Archived Sessions"}
            >
              {showArchived ? 'ARCHIVED' : 'ACTIVE'}
            </button>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} title="Close History" aria-label="Close History sidebar" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <RiCloseLine size={20} className="text-zinc-400" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2 overflow-y-auto h-[calc(100%-60px)] scrollbar-small">
          {sessions.filter(s => showArchived ? s.archived : !s.archived).map(session => (
            <div 
              key={session.id}
              className={`flex flex-col gap-2 p-3 rounded-xl transition-colors text-left group ${currentSessionId === session.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              {editingSessionId === session.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveRenameSession(); }}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500 w-full"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingSessionId(null)} className="text-[10px] text-zinc-500 hover:text-white" aria-label="Cancel rename">Cancel</button>
                    <button onClick={saveRenameSession} className="text-[10px] text-emerald-400 hover:text-emerald-300" aria-label="Save generic session name">Save</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => loadSession(session)}
                  title="Load Session"
                  aria-label={`Load chat session: ${session.summary || session.messages[0]?.content || 'New Chat'}`}
                  className="flex items-center gap-3 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                >
                  <RiChat1Line size={16} className={currentSessionId === session.id ? 'text-emerald-400 shrink-0' : 'text-zinc-500 shrink-0'} />
                  <div className="flex flex-col overflow-hidden text-left flex-1">
                    <span className={`text-xs font-bold truncate ${currentSessionId === session.id ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {session.summary || session.messages[0]?.content || 'New Chat'}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono mt-0.5">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              )}
              
              {!editingSessionId && (
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                    <button onClick={(e) => startRenameSession(e, session)} title="Rename" aria-label={`Rename session ${session.summary || 'New Chat'}`} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white">
                      <RiEditLine size={12} aria-hidden="true" />
                    </button>
                    <button onClick={(e) => toggleArchiveSession(e, session.id)} title={session.archived ? "Unarchive" : "Archive"} aria-label={session.archived ? "Unarchive session" : "Archive session"} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-amber-400">
                      {session.archived ? <RiInboxUnarchiveLine size={12} aria-hidden="true" /> : <RiArchiveLine size={12} aria-hidden="true" />}
                    </button>
                    <button onClick={(e) => deleteSession(e, session.id)} title="Delete" aria-label="Delete session" className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400">
                      <RiDeleteBinLine size={12} aria-hidden="true" />
                    </button>
                  </div>
                  {!session.summary && session.messages.length > 0 && (
                    <button 
                      onClick={(e) => summarizeSession(e, session)}
                      title="Generate Summary"
                      aria-label="Generate chat summary"
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors bg-white/5 px-2 py-1 rounded"
                    >
                      ✨
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none">
        <div className="flex-1 flex justify-start pointer-events-auto">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            title="Open History"
            aria-label="Open chat history sidebar"
            aria-expanded={isSidebarOpen}
            className="flex items-center justify-center w-12 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <RiMenuLine size={20} className="text-zinc-400" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col items-center flex-1 pointer-events-auto">
          <h1 className="text-3xl font-black tracking-[0.15em] text-white">RISHI</h1>
          <div className="flex items-center gap-2 mt-1 py-0.5 px-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></div>
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isLoading ? 'text-emerald-500' : 'text-zinc-500'}`}>
              {isLoading ? 'THINKING' : 'IDLE'}
            </span>
          </div>
        </div>
        <div className="flex-1 flex justify-end gap-3 pointer-events-auto relative">
          {messages.length > 4 && (
            <button 
              onClick={summarizeChatAsMessage}
              className="flex items-center justify-center font-mono gap-2 px-4 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-emerald-400"
              title="Summarize Chat Log"
              aria-label="Summarize Chat Log"
            >
              <RiLightbulbLine size={16} aria-hidden="true" />
              <span className="text-xs uppercase tracking-widest hidden md:block">Summarize</span>
            </button>
          )}
          <button 
            onClick={() => exportChat('markdown')}
            className="flex items-center justify-center w-12 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors"
            title="Download Chat (Markdown)"
            aria-label="Download Chat History"
          >
            <RiDownloadLine size={20} className="text-zinc-400" aria-hidden="true" />
          </button>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); playClick(); setShowThemeMenu(!showThemeMenu); }}
              className="flex items-center justify-center w-12 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors"
              title="Code Theme"
              aria-label="Select Code Highlight Theme"
              aria-haspopup="menu"
              aria-expanded={showThemeMenu}
            >
              <RiPaletteLine size={20} className="text-zinc-400" aria-hidden="true" />
            </button>
            {showThemeMenu && (
              <div role="menu" className="absolute top-14 right-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-1 w-40 z-50 shadow-2xl">
                {Object.keys(THEMES).map(themeName => (
                  <button
                    key={themeName}
                    role="menuitem"
                    onClick={(e) => { e.stopPropagation(); playClick(); handleThemeChange(themeName); }}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center justify-between ${syntaxThemeKey === themeName ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-300 hover:bg-white/5'}`}
                  >
                    {themeName}
                    {syntaxThemeKey === themeName && <RiCheckLine size={14} className="text-emerald-400" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => { playClick(); setIsTtsEnabled(!isTtsEnabled); }}
            className="flex items-center justify-center w-12 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors"
            title={isTtsEnabled ? "Mute Voice" : "Enable Voice"}
            aria-label={isTtsEnabled ? "Mute AI Voice" : "Enable AI Voice"}
            aria-pressed={isTtsEnabled}
          >
            {isTtsEnabled ? <RiVolumeUpLine size={20} className="text-emerald-400" aria-hidden="true" /> : <RiVolumeMuteLine size={20} className="text-zinc-500" aria-hidden="true" />}
          </button>
          <button 
            onClick={startNewChat}
            title="Start New Chat"
            aria-label="Start New Chat"
            className="flex items-center gap-2 px-5 h-12 bg-zinc-900 border border-white/10 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <RiAddLine size={18} className="text-zinc-400" aria-hidden="true" />
            <span className="text-xs font-bold text-zinc-300 text-left leading-tight">New<br/>Chat</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-6 pt-24 pb-32 overflow-y-auto scrollbar-small">
        <div className="flex flex-col gap-6 max-w-3xl w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full mt-20 opacity-50">
              <RiRobot2Line size={48} className="mb-4 text-zinc-500" />
              <p className="text-sm font-mono tracking-widest text-zinc-500 uppercase">Rishi AI Online</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`group flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                  {msg.role === 'user' ? <RiUserLine size={16} className="text-white" /> : <RiRobot2Line size={16} className="text-white" />}
                </div>
                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                      {msg.role === 'user' ? 'You' : 'Rishi'}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[9px] text-zinc-600 font-mono tracking-normal">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button 
                      onClick={() => deleteMessage(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-red-400 transition-all"
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      <RiDeleteBinLine size={12} />
                    </button>
                  </div>
                  <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-sm' : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-sm'}`}>
                    {msg.attachment && (
                      <div className="mb-3 max-w-xs rounded-lg overflow-hidden border border-white/10">
                        {msg.attachment.type.startsWith('image/') ? (
                          <img src={`data:${msg.attachment.type};base64,${msg.attachment.data}`} alt="Attachment" className="w-full h-auto" />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-zinc-800/50">
                            <RiAttachment2 size={24} className="text-zinc-400" />
                            <span className="text-xs font-mono truncate">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body prose prose-invert prose-sm max-w-none">
                        {msg.content === '' && isLoading ? (
                          <div className="flex items-center gap-1.5 h-5 px-1">
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        ) : (
                          <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: CodeBlock
                            }}
                          >
                            {msg.content}
                          </Markdown>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Bar */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 flex flex-col items-center z-10 gap-3">
        {/* Fast Replies */}
        {!isLoading && (
          <div className="w-full max-w-4xl flex flex-wrap gap-2 justify-center">
            {(messages.length === 0 
              ? ['Write a React component', 'Explain this code', 'Fix a bug', 'Generate a Python script']
              : ['Tell me more', 'Summarize this', 'Give an example', "What's next?"]
            ).map((reply, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(reply);
                  setTimeout(() => {
                    const sendBtn = document.getElementById('chat-send-btn');
                    if (sendBtn) sendBtn.click();
                  }, 50);
                }}
                className="px-4 py-2 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[11px] hover:bg-zinc-700 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        
        <div className="w-full max-w-4xl flex flex-col gap-2 relative">
          {/* Plus Menu */}
          {showPlusMenu && (
            <div 
              className="absolute bottom-[calc(100%+10px)] left-0 bg-[#282828] rounded-[24px] p-2 w-56 shadow-2xl flex flex-col gap-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); setShowPlusMenu(false); }}>
                <RiCameraLine size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Camera</span>
              </button>
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); setShowPlusMenu(false); }}>
                <RiGalleryLine size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Photos</span>
              </button>
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); const fileInput = document.getElementById('chat-file-upload') as HTMLInputElement; if (fileInput) fileInput.click(); setShowPlusMenu(false); }}>
                <RiAttachment2 size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Files</span>
              </button>
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); setShowPlusMenu(false); }}>
                <RiImageLine size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Create image</span>
              </button>
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); setSelectedModel('Thinking'); setShowPlusMenu(false); }}>
                <RiLightbulbLine size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Thinking</span>
              </button>
              <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); setShowPlusMenu(false); }}>
                <RiSearchEyeLine size={20} className="text-zinc-200" />
                <span className="text-sm text-zinc-100 font-medium">Deep research</span>
              </button>
              {isScreenRecording ? (
                <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left text-red-500" onClick={() => { playClick(); stopScreenRecording(); setShowPlusMenu(false); }}>
                  <RiStopCircleLine size={20} className="animate-pulse" />
                  <span className="text-sm font-medium">Stop Recording Screen</span>
                </button>
              ) : (
                <button className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left" onClick={() => { playClick(); startScreenRecording(); }}>
                  <RiComputerLine size={20} className="text-emerald-400" />
                  <span className="text-sm text-zinc-100 font-medium">Record Screen</span>
                </button>
              )}
            </div>
          )}

          {/* Model Menu ... */}
          {showModelMenu && (
            <div 
              className="absolute bottom-[calc(100%+10px)] left-12 bg-zinc-900 border border-white/10 rounded-2xl p-2 w-72 shadow-2xl flex flex-col gap-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/10 mb-1">Gemini 3</div>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('Extreme fast reply ultra pro Max'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">Extreme fast reply ultra pro Max</span>
                  <span className="text-[10px] text-zinc-500">Fast reply in just 2 second</span>
                </div>
                {selectedModel === 'Extreme fast reply ultra pro Max' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('Extreme Fast'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">Extreme Fast</span>
                  <span className="text-[10px] text-zinc-500">Instant responses</span>
                </div>
                {selectedModel === 'Extreme Fast' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('Fast'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">Fast</span>
                  <span className="text-[10px] text-zinc-500">Answers quickly</span>
                </div>
                {selectedModel === 'Fast' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('Thinking'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">Thinking</span>
                  <span className="text-[10px] text-zinc-500">Solves complex problems</span>
                </div>
                {selectedModel === 'Thinking' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('Pro'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">Pro</span>
                  <span className="text-[10px] text-zinc-500">Advanced maths and code with 3.1 Pro</span>
                </div>
                {selectedModel === 'Pro' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              
              <div className="px-4 py-2 mt-1 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/10 mb-1">OpenAI</div>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('GPT-4o'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">GPT-4o</span>
                  <span className="text-[10px] text-zinc-500">OpenAI's most capable model</span>
                </div>
                {selectedModel === 'GPT-4o' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
              <button 
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left" 
                onClick={() => { playClick(); setSelectedModel('GPT-4o-mini'); setShowModelMenu(false); }}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-200 font-medium">GPT-4o-mini</span>
                  <span className="text-[10px] text-zinc-500">Fast and efficient OpenAI model</span>
                </div>
                {selectedModel === 'GPT-4o-mini' && <RiCheckLine size={18} className="text-blue-500" />}
              </button>
            </div>
          )}

          {/* Input Bar */}
          {isScreenRecording && (
            <div className="w-full flex items-center justify-between bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl mb-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-sm font-bold tracking-wider">RECORDING SCREEN</span>
              </div>
              <button 
                onClick={() => { playClick(); stopScreenRecording(); }}
                className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                STOP & ATTACH
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 relative w-full pb-4">
            <button 
              onClick={() => { playClick(); setShowPlusMenu(!showPlusMenu); setShowModelMenu(false); }}
              title="Open Attachments Menu"
              aria-label="Open Attachments Menu"
              aria-expanded={showPlusMenu}
              aria-haspopup="menu"
              className="text-zinc-300 bg-[#282828] hover:bg-[#383838] rounded-full transition-colors shrink-0 flex items-center justify-center h-12 w-12 shadow-lg shadow-black/20"
            >
              <RiAddLine size={24} aria-hidden="true" />
            </button>
            
            <div className="flex-1 flex flex-col justify-end bg-[#282828] rounded-full min-h-[48px] relative shadow-lg shadow-black/20 overflow-hidden">
              
              {/* Attachment Preview */}
              {attachment && (
                <div className="flex items-center gap-2 p-2 mt-2 mx-4 bg-zinc-800/50 rounded-xl border border-white/5 w-fit max-w-full">
                  <RiAttachment2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono text-zinc-300 truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} title="Remove Attachment" className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-full transition-colors shrink-0">
                    <RiAddLine size={14} className="rotate-45" />
                  </button>
                </div>
              )}

              <div className="flex items-center min-h-[3rem] py-1">
                <textarea 
                  rows={Math.min(5, input.split('\n').length)}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(); 
                    }
                  }}
                  placeholder="Reply to Chat..."
                  aria-label="Chat input"
                  className="flex-1 bg-transparent text-white placeholder:text-zinc-400 focus:outline-none text-sm px-5 resize-none w-full min-w-0"
                  style={{ lineHeight: '1.5rem', paddingTop: '0.75rem' }}
                />
                
                <div className="flex items-center gap-1 pr-2 shrink-0">
                  {input.trim().length > 0 || attachment ? (
                    <button 
                      id="chat-send-btn"
                      onClick={handleSend}
                      disabled={isLoading}
                      title="Send Message"
                      aria-label="Send Message"
                      className="w-8 h-8 flex items-center justify-center bg-white text-black hover:bg-zinc-200 rounded-full transition-colors"
                    >
                      <RiArrowUpLine size={20} aria-hidden="true" />
                    </button>
                  ) : (
                    <>
                      <div className="relative flex items-center">
                        {isRecording && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#282828] z-10"
                          />
                        )}
                        <button 
                          onClick={() => { 
                            playClick(); 
                            if (isRecording) {
                              stopRecording();
                            } else {
                              startListening(); 
                            }
                          }} 
                          title={isRecording ? "Stop Recording" : "Record Voice Message"}
                          aria-label={isRecording ? "Stop Recording Voice Message" : "Record Voice Message"}
                          aria-pressed={isRecording}
                          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500/10 text-red-500 scale-110' : 'text-zinc-300 hover:bg-white/10'}`}
                        >
                          {isRecording ? <RiStopCircleLine size={20} aria-hidden="true" className="animate-pulse" /> : <RiMicLine size={20} aria-hidden="true" />}
                        </button>
                      </div>
                      <button title="Voice Footprint" aria-label="Use Voice Footprint" className="w-9 h-9 mr-1 flex items-center justify-center text-zinc-300 hover:bg-white/10 rounded-full transition-colors">
                        <RiVoiceprintFill size={20} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <input 
            type="file" 
            id="chat-file-upload" 
            className="hidden" 
            accept="image/*,application/pdf,text/plain" 
            onChange={handleFileUpload} 
          />
          <div className="hidden">
            <ReactMic
              record={isRecording}
              className="sound-wave"
              onStop={onStopRecording}
              strokeColor="#10b981"
              backgroundColor="#0a0a0a"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
