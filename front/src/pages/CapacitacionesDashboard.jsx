import React, { useState, useEffect } from 'react';
import { Search, UserCircle, CheckCircle, Clock, Calendar, Users, BookOpen, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const CapacitacionesDashboard = () => {
    const [data, setData] = useState({ personas: [] });
    const [loading, setLoading] = useState(true);
    const [currentFilter, setCurrentFilter] = useState('Todos');
    const [currentPerson, setCurrentPerson] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/capacitaciones/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const services = ['Todos', 'Doc. Controlada', 'INNTEK', 'RyCE', 'Transversal', 'Verif. Chile', 'Verif. Uruguay'];

    const filteredPeople = data.personas.filter(p => {
        const matchesFilter = currentFilter === 'Todos' || p.servicio === currentFilter;
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.servicio.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getInitials = (name) => {
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    const globalKPIs = {
        colaboradores: data.personas.length,
        totalAsignadas: data.personas.reduce((acc, p) => acc + p.total, 0),
        completadas: data.personas.reduce((acc, p) => acc + p.completados, 0),
    };
    globalKPIs.avanceGlobal = globalKPIs.totalAsignadas > 0 ? Math.round((globalKPIs.completadas / globalKPIs.totalAsignadas) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0f0f1a] text-[#e8e8f0] font-sans selection:bg-indigo-500/30">
            {/* HEADER */}
            <header className="bg-gradient-to-r from-[#0d1b2e] via-[#1F4E79] to-[#2E75B6] p-6 lg:px-10 border-b-2 border-[#5B9BD5]/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="relative z-10">
                    <h1 className="font-serif text-3xl font-bold tracking-tighter text-white">
                        Plan de Capacitaciones <span className="italic text-[#BDD7EE]">2026</span>
                    </h1>
                    <p className="text-xs text-white/50 font-light mt-1 tracking-wider uppercase">Grupo OVAL · Panel de seguimiento interactivo</p>
                </div>

                <div className="flex flex-wrap gap-4 relative z-10">
                    <KPICard value={globalKPIs.colaboradores} label="Colaboradores" icon={<Users size={14}/>} />
                    <KPICard value={globalKPIs.totalAsignadas} label="Asignaciones" icon={<BookOpen size={14}/>} />
                    <KPICard value={globalKPIs.completadas} label="Completadas" icon={<CheckCircle size={14}/>} />
                    <KPICard value={`${globalKPIs.avanceGlobal}%`} label="Avance Global" icon={<GraduationCap size={14}/>} />
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden h-full">
                {/* LEFT PANEL */}
                <aside className="w-80 flex-shrink-0 bg-[#181828] border-r border-white/5 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" size={16} />
                            <input 
                                className="w-full bg-[#22223a] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:border-[#5B9BD5] transition-all"
                                placeholder="Buscar colaborador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {services.map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setCurrentFilter(s)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all border ${
                                        currentFilter === s 
                                        ? 'bg-[#5B9BD5] border-transparent text-white' 
                                        : 'bg-[#22223a] border-white/10 text-[#a0a0b8] hover:border-white/20'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
                        {filteredPeople.map(p => {
                            const active = currentPerson?.id === p.id;
                            const compPct = p.total > 0 ? (p.completados / p.total * 100) : 0;
                            const procPct = p.total > 0 ? (p.en_proceso / p.total * 100) : 0;
                            
                            return (
                                <div 
                                    key={p.id}
                                    onClick={() => {
                                        setCurrentPerson(p);
                                        setCourseFilter('all');
                                    }}
                                    className={`p-3 rounded-xl cursor-pointer transition-all border mb-1 flex items-center gap-3 group ${
                                        active 
                                        ? 'bg-indigo-500/10 border-indigo-500/30' 
                                        : 'bg-transparent border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0 transition-transform group-hover:scale-105" style={{ background: p.avatar_color || '#5B9BD5' }}>
                                        {getInitials(p.nombre)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-xs font-semibold truncate transition-colors ${active ? 'text-white' : 'text-[#e8e8f0]'}`}>{p.nombre}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.avatar_color }}></div>
                                            <span className="text-[9px] text-[#a0a0b8] font-medium uppercase truncate">{p.servicio}</span>
                                        </div>
                                        <div className="h-0.5 w-full bg-white/5 mt-2 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-400" style={{ width: `${compPct}%` }}></div>
                                            <div className="h-full bg-yellow-400" style={{ width: `${procPct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black bg-white/5 px-2 py-1 rounded text-[#a0a0b8]">{p.total}</div>
                                </div>
                            );
                        })}
                        {filteredPeople.length === 0 && (
                            <div className="text-center py-10 text-[#a0a0b8] text-xs italic">Sin resultados</div>
                        )}
                    </div>
                </aside>

                {/* RIGHT PANEL */}
                <main className="flex-1 overflow-y-auto bg-[#0f0f1a] p-8 scrollbar-thin scrollbar-thumb-white/10">
                    {currentPerson ? (
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Profile Header */}
                            <div className="flex items-start gap-6 border-b border-white/5 pb-8">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/10" style={{ background: currentPerson.avatar_color }}>
                                    {getInitials(currentPerson.nombre)}
                                </div>
                                <div className="space-y-3">
                                    <h2 className="font-serif text-4xl text-white tracking-tight">{currentPerson.nombre}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                            {currentPerson.servicio}
                                        </span>
                                        {currentPerson.rut && (
                                            <span className="bg-[#22223a] text-[#888] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                RUT: {currentPerson.rut}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stat Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatBox val={currentPerson.total} lbl="Asignadas" color="#5B9BD5" />
                                <StatBox val={currentPerson.completados} lbl="Completadas" color="#4ade80" />
                                <StatBox val={currentPerson.en_proceso} lbl="En proceso" color="#facc15" />
                                <StatBox val={currentPerson.por_coordinar} lbl="Por coordinar" color="#60a5fa" />
                            </div>

                            {/* Progress Section */}
                            <div className="bg-[#181828] border border-white/5 p-6 rounded-2xl shadow-lg">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="space-y-1">
                                        <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Rendimiento Académico</h5>
                                        <h3 className="text-sm font-medium text-white/70 italic">Avance general consolidado</h3>
                                    </div>
                                    <span className="text-5xl font-black text-white italic">
                                        {currentPerson.total > 0 ? Math.round((currentPerson.completados / currentPerson.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-[#22223a] rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-1000 ease-out" 
                                        style={{ width: `${currentPerson.total > 0 ? (currentPerson.completados / currentPerson.total * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Courses List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="font-serif text-xl text-white flex items-center gap-3 italic">
                                        Malla Curricular <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        <span className="font-sans not-italic text-[10px] bg-white/5 px-3 py-1 rounded-lg text-[#a0a0b8] font-black uppercase tracking-widest">{currentPerson.total} Cursos</span>
                                    </h3>
                                    <div className="flex gap-2">
                                        {['all', 'Completado', 'En proceso', 'Por coordinar'].map(f => (
                                            <button 
                                                key={f}
                                                onClick={() => setCourseFilter(f)}
                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                    courseFilter === f 
                                                    ? 'bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20' 
                                                    : 'bg-[#181828] border-white/5 text-[#a0a0b8] hover:border-white/10'
                                                }`}
                                            >
                                                {f === 'all' ? 'Ver Todos' : f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {currentPerson.cursos
                                        .filter(c => courseFilter === 'all' || c.estado === courseFilter)
                                        .map((c, i) => (
                                            <div key={i} className="group bg-[#181828] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/30 transition-all hover:bg-[#1e1e32]">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                                                    c.estado === 'Completado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    c.estado === 'En proceso' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                    #{i + 1}
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <h5 className="text-[11px] font-bold text-[#e8e8f0] line-clamp-2 leading-relaxed tracking-tight">{c.nombre}</h5>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        c.estado === 'Completado' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        c.estado === 'En proceso' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                        <div className={`w-1 h-1 rounded-full ${
                                                            c.estado === 'Completado' ? 'bg-emerald-400' :
                                                            c.estado === 'En proceso' ? 'bg-yellow-400 font-bold animate-pulse' :
                                                            'bg-blue-400'
                                                        }`}></div>
                                                        {c.estado}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#a0a0b8] opacity-50 space-y-6">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                <UserCircle size={48} strokeWidth={1}/>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-serif text-2xl italic tracking-tight">Selección de Perfil Requerida</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest max-w-[200px] leading-relaxed">Haga clic en un colaborador de la lista lateral para visualizar su historial</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const KPICard = ({ value, label, icon }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center backdrop-blur-md min-w-[100px] hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-white/40">{icon}</span>
            <span className="text-2xl font-black text-white italic">{value}</span>
        </div>
        <div className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em]">{label}</div>
    </div>
);

const StatBox = ({ val, lbl, color }) => (
    <div className="bg-[#181828] border border-white/5 p-6 rounded-xl text-center relative overflow-hidden group hover:border-white/10 transition-all">
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: color }}></div>
        <div className="text-4xl font-black italic mb-2 transition-transform group-hover:scale-110" style={{ color }}>{val}</div>
        <div className="text-[9px] text-[#888] uppercase font-black tracking-widest">{lbl}</div>
    </div>
);

export default CapacitacionesDashboard;
