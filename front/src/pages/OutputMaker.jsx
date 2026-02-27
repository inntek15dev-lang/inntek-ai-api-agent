import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import {
    Plus,
    Save,
    Trash2,
    Move,
    Type,
    Image as ImageIcon,
    MousePointer2,
    Table as TableIcon,
    Heading as HeadingIcon,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Layers,
    ChevronRight,
    Edit3,
    Tag as TagIcon
} from 'lucide-react';

const ELEMENT_TYPES = [
    { type: 'heading', label: 'Heading', icon: HeadingIcon, defaultData: { text: 'Title Placeholder', param: '' } },
    { type: 'subheading', label: 'Sub-heading', icon: Layers, defaultData: { text: 'Sub-heading Placeholder', param: '' } },
    { type: 'label', label: 'Label', icon: TagIcon, defaultData: { text: 'Label Placeholder', param: '' } },
    { type: 'text', label: 'Paragraph', icon: Type, defaultData: { text: 'Text content goes here...', param: '' } },
    { type: 'image', label: 'Image', icon: ImageIcon, defaultData: { src: '', param: '' } },
    { type: 'table', label: 'Data Table', icon: TableIcon, defaultData: { rows: 2, cols: 2, param: '' } },
    { type: 'boton_accionable', label: 'Action Button', icon: MousePointer2, defaultData: { label: 'Execute', api_url: '', method: 'POST', param: '' } }
];

