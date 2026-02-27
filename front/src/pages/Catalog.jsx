import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { Plus, Search, Cpu, Zap, Activity, Info, ArrowRight, Settings } from 'lucide-react';

const Catalog = () => {
    const [tools, setTools] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const res = await axios.get(`${API_URL}/tools`);
            setTools(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTools = tools.filter(tool =>
        tool.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="guardian-label">Innovation Hub</p>
                    <h1 className="guardian-h1 !mb-0">Agent <span className="text-guardian-blue">Catalog</span></h1>
                    <p className="guardian-text-sm mt-2">Explora y ejecuta unidades de procesamiento de inteligencia artificial.</p>
                </div>
                <Link to="/tool-maker" className="guardian-btn-primary !w-auto h-12">
                    <Plus size={20} />
                    <span>New Agent</span>
                </Link>
            </div>

            {/* Search Header */}
            <div className="guardian-card !p-4 flex items-center space-x-4">
                <Search className="text-guardian-muted ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Filter modules by name or function..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400"
                />
                <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                <span className="text-[10px] font-black text-guardian-muted uppercase tracking-widest px-4 whitespace-nowrap">
                    {filteredTools.length} Units Found
                </span>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-guardian-blue border-t-transparent rounded-full animate-spin"></div>
                    <p className="guardian-text-sm font-bold animate-pulse">Scanning Neural Nodes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTools.map((tool) => (
                        <div key={tool.id} className="guardian-tool-card flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                    {tool.logo_herramienta}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="guardian-badge guardian-badge--blue mb-1">{tool.response_format}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">v1.2.0</span>
                                </div>
                            </div>

                            <div className="flex-1 mb-8">
                                <h3 className="guardian-h3 mb-2">{tool.nombre}</h3>
                                <p className="guardian-text-sm line-clamp-3 leading-relaxed">
                                    {tool.descripcion}
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                            <Cpu size={10} className="text-slate-400" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Link
                                        to={`/tool-maker/${tool.id}`}
                                        className="guardian-btn-outline !p-2"
                                        title="Edit Tool"
                                    >
                                        <Settings size={16} />
                                    </Link>
                                    <Link
                                        to={`/tool/${tool.id}`}
                                        className="guardian-btn-outline group"
                                    >
                                        <span>Launch</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredTools.length === 0 && (
                        <div className="col-span-full guardian-card !bg-slate-50 !border-dashed flex flex-col items-center justify-center py-20 text-center">
                            <Zap size={48} className="text-slate-300 mb-6" />
                            <h3 className="guardian-h3 text-slate-400">No Intelligence Units Matched</h3>
                            <p className="guardian-text-sm text-slate-400 mt-2">Adjust your search parameters or initialize a new sequence.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Catalog;
