import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, ChevronLeft, Info, Cpu, PenTool } from 'lucide-react';

const ToolMaker = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        logo_herramienta: '🤖',
        training_prompt: '',
        behavior_prompt: '',
        response_format: 'Markdown'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('http://localhost:3001/api/tools', formData);
            navigate('/catalog');
        } catch (err) {
            console.error(err);
            alert('Error al crear la herramienta');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI Tool Maker</h1>
                    <p className="text-slate-500">Diseña nuevas capacidades para tu agente</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="card space-y-6">
                    <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase">
                        <Info size={18} />
                        <span>Información Básica</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Herramienta</label>
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Ej: Analizador de Contratos"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary resize-none"
                                placeholder="¿Qué hace esta herramienta?"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Logo / Emoji</label>
                                <input
                                    name="logo_herramienta"
                                    value={formData.logo_herramienta}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="🤖, 📄, 🔍"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Formato Respuesta</label>
                                <select
                                    name="response_format"
                                    value={formData.response_format}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option>Markdown</option>
                                    <option>JSON</option>
                                    <option>Plain Text</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Logic */}
                <div className="card space-y-6">
                    <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase">
                        <Cpu size={18} />
                        <span>Lógica IA & Comportamiento</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Prompt de Entrenamiento</label>
                            <textarea
                                name="training_prompt"
                                value={formData.training_prompt}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800 text-blue-400 font-mono text-xs rounded-xl outline-none border border-slate-700 focus:ring-2 focus:ring-blue-500"
                                placeholder="Define el conocimiento base..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Prompt de Comportamiento</label>
                            <textarea
                                name="behavior_prompt"
                                value={formData.behavior_prompt}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800 text-green-400 font-mono text-xs rounded-xl outline-none border border-slate-700 focus:ring-2 focus:ring-green-500"
                                placeholder="¿Cómo debe actuar la IA?"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full md:w-auto px-12 py-4 text-lg shadow-xl shadow-blue-200 flex items-center justify-center space-x-3"
                    >
                        {isSubmitting ? <span>Guardando...</span> : (
                            <>
                                <Save size={24} />
                                <span>Guardar Herramienta</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ToolMaker;
