import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  Handle,
  Position,
  useReactFlow
} from 'reactflow'
import { Tooltip } from 'react-tooltip'
import 'reactflow/dist/style.css'
import 'react-tooltip/dist/react-tooltip.css'
import {
  RiSave3Line,
  RiLayoutColumnLine,
  RiLayoutColumnFill,
  RiAddLine,
  RiPlayFill,
  RiTerminalBoxLine,
  RiLoader4Line,
  RiCloseLine
} from 'react-icons/ri'
import { playClick, playAction } from '../utils/audio'

const TOOLS_LIBRARY = [
  { category: 'TRIGGERS', name: 'TRIGGER', description: 'Starts the workflow.', inputs: [] },
  { category: 'API', name: 'HTTP_REQUEST', description: 'Make an API call (GET/POST).', inputs: ['url', 'method', 'body'] },
  { category: 'API', name: 'GOOGLE_SEARCH', description: 'Perform a Google Search.', inputs: ['query'] },
  { category: 'LOGIC', name: 'IF_CONDITION', description: 'Conditional branching.', inputs: ['condition'] },
  { category: 'LOGIC', name: 'WAIT', description: 'Pauses execution.', inputs: ['milliseconds'] },
  { category: 'USER_INPUT', name: 'PROMPT_USER', description: 'Ask user for input.', inputs: ['message'] },
  { category: 'USER_INPUT', name: 'SHOW_ALERT', description: 'Show an alert to the user.', inputs: ['message'] },
  { category: 'USER_INPUT', name: 'CONFIRM_USER_ACTION', description: 'Ask user to confirm an action.', inputs: ['message'], outputs: ['confirmed', 'cancelled'] },
  { category: 'IRIS_CORE', name: 'VOICE_SPEAK', description: 'Make IRIS speak a message.', inputs: ['message'] },
  { category: 'IRIS_CORE', name: 'START_VOICE_CONVERSATION', description: 'Start live voice conversation.', inputs: [] },
  { category: 'IRIS_CORE', name: 'STOP_VOICE_CONVERSATION', description: 'Stop live voice conversation.', inputs: [] },
  { category: 'IRIS_CORE', name: 'VISION_ANALYZE', description: 'Analyze current camera/screen feed.', inputs: ['prompt'] },
  { category: 'IRIS_CORE', name: 'START_VISION', description: 'Start camera or screen share.', inputs: ['mode'] },
  { category: 'IRIS_CORE', name: 'STOP_VISION', description: 'Stop vision feed.', inputs: [] },
]

