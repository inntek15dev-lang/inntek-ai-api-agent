import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Key, AlertCircle } from 'lucide-react';

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
            const res = await axios.get('http://localhost:3001/api/config');
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
            await axios.post('http://localhost:3001/api/config', { configs: payload });
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
                <p className="text-slate-500">Administra las llaves de API y parámetros globales</p>
            </div>

            <div className="card space-y-8">
                <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase">
                    <Key size={18} />
                    <span>Servicios de IA</span>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            value={configs.gemini_api_key}
                            onChange={(e) => setConfigs({ ...configs, gemini_api_key: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono"
                            placeholder="AIzaSy..."
                        />
                        <div className="mt-2 flex items-start space-x-2 text-slate-400 text-xs italic">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>Esta llave se utiliza para conectar tus herramientas con los modelos de Google Gemini.</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                    >
                        <Save size={20} />
                        <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Config;
