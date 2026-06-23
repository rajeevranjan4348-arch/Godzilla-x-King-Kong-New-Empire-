import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  RiStickyNoteLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiMarkdownLine,
  RiAddLine,
  RiSave3Line,
  RiCloseLine,
  RiEditLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiListCheck,
  RiFileCopyLine,
  RiDownloadLine
} from 'react-icons/ri'
import { playClick, playAction } from '../utils/audio'

interface Note {
  filename: string
  title: string
  content: string
  createdAt: number
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
}

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : 'text'
    
    const handleCopy = async () => {
      playClick()
      try {
        await navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
      } catch (err) {
        console.error("Failed to copy text:", err)
      }
    }

    return !inline ? (
      <div className="my-6 rounded-xl overflow-hidden border border-white/10 bg-[#1E1E1E] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <span className="ml-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{language}</span>
          </div>
          <button 
            onClick={handleCopy}
            className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5"
            title="Copy code"
          >
            <RiFileCopyLine size={12} /> COPY
          </button>
        </div>
        <div className="text-[13px] leading-relaxed">
          <SyntaxHighlighter
            style={vscDarkPlus as any}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    ) : (
      <code
        className="bg-white/10 px-1.5 py-0.5 rounded-md text-emerald-400 font-mono text-[12px] border border-white/5"
        {...props}
      >
        {children}
      </code>
    )
  }
}

const STATUS_COLORS = {
  'TODO': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  'IN_PROGRESS': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'DONE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
}

const STATUS_ICONS = {
  'TODO': <RiListCheck size={12} />,
  'IN_PROGRESS': <RiTimeLine size={12} />,
  'DONE': <RiCheckboxCircleLine size={12} />
}

import { useNotificationStore } from '../store/notificationStore'

