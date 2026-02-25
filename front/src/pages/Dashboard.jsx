import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Zap, Cpu, BarChart3, Database, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: 'Neural Load', value: '12%', status: 'Stable', icon: Activity, type: 'blue' },
        { label: 'Uptime', value: '99.99%', status: 'Active', icon: ShieldCheck, type: 'green' },
        { label: 'Latency', value: '24ms', status: 'Optimal', icon: Zap, type: 'blue' },
    ];

    return (
        <div className="guardian-stack-y">
            <div>
                <p className="guardian-label">Command Center Dashboard</p>
                <h1 className="guardian-h1">
                    Bienvenido, <span className="text-guardian-blue">{user?.nombre}</span>
                </h1>
                <p className="guardian-text-sm max-w-2xl">
                    Visualización en tiempo real del estado de los agentes IA y el núcleo de integración del protocolo OVAL.
                    Cumplimiento normativo ISO 27001 activo.
                </p>
            </div>

            <div className="guardian-grid-3">
                {stats.map((stat, i) => (
                    <div key={i} className="guardian-stat-card">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-slate-50 border border-slate-100 text-guardian-muted`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`guardian-badge guardian-badge--${stat.type}`}>
                                {stat.status}
                            </span>
                        </div>
                        <div className="mt-auto">
                            <p className="guardian-label !mb-0">{stat.label}</p>
                            <h3 className="text-3xl font-black text-guardian-text tracking-tighter">{stat.value}</h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-guardian-muted uppercase tracking-widest">
                            <span>View Metrics</span>
                            <ArrowUpRight size={14} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="guardian-grid-2">
                <div className="guardian-card flex flex-col items-center justify-center text-center space-y-6 h-[400px]">
                    <div className="w-16 h-16 bg-guardian-blue/5 rounded-full flex items-center justify-center text-guardian-blue">
                        <BarChart3 size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="guardian-h3 uppercase tracking-tighter">Neural Activity Graph</h3>
                        <p className="guardian-text-sm italic">Awaiting Metric Stream Initialization...</p>
                    </div>
                    <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[40%] h-full bg-guardian-blue animate-pulse"></div>
                    </div>
                </div>

                <div className="guardian-card flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-guardian-border">
                        <div className="flex items-center space-x-3 text-guardian-text">
                            <Database size={20} />
                            <span className="guardian-h3 uppercase tracking-tighter">System Events Log</span>
                        </div>
                        <span className="guardian-badge guardian-badge--slate">Neural_Log_v1</span>
                    </div>
                    <div className="flex-1 font-mono text-[11px] space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                        <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-guardian-blue font-bold">[04:12]</span> <span className="text-guardian-muted">Core initialization sequence complete.</span></p>
                        <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-guardian-blue font-bold">[05:30]</span> <span className="text-guardian-muted">Neural link established with MySQL Node.</span></p>
                        <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-guardian-blue font-bold">[06:45]</span> <span className="text-guardian-muted">User {user?.nombre} clearance verified.</span></p>
                        <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-guardian-blue font-bold">[07:12]</span> <span className="text-guardian-muted">System monitoring activated.</span></p>
                        <p className="flex justify-between border-b border-slate-50 pb-2"><span className="text-guardian-blue font-bold">[09:01]</span> <span className="text-guardian-muted">Protocols OVAL v2.1 synced.</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
