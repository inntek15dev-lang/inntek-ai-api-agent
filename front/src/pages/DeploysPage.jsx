import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { 
    Save, 
    Rocket, 
    AlertCircle, 
    Plus, 
    Trash2, 
    Edit3, 
    X, 
    Server, 
    Terminal, 
    Globe, 
    Check, 
    HelpCircle,
    Activity
} from 'lucide-react';

const CATEGORY_ICONS = {
    infra: { icon: Server, color: 'text-blue-500', bg: 'bg-blue-50' },
    docker: { icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    env: { icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
    script: { icon: Terminal, color: 'text-amber-500', bg: 'bg-amber-50' },
    default: { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-50' }
};

const DeploysPage = () => {
    const [settings, setSettings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        key: '', value: '', categoria: 'infra', descripcion: '', activo: true
    });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/deploys`);
            setSettings(res.data.data);
        } catch (err) {
            console.error(err);
            flashMessage('error', 'Failed to fetch deployment settings.');
        } finally {
            setIsLoading(false);
        }
    };

    const flashMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const openCreateForm = () => {
        setEditingId(null);
        setFormData({
            key: '', value: '', categoria: 'infra', descripcion: '', activo: true
        });
        setShowForm(true);
    };

    const openEditForm = (setting) => {
        setEditingId(setting.id);
        setFormData({
            key: setting.key,
            value: setting.value,
            categoria: setting.categoria || 'infra',
            descripcion: setting.descripcion || '',
            activo: setting.activo
        });
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_URL}/deploys/${editingId}`, formData);
                flashMessage('success', 'Setting updated successfully.');
            } else {
                await axios.post(`${API_URL}/deploys`, formData);
                flashMessage('success', 'Setting created successfully.');
            }
            setShowForm(false);
            fetchSettings();
        } catch (err) {
            flashMessage('error', err.response?.data?.message || 'Failed to save setting.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this deployment setting?')) return;
        try {
            await axios.delete(`${API_URL}/deploys/${id}`);
            flashMessage('success', 'Setting deleted.');
            fetchSettings();
        } catch (err) {
            flashMessage('error', err.response?.data?.message || 'Failed to delete setting.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="guardian-label">Infrastructure Governance</p>
                    <h1 className="guardian-h1">Deploy <span className="text-guardian-blue">Settings</span></h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
                        Centralized management for pre-production environment variables & orchestration
                    </p>
                </div>
                <button onClick={openCreateForm} className="guardian-btn-primary h-12">
                    <Plus size={18} />
                    <span>New Setting</span>
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 border animate-in slide-in-from-top-4 duration-300 ${
                    message.type === 'success' 
                    ? 'bg-green-50/50 border-green-200 text-green-700' 
                    : 'bg-red-50/50 border-red-200 text-red-700'
                }`}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
                </div>
            )}

            {isLoading ? (
                <div className="guardian-card flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-2 border-guardian-blue border-t-transparent rounded-full animate-spin"></div>
                    <span className="guardian-label !mb-0">Syncing Data...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {settings.length === 0 ? (
                        <div className="guardian-card !p-12 text-center border-dashed border-2 flex flex-col items-center">
                            <Rocket size={40} className="text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No deployment settings found</p>
                        </div>
                    ) : (
                        <div className="guardian-card !p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 guardian-label !mb-0">Key / Category</th>
                                        <th className="px-6 py-4 guardian-label !mb-0">Value Configuration</th>
                                        <th className="px-6 py-4 guardian-label !mb-0 text-right">Status</th>
                                        <th className="px-6 py-4 guardian-label !mb-0 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {settings.map(setting => {
                                        const cat = CATEGORY_ICONS[setting.categoria] || CATEGORY_ICONS.default;
                                        return (
                                            <tr key={setting.id} className={`hover:bg-slate-50/50 transition-colors ${!setting.activo && 'opacity-60 bg-slate-50/30'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color} border border-white/50 shadow-sm`}>
                                                            <cat.icon size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-guardian-text font-mono truncate max-w-[200px]">{setting.key}</p>
                                                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {setting.categoria}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-guardian-blue font-mono break-all max-w-sm">
                                                            {setting.value}
                                                        </p>
                                                        {setting.descripcion && (
                                                            <p className="text-[10px] text-slate-500 font-medium italic">
                                                                {setting.descripcion}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${
                                                        setting.activo 
                                                        ? 'bg-green-50 border-green-200 text-green-600' 
                                                        : 'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                        {setting.activo ? 'Live' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button 
                                                            onClick={() => openEditForm(setting)}
                                                            className="p-2 text-slate-400 hover:text-guardian-blue hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(setting.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                    {editingId ? 'Update Sequence' : 'New Configuration'}
                                </p>
                                <h3 className="text-lg font-black italic uppercase tracking-tighter">
                                    {editingId ? 'Modify Setting' : 'Register Layer Variable'}
                                </h3>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="guardian-label">Setting Key</label>
                                    <input 
                                        name="key" value={formData.key} onChange={handleChange}
                                        className="guardian-input h-11 !pl-4 font-mono text-sm" 
                                        placeholder="SERVER_IP" required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="guardian-label">Module Category</label>
                                    <select 
                                        name="categoria" value={formData.categoria} onChange={handleChange}
                                        className="guardian-input h-11 !pl-4 appearance-none text-xs font-bold uppercase cursor-pointer"
                                    >
                                        <option value="infra">🏗️ Infrastructure</option>
                                        <option value="docker">🐳 Docker Hub</option>
                                        <option value="env">🌐 Environment</option>
                                        <option value="script">📜 Shell Script</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="guardian-label">Parameter Value</label>
                                <textarea 
                                    name="value" value={formData.value} onChange={handleChange}
                                    className="guardian-input !pl-4 h-24 font-mono text-xs py-3 resize-none" 
                                    placeholder="Enter connection string, IP, or parameter..." required 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="guardian-label">Strategic Description</label>
                                <input 
                                    name="descripcion" value={formData.descripcion} onChange={handleChange}
                                    className="guardian-input h-11 !pl-4 text-xs font-medium" 
                                    placeholder="Brief explanation of this setting's role..." 
                                />
                            </div>

                            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <input 
                                    type="checkbox" name="activo" checked={formData.activo}
                                    onChange={handleChange} 
                                    id="is_active"
                                    className="w-5 h-5 rounded-lg border-slate-300 text-guardian-blue focus:ring-guardian-blue cursor-pointer" 
                                />
                                <label htmlFor="is_active" className="text-xs font-black text-guardian-text uppercase tracking-tight cursor-pointer">
                                    Authorized / Activated in Pipeline
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowForm(false)} className="guardian-btn-outline flex-1 border-slate-200">
                                    <span>Abort</span>
                                </button>
                                <button type="submit" className="guardian-btn-primary flex-1 shadow-lg shadow-guardian-blue/20">
                                    <Save size={18} />
                                    <span>{editingId ? 'Execute Update' : 'Initialize Setting'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeploysPage;