const NotesView = ({ glassPanel }: { glassPanel?: string }) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newStatus, setNewStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO')
  const [editOriginalFilename, setEditOriginalFilename] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, note: Note } | null>(null)

  const addNotification = useNotificationStore(state => state.addNotification)

  const fetchNotes = async () => {
    try {
      const data = JSON.parse(localStorage.getItem('iris_notes') || '[]')
      setNotes(data.sort((a: Note, b: Note) => b.createdAt - a.createdAt))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchNotes()
    const interval = setInterval(fetchNotes, 3000) 
    
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  const startCreating = () => {
    playClick()
    setSelectedNote(null)
    setEditOriginalFilename(null)
    setNewTitle('')
    setNewContent('')
    setNewStatus('TODO')
    setIsEditorOpen(true)
  }

  const startEditing = () => {
    if (!selectedNote) return
    playClick()
    setEditOriginalFilename(selectedNote.filename)
    setNewTitle(selectedNote.title)
    const cleanContent = selectedNote.content.replace(/^# .+\n\n/, '')
    setNewContent(cleanContent)
    setNewStatus(selectedNote.status || 'TODO')
    setIsEditorOpen(true)
  }

  const cancelEditor = () => {
    playClick()
    setIsEditorOpen(false)
    setEditOriginalFilename(null)
  }

  // Auto-save effect
  useEffect(() => {
    if (!isEditorOpen || !newTitle.trim() || !newContent.trim()) return;

    const timeoutId = setTimeout(() => {
      const safeTitle = newTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const filename = `${safeTitle}.md`
      const content = `# ${newTitle}\n\n${newContent}`
      
      const newNote: Note = {
        filename,
        title: newTitle,
        content,
        createdAt: selectedNote ? selectedNote.createdAt : Date.now(),
        status: newStatus
      }

      let currentNotes = JSON.parse(localStorage.getItem('iris_notes') || '[]')
      
      if (editOriginalFilename) {
        currentNotes = currentNotes.filter((n: Note) => n.filename !== editOriginalFilename)
      } else {
        currentNotes = currentNotes.filter((n: Note) => n.filename !== filename)
      }
      
      currentNotes.push(newNote)
      localStorage.setItem('iris_notes', JSON.stringify(currentNotes))
      
      // Update original filename so subsequent auto-saves update the same note
      setEditOriginalFilename(filename)
      
      // We don't call fetchNotes() here to avoid interrupting the user's typing
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [newTitle, newContent, newStatus, isEditorOpen, editOriginalFilename, selectedNote]);

  const saveManualNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    playClick()
    
    const safeTitle = newTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${safeTitle}.md`
    const content = `# ${newTitle}\n\n${newContent}`
    
    const newNote: Note = {
      filename,
      title: newTitle,
      content,
      createdAt: Date.now(),
      status: newStatus
    }

    let currentNotes = JSON.parse(localStorage.getItem('iris_notes') || '[]')
    
    if (editOriginalFilename) {
      currentNotes = currentNotes.filter((n: Note) => n.filename !== editOriginalFilename)
    } else {
      currentNotes = currentNotes.filter((n: Note) => n.filename !== filename)
    }
    
    currentNotes.push(newNote)
    localStorage.setItem('iris_notes', JSON.stringify(currentNotes))

    setIsEditorOpen(false)
    setEditOriginalFilename(null)
    fetchNotes()
    playAction()
    addNotification({ title: 'Memory Saved', message: `Saved note: ${newTitle}`, type: 'success' })
    
    setTimeout(() => {
      setSelectedNote(newNote)
    }, 500)
  }

  const updateNoteStatus = (filename: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE', e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    playClick()
    let currentNotes = JSON.parse(localStorage.getItem('iris_notes') || '[]')
    currentNotes = currentNotes.map((n: Note) => 
      n.filename === filename ? { ...n, status } : n
    )
    localStorage.setItem('iris_notes', JSON.stringify(currentNotes))
    fetchNotes()
    playAction()
    if (selectedNote?.filename === filename) {
      setSelectedNote(prev => prev ? { ...prev, status } : null)
    }
  }

  const deleteNote = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation()
    playClick()
    let currentNotes = JSON.parse(localStorage.getItem('iris_notes') || '[]')
    currentNotes = currentNotes.filter((n: Note) => n.filename !== filename)
    localStorage.setItem('iris_notes', JSON.stringify(currentNotes))
    
    fetchNotes()
    playAction()
    if (selectedNote?.filename === filename) setSelectedNote(null)
  }

  const exportMarkdown = (note: Note) => {
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = note.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-gray-900/70 h-full grid grid-cols-12 gap-6 p-6 animate-in fade-in zoom-in duration-300">
      <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-zinc-100">
            <RiStickyNoteLine className="text-emerald-400" />
            <span className="text-xs font-bold tracking-widest">MEMORY BANK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono mr-2">{notes.length} ITEMS</span>
            <button
              onClick={startCreating}
              aria-label="Create Manual Note"
              className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Create Manual Note"
            >
              <RiAddLine size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-small" role="list">
          {notes.length === 0 ? (
            <div className="text-center text-zinc-600 text-xs mt-10">
              <p>No memories saved.</p>
              <p className="mt-2 opacity-50">Click + or ask IRIS.</p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.filename}
                role="listitem"
                onClick={() => {
                  playClick()
                  setIsEditorOpen(false)
                  setSelectedNote(note)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ x: e.pageX, y: e.pageY, note })
                }}
                className={`w-full text-left group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  selectedNote?.filename === note.filename && !isEditorOpen
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-zinc-900/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between overflow-hidden w-full">
                  <h3
                    className={`text-xs font-bold truncate ${selectedNote?.filename === note.filename && !isEditorOpen ? 'text-emerald-400' : 'text-zinc-300'}`}
                  >
                    {note.title.toUpperCase()}
                  </h3>
                  <div
                    onClick={(e) => deleteNote(note.filename, e)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Delete note ${note.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        deleteNote(note.filename, e as any)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <RiDeleteBinLine size={14} aria-hidden="true" />
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <p className="text-[9px] text-zinc-500 font-mono">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center" onClick={e => e.stopPropagation()}>
                    <select
                      value={note.status || 'TODO'}
                      aria-label={`Status for ${note.title}`}
                      onChange={(e) => updateNoteStatus(note.filename, e.target.value as any, e as any)}
                      className={`text-[9px] font-bold tracking-wider px-2 py-1 rounded border outline-none cursor-pointer appearance-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${STATUS_COLORS[note.status || 'TODO']}`}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div
        className={`col-span-8 ${glassPanel || ''} bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden`}
      >
        {isEditorOpen ? (
          <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <input
                type="text"
                placeholder="ENTER NOTE TITLE..."
                value={newTitle}
                aria-label="Note Title"
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-transparent border-none outline-none text-lg font-bold text-white placeholder-zinc-600 w-full tracking-wider focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-2"
                autoFocus
              />
              <div className="flex gap-2 items-center">
                <select
                  value={newStatus}
                  aria-label="Note Status"
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className={`text-[10px] font-bold tracking-wider px-3 py-1.5 rounded border outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${STATUS_COLORS[newStatus]}`}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
                <button
                  onClick={cancelEditor}
                  aria-label="Cancel editing"
                  className="p-2 text-zinc-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                >
                  <RiCloseLine size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <textarea
              placeholder="Write your note in Markdown..."
              aria-label="Note Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-mono text-zinc-300 placeholder-zinc-700 leading-relaxed focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-2"
            />
            <div className="flex justify-between items-center pt-4">
              <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                {newTitle.trim() && newContent.trim() ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse"></div>
                    AUTO-SAVING ACTIVE
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                    WAITING FOR INPUT
                  </>
                )}
              </div>
              <button
                onClick={saveManualNote}
                disabled={!newTitle || !newContent}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <RiSave3Line aria-hidden="true" /> {editOriginalFilename ? 'UPDATE MEMORY' : 'SAVE TO MEMORY'}
              </button>
            </div>
          </div>
        ) : selectedNote ? (
          <>
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
              <div className="flex items-center gap-2 text-zinc-300">
                <RiMarkdownLine size={18} className="opacity-50" aria-hidden="true" />
                <span className="text-xs font-bold tracking-wider">{selectedNote.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-bold tracking-wider ${STATUS_COLORS[selectedNote.status || 'TODO']}`}>
                  {STATUS_ICONS[selectedNote.status || 'TODO']}
                  {(selectedNote.status || 'TODO').replace('_', ' ')}
                </div>
                <span className="text-[9px] font-mono text-zinc-600 bg-black/20 px-2 py-1 rounded">
                  READ ONLY
                </span>
                <button
                  onClick={() => exportMarkdown(selectedNote)}
                  aria-label="Export Markdown"
                  className="text-zinc-500 hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
                  title="Export Markdown"
                >
                  <RiDownloadLine size={16} aria-hidden="true" />
                </button>
                <button
                  onClick={startEditing}
                  aria-label="Edit Note"
                  className="text-zinc-500 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1"
                  title="Edit Note"
                >
                  <RiEditLine size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-small bg-zinc-950/30">
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-4">
            <RiFileTextLine size={48} className="opacity-20" />
            <span className="text-xs tracking-widest opacity-50">
              SELECT A DATA NODE OR CREATE NEW
            </span>
          </div>
        )}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-50 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <button 
            className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            onClick={() => { updateNoteStatus(contextMenu.note.filename, 'TODO'); setContextMenu(null); }}
          >
            <RiListCheck size={14} className="text-zinc-400" /> TODO
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            onClick={() => { updateNoteStatus(contextMenu.note.filename, 'IN_PROGRESS'); setContextMenu(null); }}
          >
            <RiTimeLine size={14} className="text-blue-400" /> IN PROGRESS
          </button>
          <button 
            className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            onClick={() => { updateNoteStatus(contextMenu.note.filename, 'DONE'); setContextMenu(null); }}
          >
            <RiCheckboxCircleLine size={14} className="text-emerald-400" /> DONE
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button 
            className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            onClick={() => { exportMarkdown(contextMenu.note); setContextMenu(null); }}
          >
            <RiDownloadLine size={14} /> Export
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button 
            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
            onClick={(e) => { deleteNote(contextMenu.note.filename, e as any); setContextMenu(null); }}
          >
            <RiDeleteBinLine size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default NotesView
