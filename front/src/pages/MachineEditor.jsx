import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, ArrowLeft, Cpu, Cog, GripVertical, Workflow, ChevronDown, ChevronRight, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Custom Node Components
// ═══════════════════════════════════════════════════════════════

const ToolNode = ({ data }) => (
    <div className="bg-white border-2 border-blue-300 rounded-xl shadow-lg min-w-[200px] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 flex items-center space-x-2">
            <span className="text-lg">{data.icon || '🔧'}</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider truncate">{data.label}</span>
        </div>
        <div className="px-4 py-3">
            <p className="text-[10px] text-slate-500 line-clamp-2">{data.description || 'AI Tool'}</p>
            <div className="mt-2 flex items-center space-x-1">
                <Cpu size={10} className="text-blue-400" />
                <span className="text-[9px] font-bold text-blue-500 uppercase">Tool</span>
            </div>
        </div>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
    </div>
);

const EngineNode = ({ data }) => (
    <div className="bg-white border-2 border-purple-300 rounded-xl shadow-lg min-w-[200px] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 flex items-center space-x-2">
            <span className="text-lg">{data.icon || '⚙️'}</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider truncate">{data.label}</span>
        </div>
        <div className="px-4 py-3">
            <p className="text-[10px] text-slate-500 line-clamp-2">{data.description || 'Engine'}</p>
            <div className="mt-2 flex items-center space-x-1">
                <Cog size={10} className="text-purple-400" />
                <span className="text-[9px] font-bold text-purple-500 uppercase">{data.engineType || 'Engine'}</span>
            </div>
        </div>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
    </div>
);

const nodeTypes = { toolNode: ToolNode, engineNode: EngineNode };

