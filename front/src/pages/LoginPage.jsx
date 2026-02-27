import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            if (data?.success) {
                navigate('/catalog');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('System connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-guardian-bg">
            <div className="w-full max-w-[480px] guardian-card animate-in zoom-in-95 duration-700">
                {/* Logo and Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-900 rounded-2xl mb-6 border border-slate-700 shadow-lg shadow-slate-900/50 p-2">
                        <img src="/logo-agentx.png" alt="INNTEK AI Orchestrator" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-3xl font-black text-guardian-text tracking-tight mb-2 uppercase">INNTEK AI Orchestrator</h2>
                    <p className="guardian-text-sm font-bold uppercase tracking-[0.2em] text-[10px]">AI Agent Integrations Manager</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center space-x-3 text-red-600">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="guardian-input-group">
                        <label className="guardian-label">Email Corporativo</label>
                        <div className="relative">
                            <Mail className="guardian-input-icon" size={18} />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="guardian-input"
                                placeholder="ejemplo@guardian.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="guardian-input-group">
                        <label className="guardian-label">Contraseña</label>
                        <div className="relative">
                            <Lock className="guardian-input-icon" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="guardian-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="guardian-btn-primary group"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Securing Environment...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <span>Iniciar Sesión Securely</span>
                            </div>
                        )}
                    </button>
                </form>

                <p className="mt-12 text-center text-[10px] font-bold text-guardian-muted italic uppercase leading-relaxed max-w-[280px] mx-auto">
                    Acceso restringido a personal autorizado conforme a la política A.5.15
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
