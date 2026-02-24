import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Upload, Send, MessageSquare, FileText, CheckCircle, Cpu } from 'lucide-react';

const ToolView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchTool();
    }, [id]);

    const fetchTool = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/tools/${id}`);
            setTool(res.data.data);
        } catch (err) {
            console.error(err);
            navigate('/catalog');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (e) => {
        e.preventDefault();
        setIsExecuting(true);
        setResponse('');
        try {
            const res = await axios.post(`http://localhost:3001/api/tools/${id}/execute`, { prompt });
            setResponse(res.data.data.response);
        } catch (err) {
            alert('Error al ejecutar herramienta');
        } finally {
            setIsExecuting(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando herramienta...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/catalog')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-3xl">
                            {tool.logo_herramienta}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{tool.nombre}</h1>
                            <p className="text-slate-500 text-sm">{tool.descripcion}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Input Formulation */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card space-y-6">
                        <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase">
                            <MessageSquare size={18} />
                            <span>Ejecución de Comando</span>
                        </div>

                        <form onSubmit={handleExecute} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Instrucción / Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
                                    placeholder="Escribe aquí lo que necesitas que la IA procese..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Archivo de Referencia (Opcional)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${file ? 'border-primary bg-blue-50' : 'border-slate-200 group-hover:border-primary'}`}>
                                        {file ? (
                                            <>
                                                <CheckCircle size={32} className="text-primary mb-2" />
                                                <span className="text-sm font-bold text-primary">{file.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={32} className="text-slate-400 mb-2" />
                                                <span className="text-sm font-medium text-slate-500">Haz clic o arrastra un archivo</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isExecuting}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center space-x-3"
                            >
                                {isExecuting ? <span>Procesando...</span> : (
                                    <>
                                        <Send size={20} />
                                        <span>Ejecutar Agente</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Output Visor */}
                <div className="lg:col-span-3">
                    <div className="card h-full min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase">
                                <FileText size={18} />
                                <span>Visor de Respuesta</span>
                            </div>
                            <div className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-400 rounded uppercase">
                                Format: {tool.response_format}
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50 rounded-2xl p-6 overflow-y-auto border border-slate-100 relative">
                            {response ? (
                                <div className="prose prose-blue max-w-none font-medium text-slate-700">
                                    {response.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            ) : isExecuting ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-500 font-medium animate-pulse">La IA está pensando...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-30">
                                    <Cpu size={64} className="mb-4 text-slate-300" />
                                    <p className="text-slate-400 italic">Esperando ejecución...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolView;
