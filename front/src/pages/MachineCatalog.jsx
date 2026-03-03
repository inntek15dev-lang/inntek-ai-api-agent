import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { Plus, Search, Workflow, Trash2, Edit3, ArrowRight, Zap, Cpu, GitBranch } from 'lucide-react';

const MachineCatalog = () => {
    const [machines, setMachines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newMachine, setNewMachine] = useState({ nombre: '', descripcion: '', icono: '⚙️' });
    const navigate = useNavigate();

    useEffect(() => { fetchMachines(); }, []);

    const fetchMachines = async () => {
        try {
            const res = await axios.get(`${API_URL}/machines`);
            setMachines(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!newMachine.nombre.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/machines`, newMachine);
            navigate(`/machines/${res.data.data.id}`);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('¿Eliminar esta Machine y todo su flujo?')) return;
        try {
            await axios.delete(`${API_URL}/machines/${id}`);
            setMachines(machines.filter(m => m.id !== id));
        } catch (err) { console.error(err); }
    };

    const filteredMachines = machines.filter(m =>
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="guardian-label">Orchestration Hub</p>
                    <h1 className="guardian-h1 !mb-0">
                        <span className="text-guardian-blue">Machines</span> Catalog
                    </h1>
                    <p className="guardian-text-sm mt-2">Diseña flujos de ejecución encadenando Tools y Engines.</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="guardian-btn-primary !w-auto h-12">
                    <Plus size={20} />
                    <span>New Machine</span>
                </button>
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
                    <div className="guardian-card w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="guardian-h2 mb-6">Create New Machine</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="guardian-label">Icono</label>
                                <input
                                    value={newMachine.icono}
                                    onChange={e => setNewMachine({ ...newMachine, icono: e.target.value })}
                                    className="guardian-input !pl-4 text-2xl text-center w-20"
                                />
                            </div>
                            <div>
                                <label className="guardian-label">Nombre</label>
                                <input
                                    value={newMachine.nombre}
                                    onChange={e => setNewMachine({ ...newMachine, nombre: e.target.value })}
                                    placeholder="Nombre de la machine..."
                                    className="guardian-input !pl-4"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="guardian-label">Descripción</label>
                                <textarea
                                    value={newMachine.descripcion}
                                    onChange={e => setNewMachine({ ...newMachine, descripcion: e.target.value })}
                                    placeholder="Describe el flujo..."
                                    rows={3}
                                    className="guardian-input !pl-4"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowCreate(false)} className="guardian-btn-outline">Cancel</button>
                            <button onClick={handleCreate} className="guardian-btn-primary">
                                <Plus size={18} />
                                <span>Create & Open Editor</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="guardian-card !p-4 flex items-center space-x-4">
                <Search className="text-guardian-muted ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Filter machines by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400"
                />
                <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                <span className="text-[10px] font-black text-guardian-muted uppercase tracking-widest px-4 whitespace-nowrap">
                    {filteredMachines.length} Machines
                </span>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-guardian-blue border-t-transparent rounded-full animate-spin" />
                    <p className="guardian-text-sm font-bold animate-pulse">Loading Machines...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredMachines.map(machine => (
                        <div key={machine.id} className="guardian-tool-card flex flex-col !border-t-purple-500">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-3xl shadow-sm">
                                    {machine.icono || '⚙️'}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="guardian-badge bg-purple-50 text-purple-600 border border-purple-100">
                                        <Workflow size={10} className="inline mr-1" />
                                        Machine
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                        {machine.MachineNodes?.length || 0} nodes
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 mb-8">
                                <h3 className="guardian-h3 mb-2">{machine.nombre}</h3>
                                <p className="guardian-text-sm line-clamp-3 leading-relaxed">
                                    {machine.descripcion || 'Sin descripción'}
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                    <GitBranch size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Flow Editor
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => handleDelete(machine.id, e)}
                                        className="guardian-btn-outline !p-2 hover:!border-red-300 hover:!text-red-500"
                                        title="Delete Machine"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <Link
                                        to={`/machines/${machine.id}`}
                                        className="guardian-btn-outline group"
                                    >
                                        <span>Open</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredMachines.length === 0 && (
                        <div className="col-span-full guardian-card !bg-slate-50 !border-dashed flex flex-col items-center justify-center py-20 text-center">
                            <Zap size={48} className="text-slate-300 mb-6" />
                            <h3 className="guardian-h3 text-slate-400">No Machines Found</h3>
                            <p className="guardian-text-sm text-slate-400 mt-2">Create your first Machine to start building execution flows.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MachineCatalog;
