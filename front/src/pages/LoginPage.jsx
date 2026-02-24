import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Terminal } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Credenciales inválidas o error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full glass p-10 rounded-3xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                        <Terminal size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Bienvenido</h1>
                    <p className="text-slate-500">Ingresa a tu cuenta de agente IA</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Correo / Usuario</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Ej: inntek"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                    >
                        {isLoading ? <span>Cargando...</span> : (
                            <>
                                <LogIn size={20} />
                                <span>Iniciar Sesión</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>© 2026 Inntek AI Agent API Agent Project</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
