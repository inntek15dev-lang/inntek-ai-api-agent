import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Box } from 'lucide-react';

const Catalog = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/tools');
            setTools(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Catálogo de Herramientas</h1>
                    <p className="text-slate-500">Explora y ejecuta tus agentes de inteligencia artificial</p>
                </div>
                <button
                    onClick={() => navigate('/tool-maker')}
                    className="btn-primary flex items-center space-x-2 shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    <span>Crear Nueva</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}
                </div>
            ) : tools.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Box size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700">No hay herramientas creadas</h3>
                    <p className="text-slate-500 mb-6">Comienza creando tu primera herramienta en el Tool Maker</p>
                    <button onClick={() => navigate('/tool-maker')} className="btn-primary">
                        Crear herramienta
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tools.map((tool) => (
                        <div key={tool.id} className="card group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">
                                    {tool.logo_herramienta || '🤖'}
                                </div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {tool.response_format}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{tool.nombre}</h3>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-6 h-15">
                                {tool.descripcion || 'Sin descripción disponible.'}
                            </p>
                            <button
                                onClick={() => navigate(`/tool/${tool.id}`)}
                                className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-50 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                            >
                                <Play size={18} />
                                <span>Abrir Herramienta</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Catalog;
