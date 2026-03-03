import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import {
    ArrowLeft, Play, Upload, CheckCircle, XCircle, Loader2,
    Cpu, Cog, Clock, ChevronDown, ChevronRight, Zap, Activity,
    FileText, Send, Workflow
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Step Card Component
// ═══════════════════════════════════════════════════════════════
const StepCard = ({ step, index }) => {
    const [expanded, setExpanded] = useState(false);

    const statusConfig = {
        done: { icon: <CheckCircle size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'DONE' },
        error: { icon: <XCircle size={16} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'ERROR' },
        running: { icon: <Loader2 size={16} className="animate-spin" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'RUNNING' },
        pending: { icon: <Clock size={16} />, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'PENDING' },
    };

    const s = statusConfig[step.status] || statusConfig.pending;
    const isEngine = step.nodeType === 'engine';

    return (
        <div className={`rounded-xl border ${s.border} ${s.bg} transition-all duration-300`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-md text-xs font-black ${isEngine ? 'bg-violet-500/20 text-violet-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {index + 1}
                    </div>
                    <span className="text-lg leading-none">{step.nodeIcon}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{step.nodeName}</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isEngine ? 'text-violet-500' : 'text-cyan-500'}`}>
                                {step.nodeType}{step.engineType ? ` · ${step.engineType}` : ''}
                            </span>
                            {step.duration > 0 && (
                                <span className="text-[8px] text-slate-600 font-mono">
                                    {(step.duration / 1000).toFixed(1)}s
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`${s.color} flex items-center space-x-1`}>
                        {s.icon}
                        <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                    </span>
                    {step.output && (
                        expanded
                            ? <ChevronDown size={14} className="text-slate-600" />
                            : <ChevronRight size={14} className="text-slate-600" />
                    )}
                </div>
            </button>

            {expanded && step.output && (
                <div className="px-4 pb-3 border-t border-slate-800/40 mt-1 pt-3">
                    {step.error && (
                        <div className="text-red-400 text-xs font-bold mb-2 bg-red-500/10 px-3 py-2 rounded-lg">
                            ⚠ {step.error}
                        </div>
                    )}
                    <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
                        {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
const MachineExecutor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [machine, setMachine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);
    const [execError, setExecError] = useState(null);

    useEffect(() => {
        const loadMachine = async () => {
            try {
                const res = await axios.get(`${API_URL}/machines/${id}`);
                setMachine(res.data.data);
            } catch (err) {
                console.error(err);
                navigate('/machines');
            } finally {
                setLoading(false);
            }
        };
        loadMachine();
    }, [id]);

    const handleExecute = async (e) => {
        e.preventDefault();
        setExecuting(true);
        setResult(null);
        setExecError(null);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (file) formData.append('imagen', file);

            const res = await axios.post(`${API_URL}/machines/${id}/execute`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000 // 5 min timeout for long pipelines
            });
            setResult(res.data.data);
        } catch (err) {
            console.error(err);
            setExecError(err.response?.data?.message || err.message || 'Execution failed');
            // If partial results available
            if (err.response?.data?.data) setResult(err.response.data.data);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0e1a' }}>
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-violet-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4 animate-pulse">Loading Machine...</p>
            </div>
        );
    }

    const nodeCount = machine?.MachineNodes?.length || 0;
    const connCount = machine?.MachineConnections?.length || 0;

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate('/machines')} className="guardian-btn-outline !p-3 !rounded-xl">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-5xl shadow-sm">
                        {machine?.icono || '⚙️'}
                    </div>
                    <div>
                        <p className="guardian-label">Machine Executor</p>
                        <h1 className="guardian-h1 !mb-1 leading-none">{machine?.nombre}</h1>
                        <div className="flex items-center space-x-3 mt-1">
                            <span className="guardian-text-sm italic">{machine?.descripcion || 'Sin descripción'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="guardian-badge bg-purple-50 text-purple-600 border border-purple-100">
                                <Workflow size={10} className="inline mr-1" />
                                {nodeCount}N · {connCount}C
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/machines/${id}`)}
                    className="guardian-btn-outline !w-auto"
                >
                    <Cpu size={16} />
                    <span>Open Editor</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* ── Input Panel ── */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="guardian-card h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                            <div className="flex items-center space-x-2 text-guardian-text font-bold text-sm uppercase tracking-tight">
                                <Zap size={18} className="text-violet-500" />
                                <span>Machine Input</span>
                            </div>
                        </div>

                        <form onSubmit={handleExecute} className="space-y-8 flex-1 flex flex-col">
                            <div className="space-y-6 flex-1">
                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Pipeline Instructions</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="guardian-input !pl-4 min-h-[220px] resize-none leading-relaxed"
                                        placeholder="Enter initial data or instructions for the machine pipeline..."
                                        required
                                    />
                                </div>

                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Reference Asset</label>
                                    <div className="relative group cursor-pointer h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-violet-400 hover:bg-violet-50/50 transition-all flex flex-col items-center justify-center text-center">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {file ? (
                                            <>
                                                <CheckCircle size={28} className="text-green-500 mb-1" />
                                                <span className="text-[11px] font-bold text-guardian-text uppercase truncate max-w-[200px]">{file.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={28} className="text-slate-300 mb-1" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optional File Upload</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={executing}
                                className="guardian-btn-primary !bg-violet-600 hover:!bg-violet-700 !shadow-violet-500/20"
                            >
                                {executing ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Executing Pipeline...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Play size={20} />
                                        <span>Execute Machine</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Execution Log Panel ── */}
                <div className="lg:col-span-3">
                    <div className="guardian-card h-full min-h-[600px] flex flex-col !p-0 overflow-hidden border-t-4 border-t-violet-500">
                        <div className="flex items-center justify-between p-8 border-b border-slate-50">
                            <div className="flex items-center space-x-3 text-guardian-text font-bold text-sm uppercase tracking-tight">
                                <Activity size={18} className="text-violet-500" />
                                <span>Execution Pipeline</span>
                            </div>
                            {result && (
                                <div className="flex items-center space-x-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {result.steps?.length || 0} steps
                                    </span>
                                    <span className="text-[9px] font-mono text-violet-500">
                                        {((result.totalDuration || 0) / 1000).toFixed(1)}s total
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
                            {execError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                                    <div className="flex items-center space-x-2 mb-2 font-black uppercase tracking-tighter text-[10px]">
                                        <XCircle size={14} />
                                        <span>Execution Error</span>
                                    </div>
                                    <p className="font-bold text-sm">{execError}</p>
                                </div>
                            )}

                            {result?.steps?.length > 0 ? (
                                <div className="space-y-3">
                                    {result.steps.map((step, i) => (
                                        <StepCard key={step.nodeId} step={step} index={i} />
                                    ))}

                                    {/* Final Output */}
                                    {result.finalOutput && (
                                        <div className="mt-8 pt-6 border-t-2 border-violet-200">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <FileText size={16} className="text-violet-500" />
                                                <span className="text-xs font-black text-violet-600 uppercase tracking-widest">Final Output</span>
                                            </div>
                                            <div className="bg-white rounded-xl border border-violet-100 p-5 shadow-sm">
                                                <pre className="text-[12px] text-slate-700 font-mono overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
                                                    {typeof result.finalOutput === 'string'
                                                        ? result.finalOutput
                                                        : JSON.stringify(result.finalOutput, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : executing ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Workflow size={24} className="text-violet-500" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-black text-violet-500 uppercase tracking-[0.4em] animate-pulse">Executing Pipeline</p>
                                        <p className="text-[10px] text-slate-400">Processing {nodeCount} nodes...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale text-center px-10">
                                    <Workflow size={64} className="mb-6 text-slate-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Awaiting Pipeline Initialization</p>
                                    <p className="text-[10px] text-slate-400 mt-2">Enter instructions and click Execute to run this machine</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineExecutor;
