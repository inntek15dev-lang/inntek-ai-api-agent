import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { Save, Key, AlertCircle, ShieldAlert, Wifi, Globe, Smartphone, Lock } from 'lucide-react';

const Config = () => {
    const [configs, setConfigs] = useState({
        gemini_api_key: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/config`);
            const configData = res.data.data;
            const mapped = {};
            configData.forEach(item => {
                mapped[item.key] = item.value;
            });
            setConfigs(prev => ({ ...prev, ...mapped }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const payload = Object.entries(configs).map(([key, value]) => ({ key, value }));
            await axios.post(`${API_URL}/config`, { configs: payload });
            setMessage({ type: 'success', text: 'SYSTEM_SYNC: Configuration successfully archived.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'SYS_ERR: Failed to sync configuration.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div>
                <p className="guardian-label">Core Protocol Settings</p>
                <h1 className="guardian-h1">Configuración de <span className="text-guardian-blue">Sistema</span></h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="guardian-card border-t-4 border-t-guardian-blue">
                        <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-50">
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-guardian-muted">
                                <Key size={20} />
                            </div>
                            <span className="guardian-h3 tracking-tight">Neural API Credentials</span>
                        </div>

                        {message && (
                            <div className={`mb-8 p-4 rounded-lg flex items-center space-x-3 border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                <AlertCircle size={20} />
                                <span className="text-xs font-bold uppercase tracking-tight">{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="guardian-input-group !mb-0">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="guardian-label !mb-0">Gemini_API_Sequence</label>
                                    <span className="guardian-badge guardian-badge--blue text-[8px]">Encypted</span>
                                </div>
                                <div className="relative">
                                    <Lock className="guardian-input-icon" size={18} />
                                    <input
                                        type="password"
                                        value={configs.gemini_api_key}
                                        onChange={(e) => setConfigs({ ...configs, gemini_api_key: e.target.value })}
                                        className="guardian-input font-mono tracking-widest"
                                        placeholder="********************************"
                                    />
                                </div>
                                <div className="mt-4 flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <ShieldAlert size={18} className="text-guardian-muted mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-guardian-muted uppercase leading-relaxed tracking-wider">
                                        Esta llave permite la comunicación encriptada con los nodos de Google Gemini. Asegúrese de que el entorno sea seguro antes de la exposición.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="guardian-btn-primary"
                            >
                                <Save size={20} />
                                <span>{isSaving ? 'Syncing...' : 'Update Records'}</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-8">
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Globe size={16} className="text-slate-400" />
                                    <span className="text-[11px] font-bold text-guardian-text uppercase tracking-tight">Gemini Node</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Standby</span>
                            </div>
                        </div>
                    </div>

                    <div className="guardian-card !p-6 space-y-4 !bg-red-50/30 !border-red-100">
                        <span className="guardian-label !text-red-800">Danger Zone</span>
                        <p className="text-[10px] font-bold text-red-800/60 uppercase leading-relaxed">
                            Changes to neural credentials may interrupt ongoing agent operations.
                        </p>
                        <div className="w-full h-[1px] bg-red-100"></div>
                        <button className="text-[10px] font-bold text-red-600 uppercase hover:underline">Flush All Cache</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Config;
