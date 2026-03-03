import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Panel,
    Handle,
    Position,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, ArrowLeft, Cpu, Cog, GripVertical, Workflow, ChevronDown, ChevronRight, Check, Trash2, X, Play } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Custom Node: Tool (Blue)
// ═══════════════════════════════════════════════════════════════
const ToolNode = ({ data, selected }) => (
    <div className={`rounded-xl shadow-2xl w-40 h-40 border flex flex-col transition-all relative ${selected ? 'border-cyan-400 shadow-cyan-500/30 ring-2 ring-cyan-400/40' : 'border-slate-600'}`}
        style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3 leading-none drop-shadow-md">{data.icon || '🔧'}</span>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest line-clamp-2 leading-tight w-full drop-shadow-sm">{data.label}</span>
            <div className="mt-2 w-full flex-1 relative overflow-hidden">
                <p className="text-[9px] text-slate-400 line-clamp-3 leading-snug">{data.description || 'AI Tool'}</p>
            </div>
        </div>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-cyan-400 !border-[2px] !border-slate-900 !-left-[7px]" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-cyan-400 !border-[2px] !border-slate-900 !-right-[7px]" />
    </div>
);

// ═══════════════════════════════════════════════════════════════
// Custom Node: Engine (Purple)
// ═══════════════════════════════════════════════════════════════
const EngineNode = ({ data, selected }) => (
    <div className={`rounded-xl shadow-2xl w-40 h-40 border flex flex-col transition-all relative ${selected ? 'border-violet-400 shadow-violet-500/30 ring-2 ring-violet-400/40' : 'border-slate-600'}`}
        style={{ background: 'linear-gradient(145deg, #1e1b3a 0%, #0f0d24 100%)' }}>
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-2.5 leading-none drop-shadow-md">{data.icon || '⚙️'}</span>
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest line-clamp-2 leading-tight w-full drop-shadow-sm">{data.label}</span>
            <span className="inline-block mt-1.5 text-[8px] font-black text-violet-300 uppercase tracking-[0.15em] bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/30">{data.engineType}</span>
            <div className="mt-2 w-full flex-1 relative overflow-hidden">
                <p className="text-[9px] text-slate-400 line-clamp-2 leading-snug">{data.description || 'Engine'}</p>
            </div>
        </div>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-violet-400 !border-[2px] !border-slate-900 !-left-[7px]" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-violet-400 !border-[2px] !border-slate-900 !-right-[7px]" />
    </div>
);

const nodeTypes = { toolNode: ToolNode, engineNode: EngineNode };

const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6', width: 16, height: 16 },
};

