import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import {
    Plus,
    Save,
    Trash2,
    ChevronRight,
    Code,
    Layout,
    CheckCircle2,
    Info,
    Settings2,
    Database,
    FileJson,
    Edit3,
    Hash,
    Type,
    ToggleLeft,
    Box,
    List
} from 'lucide-react';

const PROPERTY_TYPES = [
    { type: 'string', label: 'String', icon: Type, color: 'text-blue-500' },
    { type: 'number', label: 'Number', icon: Hash, color: 'text-orange-500' },
    { type: 'boolean', label: 'Boolean', icon: ToggleLeft, color: 'text-green-500' },
    { type: 'object', label: 'Object', icon: Box, color: 'text-purple-500' },
    { type: 'array', label: 'Array', icon: List, color: 'text-pink-500' }
];

const JsonSchemaMaker = () => {
    const [schemas, setSchemas] = useState([]);
    const [view, setView] = useState('catalog'); // 'catalog' or 'builder'
    const [editMode, setEditMode] = useState('visual'); // 'visual' or 'code'
    const [isSaving, setIsSaving] = useState(false);

    const [currentSchema, setCurrentSchema] = useState({
        nombre: '',
        descripcion: '',
        schema: {
            type: 'object',
            properties: {},
            required: []
        }
    });

    const [rawJson, setRawJson] = useState('');

    useEffect(() => {
        if (editMode === 'code') {
            setRawJson(JSON.stringify(currentSchema.schema, null, 4));
        }
    }, [editMode]);

    useEffect(() => {
        fetchSchemas();
    }, []);

    const fetchSchemas = async () => {
        try {
            const res = await axios.get(`${API_URL}/json-schemas`);
            setSchemas(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!currentSchema.nombre) return alert('Designation Required');
        setIsSaving(true);
        try {
            const payload = {
                ...currentSchema,
                schema: JSON.stringify(currentSchema.schema)
            };
            if (currentSchema.id) {
                await axios.put(`${API_URL}/json-schemas/${currentSchema.id}`, payload);
            } else {
                await axios.post(`${API_URL}/json-schemas`, payload);
            }
            fetchSchemas();
            setView('catalog');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const addProperty = () => {
        const propName = `property_${Object.keys(currentSchema.schema.properties).length + 1}`;
        const newProperties = {
            ...currentSchema.schema.properties,
            [propName]: { type: 'string' }
        };
        setCurrentSchema({
            ...currentSchema,
            schema: { ...currentSchema.schema, properties: newProperties }
        });
    };

    const updatePropertyName = (oldName, newName) => {
        if (oldName === newName) return;
        const properties = { ...currentSchema.schema.properties };
        properties[newName] = properties[oldName];
        delete properties[oldName];

        const required = currentSchema.schema.required.map(r => r === oldName ? newName : r);

        setCurrentSchema({
            ...currentSchema,
            schema: { ...currentSchema.schema, properties, required }
        });
    };

    const updatePropertyType = (name, type) => {
        const properties = { ...currentSchema.schema.properties };
        properties[name] = { ...properties[name], type };
        setCurrentSchema({
            ...currentSchema,
            schema: { ...currentSchema.schema, properties }
        });
    };

    const toggleRequired = (name) => {
        const required = currentSchema.schema.required.includes(name)
            ? currentSchema.schema.required.filter(r => r !== name)
            : [...currentSchema.schema.required, name];
        setCurrentSchema({
            ...currentSchema,
            schema: { ...currentSchema.schema, required }
        });
    };

    const deleteProperty = (name) => {
        const properties = { ...currentSchema.schema.properties };
        delete properties[name];
        const required = currentSchema.schema.required.filter(r => r !== name);
        setCurrentSchema({
            ...currentSchema,
            schema: { ...currentSchema.schema, properties, required }
        });
    };

    const renderCatalog = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="guardian-h1">Neural Structures</h1>
                    <p className="guardian-text-sm italic">Define data contracts and validation schemas for AI processing.</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentSchema({ nombre: '', descripcion: '', schema: { type: 'object', properties: {}, required: [] } });
                        setView('builder');
                    }}
                    className="guardian-btn-primary"
                >
                    <Plus size={18} />
                    <span>Generate New Schema</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemas.map(schema => (
                    <div key={schema.id} className="guardian-card group hover:border-guardian-blue/40 cursor-pointer transition-all" onClick={() => {
                        const parsed = typeof schema.schema === 'string' ? JSON.parse(schema.schema) : schema.schema;
                        setCurrentSchema({ ...schema, schema: parsed });
                        setView('builder');
                    }}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-guardian-blue/10 transition-colors">
                                <FileJson size={24} className="text-guardian-blue" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">JSON</span>
                        </div>
                        <h3 className="font-bold text-guardian-text mb-1">{schema.nombre}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{schema.descripcion || 'No Description Linked'}</p>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase">
                            <span>Keys: {Object.keys(typeof schema.schema === 'string' ? JSON.parse(schema.schema).properties : schema.schema.properties).length}</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBuilder = () => (
        <div className="space-y-6 animate-in zoom-in-95 duration-300 h-[calc(100vh-180px)] flex flex-col">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-guardian-border shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-6 flex-1">
                    <button onClick={() => setView('catalog')} className="text-slate-400 hover:text-guardian-text transition-colors">
                        <ChevronRight className="rotate-180" />
                    </button>
                    <div className="flex-1 max-w-md">
                        <input
                            value={currentSchema.nombre}
                            onChange={(e) => setCurrentSchema({ ...currentSchema, nombre: e.target.value })}
                            className="bg-transparent font-bold text-lg focus:outline-none w-full"
                            placeholder="Protocol Designation..."
                        />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setEditMode('visual')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'visual' ? 'bg-white text-guardian-blue shadow-sm' : 'text-slate-400'}`}
                        >
                            <Layout size={14} />
                            <span>Visual Hub</span>
                        </button>
                        <button
                            onClick={() => setEditMode('code')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'code' ? 'bg-white text-guardian-blue shadow-sm' : 'text-slate-400'}`}
                        >
                            <Code size={14} />
                            <span>Code Access</span>
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="guardian-btn-primary !py-2 ml-6"
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Syncing...' : 'Commit Protocol'}</span>
                </button>
            </div>

            <div className="flex-1 flex space-x-6 overflow-hidden">
                {/* Main Editor Area */}
                <div className="flex-1 bg-white rounded-3xl border border-guardian-border p-8 overflow-y-auto">
                    {editMode === 'visual' ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Parameters</h4>
                                <button
                                    onClick={addProperty}
                                    className="p-2 bg-guardian-blue/10 text-guardian-blue rounded-lg hover:bg-guardian-blue hover:text-white transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(currentSchema.schema.properties).map(([name, config]) => (
                                    <div key={name} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all flex items-center space-x-4">
                                        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-4 relative group">
                                                <input
                                                    value={name}
                                                    onChange={(e) => updatePropertyName(name, e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-guardian-text focus:ring-1 ring-guardian-blue"
                                                    placeholder="param_id"
                                                />
                                                <Edit3 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <div className="col-span-3">
                                                <select
                                                    value={config.type}
                                                    onChange={(e) => updatePropertyType(name, e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-guardian-text focus:ring-1 ring-guardian-blue"
                                                >
                                                    {PROPERTY_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                                                </select>
                                            </div>

                                            <div className="col-span-3 flex justify-center">
                                                <button
                                                    onClick={() => toggleRequired(name)}
                                                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentSchema.schema.required.includes(name) ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                                >
                                                    Required
                                                </button>
                                            </div>

                                            <div className="col-span-2 flex justify-end">
                                                <button
                                                    onClick={() => deleteProperty(name)}
                                                    className="p-2 text-slate-300 hover:text-cyber-pink transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(currentSchema.schema.properties).length === 0 && (
                                    <div className="h-40 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-slate-200 rounded-3xl">
                                        <Database size={32} className="mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Initialization Pending</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Direct Protocol Access</h4>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Valid JSON Required</span>
                            </div>
                            <textarea
                                value={rawJson}
                                onChange={(e) => {
                                    setRawJson(e.target.value);
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setCurrentSchema({ ...currentSchema, schema: parsed });
                                    } catch (err) {
                                        // Allow typing invalid JSON temporarily
                                    }
                                }}
                                className="flex-1 w-full bg-slate-900 text-emerald-500 font-mono text-xs p-6 rounded-2xl resize-none focus:ring-2 ring-guardian-blue/50 outline-none"
                                spellCheck="false"
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar Preview */}
                <div className="w-80 space-y-4 flex flex-col">
                    <div className="guardian-card !p-6 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Execution Preview</h4>
                        <div className="flex-1 bg-slate-50 rounded-2xl p-6 overflow-y-auto">
                            <pre className="text-[10px] font-mono text-guardian-text leading-relaxed whitespace-pre-wrap">
                                {JSON.stringify(currentSchema.schema, null, 2)}
                            </pre>
                        </div>
                        <div className="mt-6 p-4 bg-guardian-blue/5 rounded-xl border border-guardian-blue/10 flex items-start space-x-3">
                            <Info size={16} className="text-guardian-blue shrink-0 mt-0.5" />
                            <p className="text-[9px] text-slate-500 italic">This schema will enforce strict validation on tool responses, ensuring structural integrity for downstream visual links.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pb-10 h-full">
            {view === 'catalog' ? renderCatalog() : renderBuilder()}
        </div>
    );
};

export default JsonSchemaMaker;