const OutputMaker = () => {
    const [categories, setCategories] = useState([]);
    const [formats, setFormats] = useState([]);
    const [view, setView] = useState('catalog'); // 'catalog' or 'builder'

    // Builder State
    const [currentFormat, setCurrentFormat] = useState({
        nombre: '',
        tipo: 'reporte',
        category_id: '',
        estructura: []
    });
    const [selectedElementIndex, setSelectedElementIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, formatRes] = await Promise.all([
                axios.get(`${API_URL}/output-categories`),
                axios.get(`${API_URL}/output-formats`)
            ]);
            setCategories(catRes.data.data);
            setFormats(formatRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('elementType', type);
    };

    const handleReorderStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDrop = (e, targetIndex = null) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('elementType');

        if (type) {
            // New element being dropped
            const elementDef = ELEMENT_TYPES.find(t => t.type === type);
            if (elementDef) {
                const newElements = [...currentFormat.estructura];
                const newElement = {
                    id: Date.now(),
                    type: elementDef.type,
                    data: { ...elementDef.defaultData }
                };

                if (targetIndex !== null) {
                    newElements.splice(targetIndex, 0, newElement);
                } else {
                    newElements.push(newElement);
                }

                setCurrentFormat({ ...currentFormat, estructura: newElements });
                setSelectedElementIndex(targetIndex !== null ? targetIndex : newElements.length - 1);
            }
        } else if (draggedIndex !== null && targetIndex !== null) {
            // Reordering existing element
            const newElements = [...currentFormat.estructura];
            const [movedElement] = newElements.splice(draggedIndex, 1);
            newElements.splice(targetIndex, 0, movedElement);

            setCurrentFormat({ ...currentFormat, estructura: newElements });
            setSelectedElementIndex(targetIndex);
            setDraggedIndex(null);
        }
    };

    const handleSave = async () => {
        if (!currentFormat.nombre || !currentFormat.category_id) {
            alert('Please provide a name and category');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                ...currentFormat,
                estructura: JSON.stringify(currentFormat.estructura)
            };
            if (currentFormat.id) {
                await axios.put(`${API_URL}/output-formats/${currentFormat.id}`, payload);
            } else {
                await axios.post(`${API_URL}/output-formats`, payload);
            }
            fetchData();
            setView('catalog');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteElement = (index) => {
        const newElements = currentFormat.estructura.filter((_, i) => i !== index);
        setCurrentFormat({ ...currentFormat, estructura: newElements });
        setSelectedElementIndex(null);
    };

    const updateElementData = (field, value) => {
        const newElements = [...currentFormat.estructura];
        newElements[selectedElementIndex].data[field] = value;
        setCurrentFormat({ ...currentFormat, estructura: newElements });
    };

    const renderCatalog = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="guardian-h1">Output Systems</h1>
                    <p className="guardian-text-sm italic">Manage neural response visualizers and behavioral cards.</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentFormat({ nombre: '', tipo: 'reporte', category_id: '', estructura: [] });
                        setView('builder');
                    }}
                    className="guardian-btn-primary"
                >
                    <Plus size={18} />
                    <span>Initialize New Link</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formats.map(format => (
                    <div key={format.id} className="guardian-card hover:border-guardian-blue/40 transition-all group cursor-pointer" onClick={() => {
                        const parsed = typeof format.estructura === 'string' ? JSON.parse(format.estructura) : format.estructura;
                        setCurrentFormat({ ...format, estructura: parsed });
                        setView('builder');
                    }}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-guardian-blue/10 transition-colors">
                                <Layers size={24} className="text-guardian-blue" />
                            </div>
                            <span className={`guardian-badge ${format.tipo === 'reporte' ? 'guardian-badge--blue' : 'guardian-badge--pink'}`}>
                                {format.tipo}
                            </span>
                        </div>
                        <h3 className="font-bold text-guardian-text mb-1">{format.nombre}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format.OutputCategory?.nombre || 'General'}</p>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] text-slate-300">ID: {format.id.slice(0, 8)}</span>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-guardian-blue transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBuilder = () => (
        <div className="flex flex-col h-[calc(100vh-180px)] space-y-6 animate-in zoom-in-95 duration-300">
            {/* Top Config */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-guardian-border shadow-sm">
                <div className="flex items-center space-x-6 flex-1">
                    <button onClick={() => setView('catalog')} className="text-slate-400 hover:text-guardian-text transition-colors">
                        <ChevronRight className="rotate-180" />
                    </button>
                    <div className="flex-1 max-w-md">
                        <input
                            value={currentFormat.nombre}
                            onChange={(e) => setCurrentFormat({ ...currentFormat, nombre: e.target.value })}
                            className="w-full bg-transparent font-bold text-lg focus:outline-none placeholder:opacity-30"
                            placeholder="Link Identification Name..."
                        />
                    </div>
                    <select
                        value={currentFormat.category_id}
                        onChange={(e) => setCurrentFormat({ ...currentFormat, category_id: e.target.value })}
                        className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold text-guardian-text focus:ring-1 ring-guardian-blue"
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <select
                        value={currentFormat.tipo}
                        onChange={(e) => setCurrentFormat({ ...currentFormat, tipo: e.target.value })}
                        className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-bold text-guardian-text focus:ring-1 ring-guardian-blue"
                    >
                        <option value="reporte">Reporte</option>
                        <option value="accionable">Accionable</option>
                        <option value="generativo">Generativo</option>
                    </select>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="guardian-btn-primary !py-2">
                    <Save size={18} />
                    <span>{isSaving ? 'Syncing...' : 'Commit Structure'}</span>
                </button>
            </div>

            <div className="flex flex-1 space-x-6 overflow-hidden">
                {/* Element Toolbox */}
                <div className="w-64 space-y-4 overflow-y-auto pr-2">
                    <div className="guardian-card !p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Neural Components</h4>
                        <div className="space-y-2">
                            {ELEMENT_TYPES.map(el => (
                                <div
                                    key={el.type}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, el.type)}
                                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-transparent hover:border-guardian-blue/30 hover:bg-white cursor-move transition-all group"
                                >
                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-guardian-blue transition-colors">
                                        <el.icon size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-guardian-text">{el.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card Canvas */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex-1 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 p-10 overflow-y-auto flex flex-col items-center"
                >
                    <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
                        <div className="p-8 space-y-6">
                            {currentFormat.estructura.length === 0 && (
                                <div className="h-[300px] flex flex-col items-center justify-center text-center opacity-20">
                                    <Layers size={48} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Drop Elements Here<br />to Build Card Architecture</p>
                                </div>
                            )}
                            {currentFormat.estructura.map((el, idx) => (
                                <div
                                    key={el.id}
                                    draggable
                                    onDragStart={() => handleReorderStart(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onClick={() => setSelectedElementIndex(idx)}
                                    className={`relative p-4 rounded-2xl transition-all cursor-pointer border-2 group/item ${selectedElementIndex === idx ? 'border-guardian-blue bg-guardian-blue/5' : 'border-transparent hover:bg-slate-50'}`}
                                >
                                    {/* Drag Handle Icon (visible on hover) */}
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-20 transition-opacity">
                                        <Move size={12} />
                                    </div>

                                    {el.type === 'heading' && <h2 className="text-xl font-black text-guardian-text">{el.data.param ? `{{${el.data.param}}}` : el.data.text}</h2>}
                                    {el.type === 'subheading' && <h3 className="text-md font-bold text-guardian-text/80">{el.data.param ? `{{${el.data.param}}}` : el.data.text}</h3>}
                                    {el.type === 'label' && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mb-1">{el.data.text}</span>
                                            <span className="text-sm font-bold text-guardian-text">{el.data.param ? `{{${el.data.param}}}` : '---'}</span>
                                        </div>
                                    )}
                                    {el.type === 'text' && <p className="text-sm text-slate-500 leading-relaxed">{el.data.param ? `{{${el.data.param}}}` : el.data.text}</p>}
                                    {el.type === 'image' && (
                                        <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                                            {el.data.param ? (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dynamic Image: {el.data.param}</span>
                                            ) : (
                                                <ImageIcon size={32} className="text-slate-300" />
                                            )}
                                        </div>
                                    )}
                                    {el.type === 'table' && (
                                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                                            <div className="bg-slate-50 p-3 flex items-center justify-center border-b border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table: {el.data.param || 'Static'}</span>
                                            </div>
                                            <div className="p-4 bg-white grid grid-cols-2 gap-2 opacity-30">
                                                <div className="h-4 bg-slate-100 rounded"></div>
                                                <div className="h-4 bg-slate-100 rounded"></div>
                                                <div className="h-4 bg-slate-100 rounded"></div>
                                                <div className="h-4 bg-slate-100 rounded"></div>
                                            </div>
                                        </div>
                                    )}
                                    {el.type === 'boton_accionable' && (
                                        <button className="w-full py-4 bg-guardian-blue rounded-xl text-white font-bold text-sm shadow-lg shadow-guardian-blue/20">
                                            {el.data.label}
                                        </button>
                                    )}

                                    {selectedElementIndex === idx && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteElement(idx); }}
                                            className="absolute -top-3 -right-3 w-8 h-8 bg-cyber-pink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Property Editor */}
                <div className="w-80 space-y-4 overflow-y-auto pl-2">
                    <div className="guardian-card !p-6 h-full">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Component Logic</h4>
                        {selectedElementIndex !== null ? (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="space-y-4">
                                    <div className="p-3 bg-guardian-blue/5 rounded-xl border border-guardian-blue/10 flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg text-guardian-blue shadow-sm">
                                            {React.createElement(ELEMENT_TYPES.find(t => t.type === currentFormat.estructura[selectedElementIndex].type).icon, { size: 16 })}
                                        </div>
                                        <span className="text-xs font-black uppercase text-guardian-blue">{currentFormat.estructura[selectedElementIndex].type}</span>
                                    </div>

                                    {/* Parameter Mapping */}
                                    <div className="guardian-input-group">
                                        <label className="guardian-label">Data Parameter Binding</label>
                                        <div className="relative">
                                            <input
                                                value={currentFormat.estructura[selectedElementIndex].data.param}
                                                onChange={(e) => updateElementData('param', e.target.value)}
                                                className="guardian-input !pl-4"
                                                placeholder="e.g. results.score"
                                            />
                                            <Edit3 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-2 italic px-1">Use dot notation to map specific JSON response keys.</p>
                                    </div>

                                    {/* Type Specific Fields */}
                                    {(currentFormat.estructura[selectedElementIndex].type === 'heading' ||
                                        currentFormat.estructura[selectedElementIndex].type === 'subheading' ||
                                        currentFormat.estructura[selectedElementIndex].type === 'label') && (
                                            <div className="guardian-input-group">
                                                <label className="guardian-label">Static Label / Placeholder</label>
                                                <input
                                                    value={currentFormat.estructura[selectedElementIndex].data.text}
                                                    onChange={(e) => updateElementData('text', e.target.value)}
                                                    className="guardian-input !pl-4"
                                                />
                                            </div>
                                        )}

                                    {currentFormat.estructura[selectedElementIndex].type === 'boton_accionable' && (
                                        <>
                                            <div className="guardian-input-group">
                                                <label className="guardian-label">Button Label</label>
                                                <input
                                                    value={currentFormat.estructura[selectedElementIndex].data.label}
                                                    onChange={(e) => updateElementData('label', e.target.value)}
                                                    className="guardian-input !pl-4"
                                                />
                                            </div>
                                            <div className="guardian-input-group">
                                                <label className="guardian-label">Target Protocol (API URL)</label>
                                                <input
                                                    value={currentFormat.estructura[selectedElementIndex].data.api_url}
                                                    onChange={(e) => updateElementData('api_url', e.target.value)}
                                                    className="guardian-input !pl-4"
                                                    placeholder="https://api.system.com/..."
                                                />
                                            </div>
                                            <div className="guardian-input-group">
                                                <label className="guardian-label">Execution Method</label>
                                                <select
                                                    value={currentFormat.estructura[selectedElementIndex].data.method}
                                                    onChange={(e) => updateElementData('method', e.target.value)}
                                                    className="guardian-input !pl-4"
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-center opacity-30 mt-10">
                                <MousePointer2 size={32} className="mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Select an Element<br />to Configure Logic</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pb-10">
            {view === 'catalog' ? renderCatalog() : renderBuilder()}
        </div>
    );
};

export default OutputMaker;