// ═══════════════════════════════════════════════════════════════
// Main Editor
// ═══════════════════════════════════════════════════════════════
const MachineEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [machine, setMachine] = useState(null);
    const [tools, setTools] = useState([]);
    const [engines, setEngines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [machineName, setMachineName] = useState('');
    const [machineDesc, setMachineDesc] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [toolsOpen, setToolsOpen] = useState(true);
    const [enginesOpen, setEnginesOpen] = useState(true);

    const reactFlowWrapper = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [machineRes, toolsRes, enginesRes] = await Promise.all([
                    axios.get(`${API_URL}/machines/${id}`),
                    axios.get(`${API_URL}/tools`),
                    axios.get(`${API_URL}/engines`),
                ]);
                const m = machineRes.data.data;
                setMachine(m);
                setMachineName(m.nombre);
                setMachineDesc(m.descripcion || '');
                setTools(toolsRes.data.data);
                setEngines(enginesRes.data.data);

                const flowNodes = (m.MachineNodes || []).map(n => ({
                    id: n.id,
                    type: n.node_type === 'tool' ? 'toolNode' : 'engineNode',
                    position: { x: n.position_x || 0, y: n.position_y || 0 },
                    data: {
                        label: n.Tool?.nombre || n.Engine?.nombre || 'Unknown',
                        icon: n.Tool?.logo_herramienta || n.Engine?.icono || '❓',
                        description: n.Tool?.descripcion || n.Engine?.descripcion || '',
                        engineType: n.Engine?.tipo || '',
                        nodeType: n.node_type,
                        toolId: n.tool_id,
                        engineId: n.engine_id,
                        config: n.config ? (typeof n.config === 'string' ? JSON.parse(n.config) : n.config) : {},
                        configSchema: n.Engine?.config_schema ? (typeof n.Engine.config_schema === 'string' ? JSON.parse(n.Engine.config_schema) : n.Engine.config_schema) : null,
                    },
                }));

                const flowEdges = (m.MachineConnections || []).map(c => ({
                    id: c.id,
                    source: c.source_node_id,
                    target: c.target_node_id,
                    sourceHandle: c.source_handle,
                    targetHandle: c.target_handle,
                    ...defaultEdgeOptions,
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } catch (err) { console.error('Failed to load:', err); }
            finally { setLoading(false); }
        };
        loadData();
    }, [id]);

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    }, [setEdges]);

    const generateUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    const onDragStart = (event, itemType, item) => {
        event.dataTransfer.setData('application/reactflow-type', itemType);
        event.dataTransfer.setData('application/reactflow-item', JSON.stringify(item));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow-type');
        const item = JSON.parse(event.dataTransfer.getData('application/reactflow-item'));
        if (!type || !item) return;

        const wrapperBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = { x: event.clientX - wrapperBounds.left - 90, y: event.clientY - wrapperBounds.top - 30 };

        setNodes(nds => [...nds, {
            id: generateUUID(),
            type: type === 'tool' ? 'toolNode' : 'engineNode',
            position,
            data: {
                label: item.nombre,
                icon: item.logo_herramienta || item.icono || '❓',
                description: item.descripcion || '',
                engineType: item.tipo || '',
                nodeType: type,
                toolId: type === 'tool' ? item.id : null,
                engineId: type === 'engine' ? item.id : null,
                config: {},
                configSchema: item.config_schema ? (typeof item.config_schema === 'string' ? JSON.parse(item.config_schema) : item.config_schema) : null
            },
        }]);
    }, [setNodes]);

    const updateNodeConfig = (nodeId, key, value) => {
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === nodeId) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            config: {
                                ...n.data.config,
                                [key]: value,
                            },
                        },
                    };
                }
                return n;
            })
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${API_URL}/machines/${id}`, {
                nombre: machineName,
                descripcion: machineDesc,
                icono: machine?.icono,
                nodes: nodes.map(n => ({
                    id: n.id, node_type: n.data.nodeType, tool_id: n.data.toolId,
                    engine_id: n.data.engineId, position_x: n.position.x, position_y: n.position.y, config: n.data.config,
                })),
                connections: edges.map(e => ({
                    source_node_id: e.source, target_node_id: e.target,
                    source_handle: e.sourceHandle || null, target_handle: e.targetHandle || null,
                })),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#0a0e1a' }}>
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4 animate-pulse">Initializing Machine Flow...</p>
            </div>
        );
    }

    const selectedNode = nodes.find(n => n.selected);

    return (
        <div className="fixed inset-0 z-50 flex" style={{ background: '#0a0e1a' }}>
            {/* ── Compact Sidebar ── */}
            <div className={`flex flex-col border-r border-slate-800 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'}`}
                style={{ background: 'linear-gradient(180deg, #0f1320 0%, #0a0e1a 100%)' }}>

                {/* Header */}
                <div className="p-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-2 min-w-0">
                        <Workflow size={14} className="text-violet-400 flex-shrink-0" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] truncate">Components</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-600 hover:text-slate-400 p-0.5">
                        <X size={12} />
                    </button>
                </div>

                {/* Scrollable items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Tools */}
                    <div className="border-b border-slate-800/60">
                        <button onClick={() => setToolsOpen(!toolsOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center space-x-1.5">
                                <Cpu size={10} className="text-cyan-500" />
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Tools</span>
                                <span className="text-[8px] text-slate-600 ml-1">({tools.length})</span>
                            </div>
                            {toolsOpen ? <ChevronDown size={10} className="text-slate-600" /> : <ChevronRight size={10} className="text-slate-600" />}
                        </button>
                        {toolsOpen && (
                            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                {tools.map(tool => (
                                    <div key={tool.id} draggable onDragStart={e => onDragStart(e, 'tool', tool)}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 cursor-grab active:cursor-grabbing hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group aspect-square text-center relative overflow-hidden">
                                        <GripVertical size={10} className="absolute top-1.5 left-1.5 text-slate-700/50 group-hover:text-cyan-500/50" />
                                        <span className="text-2xl mb-2 leading-none">{tool.logo_herramienta}</span>
                                        <span className="text-[9px] font-bold text-slate-400 line-clamp-3 leading-tight group-hover:text-cyan-300 px-1">{tool.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Engines */}
                    <div>
                        <button onClick={() => setEnginesOpen(!enginesOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center space-x-1.5">
                                <Cog size={10} className="text-violet-500" />
                                <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Engines</span>
                                <span className="text-[8px] text-slate-600 ml-1">({engines.length})</span>
                            </div>
                            {enginesOpen ? <ChevronDown size={10} className="text-slate-600" /> : <ChevronRight size={10} className="text-slate-600" />}
                        </button>
                        {enginesOpen && (
                            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                {engines.map(engine => (
                                    <div key={engine.id} draggable onDragStart={e => onDragStart(e, 'engine', engine)}
                                        className="flex flex-col items-center justify-center p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 cursor-grab active:cursor-grabbing hover:bg-violet-500/10 hover:border-violet-500/30 transition-all group aspect-square text-center relative overflow-hidden">
                                        <GripVertical size={10} className="absolute top-1.5 left-1.5 text-slate-700/50 group-hover:text-violet-500/50" />
                                        <span className="text-2xl mb-2 leading-none">{engine.icono}</span>
                                        <span className="text-[9px] font-bold text-slate-400 line-clamp-3 leading-tight group-hover:text-violet-300 px-1">{engine.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Canvas Area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 flex-shrink-0"
                    style={{ background: 'linear-gradient(90deg, #0f1320, #0a0e1a)' }}>
                    <div className="flex items-center space-x-3 min-w-0">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-cyan-400 p-1 border border-slate-800 rounded transition-colors">
                                <Workflow size={14} />
                            </button>
                        )}
                        <button onClick={() => navigate('/machines')} className="text-slate-600 hover:text-white p-1 border border-slate-800 rounded transition-colors">
                            <ArrowLeft size={14} />
                        </button>
                        <div className="h-5 w-px bg-slate-800" />
                        <span className="text-lg leading-none">{machine?.icono || '⚙️'}</span>
                        <div className="min-w-0">
                            <input value={machineName} onChange={e => setMachineName(e.target.value)}
                                className="text-sm font-bold text-white bg-transparent border-none outline-none w-full placeholder:text-slate-700"
                                placeholder="Machine name..." />
                            <input value={machineDesc} onChange={e => setMachineDesc(e.target.value)}
                                className="text-[10px] text-slate-600 bg-transparent border-none outline-none w-full placeholder:text-slate-800"
                                placeholder="Description..." />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest mr-2">
                            {nodes.length}N · {edges.length}C
                        </div>
                        <button onClick={() => navigate(`/machines/${id}/execute`)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20">
                            <Play size={12} />
                            <span>Run</span>
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${saved
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                                }`}>
                            {saving ? <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                : saved ? <Check size={12} /> : <Save size={12} />}
                            <span>{saving ? 'Saving' : saved ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                </div>

                {/* React Flow */}
                <div className="flex-1" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        defaultEdgeOptions={defaultEdgeOptions}
                        fitView
                        deleteKeyCode={['Backspace', 'Delete']}
                        proOptions={{ hideAttribution: true }}
                        style={{ background: '#0a0e1a' }}
                    >
                        <Background color="#1e293b" gap={24} size={1} variant="dots" />
                        <Controls
                            className="!bg-slate-900 !border-slate-800 !rounded-lg !shadow-2xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700"
                        />
                        <MiniMap
                            nodeColor={n => n.type === 'toolNode' ? '#06b6d4' : '#8b5cf6'}
                            maskColor="rgba(10, 14, 26, 0.85)"
                            className="!bg-slate-900/80 !border-slate-800 !rounded-lg"
                        />
                    </ReactFlow>

                    {/* Properties Panel (Overlay) */}
                    {selectedNode && selectedNode.data.configSchema && Object.keys(selectedNode.data.configSchema).length > 0 && (
                        <div className="absolute top-16 right-4 w-72 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-lg shadow-2xl z-10 flex flex-col pointer-events-auto"
                            style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,14,26,0.95) 100%)' }}>
                            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs">{selectedNode.data.icon}</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{selectedNode.data.label} Properties</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {Object.entries(selectedNode.data.configSchema).map(([key, field]) => {
                                    // Handle direct field type or nested object { type, description, options }
                                    const fieldType = typeof field === 'string' ? field : field.type;
                                    const description = typeof field === 'object' ? field.description : '';
                                    const options = typeof field === 'object' ? field.options : [];
                                    const val = selectedNode.data.config?.[key] || '';

                                    return (
                                        <div key={key}>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{key}</label>

                                            {fieldType === 'select' ? (
                                                <select
                                                    value={val}
                                                    onChange={e => updateNodeConfig(selectedNode.id, key, e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                                                >
                                                    <option value="">Select option...</option>
                                                    {options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : fieldType === 'text' || fieldType === 'textarea' ? (
                                                <textarea
                                                    value={val}
                                                    onChange={e => updateNodeConfig(selectedNode.id, key, e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50 min-h-[60px]"
                                                    placeholder={description}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={e => updateNodeConfig(selectedNode.id, key, e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                                                    placeholder={description}
                                                />
                                            )}
                                            {description && <p className="mt-1 text-[9px] text-slate-600">{description}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MachineEditor;
