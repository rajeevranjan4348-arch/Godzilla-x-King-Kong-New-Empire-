import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RiCalendarEventLine, 
  RiTimeLine, 
  RiFolderOpenLine, 
  RiImageLine, 
  RiFileTextLine,
  RiArrowLeftLine,
  RiSearchLine,
  RiApps2Line
} from 'react-icons/ri';
import CalendarView from './Calendar';
import RemindersView from './Reminders';
import NotesView from './Notes';
import GalleryView from './Gallery';
import DocumentsView from './Documents';
import ChatGPTView from './ChatGPT';

import GoogleChatView from './GoogleChat';
import GoogleContactsView from './GoogleContacts';

import GmailView from './Gmail';

export const APPS = [
  { id: 'ChatGPT', name: 'ChatGPT', description: 'Advanced AI assistant...', icon: '/icons/gemini.png', color: 'bg-emerald-500', component: ChatGPTView },
  { id: 'Gemini', name: 'Gemini', description: 'Multimodal AI assistant...', icon: '/icons/gemini.png', color: 'bg-blue-500', component: null },
  { id: 'Google Lens', name: 'Google Lens', description: 'Uses your camera to id...', icon: '/icons/lens.png', color: 'bg-yellow-500', component: null },
  { id: 'Google Assistant', name: 'Google Assistant', description: 'Automates smart home...', icon: '/icons/assistant.png', color: 'bg-blue-400', component: null },
  { id: 'Gmail', name: 'Gmail', description: 'Uses AI for smart sortin...', icon: '/icons/gmail.png', color: 'bg-red-500', component: GmailView },
  { id: 'Google Meet', name: 'Google Meet', description: 'High-definition video co...', icon: '/icons/meet.png', color: 'bg-green-500', component: null },
  { id: 'Google Messages', name: 'Google Messages', description: 'Supports RCS for high-...', icon: '/icons/messages.png', color: 'bg-blue-300', component: null },
  { id: 'Google Chat', name: 'Google Chat', description: 'A space for team collab...', icon: '/icons/chat.png', color: 'bg-green-400', component: GoogleChatView },
  { id: 'Google Contacts', name: 'Google Contacts', description: 'Address book and contact management...', icon: '/icons/contacts.png', color: 'bg-blue-600', component: GoogleContactsView },
  { id: 'Google Drive', name: 'Google Drive', description: 'Secure cloud storage wi...', icon: '/icons/drive.png', color: 'bg-blue-500', component: null },
  { id: 'Google Docs', name: 'Google Docs', description: 'Real-time collaborative ...', icon: '/icons/docs.png', color: 'bg-blue-600', component: null },
  { id: 'Google Sheets', name: 'Google Sheets', description: 'Powerful spreadsheets ...', icon: '/icons/sheets.png', color: 'bg-green-600', component: null },
  { id: 'Google Slides', name: 'Google Slides', description: 'Create presentations wi...', icon: '/icons/slides.png', color: 'bg-yellow-400', component: null },
  { id: 'Google Tasks', name: 'Google Tasks', description: 'Manage your tasks...', icon: '/icons/tasks.png', color: 'bg-blue-500', component: null },
  { id: 'Google Picker', name: 'Google Picker', description: 'Select files from Drive...', icon: '/icons/picker.png', color: 'bg-blue-400', component: null },
  { id: 'Google Calendar', name: 'Google Calendar', description: 'Intelligent scheduling th...', icon: '/icons/calendar.png', color: 'bg-blue-500', component: CalendarView },
  { id: 'Google Keep', name: 'Google Keep', description: 'A minimalist note-takin...', icon: '/icons/keep.png', color: 'bg-yellow-400', component: NotesView },
  { id: 'Google Forms', name: 'Google Forms', description: 'Create surveys and quiz...', icon: '/icons/forms.png', color: 'bg-purple-500', component: null },
  { id: 'YouTube', name: 'YouTube', description: 'The world\'s largest vide...', icon: '/icons/youtube.png', color: 'bg-red-600', component: null },
  { id: 'YouTube Music', name: 'YouTube Music', description: 'Smart music streaming...', icon: '/icons/ytmusic.png', color: 'bg-red-500', component: null },
  { id: 'Google Photos', name: 'Google Photos', description: 'Features "Magic Eraser"...', icon: '/icons/photos.png', color: 'bg-blue-400', component: GalleryView },
  { id: 'Google TV', name: 'Google TV', description: 'Aggregates movies and...', icon: '/icons/tv.png', color: 'bg-zinc-700', component: null },
  { id: 'Google Podcasts', name: 'Google Podcasts', description: 'Discover free podcasts ...', icon: '/icons/podcasts.png', color: 'bg-blue-500', component: null },
  { id: 'Google Arts & Culture', name: 'Google Arts & Culture', description: 'Explore art and history ...', icon: '/icons/arts.png', color: 'bg-zinc-800', component: null },
  { id: 'Google Maps', name: 'Google Maps', description: 'Offers "Immersive View...', icon: '/icons/maps.png', color: 'bg-green-500', component: null },
  { id: 'Google Chrome', name: 'Google Chrome', description: 'Fast, secure web brows...', icon: '/icons/chrome.png', color: 'bg-yellow-500', component: null },
  { id: 'Files by Google', name: 'Files by Google', description: 'A file manager that clea...', icon: '/icons/files.png', color: 'bg-blue-500', component: DocumentsView },
  { id: 'Gboard', name: 'Gboard', description: 'A smart keyboard with ...', icon: '/icons/gboard.png', color: 'bg-blue-400', component: null },
  { id: 'Google Wallet', name: 'Google Wallet', description: 'Securely stores paymen...', icon: '/icons/wallet.png', color: 'bg-zinc-800', component: null },
  { id: 'Google Translate', name: 'Google Translate', description: 'Translate languages ins...', icon: '/icons/translate.png', color: 'bg-blue-500', component: null },
  { id: 'Google Play Store', name: 'Google Play Store', description: 'Discover apps, games...', icon: '/icons/play.png', color: 'bg-white', component: null },
  { id: 'Google Earth', name: 'Google Earth', description: 'High-resolution satellite...', icon: '/icons/earth.png', color: 'bg-blue-600', component: null },
  { id: 'Google Classroom', name: 'Google Classroom', description: 'A digital hub for teache...', icon: '/icons/classroom.png', color: 'bg-green-600', component: null },
];

