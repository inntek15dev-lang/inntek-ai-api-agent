import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { 
    ChevronLeft, 
    ChevronRight, 
    Send, 
    Cpu, 
    Maximize2, 
    Minimize2, 
    Layers, 
    Activity,
    Upload,
    Zap,
    MessageSquare,
    Command,
    X
} from 'lucide-react';

const ExhibitionView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exhibition, setExhibition] = useState(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [files, setFiles] = useState([]);
    const [execError, setExecError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTray, setShowTray] = useState(true);

    useEffect(() => {
        fetchExhibition();
    }, [id]);

    const fetchExhibition = async () => {
        try {
            const res = await axios.get(`${API_URL}/exhibitions/${id}`);
            setExhibition(res.data.data);
            if (res.data.data.ExhibitionSlides.length > 0) {
                // Initialize prompt from config if available
                const firstSlide = res.data.data.ExhibitionSlides[0];
                if (firstSlide.config) {
                    try {
                        const config = JSON.parse(firstSlide.config);
                        if (config.defaultPrompt) setPrompt(config.defaultPrompt);
                    } catch (e) {}
                }
            }
        } catch (err) {
            console.error(err);
            navigate('/exhibitions');
        }
    };

    const resolvePath = (obj, path) => {
        if (path === '.' || path === 'root') return obj;
        if (!path) return null;
        return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
    };

    const DynamicRenderer = ({ data, structure }) => {
        if (!structure) return null;
        let elements = [];
        try {
            const parsed = typeof structure === 'string' ? JSON.parse(structure) : structure;
            if (Array.isArray(parsed)) elements = parsed;
        } catch (e) {}

        if (elements.length === 0) return <div className="p-10 text-slate-400 font-mono text-xs">{JSON.stringify(data, null, 2)}</div>;

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto py-12 px-6">
                {elements.map((el, i) => {
                    const rawValue = resolvePath(data, el.data.param);
                    const value = (rawValue !== undefined && rawValue !== null) ? rawValue : el.data.text;

                    const asString = (val) => {
                        if (val === undefined || val === null) return '';
                        return (typeof val === 'object') ? JSON.stringify(val) : String(val);
                    };

                    switch (el.type) {
                        case 'heading':
                            return <h1 key={i} className="text-6xl font-black text-white tracking-tighter filter drop-shadow-2xl">{asString(value)}</h1>;
                        case 'subheading':
                            return <h2 key={i} className="text-3xl font-bold text-white/70 tracking-tight">{asString(value)}</h2>;
                        case 'label':
                            return (
                                <div key={i} className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-guardian-blue/80 bg-guardian-blue/10 px-3 py-1 rounded-full border border-guardian-blue/20">
                                        {el.data.text}
                                    </span>
                                    <div className="text-2xl font-bold text-white/90">
                                        {asString(value)}
                                    </div>
                                </div>
                            );
                        case 'text':
                            return <p key={i} className="text-xl text-white/60 leading-relaxed font-medium">{asString(value)}</p>;
                        case 'image':
                            return <img key={i} src={asString(value)} alt="Exhibition" className="w-full rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10" />;
                        case 'table':
                            let list = Array.isArray(value) ? value : (value?.lista || value?.items || []);
                            const hasCols = el.data.columns && Array.isArray(el.data.columns);
                            return (
                                <div key={i} className="overflow-x-auto rounded-[2rem] border border-white/10 bg-black/20 backdrop-blur-xl">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                            <tr>
                                                {hasCols ? el.data.columns.map((c, ci) => <th key={ci} className="px-8 py-6">{c.header}</th>) : <th className="px-8 py-6">Data Node</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {list.map((row, ri) => (
                                                <tr key={ri} className="hover:bg-white/5 transition-colors">
                                                    {hasCols ? el.data.columns.map((c, ci) => (
                                                        <td key={ci} className="px-8 py-6 text-lg font-bold text-white/80">
                                                            {asString(resolvePath(row, c.mapping))}
                                                        </td>
                                                    )) : <td className="px-8 py-6 text-lg font-bold text-white/80">{asString(row)}</td>}
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
                                    className="w-full py-8 bg-white text-black font-black text-xl rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.1em]"
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

    const handleExecute = async () => {
        const currentSlide = exhibition.ExhibitionSlides[currentSlideIndex];
        if (!currentSlide) return;

        setIsExecuting(true);
        setExecError(null);
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            files.forEach(f => formData.append('imagenes', f));

            const res = await axios.post(`${API_URL}/tools/${currentSlide.tool_id}/execute`, formData);
            setResponse(res.data.data.response);
        } catch (err) {
            console.error(err);
            setExecError(err.response?.data?.message || err.message);
        } finally {
            setIsExecuting(false);
        }
    };

    const nextSlide = () => {
        if (currentSlideIndex < exhibition.ExhibitionSlides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
            setResponse('');
            setExecError(null);
        }
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
            setResponse('');
            setExecError(null);
        }
    };

    if (!exhibition) return null;

    const currentSlide = exhibition.ExhibitionSlides[currentSlideIndex];

    return (
        <div className={`fixed inset-0 bg-[#0a0a0b] z-[60] flex flex-col transition-all duration-700 overflow-hidden ${isFullscreen ? '' : ''}`}>
            {/* Top Minimal Nav */}
            <div className={`absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10 transition-opacity duration-500 ${showTray ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate('/exhibitions')} className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-white font-black text-xl tracking-tighter uppercase">{exhibition.nombre}</h2>
                        <p className="text-[10px] font-black text-guardian-blue tracking-[0.5em] uppercase opacity-60">Phase {currentSlideIndex + 1} of {exhibition.ExhibitionSlides.length}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {response ? (
                    <DynamicRenderer 
                        data={typeof response === 'string' ? JSON.parse(response) : response} 
                        structure={currentSlide.Tool?.OutputFormat?.estructura} 
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                        {isExecuting ? (
                            <div className="flex flex-col items-center space-y-12 animate-in zoom-in-95 duration-700">
                                <div className="relative">
                                    <div className="w-32 h-32 border-[8px] border-guardian-blue/10 border-t-guardian-blue rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Cpu size={40} className="text-guardian-blue animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-3">
                                    <p className="text-sm font-black text-guardian-blue uppercase tracking-[0.8em] animate-pulse">Neural Synthesizing</p>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Awaiting response from {currentSlide?.Tool?.nombre}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-8 max-w-2xl px-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                                <div className="text-8xl mb-4 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                    {currentSlide?.Tool?.logo_herramienta}
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase">{currentSlide?.nombre}</h1>
                                    <p className="text-lg text-white/30 font-medium italic">Ready to process protocols. Use the control tray to initialize execution.</p>
                                </div>
                            </div>
                        )}
                        
                        {execError && (
                            <div className="mt-8 p-6 bg-cyber-pink/10 border border-cyber-pink/20 rounded-2xl text-cyber-pink font-bold max-w-lg text-center animate-in shake duration-500">
                                <Activity size={24} className="mx-auto mb-2" />
                                {execError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Glass Tray */}
            <div className={`p-8 w-full z-20 transition-all duration-700 transform ${showTray ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 flex items-center space-x-6 shadow-2xl">
                    {/* Navigation */}
                    <div className="flex items-center space-x-2 border-r border-white/10 pr-6">
                        <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all">
                            <ChevronLeft size={28} />
                        </button>
                        <div className="flex space-x-1.5 px-4">
                            {exhibition.ExhibitionSlides.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlideIndex ? 'w-8 bg-guardian-blue' : 'w-1.5 bg-white/10'}`}></div>
                            ))}
                        </div>
                        <button onClick={nextSlide} disabled={currentSlideIndex === exhibition.ExhibitionSlides.length - 1} className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-10 transition-all">
                            <ChevronRight size={28} />
                        </button>
                    </div>

                    {/* Prompt Box */}
                    <div className="flex-1 relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-guardian-blue transition-colors">
                            <Command size={20} />
                        </div>
                        <input 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                            placeholder="Input command instructions..."
                            className="w-full bg-white/5 border border-white/5 group-focus-within:border-guardian-blue/30 group-focus-within:bg-white/10 rounded-2xl py-6 pl-14 pr-6 text-white text-lg font-bold focus:outline-none transition-all placeholder:text-white/10"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pl-2">
                        <label className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer">
                            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files))} />
                            {files.length > 0 ? <Zap className="text-guardian-blue" size={24} /> : <Upload size={24} />}
                        </label>
                        <button 
                            onClick={handleExecute}
                            disabled={isExecuting}
                            className="bg-guardian-blue hover:bg-guardian-blue/80 text-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(42,126,233,0.3)] hover:shadow-[0_0_60px_rgba(42,126,233,0.5)] transition-all active:scale-95 disabled:grayscale"
                        >
                            {isExecuting ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Tray Button */}
            <button 
                onClick={() => setShowTray(!showTray)} 
                className={`absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all z-30 ${showTray ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                <Layers size={20} />
            </button>
        </div>
    );
};

export default ExhibitionView;
