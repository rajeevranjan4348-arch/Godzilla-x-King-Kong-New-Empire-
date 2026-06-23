import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { 
  RiPlayCircleLine, 
  RiRobot2Line, 
  RiGlobalLine, 
  RiGitBranchLine, 
  RiUserSmileLine,
  RiAddLine,
  RiSave3Line,
  RiPlayFill,
  RiTimeLine,
  RiCheckLine
} from 'react-icons/ri';
import { playClick, playAction } from '../utils/audio';

// --- Custom Nodes ---

const BaseNode = ({ title, icon, color, children, data }: any) => (
  <div className={`bg-zinc-900/90 backdrop-blur-md border border-${color}-500/50 rounded-xl shadow-2xl min-w-[200px] overflow-hidden`}>
    <div className={`px-3 py-2 bg-${color}-500/10 border-b border-${color}-500/20 flex items-center gap-2`}>
      <div className={`text-${color}-400`}>{icon}</div>
      <div className="text-[10px] font-bold tracking-widest text-zinc-200 uppercase">{title}</div>
    </div>
    <div className="p-3 flex flex-col gap-2">
      {children}
    </div>
  </div>
);

const TriggerNode = ({ data }: any) => (
  <>
    <BaseNode title="Trigger" icon={<RiPlayCircleLine size={16} />} color="emerald">
      <div className="text-xs text-zinc-400 font-mono">Starts the workflow</div>
      <input 
        type="text" 
        placeholder="Event name..." 
        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500/50"
        defaultValue={data.eventName || ''}
      />
    </BaseNode>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-zinc-900" />
  </>
);

const AIActionNode = ({ data }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500 border-2 border-zinc-900" />
    <BaseNode title="AI Action" icon={<RiRobot2Line size={16} />} color="purple">
      <textarea 
        placeholder="System prompt..." 
        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-purple-500/50 resize-none h-16"
        defaultValue={data.prompt || ''}
      />
    </BaseNode>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500 border-2 border-zinc-900" />
  </>
);

const APICallNode = ({ data }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-zinc-900" />
    <BaseNode title="API Call" icon={<RiGlobalLine size={16} />} color="blue">
      <select className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50 mb-1">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
      </select>
      <input 
        type="text" 
        placeholder="https://api..." 
        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50"
        defaultValue={data.url || ''}
      />
    </BaseNode>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-zinc-900" />
  </>
);

const ConditionNode = ({ data }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500 border-2 border-zinc-900" />
    <BaseNode title="Condition" icon={<RiGitBranchLine size={16} />} color="yellow">
      <input 
        type="text" 
        placeholder="If condition..." 
        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-yellow-500/50"
        defaultValue={data.condition || ''}
      />
    </BaseNode>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="w-3 h-3 bg-green-500 border-2 border-zinc-900" />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="w-3 h-3 bg-red-500 border-2 border-zinc-900" />
  </>
);

const InteractionNode = ({ data }: any) => (
  <>
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-500 border-2 border-zinc-900" />
    <BaseNode title="User Input" icon={<RiUserSmileLine size={16} />} color="pink">
      <input 
        type="text" 
        placeholder="Ask user..." 
        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-pink-500/50"
        defaultValue={data.question || ''}
      />
    </BaseNode>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500 border-2 border-zinc-900" />
  </>
);

const nodeTypes = {
  trigger: TriggerNode,
  aiAction: AIActionNode,
  apiCall: APICallNode,
  condition: ConditionNode,
  interaction: InteractionNode,
};

const initialNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { eventName: 'On Message Received' } },
];
const initialEdges: Edge[] = [];

const LOCAL_STORAGE_KEY = 'iris_workflows_data';

const getInitialElements = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.nodes && parsed.edges) {
        return parsed;
      }
    }
  } catch(e) {
    console.error("Failed to parse local storage workflow data", e);
  }
  return { nodes: initialNodes, edges: initialEdges };
};

// --- Main Component ---