export default function AppsView({ glassPanel, reminders, setReminders, setActiveTab }: { glassPanel?: any, reminders?: any, setReminders?: any, setActiveTab?: (tab: string) => void }) {
  const [activeApp, setActiveApp] = useState<string | null>(() => {
    return localStorage.getItem('iris_active_app') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GOOGLE' | 'SYSTEM' | 'MEDIA'>('ALL');

  const launchApp = (appId: string) => {
    // Check if app routes to a main system tab
    if (appId === 'Gemini' && setActiveTab) {
      setActiveTab('CHAT');
      return;
    }
    setActiveApp(appId);
    localStorage.setItem('iris_active_app', appId);
  };

  const closeApp = () => {
    setActiveApp(null);
    localStorage.removeItem('iris_active_app');
  };

  useEffect(() => {
    const handleLaunchApp = (e: any) => {
      if (e.detail?.appId) {
        launchApp(e.detail.appId);
      }
    };
    window.addEventListener('launch-app', handleLaunchApp);
    return () => {
      window.removeEventListener('launch-app', handleLaunchApp);
    };
  }, []);

  if (activeApp) {
    const appData = APPS.find(a => a.id === activeApp);
    const App = appData?.component as any;
    if (App) {
      return (
        <div className="h-full w-full flex flex-col animate-in fade-in zoom-in duration-300">
          <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-black/50">
            <button 
              onClick={closeApp}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <RiArrowLeftLine size={24} />
            </button>
            <h2 className="text-sm font-bold tracking-widest text-emerald-400">{activeApp}</h2>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {activeApp === 'Google Calendar' 
                ? <App glassPanel={glassPanel} />
                : activeApp === 'Google Keep'
                ? <App glassPanel={glassPanel} />
                : activeApp === 'Google Photos'
                ? <App />
                : activeApp === 'Files by Google'
                ? <App glassPanel={glassPanel} />
                : <App />
            }
          </div>
        </div>
      );
    } else if (appData) {
      return (
        <div className="h-full w-full flex flex-col animate-in fade-in zoom-in duration-300 bg-[#0a0a0a]">
          <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-black/50 shrink-0">
            <button 
              onClick={closeApp}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <RiArrowLeftLine size={24} />
            </button>
            <h2 className="text-sm font-bold tracking-widest text-emerald-400">{appData.name}</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-black to-zinc-900/50">
             <div className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl mb-8 ${appData.color}`}>
                <span className="text-6xl font-bold text-white/90">{appData.name.charAt(0)}</span>
             </div>
             <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">{appData.name}</h2>
             <p className="text-zinc-400 max-w-md mx-auto text-lg leading-relaxed">{appData.description}</p>
             <div className="mt-12 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold tracking-widest uppercase">
               App Opened Successfully
             </div>
          </div>
        </div>
      );
    }
  }

  const filteredApps = APPS.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'GOOGLE') return app.name.toLowerCase().includes('google') || app.name === 'Gmail' || app.name === 'YouTube';
    if (activeFilter === 'SYSTEM') return ['Gemini', 'Google Keep', 'Google Calendar', 'Files by Google'].includes(app.name);
    if (activeFilter === 'MEDIA') return ['YouTube', 'YouTube Music', 'Google Photos', 'Google TV', 'Google Podcasts'].includes(app.name);
    
    return true;
  });

  return (
    <div className="h-full w-full p-6 md:p-10 overflow-y-auto bg-[#0a0a0a] text-zinc-300 scrollbar-small animate-in fade-in zoom-in duration-300">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <RiApps2Line size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-white">APPLICATIONS</h1>
            <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">System & External Modules</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Search applications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredApps.length > 0) {
                launchApp(filteredApps[0].id);
              }
            }}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          <button onClick={() => setActiveFilter('ALL')} title="Show All" className={`px-6 py-2 ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'} text-xs font-bold tracking-widest rounded-lg shrink-0 transition-colors`}>ALL</button>
          <button onClick={() => setActiveFilter('GOOGLE')} title="Filter Google Apps" className={`px-6 py-2 ${activeFilter === 'GOOGLE' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'} text-xs font-bold tracking-widest rounded-lg shrink-0 transition-colors`}>GOOGLE</button>
          <button onClick={() => setActiveFilter('SYSTEM')} title="Filter System Apps" className={`px-6 py-2 ${activeFilter === 'SYSTEM' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'} text-xs font-bold tracking-widest rounded-lg shrink-0 transition-colors`}>SYSTEM</button>
          <button onClick={() => setActiveFilter('MEDIA')} title="Filter Media & Code" className={`px-6 py-2 ${activeFilter === 'MEDIA' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'} text-xs font-bold tracking-widest rounded-lg shrink-0 transition-colors`}>MEDIA</button>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-x-4 gap-y-8 mt-4">
          {filteredApps.map(app => (
            <button
              key={app.id}
              onClick={() => launchApp(app.id)}
              title={`Launch ${app.id}`}
              className="flex flex-col items-center gap-3 group focus:outline-none"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-active:scale-95 ${app.color}`}>
                <span className="text-2xl font-bold text-white/90">{app.id.charAt(0)}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{app.id}</span>
                <span className="text-[9px] text-zinc-600 mt-0.5 max-w-[80px] truncate">{app.description}</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
