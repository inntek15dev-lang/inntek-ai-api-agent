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
            setTool(res.data.data);
        } catch (err) {
            console.error(err);
            navigate('/catalog');
        } finally {
            setLoading(false);
        }
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
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    {response.split('\n').map((line, i) => (
                                        <p key={i}>
                                            <span className="text-guardian-blue/40 mr-4 font-bold">{String(i + 1).padStart(2, '0')}</span>
                                            {line}
                                        </p>
                                    ))}
                                </div>
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
