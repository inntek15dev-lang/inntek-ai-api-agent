import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Upload, Send, MessageSquare, FileText, CheckCircle, Cpu, Zap, Activity } from 'lucide-react';

const ToolView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchTool();
    }, [id]);

    const fetchTool = async () => {
        try {
            const res = await axios.get(`http://localhost:3333/api/tools/${id}`);
            // The backend returns Tool with OutputFormat nested if associated
            setTool(res.data.data);
        } catch (err) {
            console.error(err);
            navigate('/catalog');
        } finally {
            setLoading(false);
        }
    };

    const resolvePath = (obj, path) => {
        if (!path) return null;
        return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
    };

    const DynamicRenderer = ({ data, structure }) => {
        if (!structure) return null;

        let elements = null;
        let isHtmlTemplate = false;

        try {
            // Try to parse as JSON element array (New format)
            const parsed = typeof structure === 'string' ? JSON.parse(structure) : structure;
            if (Array.isArray(parsed)) {
                elements = parsed;
            } else {
                isHtmlTemplate = true;
            }
        } catch (e) {
            // If parsing fails, it's likely a raw HTML template (Legacy/Seed format)
            isHtmlTemplate = true;
        }

        if (isHtmlTemplate) {
            // Regex-based template engine for HTML templates
            const renderedHtml = structure.replace(/\{\{(.*?)\}\}/g, (match, path) => {
                const value = resolvePath(data, path.trim());
                return value !== undefined && value !== null ? value : match;
            });

            return (
                <div
                    className="animate-in fade-in slide-in-from-bottom-4"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
            );
        }

        if (!elements) return null;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {elements.map((el, i) => {
                    const value = resolvePath(data, el.data.param) || el.data.text;

                    switch (el.type) {
                        case 'heading':
                            return <h2 key={i} className="text-2xl font-black text-guardian-text">{value}</h2>;
                        case 'subheading':
                            return <h3 key={i} className="text-lg font-bold text-guardian-text/80 mt-4">{value}</h3>;
                        case 'label':
                            return (
                                <div key={i} className="flex flex-col space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                        {el.data.text}
                                    </span>
                                    <span className="text-base font-bold text-guardian-text">
                                        {value}
                                    </span>
                                </div>
                            );
                        case 'text':
                            return <p key={i} className="text-sm text-slate-500 leading-relaxed">{value}</p>;
                        case 'image':
                            return <img key={i} src={value} alt="AI Generated" className="w-full rounded-2xl shadow-lg" />;
                        case 'table':
                            return (
                                <div key={i} className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-400 uppercase font-black">
                                            <tr>
                                                {Array.isArray(value) && Object.keys(value[0] || {}).map(k => (
                                                    <th key={k} className="px-4 py-3">{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(value) && value.map((row, ri) => (
                                                <tr key={ri} className="border-t border-slate-50">
                                                    {Object.values(row).map((v, ci) => (
                                                        <td key={ci} className="px-4 py-3 font-bold text-guardian-text">{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        case 'boton_accionable':
                            return (
                                <button
                                    key={i}
                                    onClick={async () => {
                                        try {
                                            const payload = el.data.param ? resolvePath(data, el.data.param) : data;
                                            await axios({
                                                method: el.data.method,
                                                url: el.data.api_url,
                                                data: payload
                                            });
                                            alert('Action executed successfully');
                                        } catch (err) {
                                            alert('Action failed: ' + err.message);
                                        }
                                    }}
                                    className="w-full py-4 bg-guardian-blue rounded-xl text-white font-bold text-sm shadow-lg shadow-guardian-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {el.data.label}
                                </button>
                            );
                        default:
                            return null;
                    }
                })}
            </div>
        );
    };

    const handleExecute = async (e) => {
        e.preventDefault();
        setIsExecuting(true);
        setResponse('');
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (file) {
                formData.append('imagen', file);
            }

            const res = await axios.post(`http://localhost:3333/api/tools/${id}/execute`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResponse(res.data.data.response);
        } catch (err) {
            console.error(err);
        } finally {
            setIsExecuting(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-guardian-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="guardian-text-sm font-bold animate-pulse">Syncing Host...</p>
        </div>
    );

    if (!tool) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Activity size={48} className="text-cyber-pink animate-pulse" />
            <p className="guardian-text-sm font-bold text-cyber-pink uppercase font-black tracking-widest">Protocol Retrieval Failed</p>
            <button onClick={() => navigate('/catalog')} className="guardian-btn-outline">Return to Catalog</button>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => navigate('/catalog')}
                        className="guardian-btn-outline !p-3 !rounded-xl"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-white border border-guardian-border rounded-2xl flex items-center justify-center text-5xl shadow-sm">
                            {tool.logo_herramienta}
                        </div>
                        <div>
                            <h1 className="guardian-h1 !mb-1 leading-none">{tool.nombre}</h1>
                            <div className="flex items-center space-x-3 mt-1">
                                <span className="guardian-text-sm italic">{tool.descripcion}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="guardian-badge guardian-badge--blue">{tool.response_format} Output</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Input Formulation */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="guardian-card h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                            <div className="flex items-center space-x-2 text-guardian-text font-bold text-sm uppercase tracking-tight">
                                <MessageSquare size={18} className="text-guardian-blue" />
                                <span>Command Input</span>
                            </div>
                        </div>

                        <form onSubmit={handleExecute} className="space-y-8 flex-1 flex flex-col">
                            <div className="space-y-6 flex-1">
                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Requirement Instructions</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="guardian-input !pl-4 min-h-[220px] resize-none leading-relaxed"
                                        placeholder="Enter processing protocols..."
                                        required
                                    />
                                </div>

                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Reference Assets</label>
                                    <div className="relative group cursor-pointer h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-guardian-blue hover:bg-guardian-blue/5 transition-all flex flex-col items-center justify-center text-center">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {file ? (
                                            <>
                                                <CheckCircle size={28} className="text-green-500 mb-1" />
                                                <span className="text-[11px] font-bold text-guardian-text uppercase truncate max-w-[150px]">{file.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={28} className="text-slate-300 mb-1" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Upload Link</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isExecuting}
                                className="guardian-btn-primary"
                            >
                                {isExecuting ? (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Run Protocol</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Output Visor */}
                <div className="lg:col-span-3">
                    <div className="guardian-card h-full min-h-[600px] flex flex-col !p-0 overflow-hidden border-t-4 border-t-guardian-blue">
                        <div className="flex items-center justify-between p-8 border-b border-slate-50">
                            <div className="flex items-center space-x-3 text-guardian-text font-bold text-sm uppercase tracking-tight">
                                <FileText size={18} className="text-guardian-blue" />
                                <span>Response Visor</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-guardian-muted border border-slate-100">
                                    <Cpu size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto font-mono text-[13px] leading-relaxed text-slate-700 bg-slate-50/30">
                            {response ? (
                                tool.OutputFormat ? (
                                    (() => {
                                        try {
                                            const jsonData = typeof response === 'string' ? JSON.parse(response) : response;
                                            return <DynamicRenderer data={jsonData} structure={tool.OutputFormat.estructura} />;
                                        } catch (e) {
                                            const displayLines = typeof response === 'string' ? response.split('\n') : [JSON.stringify(response, null, 2)];
                                            return (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-cyber-pink/5 border border-cyber-pink/20 rounded-xl text-cyber-pink text-xs font-bold mb-4">
                                                        Protocol Error: Visual Link expects JSON but received raw data. Rendering fallback stream:
                                                    </div>
                                                    {displayLines.map((line, i) => (
                                                        <p key={i}>
                                                            <span className="text-guardian-blue/40 mr-4 font-bold">{String(i + 1).padStart(2, '0')}</span>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }
                                    })()
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        {(typeof response === 'string' ? response.split('\n') : JSON.stringify(response, null, 2).split('\n')).map((line, i) => (
                                            <p key={i}>
                                                <span className="text-guardian-blue/40 mr-4 font-bold">{String(i + 1).padStart(2, '0')}</span>
                                                {line}
                                            </p>
                                        ))}
                                    </div>
                                )
                            ) : isExecuting ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-6">
                                    <div className="w-16 h-16 border-4 border-guardian-blue/10 border-t-guardian-blue rounded-full animate-spin"></div>
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-black text-guardian-blue uppercase tracking-[0.4em] animate-pulse">Thinking</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale text-center px-10">
                                    <Cpu size={64} className="mb-6 text-slate-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Awaiting Input Initialization</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolView;
