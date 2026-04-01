import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
    AlertCircle,
    Terminal as TerminalIcon,
    RotateCcw
} from 'lucide-react';

const MIME_EXTENSIONS = {
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'text/csv': '.csv',
    'text/plain': '.txt',
    'application/json': '.json'
};

const Downloader = () => {
    // Form States
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [urlCol, setUrlCol] = useState('');
    const [nameCol, setNameCol] = useState('');
    const [renderKey, setRenderKey] = useState(0);

    // Execution States
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]); // [{ id, status, filename, url, error, blob }]
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    
    const logsEndRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, message, type }]);
    };

    // Handle File Upload & CSV Parsing
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // --- Deep Flush (Purge previous states) ---
        setHeaders([]);
        setCsvData([]);
        setUrlCol('');
        setNameCol('');
        setProgress(0);
        setResults([]);
        setLogs([]);

        setFile(selectedFile);
        addLog(`Deep Flush performed. New Payload: ${selectedFile.name}`, 'info');
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rawRows = text.split(/\r?\n/).filter(row => row.trim() !== '');
            
            if (rawRows.length > 0) {
                // --- Auto-Sense Delimiter ---
                const firstLine = rawRows[0];
                const commaCount = (firstLine.match(/,/g) || []).length;
                const semiCount = (firstLine.match(/;/g) || []).length;
                const delimiter = commaCount >= semiCount ? ',' : ';';
                
                addLog(`Auto-Sense Delimiter detected: ${delimiter === ',' ? 'Comma' : 'Semicolon'}`, 'info');
                addLog(`Diagnostic: Raw Header Row Detected: ${firstLine.substring(0, 80)}...`, 'info');

                // Split cells and clean padding
                const rows = rawRows.map(row => row.split(delimiter).map(cell => cell.trim()));
                const headerRow = rows[0].map((h, i) => h || `Column ${i + 1}`);
                
                setHeaders([...headerRow]);
                
                const dataRows = rows.slice(1);
                setCsvData([...dataRows]);
                
                addLog(`Parsed ${dataRows.length} potential rows from ${selectedFile.name}`, 'success');

                // Auto-select if contains "url" or "link"
                const urlIdx = headerRow.findIndex(h => h.toLowerCase().includes('url') || h.toLowerCase().includes('link'));
                const nameIdx = headerRow.findIndex(h => h.toLowerCase().includes('nombre') || h.toLowerCase().includes('name'));
                
                if (urlIdx !== -1) setUrlCol(headerRow[urlIdx]);
                if (nameIdx !== -1) setNameCol(headerRow[nameIdx]);

                setRenderKey(prev => prev + 1);
            }
        };
        reader.readAsText(selectedFile);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Reactive Process List (Sequential Downloads)
    const processList = async () => {
        if (!urlCol || !nameCol) return;
        
        setIsProcessing(true);
        setResults([]);
        setProgress(0);
        setLogs([]);
        addLog('Initiating Deep-Proxy Extraction Sequence...', 'info');

        const urlIdx = headers.indexOf(urlCol);
        const nameIdx = headers.indexOf(nameCol);
        const token = localStorage.getItem('token');

        const currentResults = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const url = row[urlIdx];
            const filename = row[nameIdx] || `file_${i + 1}`;

            if (!url) {
                addLog(`Row ${i + 1}: Empty URL skipped.`, 'warning');
                continue;
            }

            const resEntry = { 
                id: i,
                filename, 
                url, 
                status: 'processing',
                blob: null
            };
            
            currentResults.push(resEntry);
            setResults([...currentResults]);
            addLog(`Fetching (${i + 1}/${csvData.length}): ${filename}...`, 'info');

            try {
                // Sequential Fetch through Proxy
                const cleanUrl = encodeURIComponent(url);
                const response = await axios.get(`${API_URL}/downloader/proxy`, {
                    params: { url: cleanUrl, filename },
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                    timeout: 45000 // 45s for institutional slow links
                });

                resEntry.status = 'ready';
                resEntry.blob = response.data;
                
                // Refine filename with extension if missing
                const contentTypeHeader = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase();
                const expectedExt = MIME_EXTENSIONS[contentTypeHeader];
                
                if (expectedExt && !resEntry.filename.toLowerCase().endsWith(expectedExt)) {
                    resEntry.filename = `${resEntry.filename}${expectedExt}`;
                }

                addLog(`Success: ${resEntry.filename} fully hydrated.`, 'success');
            } catch (err) {
                resEntry.status = 'error';
                resEntry.error = err.message;
                addLog(`Failed: ${filename} extraction blocked. Error: ${err.message}`, 'error');
            }

            const currentProgress = Math.round(((i + 1) / csvData.length) * 100);
            setProgress(currentProgress);
            setResults([...currentResults]);

            // Human-like delay to ensure clean closing of sockets
            if (i < csvData.length - 1) await sleep(500);
        }

        addLog(`Sequence Alpha-One verified. ZIP container is now ARMED.`, 'success');
        setIsProcessing(false);
    };

    const downloadZip = async () => {
        if (progress < 100) return;

        addLog('Constructing Archive Package...', 'info');
        const zip = new JSZip();
        
        results.forEach(res => {
            if (res.status === 'ready' && res.blob) {
                zip.file(res.filename, res.blob);
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `payload_${Date.now()}.zip`);
        addLog('Archive transmitted successfully.', 'success');
    };

    const reset = () => {
        setFile(null);
        setCsvData([]);
        setHeaders([]);
        setUrlCol('');
        setNameCol('');
        setResults([]);
        setProgress(0);
        setLogs([]);
    };

    const allLoaded = results.length > 0 && 
                      !isProcessing && 
                      results.every(res => res.status === 'ready' || res.status === 'error');

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Download className="text-guardian-blue animate-pulse" />
                        Reactive Downloader <span className="text-guardian-blue">X-1.5</span>
                    </h2>
                    <p className="text-[10px] text-guardian-muted font-bold tracking-[0.3em] uppercase italic">
                        Protocol: Sequential Hyper-Extraction • Version: Deep-Flush-1.5
                    </p>
                </div>
                {csvData.length > 0 && (
                    <button onClick={reset} className="text-guardian-muted hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic mb-1">
                        <RotateCcw size={12} />
                        Abort Session
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Controls & Logs */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Form Card */}
                    <div className="guardian-card p-6 border-l-4 border-l-guardian-blue bg-gradient-to-br from-white/5 to-transparent space-y-6">
                        {/* File Upload */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">1. Source payload</label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    id="csv-upload"
                                    disabled={isProcessing}
                                />
                                <label 
                                    htmlFor="csv-upload"
                                    className={`flex items-center justify-between px-4 py-3 bg-black/40 border border-white/10 rounded-lg cursor-pointer transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-guardian-blue/50 hover:bg-guardian-blue/5'}`}
                                >
                                    <span className="text-xs font-bold text-white/70 truncate mr-2">
                                        {file ? file.name : 'Upload .csv list'}
                                    </span>
                                    <FileUp size={18} className="text-guardian-muted" />
                                </label>
                            </div>
                        </div>

                        {/* Configs */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">2. Mapping link</label>
                                    <select 
                                        key={`link-select-${renderKey}`}
                                        value={urlCol}
                                        onChange={(e) => setUrlCol(e.target.value)}
                                        disabled={headers.length === 0 || isProcessing}
                                        className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-3 rounded-lg focus:outline-none focus:border-guardian-blue disabled:opacity-50"
                                    >
                                    <option value="">-- Choose Column --</option>
                                    {headers.map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-guardian-muted uppercase tracking-widest italic">3. Mapping name</label>
                                    <select 
                                        key={`name-select-${renderKey}`}
                                        value={nameCol}
                                        onChange={(e) => setNameCol(e.target.value)}
                                        disabled={headers.length === 0 || isProcessing}
                                        className="w-full bg-black/40 border border-white/10 text-white text-xs font-bold p-3 rounded-lg focus:outline-none focus:border-guardian-blue disabled:opacity-50"
                                    >
                                    <option value="">-- Choose Column --</option>
                                    {headers.map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3 bg-white/[0.02] p-4 rounded-lg border border-white/5">
                            <button
                                onClick={processList}
                                disabled={!file || !urlCol || !nameCol || isProcessing}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all ${
                                    !file || !urlCol || !nameCol || isProcessing
                                    ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                                    : 'bg-guardian-blue text-white hover:bg-guardian-blue/80 hover:shadow-[0_0_15px_rgba(31,105,255,0.4)]'
                                }`}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                                {isProcessing ? 'Hydrating Cluster...' : 'Execute Extraction'}
                            </button>
                            
                            <button
                                onClick={downloadZip}
                                disabled={!allLoaded}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest italic transition-all shadow-sm ${
                                    allLoaded
                                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                                }`}
                            >
                                <Archive size={14} />
                                Download Bundle (.ZIP)
                            </button>
                        </div>
                    </div>

                    {/* Progress Monitor */}
                    {(isProcessing || progress > 0) && (
                        <div className="guardian-card p-6 bg-black/60 border border-white/10 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-white italic uppercase tracking-widest">Global Progress</span>
                                <span className={`text-xl font-black italic tracking-tighter ${progress === 100 ? 'text-green-500' : 'text-guardian-blue'}`}>
                                    {progress}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(31,105,255,0.4)] ${progress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-guardian-blue'}`} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Task Logs */}
                    <div className="guardian-card p-4 bg-black/80 border border-white/10 rounded-lg space-y-2 h-[250px] flex flex-col">
                        <div className="flex items-center gap-2 text-guardian-muted border-b border-white/5 pb-2 mb-2">
                            <TerminalIcon size={12} />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Extraction Log Feed</span>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2 custom-scrollbar">
                            {logs.length === 0 && <span className="text-white/20 italic">Waiting for instruction input...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 leading-relaxed">
                                    <span className="text-white/30 shrink-0">[{log.time}]</span>
                                    <span className={
                                        log.type === 'success' ? 'text-green-500' : 
                                        log.type === 'error' ? 'text-red-500' : 
                                        log.type === 'warning' ? 'text-yellow-500' : 'text-white/70'
                                    }>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                {/* Right Side: Results Viewer */}
                <div className="lg:col-span-8">
                    {csvData.length > 0 ? (
                        <div className="guardian-card overflow-hidden border border-white/10 flex flex-col h-[calc(100vh-280px)]">
                            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                                <span className="text-[10px] font-black text-guardian-muted uppercase tracking-[0.3em] italic">Payload Results Table</span>
                                <div className="flex gap-4 text-[9px] font-bold uppercase italic">
                                    <span className="text-green-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> {results.filter(r => r.status === 'ready').length} Loaded
                                    </span>
                                    <span className="text-red-500 flex items-center gap-1">
                                        <XCircle size={12} /> {results.filter(r => r.status === 'error').length} Fails
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/30 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                                            <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic w-16">Node</th>
                                            <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic">Filename Identification</th>
                                            <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic text-center w-32">Status</th>
                                            <th className="p-4 text-[9px] font-black text-guardian-muted uppercase tracking-widest italic text-right w-20">Link</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {results.map((res) => (
                                            <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 text-[10px] font-black text-white/30 italic">P-IDX {String(res.id + 1).padStart(3, '0')}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded bg-white/5 group-hover:scale-110 transition-transform ${res.status === 'ready' ? 'text-green-500' : res.status === 'error' ? 'text-red-500' : 'text-guardian-blue animate-pulse'}`}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-white truncate max-w-[300px]">
                                                                {res.filename}
                                                            </span>
                                                            <span className="text-[8px] text-guardian-muted font-black uppercase tracking-tighter truncate max-w-[200px]">
                                                                {res.url}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {res.status === 'ready' ? (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] font-black uppercase italic rounded-full">
                                                            <CheckCircle2 size={10} />
                                                            Ready
                                                        </div>
                                                    ) : res.status === 'error' ? (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase italic rounded-full" title={res.error}>
                                                            <XCircle size={10} />
                                                            Failed
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-guardian-blue/10 border border-guardian-blue/20 text-guardian-blue text-[8px] font-black uppercase italic rounded-full animate-pulse">
                                                            <Loader2 size={10} className="animate-spin" />
                                                            Hydrating
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <a 
                                                        href={res.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="p-2 inline-flex bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-guardian-blue transition-all"
                                                        title="Launch Source Link"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Placeholders for visual consistency */}
                                        {results.length < csvData.length && csvData.slice(results.length).map((_, i) => (
                                            <tr key={`ph-${i}`} className="opacity-20 grayscale cursor-not-allowed">
                                                <td className="p-4 text-[10px] font-black text-white/30 italic">P-IDX {String(results.length + i + 1).padStart(3, '0')}</td>
                                                <td className="p-4 space-y-1">
                                                    <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
                                                    <div className="h-2 w-20 bg-white/5 rounded" />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-[10px] font-black uppercase text-white/20 italic">Queued</span>
                                                </td>
                                                <td className="p-4"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="guardian-card border-dashed border-2 py-40 flex flex-col items-center justify-center text-center space-y-6 h-[calc(100vh-280px)]">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-guardian-muted backdrop-blur-sm border border-white/5 animate-pulse">
                                <Download size={48} strokeWidth={1} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Extraction Hub Offline</h3>
                                <p className="text-[10px] text-guardian-muted font-bold uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
                                    Upload a structured CSV to initialize the hydration node.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Downloader;
