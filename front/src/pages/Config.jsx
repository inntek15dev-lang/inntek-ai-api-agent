import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { Save, Key, AlertCircle, ShieldAlert, Wifi, Globe, Plus, Trash2, Star, Edit3, X, Cpu, Zap, Eye, EyeOff } from 'lucide-react';

const PROVIDER_TYPES = [
    { value: 'google_native', label: 'Google Native (SDK)', icon: '🔷' },
    { value: 'openai_compatible', label: 'OpenAI Compatible (REST)', icon: '🟢' }
];

const Config = () => {
    const [providers, setProviders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [editingProvider, setEditingProvider] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showKey, setShowKey] = useState({});
    const [formData, setFormData] = useState({
        nombre: '', slug: '', tipo: 'openai_compatible',
        api_key: '', base_url: '', modelo: '',
        is_default: false, activo: true, extra_headers: ''
    });

    useEffect(() => { fetchProviders(); }, []);

    const fetchProviders = async () => {
        try {
            const res = await axios.get(`${API_URL}/ai-providers`);
            setProviders(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const flashMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const openCreateForm = () => {
        setEditingProvider(null);
        setFormData({
            nombre: '', slug: '', tipo: 'openai_compatible',
            api_key: '', base_url: '', modelo: '',
            is_default: false, activo: true, extra_headers: ''
        });
        setShowForm(true);
    };

    const openEditForm = (provider) => {
        setEditingProvider(provider.id);
        setFormData({
            nombre: provider.nombre,
            slug: provider.slug,
            tipo: provider.tipo,
            api_key: provider.api_key || '',
            base_url: provider.base_url || '',
            modelo: provider.modelo,
            is_default: provider.is_default,
            activo: provider.activo,
            extra_headers: provider.extra_headers || ''
        });
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingProvider) {
                await axios.put(`${API_URL}/ai-providers/${editingProvider}`, formData);
                flashMessage('success', 'Provider updated successfully.');
            } else {
                await axios.post(`${API_URL}/ai-providers`, formData);
                flashMessage('success', 'Provider created successfully.');
            }
            setShowForm(false);
            fetchProviders();
        } catch (err) {
            flashMessage('error', err.response?.data?.message || 'Failed to save provider.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this provider?')) return;
        try {
            await axios.delete(`${API_URL}/ai-providers/${id}`);
            flashMessage('success', 'Provider deleted.');
            fetchProviders();
        } catch (err) {
            flashMessage('error', err.response?.data?.message || 'Cannot delete provider.');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await axios.put(`${API_URL}/ai-providers/${id}/set-default`);
            flashMessage('success', 'Default provider updated.');
            fetchProviders();
        } catch (err) {
            flashMessage('error', 'Failed to set default.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div>
                <p className="guardian-label">Core Protocol Settings</p>
                <h1 className="guardian-h1">AI <span className="text-guardian-blue">Providers</span></h1>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-3 border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <AlertCircle size={20} />
                    <span className="text-xs font-bold uppercase tracking-tight">{message.text}</span>
                </div>
            )}

            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map(provider => (
                    <div key={provider.id}
                        className={`guardian-card !p-6 relative transition-all border-t-4 ${provider.is_default ? 'border-t-guardian-blue shadow-lg' : 'border-t-slate-200'
                            } ${!provider.activo ? 'opacity-50' : ''}`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">
                                    {provider.tipo === 'google_native' ? '🔷' : '🟢'}
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-guardian-text">{provider.nombre}</h3>
                                    <p className="text-[10px] font-bold text-guardian-muted uppercase tracking-wider">{provider.slug}</p>
                                </div>
                            </div>
                            {provider.is_default && (
                                <span className="guardian-badge guardian-badge--blue flex items-center space-x-1">
                                    <Star size={10} /><span>Default</span>
                                </span>
                            )}
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between">
                                <span className="guardian-label !mb-0 !text-[9px]">Model</span>
                                <span className="text-xs font-bold text-guardian-text truncate max-w-[60%] text-right">{provider.modelo}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="guardian-label !mb-0 !text-[9px]">Type</span>
                                <span className="guardian-badge guardian-badge--slate !text-[8px]">
                                    {provider.tipo === 'google_native' ? 'Native SDK' : 'OpenAI Compat'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="guardian-label !mb-0 !text-[9px]">API Key</span>
                                <span className="text-xs font-mono text-guardian-muted">
                                    {provider.api_key || <span className="text-red-500 font-bold">NOT SET</span>}
                                </span>
                            </div>
                            {provider.base_url && (
                                <div className="flex items-center justify-between">
                                    <span className="guardian-label !mb-0 !text-[9px]">Base URL</span>
                                    <span className="text-[10px] font-mono text-guardian-muted truncate max-w-[60%]">{provider.base_url}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                            <button onClick={() => openEditForm(provider)}
                                className="flex-1 flex items-center justify-center space-x-1 py-2 text-[10px] font-bold uppercase text-guardian-muted hover:text-guardian-blue transition-colors rounded-lg hover:bg-slate-50">
                                <Edit3 size={12} /><span>Edit</span>
                            </button>
                            {!provider.is_default && (
                                <>
                                    <button onClick={() => handleSetDefault(provider.id)}
                                        className="flex-1 flex items-center justify-center space-x-1 py-2 text-[10px] font-bold uppercase text-guardian-muted hover:text-yellow-600 transition-colors rounded-lg hover:bg-yellow-50">
                                        <Star size={12} /><span>Default</span>
                                    </button>
                                    <button onClick={() => handleDelete(provider.id)}
                                        className="flex items-center justify-center py-2 px-3 text-[10px] font-bold uppercase text-guardian-muted hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Provider Card */}
                <button onClick={openCreateForm}
                    className="guardian-card !p-6 border-2 border-dashed border-slate-200 hover:border-guardian-blue flex flex-col items-center justify-center space-y-3 transition-all hover:bg-slate-50/50 min-h-[200px] cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-guardian-muted">
                        <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold text-guardian-muted uppercase tracking-wider">Add Provider</span>
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="guardian-label !mb-0">
                                    {editingProvider ? 'Edit Provider' : 'New Provider'}
                                </p>
                                <h3 className="guardian-h3 !text-base mt-1">
                                    {editingProvider ? 'Update Configuration' : 'Register AI Provider'}
                                </h3>
                            </div>
                            <button onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-guardian-muted">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Name</label>
                                    <input name="nombre" value={formData.nombre} onChange={handleChange}
                                        className="guardian-input !pl-4" placeholder="Google Gemini" required />
                                </div>
                                <div className="guardian-input-group !mb-0">
                                    <label className="guardian-label">Slug (ID)</label>
                                    <input name="slug" value={formData.slug} onChange={handleChange}
                                        className="guardian-input !pl-4 font-mono" placeholder="google" required />
                                </div>
                            </div>

                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Provider Type</label>
                                <select name="tipo" value={formData.tipo} onChange={handleChange}
                                    className="guardian-input !pl-4 appearance-none">
                                    {PROVIDER_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="guardian-input-group !mb-0">
                                <label className="guardian-label">Model</label>
                                <input name="modelo" value={formData.modelo} onChange={handleChange}
                                    className="guardian-input !pl-4 font-mono text-xs" placeholder="gemini-2.0-flash" required />
                            </div>

                            <div className="guardian-input-group !mb-0">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="guardian-label !mb-0">API Key</label>
                                    <button type="button" onClick={() => setShowKey(prev => ({ ...prev, form: !prev.form }))}
                                        className="text-guardian-muted hover:text-guardian-blue">
                                        {showKey.form ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <input name="api_key" value={formData.api_key} onChange={handleChange}
                                    type={showKey.form ? 'text' : 'password'}
                                    className="guardian-input !pl-4 font-mono text-xs tracking-wider"
                                    placeholder="sk-..." />
                            </div>

                            {formData.tipo === 'openai_compatible' && (
                                <>
                                    <div className="guardian-input-group !mb-0">
                                        <label className="guardian-label">Base URL</label>
                                        <input name="base_url" value={formData.base_url} onChange={handleChange}
                                            className="guardian-input !pl-4 font-mono text-xs"
                                            placeholder="https://openrouter.ai/api/v1" />
                                    </div>
                                    <div className="guardian-input-group !mb-0">
                                        <label className="guardian-label">Extra Headers (JSON)</label>
                                        <textarea name="extra_headers" value={formData.extra_headers} onChange={handleChange}
                                            rows={2} className="guardian-input !pl-4 font-mono text-xs resize-none"
                                            placeholder='{"HTTP-Referer": "https://myapp.com"}' />
                                    </div>
                                </>
                            )}

                            <div className="flex items-center space-x-6 pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="activo" checked={formData.activo}
                                        onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-guardian-blue focus:ring-guardian-blue" />
                                    <span className="text-xs font-bold text-guardian-text uppercase">Active</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="is_default" checked={formData.is_default}
                                        onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-guardian-blue focus:ring-guardian-blue" />
                                    <span className="text-xs font-bold text-guardian-text uppercase">Set as Default</span>
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="guardian-btn-outline flex-1">
                                    <span>Cancel</span>
                                </button>
                                <button type="submit" className="guardian-btn-primary flex-1">
                                    <Save size={18} />
                                    <span>{editingProvider ? 'Update' : 'Create'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="guardian-card !p-6 space-y-6 !bg-slate-50/50">
                    <span className="guardian-label">Network Status</span>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Wifi size={16} className="text-guardian-blue" />
                                <span className="text-[11px] font-bold text-guardian-text uppercase tracking-tight">Backend API</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-500 uppercase">Online</span>
                        </div>
                        {providers.filter(p => p.is_default).map(p => (
                            <div key={p.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Globe size={16} className="text-guardian-blue" />
                                    <span className="text-[11px] font-bold text-guardian-text uppercase tracking-tight">{p.nombre}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase ${p.api_key ? 'text-green-500' : 'text-red-500'}`}>
                                    {p.api_key ? 'Ready' : 'No Key'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="guardian-card !p-6 space-y-4 md:col-span-2">
                    <span className="guardian-label">How It Works</span>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                            <Cpu size={16} className="text-guardian-blue mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-guardian-muted uppercase leading-relaxed">
                                <strong className="text-guardian-text">Google Native</strong> — Uses the official Google Gemini SDK. Supports multimodal (images, PDFs) and JSON Schema enforcement.
                            </p>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                            <Zap size={16} className="text-green-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-guardian-muted uppercase leading-relaxed">
                                <strong className="text-guardian-text">OpenAI Compatible</strong> — Generic REST API. Works with OpenRouter, Groq, Together, Ollama, and any OpenAI-format endpoint.
                            </p>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                            <ShieldAlert size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-yellow-800 uppercase leading-relaxed">
                                Each AI Tool can optionally override the system default provider. If no override is set, the tool uses whichever provider is marked as <strong>DEFAULT</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Config;