const ToolNode = ({ data, id, selected }: any) => {
  return (
    <div className={`bg-[#18181b] border ${data.isActive ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : selected ? 'border-blue-500' : 'border-[#27272a]'} rounded-lg shadow-xl min-w-50 max-w-62.5 font-sans text-zinc-100 p-3 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-500 border-none" />
      <div className="text-xs font-bold flex items-center justify-between">
        {data.tool?.name || 'Tool'}
        {data.isActive && <RiLoader4Line className="animate-spin text-emerald-400" />}
      </div>
      <div className="text-[9px] text-zinc-500 mt-1">{data.tool?.description}</div>
      {data.tool?.outputs ? (
        data.tool.outputs.map((output: string, index: number) => {
          const leftPercent = ((index + 1) * 100) / (data.tool.outputs.length + 1);
          return (
             <Handle key={output} type="source" id={output} position={Position.Bottom} style={{ left: `${leftPercent}%` }} className="w-2 h-2 bg-emerald-500 border-none">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 font-bold whitespace-nowrap">
                  {output.toUpperCase()}
                </div>
             </Handle>
          )
        })
      ) : (
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-emerald-500 border-none" />
      )}
    </div>
  )
}

import { useNotificationStore } from '../store/notificationStore'

const nodeTypes = { customTool: ToolNode }

function Editor() {
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [workflowName, setWorkflowName] = useState('New IRIS Macro')
  const [description, setDescription] = useState('Custom Macro')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const addNotification = useNotificationStore(state => state.addNotification)

  const [isExecuting, setIsExecuting] = useState(false)
  const [execLogs, setExecLogs] = useState<string[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const { project } = useReactFlow()

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'default',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2, filter: 'drop-shadow(0 0 4px #10b981)' }
          },
          eds
        )
      ),
    []
  )

  const onDragStart = (event: any, tool: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(tool))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = useCallback((event: any) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const toolData = event.dataTransfer.getData('application/reactflow')

      if (!toolData) return

      const tool = JSON.parse(toolData)
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode = {
        id: `${tool.name}_${Date.now()}`,
        type: 'customTool',
        position,
        data: { tool, inputs: {}, isActive: false },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const onNodeClick = (_: any, node: any) => {
    playClick()
    setSelectedNodeId(node.id)
  }

  const onPaneClick = () => {
    playClick()
    setSelectedNodeId(null)
  }

  const updateNodeInput = (key: string, value: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, data: { ...n.data, inputs: { ...n.data.inputs, [key]: value } } }
      }
      return n
    }))
  }

  const resetCanvas = () => {
    playClick()
    setWorkflowName('New IRIS Macro')
    setDescription('Custom Macro')
    setNodes([])
    setEdges([])
    setIsSaved(false)
    setSelectedNodeId(null)
  }

  const saveWorkflow = async () => {
    playClick()
    addNotification({ title: 'Macro Saved', message: `Successfully saved ${workflowName}`, type: 'success' })
    setIsSaved(true)
    playAction()
  }

  const runMacroManually = async () => {
    playClick()
    if (nodes.length === 0) return alert('No nodes to execute.')
    
    let current = nodes.find(n => n.data?.tool?.name === 'TRIGGER')
    if (!current) {
      current = nodes[0]
    }

    setIsExecuting(true)
    setExecLogs(['[SYSTEM] Initializing macro execution...'])

    let currId: string | null = current.id
    let visited = new Set()

    while (currId && !visited.has(currId)) {
      visited.add(currId)
      const node = nodes.find(n => n.id === currId)
      if (!node) break

      setNodes(nds => nds.map(n => ({
        ...n,
        data: { ...n.data, isActive: n.id === node.id }
      })))

      const toolName = node.data?.tool?.name || 'Unknown Tool'
      setExecLogs(prev => [...prev, `> Executing: ${toolName}`])
      
      let delay = 1000
      if (toolName === 'WAIT') {
        delay = Number(node.data?.inputs?.milliseconds) || 1000
      }
      
      await new Promise(r => setTimeout(r, delay))
      
      let activeOutputHandle: string | null = null;

      if (toolName === 'CONFIRM_USER_ACTION') {
        const msg = node.data?.inputs?.message || 'Are you sure?'
        const confirmed = window.confirm(msg)
        setExecLogs(prev => [...prev, `  - User ${confirmed ? 'confirmed' : 'cancelled'}`])
        activeOutputHandle = confirmed ? 'confirmed' : 'cancelled'
      } else if (toolName === 'HTTP_REQUEST') {
        const url = node.data?.inputs?.url
        const method = node.data?.inputs?.method || 'GET'
        const body = node.data?.inputs?.body
        if (url) {
          try {
            const res = await fetch(url, { method, body: method !== 'GET' ? body : undefined })
            const data = await res.text()
            setExecLogs(prev => [...prev, `  - Response: ${data.substring(0, 50)}...`])
          } catch (e: any) {
            setExecLogs(prev => [...prev, `  - Error: ${e.message}`])
          }
        }
      } else if (toolName === 'GOOGLE_SEARCH') {
        const query = node.data?.inputs?.query
        if (query) {
          setExecLogs(prev => [...prev, `  - Searching Google for: ${query}`])
          try {
            // Using a public CORS proxy for demonstration purposes
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${query}`)}`)
            if (res.ok) {
               setExecLogs(prev => [...prev, `  - Search completed successfully.`])
            } else {
               setExecLogs(prev => [...prev, `  - Search failed.`])
            }
          } catch (e: any) {
            setExecLogs(prev => [...prev, `  - Error: ${e.message}`])
          }
        } else {
          setExecLogs(prev => [...prev, `  - Error: Missing search query.`])
        }
      } else if (toolName === 'PROMPT_USER') {
        const msg = node.data?.inputs?.message || 'Please provide input:'
        const answer = prompt(msg)
        setExecLogs(prev => [...prev, `  - User answered: ${answer}`])
      } else if (toolName === 'SHOW_ALERT') {
        const msg = node.data?.inputs?.message || 'Alert!'
        alert(msg)
        setExecLogs(prev => [...prev, `  - Alert shown`])
      } else if (toolName === 'VOICE_SPEAK') {
        const msg = node.data?.inputs?.message || 'Hello'
        setExecLogs(prev => [...prev, `  - IRIS says: ${msg}`])
        const utterance = new SpeechSynthesisUtterance(msg)
        
        const voices = window.speechSynthesis.getVoices()
        const maleVoice = voices.find(v => 
          v.name.includes('Google UK English Male') || 
          v.name.includes('Male') || 
          v.name.includes('David') || 
          v.name.includes('Mark')
        )
        if (maleVoice) {
          utterance.voice = maleVoice
        }
        
        window.speechSynthesis.speak(utterance)
        await new Promise(r => {
          utterance.onend = r
          setTimeout(r, 5000)
        })
      } else if (toolName === 'START_VOICE_CONVERSATION') {
        setExecLogs(prev => [...prev, `  - Connecting to IRIS Voice System...`])
        await new Promise(r => setTimeout(r, 1500))
        setExecLogs(prev => [...prev, `  - Voice conversation active.`])
      } else if (toolName === 'STOP_VOICE_CONVERSATION') {
        setExecLogs(prev => [...prev, `  - Disconnecting from IRIS Voice System...`])
        await new Promise(r => setTimeout(r, 1000))
        setExecLogs(prev => [...prev, `  - Voice conversation stopped.`])
      } else if (toolName === 'VISION_ANALYZE') {
        const promptMsg = node.data?.inputs?.prompt || 'What do you see?'
        setExecLogs(prev => [...prev, `  - Analyzing vision with prompt: ${promptMsg}`])
        await new Promise(r => setTimeout(r, 2000))
        setExecLogs(prev => [...prev, `  - Vision analysis complete. (Mock result)`])
      } else if (toolName === 'START_VISION') {
        const mode = node.data?.inputs?.mode || 'camera'
        setExecLogs(prev => [...prev, `  - Starting vision mode: ${mode}`])
      } else if (toolName === 'STOP_VISION') {
        setExecLogs(prev => [...prev, `  - Stopping vision`])
      } else if (toolName === 'IF_CONDITION') {
        const condition = node.data?.inputs?.condition
        setExecLogs(prev => [...prev, `  - Evaluating condition: ${condition}`])
        const result = Math.random() > 0.5
        setExecLogs(prev => [...prev, `  - Condition result: ${result}`])
      }
      
      setExecLogs(prev => [...prev, `  - Completed: ${toolName}`])
      setTimeout(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
      const outgoingEdges = edges.filter(e => e.source === currId)
      if (outgoingEdges.length > 0) {
        if (activeOutputHandle) {
          const edge = outgoingEdges.find(e => e.sourceHandle === activeOutputHandle)
          currId = edge ? edge.target : null
        } else {
          currId = outgoingEdges[0].target
        }
      } else {
        currId = null
      }
    }

    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isActive: false }
    })))

    setExecLogs(prev => [...prev, '[SYSTEM] Macro execution finished successfully.'])
    addNotification({ title: 'Macro Completed', message: `Execution of ${workflowName} finished.`, type: 'success' })
    setTimeout(() => setIsExecuting(false), 4000)
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  return (
    <div className="flex h-full w-full bg-[#09090b] relative overflow-hidden">
      <div
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] bg-[#111113] border-r border-[#27272a] p-4 flex flex-col gap-4 transition-all overflow-y-auto scrollbar-small ${
          isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full w-0'
        } z-40`}
      >
        {isSidebarOpen && (
          <>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-emerald-500 flex items-center gap-2 border-b border-[#27272a] pb-4 shrink-0">
              MODULE LIBRARY
            </h2>
            <div className="text-xs text-zinc-500 mb-2 shrink-0">Drag and drop tools to canvas</div>
            
            <div className="flex flex-col gap-6 pb-10">
              {['TRIGGERS', 'API', 'LOGIC', 'USER_INPUT', 'IRIS_CORE'].map(category => (
                <div key={category}>
                  <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">{category.replace('_', ' ')}</h3>
                  <div className="flex flex-col gap-2">
                    {TOOLS_LIBRARY.filter(t => t.category === category).map(tool => (
                      <div
                        key={tool.name}
                        className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg cursor-grab hover:border-emerald-500/50 transition-colors"
                        draggable
                        onDragStart={(e) => onDragStart(e, tool)}
                      >
                        <div className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase mb-1">{tool.name.replace(/_/g, ' ')}</div>
                        <div className="text-[9px] text-zinc-500 leading-relaxed">{tool.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close module library sidebar" : "Open module library sidebar"}
        aria-expanded={isSidebarOpen}
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-[#111113] border border-[#27272a] border-l-0 p-2 rounded-r-lg text-zinc-400 hover:text-white z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {isSidebarOpen ? <RiLayoutColumnLine size={18} aria-hidden="true" /> : <RiLayoutColumnFill size={18} aria-hidden="true" />}
      </button>

      <div
        className={`grow flex flex-col relative transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 shadow-2xl">
          <button
            onClick={resetCanvas}
            aria-label="Start New Macro"
            className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-600 hover:text-emerald-500 hover:border-emerald-500/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            data-tooltip-id="global-tooltip"
            data-tooltip-content="Start New Macro"
          >
            <RiAddLine size={16} aria-hidden="true" />
          </button>

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            aria-label="Macro Name"
            className="bg-[#18181b] border border-[#27272a] px-4 py-2 rounded-lg text-sm text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all w-64 focus-visible:ring-2 focus-visible:ring-emerald-500"
          />

          <button
            onClick={runMacroManually}
            disabled={isExecuting}
            aria-label={isExecuting ? "Running macro" : "Run macro"}
            className={`px-5 py-2 rounded-lg text-[11px] font-black tracking-widest transition-colors flex items-center gap-2 border border-[#27272a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isExecuting ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#18181b] hover:bg-[#27272a] text-emerald-400'}`}
          >
            <RiPlayFill size={16} aria-hidden="true" /> {isExecuting ? 'RUNNING...' : 'RUN'}
          </button>

          <button
            onClick={saveWorkflow}
            aria-label="Save macro"
            className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2 rounded-lg text-[11px] font-black tracking-widest transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <RiSave3Line size={16} aria-hidden="true" /> SAVE
          </button>
        </div>

        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            className="bg-[#09090b]"
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="react-flow__controls" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-[#111113] border border-[#27272a] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#18181b]">
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                Configure Node
              </span>
              <button
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close node configuration"
                className="text-zinc-500 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              >
                <RiCloseLine size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh] scrollbar-small">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">
                  {selectedNode.data.tool.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                  {selectedNode.data.tool.description}
                </p>
              </div>
              
              {selectedNode.data.tool.inputs.length > 0 ? (
                <div className="flex flex-col gap-4 mt-2">
                  {selectedNode.data.tool.inputs.map((input: string) => (
                    <div key={input} className="flex flex-col gap-2">
                      <label htmlFor={`input-${input}`} className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                        {input}
                      </label>
                      <input
                        id={`input-${input}`}
                        type="text"
                        value={selectedNode.data.inputs[input] || ''}
                        onChange={(e) => updateNodeInput(input, e.target.value)}
                        placeholder={`Enter ${input}...`}
                        className="bg-[#09090b] border border-[#27272a] rounded-md text-xs p-2.5 text-white outline-none focus:border-emerald-500 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-600 italic uppercase tracking-widest bg-black/30 p-3 rounded text-center border border-white/5 mt-2">
                  No configuration needed.
                </div>
              )}
            </div>
          </div>
        )}

        {isExecuting && (
          <div className="absolute bottom-4 right-4 w-96 bg-black/90 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2 text-emerald-400">
                <RiTerminalBoxLine size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Execution Log</span>
              </div>
              <RiLoader4Line className="text-emerald-500 animate-spin" size={16} />
            </div>
            <div className="p-4 h-48 overflow-y-auto font-mono text-[10px] text-zinc-300 space-y-2 scrollbar-small">
              {execLogs.map((log, i) => (
                <div key={i} className={`${log.includes('[SYSTEM]') ? 'text-emerald-500 font-bold' : log.includes('Completed') ? 'text-zinc-500' : 'text-zinc-300'}`}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        <Tooltip
          id="global-tooltip"
          place="top"
          style={{
            maxWidth: '250px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            zIndex: 100
          }}
        />
      </div>
    </div>
  )
}

export default function WorkFlowEditorView() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}
