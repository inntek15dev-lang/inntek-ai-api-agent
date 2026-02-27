import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ChevronLeft, Info, Cpu, Zap, Activity, Grid, Edit } from 'lucide-react';

const ToolMaker = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        logo_herramienta: '🤖',
        training_prompt: '',
        behavior_prompt: '',
        response_format: 'JSON',
        output_format_id: '',
        json_schema_id: ''
    });
    const [outputs, setOutputs] = useState([]);
    const [schemas, setSchemas] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!id;

    useEffect(() => {
        fetchOutputs();
        fetchSchemas();
        if (isEdit) {
            fetchTool();
        }
    }, [id]);

    const fetchOutputs = async () => {
        try {
            const res = await axios.get(`${API_URL}/output-formats`);
            setOutputs(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSchemas = async () => {
        try {
            const res = await axios.get(`${API_URL}/json-schemas`);
            setSchemas(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTool = async () => {
        try {
            const res = await axios.get(`${API_URL}/tools/${id}`);
            const tool = res.data.data;
            setFormData({
                ...tool,
                output_format_id: tool.output_format_id || '',
                json_schema_id: tool.json_schema_id || ''
            });
        } catch (err) {
            console.error('Error fetching tool:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEdit) {
                await axios.put(`${API_URL}/tools/${id}`, formData);
            } else {
                await axios.post(`${API_URL}/tools`, formData);
            }
            navigate('/catalog');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center space-x-6">
                <button
                    onClick={() => navigate(-1)}
                    className="guardian-btn-outline !p-3 !rounded-xl"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <p className="guardian-label">Development Lab</p>
                    <h1 className="guardian-h1 !mb-0">
                        AI <span className="text-guardian-blue">{isEdit ? 'Tool Editor' : 'Tool Maker'}</span>
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Basic Info */}
                <div className="lg:col-span-1">
                    <div className="guardian-card">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-guardian-muted">
                                <Info size={20} />
                            </div>
                            <span className="guardian-h3 tracking-tight">Core Identity</span>
                        </div>

                        <div className="space-y-6">
                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Tool Designation</label>
                                <input
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="guardian-input !pl-4"
                                    placeholder="Unit ID..."
                                    required
                                />
                            </div>
                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Operational Brief</label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows={4}
                                    className="guardian-input !pl-4 resize-none"
                                    placeholder="Primary function parameters..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Icon</label>
                                    <input
                                        name="logo_herramienta"
                                        value={formData.logo_herramienta}
                                        onChange={handleChange}
                                        className="guardian-input !pl-4 text-center text-xl"
                                        placeholder="🤖"
                                    />
                                </div>
                                <div className="guardian-input-group !mb-0 col-span-2">
                                    <label className="guardian-label">Visual Output Link</label>
                                    <select
                                        name="output_format_id"
                                        value={formData.output_format_id || ''}
                                        onChange={handleChange}
                                        className="guardian-input !pl-4 appearance-none"
                                    >
                                        <option value="">Raw Text (Default)</option>
                                        {outputs.map(out => (
                                            <option key={out.id} value={out.id}>{out.nombre} ({out.tipo})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="guardian-input-group !mb-0 col-span-2">
                                    <label className="guardian-label">Validation JSON Schema</label>
                                    <select
                                        name="json_schema_id"
                                        value={formData.json_schema_id || ''}
                                        onChange={handleChange}
                                        className="guardian-input !pl-4 appearance-none"
                                    >
                                        <option value="">No Strict Validation</option>
                                        {schemas.map(sch => (
                                            <option key={sch.id} value={sch.id}>{sch.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Logic */}
                <div className="lg:col-span-2">
                    <div className="guardian-card border-t-4 border-t-guardian-blue">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3 text-guardian-text">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-guardian-muted">
                                    <Cpu size={20} />
                                </div>
                                <span className="guardian-h3 tracking-tight">Neural Configuration</span>
                            </div>
                            <span className="guardian-badge guardian-badge--slate">G-Sequence-1.5</span>
                        </div>

                        <div className="space-y-8">
                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Training Vector (Context)</label>
                                <textarea
                                    name="training_prompt"
                                    value={formData.training_prompt}
                                    onChange={handleChange}
                                    rows={6}
                                    className="guardian-input !pl-4 font-mono text-xs leading-relaxed"
                                    placeholder="Initialize base knowledge sequence..."
                                />
                            </div>
                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Behavior Filter (Persona)</label>
                                <textarea
                                    name="behavior_prompt"
                                    value={formData.behavior_prompt}
                                    onChange={handleChange}
                                    rows={6}
                                    className="guardian-input !pl-4 font-mono text-xs leading-relaxed"
                                    placeholder="Define interaction protocols..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="guardian-btn-primary !w-auto min-w-[200px]"
                                >
                                    {isEdit ? <Edit size={20} /> : <Save size={20} />}
                                    <span>{isEdit ? 'Actualizar Unidad' : 'Sincronizar Unidad'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ToolMaker;