// ═══════════════════════════════════════════════════════════════
// Main Editor Component
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

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [toolsOpen, setToolsOpen] = useState(true);
    const [enginesOpen, setEnginesOpen] = useState(true);

    const reactFlowWrapper = useRef(null);

    // Load machine, tools, engines
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

                // Convert DB nodes to React Flow nodes
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
                    },
                }));

                // Convert DB connections to React Flow edges
                const flowEdges = (m.MachineConnections || []).map(c => ({
                    id: c.id,
                    source: c.source_node_id,
                    target: c.target_node_id,
                    sourceHandle: c.source_handle,
                    targetHandle: c.target_handle,
                    animated: true,
                    style: { stroke: '#8b5cf6', strokeWidth: 2 },
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } catch (err) {
                console.error('Failed to load machine:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
        }, eds));
    }, [setEdges]);

    // Generate a UUID v4
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };

    // Drag & Drop handlers
    const onDragStart = (event, itemType, item) => {
        event.dataTransfer.setData('application/reactflow-type', itemType);
        event.dataTransfer.setData('application/reactflow-item', JSON.stringify(item));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow-type');
        const item = JSON.parse(event.dataTransfer.getData('application/reactflow-item'));

        if (!type || !item) return;

        const wrapperBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = {
            x: event.clientX - wrapperBounds.left - 100,
            y: event.clientY - wrapperBounds.top - 30,
        };

        const newNode = {
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
            },
        };

        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);

    // Save
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                nombre: machineName,
                descripcion: machineDesc,
                icono: machine?.icono,
                nodes: nodes.map(n => ({
                    id: n.id,
                    node_type: n.data.nodeType,
                    tool_id: n.data.toolId,
                    engine_id: n.data.engineId,
                    position_x: n.position.x,
                    position_y: n.position.y,
                    config: null,
                })),
                connections: edges.map(e => ({
                    source_node_id: e.source,
                    target_node_id: e.target,
                    source_handle: e.sourceHandle || null,
                    target_handle: e.targetHandle || null,
                })),
            };

            await axios.put(`${API_URL}/machines/${id}`, payload);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Save error:', err);
            alert('Error saving machine: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-guardian-blue border-t-transparent rounded-full animate-spin" />
                <p className="guardian-text-sm font-bold animate-pulse">Loading Machine Flow...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Top Bar */}
            <div className="bg-white border border-guardian-border rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/machines')} className="guardian-btn-outline !p-2" title="Back to catalog">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{machine?.icono || '⚙️'}</span>
                        <div>
                            <input
                                value={machineName}
                                onChange={e => setMachineName(e.target.value)}
                                className="text-lg font-bold text-guardian-text bg-transparent border-none outline-none w-full"
                                placeholder="Machine name..."
                            />
                            <input
                                value={machineDesc}
                                onChange={e => setMachineDesc(e.target.value)}
                                className="text-xs text-guardian-muted bg-transparent border-none outline-none w-full"
                                placeholder="Description..."
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`guardian-btn-primary !w-auto ${saved ? '!bg-green-500' : ''}`}
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saved ? (
                        <Check size={18} />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Flow'}</span>
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex flex-1 gap-4 min-h-0">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 bg-white border border-guardian-border rounded-xl shadow-sm overflow-y-auto">
                    <div className="p-4 border-b border-guardian-border">
                        <p className="text-[10px] font-black text-guardian-muted uppercase tracking-widest">
                            Drag & Drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Drag items to the canvas</p>
                    </div>

                    {/* Tools Section */}
                    <div className="border-b border-guardian-border">
                        <button
                            onClick={() => setToolsOpen(!toolsOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-2">
                                <Cpu size={14} className="text-blue-500" />
                                <span className="text-xs font-bold text-guardian-text uppercase tracking-wider">Tools</span>
                            </div>
                            {toolsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {toolsOpen && (
                            <div className="px-3 pb-3 space-y-1">
                                {tools.map(tool => (
                                    <div
                                        key={tool.id}
                                        draggable
                                        onDragStart={e => onDragStart(e, 'tool', tool)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors group"
                                    >
                                        <GripVertical size={12} className="text-blue-300 group-hover:text-blue-500" />
                                        <span className="text-sm">{tool.logo_herramienta}</span>
                                        <span className="text-xs font-medium text-slate-700 truncate">{tool.nombre}</span>
                                    </div>
                                ))}
                                {tools.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-2">No tools available</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Engines Section */}
                    <div>
                        <button
                            onClick={() => setEnginesOpen(!enginesOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-2">
                                <Cog size={14} className="text-purple-500" />
                                <span className="text-xs font-bold text-guardian-text uppercase tracking-wider">Engines</span>
                            </div>
                            {enginesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {enginesOpen && (
                            <div className="px-3 pb-3 space-y-1">
                                {engines.map(engine => (
                                    <div
                                        key={engine.id}
                                        draggable
                                        onDragStart={e => onDragStart(e, 'engine', engine)}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100 cursor-grab active:cursor-grabbing hover:bg-purple-100 transition-colors group"
                                    >
                                        <GripVertical size={12} className="text-purple-300 group-hover:text-purple-500" />
                                        <span className="text-sm">{engine.icono}</span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium text-slate-700 truncate">{engine.nombre}</span>
                                            <span className="text-[9px] text-purple-500 uppercase font-bold">{engine.tipo}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* React Flow Canvas */}
                <div className="flex-1 bg-white border border-guardian-border rounded-xl shadow-sm overflow-hidden" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                        deleteKeyCode={['Backspace', 'Delete']}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#e2e8f0" gap={20} size={1} />
                        <Controls className="!bg-white !border-guardian-border !rounded-lg !shadow-sm" />
                        <MiniMap
                            nodeColor={(node) => node.type === 'toolNode' ? '#3b82f6' : '#8b5cf6'}
                            className="!bg-white !border-guardian-border !rounded-lg !shadow-sm"
                        />
                        <Panel position="top-center">
                            <div className="bg-white/90 backdrop-blur border border-guardian-border rounded-lg px-4 py-2 shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <Workflow size={14} className="text-purple-500" />
                                    <span className="text-[10px] font-black text-guardian-muted uppercase tracking-widest">
                                        {nodes.length} Nodes · {edges.length} Connections
                                    </span>
                                </div>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
};

export default MachineEditor;
