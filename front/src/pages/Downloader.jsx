import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Download, 
    FileUp, 
    Play, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Archive, 
    FileText,
    ExternalLink,
    AlertCircle
} from 'lucide-react';

const Downloader = () => {
    // Form States
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [urlCol, setUrlCol] = useState('');
    const [nameCol, setNameCol] = useState('');

    // Execution States
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]); // [{ row, status, filename, url, error }]
    const [progress, setProgress] = useState(0);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

    // Handle File Upload & CSV Parsing
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
            if (rows.length > 0) {
                const headerRow = rows[0];
                setHeaders(headerRow);
                setCsvData(rows.slice(1).filter(r => r.length === headerRow.length));
                
                // Auto-select if contains "url" or "link"
                const urlIdx = headerRow.findIndex(h => h.toLowerCase().includes('url') || h.toLowerCase().includes('link'));
                const nameIdx = headerRow.findIndex(h => h.toLowerCase().includes('nombre') || h.toLowerCase().includes('name'));
                
                if (urlIdx !== -1) setUrlCol(headerRow[urlIdx]);
                if (nameIdx !== -1) setNameCol(headerRow[nameIdx]);
            }
        };
        reader.readAsText(selectedFile);
    };

    // Process List
    const processList = async () => {
        if (!urlCol || !nameCol) return;
        
        setIsProcessing(true);
        setResults([]);
        setProgress(0);

        const urlIdx = headers.indexOf(urlCol);
        const nameIdx = headers.indexOf(nameCol);

        const newResults = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const url = row[urlIdx];
            const filename = row[nameIdx];

            if (!url) continue;

            const resEntry = { 
                id: i,
                filename: filename || `file_${i}`, 
                url, 
                status: 'pending' 
            };
            
            newResults.push(resEntry);
            setResults([...newResults]);

            try {
                // We don't download here, we just provide the links
                // But we can "validate" the URLs if needed
                resEntry.status = 'ready';
            } catch (err) {
                resEntry.status = 'error';
                resEntry.error = err.message;
            }

            setProgress(Math.round(((i + 1) / csvData.length) * 100));
            setResults([...newResults]);
        }

        setIsProcessing(false);
    };

    const downloadIndividual = (url, filename) => {
        const token = localStorage.getItem('token');
        // Ensure '+' are encoded but the rest of the proxy logic remains clean
        const cleanUrl = encodeURIComponent(url);
        const proxyUrl = `${API_URL}/downloader/proxy?url=${cleanUrl}&filename=${encodeURIComponent(filename)}&token=${token}`;
        
        console.log(`[PARKO] Initiating deep-proxy download for: ${url}`);
        window.open(proxyUrl, '_blank');
    };

    const downloadZip = async () => {
        if (results.length === 0) return;

        try {
            setIsProcessing(true);
            const token = localStorage.getItem('token');
            const filesToZip = results
                .filter(r => r.status === 'ready')
                .map(r => ({ url: r.url, filename: r.filename }));

            const response = await axios.post(`${API_URL}/downloader/zip`, 
                { files: filesToZip },
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob' 
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'descargas_masivas.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('ZIP Error:', err);
            alert('Error creating ZIP archive');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Download className="text-guardian-blue animate-pulse" />
                        Massive Downloader <span className="text-guardian-blue">X</span>
                    </h2>
                    <p className="text-[10px] text-guardian-muted font-bold tracking-[0.3em] uppercase italic">
                        Protocol: CSV Hyper-Extraction & Sequential Renaming
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="guardian-card p-6 border-l-4 border-l-guardian-blue bg-gradient-to-br from-white/5 to-transparent">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">1. Select CSV Source</label>
                        <div className="relative group">
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileChange}
                                className="hidden" 
                                id="csv-upload"
                            />
                            <label 
                                htmlFor="csv-upload"
                                className="flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-lg cursor-pointer hover:border-guardian-blue/50 hover:bg-guardian-blue/5 transition-all group"
                            >
                                <span className="text-xs font-bold text-white/70 truncate mr-2">
                                    {file ? file.name : 'Upload .csv list'}
                                </span>
                                <FileUp size={18} className="text-guardian-muted group-hover:text-guardian-blue transition-colors" />
                            </label>
                        </div>
                    </div>

                    {/* URL Column */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">2. Download Link Column</label>
                        <select 
                            value={urlCol}
                            onChange={(e) => setUrlCol(e.target.value)}
                            disabled={headers.length === 0}
                            className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-3 rounded-lg focus:outline-none focus:border-guardian-blue"
                        >
                            <option value="">-- Choose Column --</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    {/* Name Column */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">3. Output Name Column</label>
                        <select 
                            value={nameCol}
                            onChange={(e) => setNameCol(e.target.value)}
                            disabled={headers.length === 0}
                            className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-3 rounded-lg focus:outline-none focus:border-guardian-blue"
                        >
                            <option value="">-- Choose Column --</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={processList}
                        disabled={!file || !urlCol || !nameCol || isProcessing}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all ${
                            !file || !urlCol || !nameCol || isProcessing
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-guardian-blue text-white hover:bg-guardian-blue/80 hover:shadow-[0_0_15px_rgba(31,105,255,0.4)]'
                        }`}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                        Execute Sequence
                    </button>
                    
                    {results.length > 0 && !isProcessing && (
                         <button
                            onClick={downloadZip}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest italic hover:bg-purple-600/30 transition-all shadow-sm"
                        >
                            <Archive size={14} />
                            Package All (ZIP)
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-guardian-muted italic">
                        <span>Hydrating downloads...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-guardian-blue transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
                <div className="guardian-card overflow-hidden border-t border-white/5">
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 sticky top-0 z-10">
                                    <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic w-16">ID</th>
                                    <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic">Filename</th>
                                    <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic hiddem md:table-cell">Source URL</th>
                                    <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic text-center">Status</th>
                                    <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {results.map((res) => (
                                    <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-[10px] font-black text-white/30 italic">#{res.id + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-guardian-blue/50" />
                                                <span className="text-[11px] font-bold text-white truncate max-w-[200px]" title={res.filename}>
                                                    {res.filename}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex items-center gap-1 text-[9px] text-guardian-muted font-medium truncate max-w-[300px]">
                                                <ExternalLink size={10} />
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:text-guardian-blue transition-colors">
                                                    {res.url}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {res.status === 'ready' ? (
                                                <div className="flex items-center justify-center gap-1 text-green-500 text-[9px] font-black uppercase italic">
                                                    <CheckCircle2 size={12} />
                                                    Ready
                                                </div>
                                            ) : res.status === 'error' ? (
                                                <div className="flex items-center justify-center gap-1 text-red-500 text-[9px] font-black uppercase italic" title={res.error}>
                                                    <AlertCircle size={12} />
                                                    Error
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1 text-guardian-muted text-[9px] font-black uppercase italic animate-pulse">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Queued
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => downloadIndividual(res.url, res.filename)}
                                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-guardian-blue transition-all group-hover:scale-110"
                                                title="Download this file"
                                            >
                                                <Download size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {!file && results.length === 0 && (
                <div className="guardian-card border-dashed border-2 py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-guardian-muted backdrop-blur-sm">
                        <Download size={32} strokeWidth={1} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">No Queue Active</h3>
                        <p className="text-[10px] text-guardian-muted font-bold uppercase tracking-[0.2em]">Upload a payload to begin extraction</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Downloader;
