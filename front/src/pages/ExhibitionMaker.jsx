import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { 
    Plus, 
    Save, 
    Trash2, 
    ChevronRight, 
    Layout, 
    Scissors, 
    Settings, 
    Eye,
    MoveUp,
    MoveDown,
    Image as ImageIcon
} from 'lucide-react';

const ExhibitionMaker = () => {
    const navigate = useNavigate();
    const [exhibitions, setExhibitions] = useState([]);
    const [tools, setTools] = useState([]);
    const [view, setView] = useState('catalog'); // 'catalog' or 'editor'
    const [currentExhibition, setCurrentExhibition] = useState({
        nombre: '',
        descripcion: '',
        logo: '',
        activo: true,
        ExhibitionSlides: []
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchExhibitions();
        fetchTools();
    }, []);

    const fetchExhibitions = async () => {
        try {
            const res = await axios.get(`${API_URL}/exhibitions`);
            setExhibitions(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTools = async () => {
        try {
            const res = await axios.get(`${API_URL}/tools`);
            setTools(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!currentExhibition.nombre) return alert('Name is required');
        setIsSaving(true);
        try {
            let res;
            if (currentExhibition.id) {
                res = await axios.put(`${API_URL}/exhibitions/${currentExhibition.id}`, currentExhibition);
                // Slides are managed differently (simple version: delete and recreate if complex, but here we just update basic info)
            } else {
                res = await axios.post(`${API_URL}/exhibitions`, currentExhibition);
            }
            
            // Handle slides (simplified: if new slides were added in UI, create them in backend)
            // For a robust implementation, slides should be saved individually or via a bulk endpoint.
            // Here we'll do individual saves for any slide marked as 'dirty' or 'new'.
            
            fetchExhibitions();
            setView('catalog');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const addSlide = async (toolId) => {
        if (!currentExhibition.id) {
            alert('Save the exhibition first before adding slides');
            return;
        }
        try {
            const tool = tools.find(t => t.id === toolId);
            const res = await axios.post(`${API_URL}/exhibitions/${currentExhibition.id}/slides`, {
                nombre: tool.nombre,
                tool_id: toolId,
                order: currentExhibition.ExhibitionSlides.length
            });
            const newExhibition = { ...currentExhibition };
            newExhibition.ExhibitionSlides.push({ ...res.data.data, Tool: tool });
            setCurrentExhibition(newExhibition);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteSlide = async (slideId) => {
        try {
            await axios.delete(`${API_URL}/exhibitions/${currentExhibition.id}/slides/${slideId}`);
            const newExhibition = { ...currentExhibition };
            newExhibition.ExhibitionSlides = newExhibition.ExhibitionSlides.filter(s => s.id !== slideId);
            setCurrentExhibition(newExhibition);
        } catch (err) {
            console.error(err);
        }
    };

    const renderCatalog = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="guardian-h1">Exhibition Modules</h1>
                    <p className="guardian-text-sm italic">Create full-page interactive showcases for tool outputs.</p>
                </div>
                <button 
                    onClick={() => {
                        setCurrentExhibition({ nombre: '', descripcion: '', logo: '', activo: true, ExhibitionSlides: [] });
                        setView('editor');
                    }}
                    className="guardian-btn-primary"
                >
                    <Plus size={18} />
                    <span>Create Exhibition</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exhibitions.map(ex => (
                    <div key={ex.id} className="guardian-card group cursor-pointer hover:border-guardian-blue/40 transition-all" onClick={async () => {
                        const res = await axios.get(`${API_URL}/exhibitions/${ex.id}`);
                        setCurrentExhibition(res.data.data);
                        setView('editor');
                    }}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-guardian-blue/10 rounded-xl">
                                <Layout className="text-guardian-blue" size={24} />
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/exhibition/${ex.id}`); }}
                                className="p-2 hover:bg-guardian-blue/10 rounded-lg text-guardian-blue transition-colors"
                            >
                                <Eye size={18} />
                            </button>
                        </div>
                        <h3 className="font-bold text-guardian-text">{ex.nombre}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ex.descripcion || 'No description provided.'}</p>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] text-slate-300 uppercase font-black">Ready for Deployment</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-guardian-blue transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-guardian-border shadow-sm">
                <div className="flex items-center space-x-6 flex-1">
                    <button onClick={() => setView('catalog')} className="text-slate-400 hover:text-guardian-text transition-colors">
                        <ChevronRight className="rotate-180" />
                    </button>
                    <div className="flex-1 max-w-md">
                        <input 
                            value={currentExhibition.nombre}
                            onChange={(e) => setCurrentExhibition({ ...currentExhibition, nombre: e.target.value })}
                            className="w-full bg-transparent font-bold text-2xl focus:outline-none placeholder:opacity-30"
                            placeholder="Exhibition Name..."
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {currentExhibition.id && (
                        <button 
                            onClick={() => navigate(`/exhibition/${currentExhibition.id}`)}
                            className="guardian-btn-outline !py-2"
                        >
                            <Eye size={18} />
                            <span>Preview</span>
                        </button>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="guardian-btn-primary !py-2">
                        <Save size={18} />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="space-y-6">
                    <div className="guardian-card">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Manifest Properties</h4>
                        <div className="space-y-4">
                            <div className="guardian-input-group">
                                <label className="guardian-label">Description</label>
                                <textarea 
                                    value={currentExhibition.descripcion}
                                    onChange={(e) => setCurrentExhibition({ ...currentExhibition, descripcion: e.target.value })}
                                    className="guardian-input min-h-[100px] resize-none"
                                    placeholder="Executive summary of the exhibition..."
                                />
                            </div>
                            <div className="guardian-input-group">
                                <label className="guardian-label">Cover Icon</label>
                                <input 
                                    value={currentExhibition.logo}
                                    onChange={(e) => setCurrentExhibition({ ...currentExhibition, logo: e.target.value })}
                                    className="guardian-input"
                                    placeholder="Emoji or Icon ID"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="guardian-card border-t-4 border-t-guardian-blue">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Available Tools</h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {tools.map(tool => (
                                <div key={tool.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-transparent hover:border-guardian-blue/20 transition-all group">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-lg">
                                            {tool.logo_herramienta}
                                        </div>
                                        <span className="text-xs font-bold text-guardian-text">{tool.nombre}</span>
                                    </div>
                                    <button 
                                        onClick={() => addSlide(tool.id)}
                                        className="p-1.5 bg-white text-guardian-blue rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Slides List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="guardian-card min-h-[500px]">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center justify-between">
                            <span>Slide Architecture</span>
                            <span className="text-guardian-blue">{currentExhibition.ExhibitionSlides.length} Elements</span>
                        </h4>
                        <div className="space-y-4">
                            {currentExhibition.ExhibitionSlides.length === 0 && (
                                <div className="h-[300px] flex flex-col items-center justify-center text-center opacity-20">
                                    <Layout size={48} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Add Tools from the left<br />to build your sequence</p>
                                </div>
                            )}
                            {currentExhibition.ExhibitionSlides.map((slide, idx) => (
                                <div key={slide.id || idx} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-guardian-blue/20 transition-all group animate-in slide-in-from-right-4">
                                    <div className="w-8 h-8 flex flex-col items-center justify-center text-slate-300">
                                        <button className="hover:text-guardian-blue"><MoveUp size={14} /></button>
                                        <button className="hover:text-guardian-blue"><MoveDown size={14} /></button>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm text-2xl">
                                        {slide.Tool?.logo_herramienta}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-guardian-text">{slide.nombre}</h5>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Connected to {slide.Tool?.nombre}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => deleteSlide(slide.id)}
                                            className="p-2 bg-white text-cyber-pink rounded-lg shadow-sm hover:bg-cyber-pink hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pb-10">
            {view === 'catalog' ? renderCatalog() : renderEditor()}
        </div>
    );
};

export default ExhibitionMaker;