const WorkflowsView = () => {
  const { nodes: initialStoredNodes, edges: initialStoredEdges } = useMemo(() => getInitialElements(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialStoredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialStoredEdges);
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  useEffect(() => {
    const savedTime = localStorage.getItem(`${LOCAL_STORAGE_KEY}_timestamp`);
    if (savedTime) {
      setLastSaved(new Date(savedTime));
    }
  }, []);

  const triggerSave = useCallback(() => {
     setIsAutoSaving(true);
     const dataToSave = { nodes: nodesRef.current, edges: edgesRef.current };
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
     const now = new Date();
     localStorage.setItem(`${LOCAL_STORAGE_KEY}_timestamp`, now.toISOString());
     setLastSaved(now);
     setTimeout(() => setIsAutoSaving(false), 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
       triggerSave();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [triggerSave]);

  const handleManualSave = () => {
    playAction();
    triggerSave();
    alert("Workflow Saved Locally!");
  };

  const onConnect = useCallback(
    (params: Connection) => {
      playClick();
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      playClick();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex-1 bg-gray-900/70 h-full grid grid-cols-12 gap-0 animate-in fade-in zoom-in duration-300">
      {/* Sidebar */}
      <div className="col-span-3 border-r border-white/10 bg-black/40 flex flex-col h-full z-10">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <RiGitBranchLine className="text-emerald-400" size={20} />
          <h2 className="text-xs font-bold tracking-widest text-zinc-100 uppercase">Workflow Nodes</h2>
        </div>
        
        <div className="p-4 flex flex-col gap-3 overflow-y-auto scrollbar-small">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Drag to add</div>
          
          <div 
            className="p-3 border border-emerald-500/30 bg-emerald-500/10 rounded-xl cursor-grab hover:bg-emerald-500/20 transition-colors flex items-center gap-3"
            onDragStart={(e) => onDragStart(e, 'trigger')} draggable
          >
            <RiPlayCircleLine className="text-emerald-400" size={20} />
            <div>
              <div className="text-xs font-bold text-emerald-100 tracking-wider">Trigger</div>
              <div className="text-[9px] text-emerald-400/70 font-mono">Start event</div>
            </div>
          </div>

          <div 
            className="p-3 border border-purple-500/30 bg-purple-500/10 rounded-xl cursor-grab hover:bg-purple-500/20 transition-colors flex items-center gap-3"
            onDragStart={(e) => onDragStart(e, 'aiAction')} draggable
          >
            <RiRobot2Line className="text-purple-400" size={20} />
            <div>
              <div className="text-xs font-bold text-purple-100 tracking-wider">AI Action</div>
              <div className="text-[9px] text-purple-400/70 font-mono">LLM Prompt</div>
            </div>
          </div>

          <div 
            className="p-3 border border-blue-500/30 bg-blue-500/10 rounded-xl cursor-grab hover:bg-blue-500/20 transition-colors flex items-center gap-3"
            onDragStart={(e) => onDragStart(e, 'apiCall')} draggable
          >
            <RiGlobalLine className="text-blue-400" size={20} />
            <div>
              <div className="text-xs font-bold text-blue-100 tracking-wider">API Call</div>
              <div className="text-[9px] text-blue-400/70 font-mono">External Request</div>
            </div>
          </div>

          <div 
            className="p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-xl cursor-grab hover:bg-yellow-500/20 transition-colors flex items-center gap-3"
            onDragStart={(e) => onDragStart(e, 'condition')} draggable
          >
            <RiGitBranchLine className="text-yellow-400" size={20} />
            <div>
              <div className="text-xs font-bold text-yellow-100 tracking-wider">Condition</div>
              <div className="text-[9px] text-yellow-400/70 font-mono">If/Else Logic</div>
            </div>
          </div>

          <div 
            className="p-3 border border-pink-500/30 bg-pink-500/10 rounded-xl cursor-grab hover:bg-pink-500/20 transition-colors flex items-center gap-3"
            onDragStart={(e) => onDragStart(e, 'interaction')} draggable
          >
            <RiUserSmileLine className="text-pink-400" size={20} />
            <div>
              <div className="text-xs font-bold text-pink-100 tracking-wider">User Input</div>
              <div className="text-[9px] text-pink-400/70 font-mono">Ask for info</div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-white/10 flex flex-col gap-2">
          <button 
            onClick={handleManualSave}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RiSave3Line size={16} /> SAVE WORKFLOW
          </button>
          
          <div className="flex items-center justify-center gap-1 my-1 text-[10px] text-zinc-500 font-mono h-4">
            {isAutoSaving ? (
              <span className="text-emerald-400 animate-pulse flex items-center gap-1"><RiTimeLine size={12} /> Auto-saving...</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1"><RiCheckLine size={12} className="text-emerald-500" /> Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            ) : (
              <span>Not saved yet</span>
            )}
          </div>

          <button 
            onClick={() => { playAction(); alert("Executing Workflow..."); }}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <RiPlayFill size={16} className="text-emerald-400" /> TEST RUN
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="col-span-9 h-full relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-950"
            colorMode="dark"
          >
            <Background color="#3f3f46" gap={16} size={1} />
            <Controls className="bg-zinc-900 border-white/10 fill-white" />
            <MiniMap 
              className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden" 
              maskColor="rgba(0,0,0,0.7)"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger': return '#10b981';
                  case 'aiAction': return '#a855f7';
                  case 'apiCall': return '#3b82f6';
                  case 'condition': return '#eab308';
                  case 'interaction': return '#ec4899';
                  default: return '#71717a';
                }
              }}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default WorkflowsView;
