import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Play,
    Database,
    Zap,
    Upload,
    Terminal,
    FileCode,
    Cpu,
    BookOpen,
    MessageSquare,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ApiTester = () => {
    const [tools, setTools] = useState([]);
    const [providers, setProviders] = useState([]);
    const [schemas, setSchemas] = useState([]);

    const [selectedToolId, setSelectedToolId] = useState('');
    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [selectedSchemaId, setSelectedSchemaId] = useState('');

    const [trainingPrompt, setTrainingPrompt] = useState('');
    const [behaviorPrompt, setBehaviorPrompt] = useState('');
    const [inputText, setInputText] = useState('');
    const [inputFiles, setInputFiles] = useState([]);
    const [allowEmptyPrompt, setAllowEmptyPrompt] = useState(false);

    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showRaw, setShowRaw] = useState(false);

    // Initial load
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tRes, pRes, sRes] = await Promise.all([
                    axios.get(`${API_URL}/tools`),
                    axios.get(`${API_URL}/ai-providers`),
                    axios.get(`${API_URL}/json-schemas`)
                ]);
                setTools(tRes.data.data || []);
                setProviders(pRes.data.data || []);
                setSchemas(sRes.data.data || []);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load system data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle tool selection - prefill fields
    const handleToolSelect = (id) => {
        setSelectedToolId(id);
        if (!id) {
            setTrainingPrompt('');
            setBehaviorPrompt('');
            setSelectedProviderId('');
            setSelectedSchemaId('');
            return;
        }

        const tool = tools.find(t => t.id === id);
        if (tool) {
            setTrainingPrompt(tool.training_prompt || '');
            setBehaviorPrompt(tool.behavior_prompt || '');
            setSelectedProviderId(tool.ai_provider_id || '');
            setSelectedSchemaId(tool.json_schema_id || '');
        }
    };

    const handleExecute = async () => {
        if (!inputText && !allowEmptyPrompt && inputFiles.length === 0) {
            setError('Debe ingresar un prompt o cargar archivos para continuar.');
            return;
        }

        setExecuting(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('tool_id', selectedToolId);
            formData.append('training_prompt', trainingPrompt);
            formData.append('behavior_prompt', behaviorPrompt);
            formData.append('ai_provider_id', selectedProviderId);
            formData.append('json_schema_id', selectedSchemaId);
            formData.append('prompt', inputText);

            if (inputFiles.length > 0) {
                inputFiles.forEach(f => formData.append('imagenes', f));
            }

            const res = await axios.post(`${API_URL}/api-tester/execute`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(res.data.data);
        } catch (err) {
            console.error('Execution error:', err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col space-y-6 h-screen overflow-hidden p-6 -m-6 bg-[#0a0e1a]">
            {/* Header / Base Tool Selector */}
            <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                        <Terminal size={20} />
                    </div>
                    <div className="flex flex-col mr-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white italic">Neural API Tester</h2>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Test tools with real-time parameter overrides</span>
                    </div>

                    <div className="flex items-center space-x-2 bg-black/40 p-1 rounded-lg border border-slate-800 flex-1 max-w-md">
                        <Database size={14} className="text-slate-500 ml-2" />
                        <select
                            value={selectedToolId}
                            onChange={(e) => handleToolSelect(e.target.value)}
                            className="bg-transparent text-xs text-white p-1.5 focus:outline-none w-full"
                        >
                            <option value="">-- [ NEW VIRTUAL TOOL ] --</option>
                            {tools.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleExecute}
                    disabled={executing || (!inputText && !allowEmptyPrompt && inputFiles.length === 0)}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${executing ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        }`}
                >
                    {executing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                    <span>Execute Probe</span>
                </button>
            </div>

            {/* Main Content: 3 Columns */}
            <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">

                {/* Column 1: Config (Schema & Provider) */}
                <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        <Settings size={12} />
                        <span>Core Configuration</span>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-4 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Provider</label>
                            <div className="flex items-center space-x-2 bg-black/40 border border-slate-700 p-2 rounded-lg">
                                <Cpu size={14} className="text-cyan-500/60" />
                                <select
                                    value={selectedProviderId}
                                    onChange={(e) => setSelectedProviderId(e.target.value)}
                                    className="bg-transparent text-[11px] text-white w-full focus:outline-none"
                                >
                                    <option value="">System Default</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} ({p.modelo})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">JSON Response Schema</label>
                            <div className="flex items-center space-x-2 bg-black/40 border border-slate-700 p-2 rounded-lg">
                                <FileCode size={14} className="text-violet-500/60" />
                                <select
                                    value={selectedSchemaId}
                                    onChange={(e) => setSelectedSchemaId(e.target.value)}
                                    className="bg-transparent text-[11px] text-white w-full focus:outline-none"
                                >
                                    <option value="">No Schema (Text Mode)</option>
                                    {schemas.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedSchemaId && (
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg flex-1">
                                    <p className="text-[9px] text-violet-300 italic opacity-60">
                                        Note: Schema will be injected into behavior protocol as a strict constraint.
                                    </p>
                                    <pre className="text-[9px] font-mono p-2 text-violet-400/80 mt-2 overflow-x-auto">
                                        {JSON.stringify(JSON.parse(schemas.find(s => s.id === selectedSchemaId)?.schema || '{}'), null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Prompts (Training & Behavior) */}
                <div className="col-span-4 flex flex-col space-y-4 overflow-hidden">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        <BookOpen size={12} />
                        <span>Behavioral Protocols</span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center space-x-1">
                                    <Zap size={10} className="text-yellow-500" />
                                    <span>System Training Prompt</span>
                                </label>
                            </div>
                            <textarea
                                value={trainingPrompt}
                                onChange={(e) => setTrainingPrompt(e.target.value)}
                                placeholder="Define global knowledge and persona..."
                                className="bg-black/40 border border-slate-700 rounded-lg p-3 text-[11px] text-indigo-100/90 font-mono w-full min-h-[220px] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none leading-relaxed"
                            />
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center space-x-1">
                                    <MessageSquare size={10} className="text-cyan-500" />
                                    <span>Behavior Protocol</span>
                                </label>
                            </div>
                            <textarea
                                value={behaviorPrompt}
                                onChange={(e) => setBehaviorPrompt(e.target.value)}
                                placeholder="Define output rules and extracting logic..."
                                className="bg-black/40 border border-slate-700 rounded-lg p-3 text-[11px] text-cyan-100/90 font-mono w-full min-h-[220px] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all outline-none leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Column 3: Input & Output */}
                <div className="col-span-5 flex flex-col space-y-4 overflow-hidden">
                    {/* Input Section */}
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            <Upload size={12} />
                            <span>Neural Input</span>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Text Input</span>
                                <label className="flex items-center cursor-pointer space-x-2 group">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
                                        Allow Empty
                                    </span>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={allowEmptyPrompt}
                                            onChange={(e) => setAllowEmptyPrompt(e.target.checked)}
                                        />
                                        <div className={`w-7 h-3.5 rounded-full transition-colors ${allowEmptyPrompt ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${allowEmptyPrompt ? 'translate-x-3.5' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={allowEmptyPrompt ? "Enter instructions (optional)..." : "Paste text or describe instruction..."}
                                className="bg-black/60 border border-slate-700 rounded-lg p-3 text-[12px] text-white w-full h-[120px] focus:border-cyan-500/50 outline-none resize-none"
                            />

                            <div className="flex flex-col space-y-2">
                                <label className="flex-1 flex items-center justify-center space-x-3 p-4 bg-cyan-500/5 border border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:bg-cyan-500/10 transition-all group">
                                    <Upload size={18} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col text-left">
                                        <span className="text-[11px] text-cyan-100 font-bold uppercase tracking-wider italic">
                                            {inputFiles.length > 0 ? `${inputFiles.length} Files Selected` : 'Upload Assets (Batch Support)'}
                                        </span>
                                        <span className="text-[9px] text-cyan-500/50 font-black">SUPPORTED: PDF, PNG, JPG, WEBP</span>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => setInputFiles(Array.from(e.target.files))}
                                    />
                                </label>

                                {inputFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {inputFiles.map((f, i) => (
                                            <div key={i} className="flex items-center space-x-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[9px] text-cyan-200">
                                                <span className="truncate max-w-[80px]">{f.name}</span>
                                                <button onClick={() => setInputFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400">
                                                    <EyeOff size={8} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result Section */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Check size={12} className={result ? 'text-emerald-500' : ''} />
                                    <span>Neural Response Outlet</span>
                                </div>
                                {result && (
                                    <button
                                        onClick={() => setShowRaw(!showRaw)}
                                        className={`flex items-center space-x-1 font-bold ${showRaw ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {showRaw ? <Eye size={10} /> : <EyeOff size={10} />}
                                        <span>{showRaw ? 'Render View' : 'Raw JSON'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 bg-black/60 border border-slate-800 rounded-xl overflow-hidden relative">
                                {!result && !error && !executing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-20 italic">
                                        <Play size={48} className="mb-4" />
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">Idle - Ready for Probe</span>
                                    </div>
                                )}

                                {executing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                                        <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
                                        <div className="text-center">
                                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] animate-pulse italic block mb-1">Synthesizing Neural Result</span>
                                            <span className="text-[10px] text-slate-500 font-black uppercase italic tracking-widest opacity-60">Consulting {providers.find(p => p.id === selectedProviderId)?.nombre || 'Default API'}</span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-6">
                                        <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-100">
                                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-[10px] font-black uppercase italic tracking-wider">Protocol Deviation Failure</span>
                                                <span className="text-xs font-mono">{error}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {result && (
                                    <div className="h-full overflow-y-auto custom-scrollbar p-0">
                                        {showRaw ? (
                                            <pre className="p-6 text-[11px] font-mono text-cyan-400/90 leading-relaxed whitespace-pre-wrap">
                                                {JSON.stringify(result.response, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="p-6">
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mb-4">
                                                    <div className="flex items-center space-x-2 mb-3 text-emerald-400">
                                                        <Zap size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Computed Success via {result.provider.nombre}</span>
                                                    </div>
                                                    <div className="text-[13px] text-white leading-relaxed">
                                                        {typeof result.response === 'string' ? result.response : (
                                                            <div className="space-y-4">
                                                                {Object.entries(result.response).map(([key, value]) => (
                                                                    <div key={key} className="border-b border-emerald-500/10 pb-2 last:border-0">
                                                                        <label className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest block mb-0.5">{key.replace(/_/g, ' ')}</label>
                                                                        <div className="text-emerald-50/90 font-medium">
                                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiTester;
