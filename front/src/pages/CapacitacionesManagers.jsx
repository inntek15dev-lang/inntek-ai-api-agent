import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { Save, Plus, Trash2, Edit3, GraduationCap, Users, BookOpen, Layers, X, Search } from 'lucide-react';

const CapacitacionesManagers = () => {
    const [activeTab, setActiveTab] = useState('colaboradores');
    const [data, setData] = useState({ colaboradores: [], servicios: [], cursos: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [colabs, svcs, courses] = await Promise.all([
                axios.get(`${API_URL}/capacitaciones/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/capacitaciones/servicios`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/capacitaciones/cursos`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setData({
                colaboradores: colabs.data.personas,
                servicios: svcs.data,
                cursos: courses.data
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            setFormData(activeTab === 'colaboradores' ? { nombre: '', rut: '', servicio_id: '' } : { nombre: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        // Basic implementation for Sprint 4
        // In a real scenario, we would have specific endpoints for each CRUD
        alert('Funcionalidad de guardado en desarrollo para el Sprint 4 final. Datos persistidos en base de datos vía Seeders por ahora.');
        setShowModal(false);
    };

    const tabs = [
        { id: 'colaboradores', label: 'Colaboradores', icon: Users },
        { id: 'servicios', label: 'Servicios', icon: Layers },
        { id: 'cursos', label: 'Cursos', icon: BookOpen },
    ];

    const getFilteredList = () => {
        const list = activeTab === 'colaboradores' ? data.colaboradores : 
                     activeTab === 'servicios' ? data.servicios : data.cursos;
        if (!searchTerm) return list;
        return list.filter(item => 
            (item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.rut || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-500 mb-1">
                        <GraduationCap size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administración</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Mantenedores <span className="text-slate-400">Capacitaciones</span></h1>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus size={16} /> Nuevo {activeTab.slice(0, -1)}
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search and Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={`Buscar en ${activeTab}...`}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre / ID</th>
                                {activeTab === 'colaboradores' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT</th>}
                                {activeTab === 'colaboradores' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio</th>}
                                {activeTab === 'servicios' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</th>}
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {getFilteredList().map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {item.id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700">{item.nombre}</div>
                                                <div className="text-[9px] text-slate-400 font-mono">{item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {activeTab === 'colaboradores' && <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.rut || 'N/A'}</td>}
                                    {activeTab === 'colaboradores' && (
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-tight text-slate-500">
                                                {item.servicio}
                                            </span>
                                        </td>
                                    )}
                                    {activeTab === 'servicios' && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ background: item.color }}></div>
                                                <span className="text-xs font-mono text-slate-500 uppercase">{item.color}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg transition-all text-slate-400 shadow-sm border border-transparent hover:border-slate-100"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="p-2 hover:bg-white hover:text-red-600 rounded-lg transition-all text-slate-400 shadow-sm border border-transparent hover:border-slate-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800 italic uppercase">
                                {editingItem ? 'Editar' : 'Nuevo'} {activeTab.slice(0, -1)}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </header>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    required
                                />
                            </div>
                            {activeTab === 'colaboradores' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">RUT</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        value={formData.rut}
                                        onChange={(e) => setFormData({...formData, rut: e.target.value})}
                                    />
                                </div>
                            )}
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                                    <Save size={14} /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapacitacionesManagers;
