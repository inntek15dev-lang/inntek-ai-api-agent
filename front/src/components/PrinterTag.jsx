import React, { useState } from 'react';
import { X, Plus, Minus, Power } from 'lucide-react';

const PrinterTag = ({ data, onClear }) => {
    const [isFolded, setIsFolded] = useState(true);
    const [visible, setVisible] = useState(true);

    if (!visible || !data) return null;

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const displayContent = isFolded ? content.split('\n')[0].substring(0, 50) + (content.length > 50 ? '...' : '') : content;

    const handleClear = (e) => {
        e.stopPropagation();
        setVisible(false);
        if (onClear) onClear();
    };

    return (
        <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 z-[60] min-w-[180px] max-w-[300px] nodrag">
            <div className={`relative rounded-lg border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 overflow-hidden`}>
                {/* Luminous Header */}
                <div className="flex items-center justify-between px-2 py-1 bg-emerald-500/20 border-b border-emerald-500/30">
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                        <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">Printer Output</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsFolded(!isFolded); }}
                            className="p-0.5 hover:bg-emerald-500/30 rounded text-emerald-300 transition-colors"
                        >
                            {isFolded ? <Plus size={10} /> : <Minus size={10} />}
                        </button>
                        <button
                            onClick={handleClear}
                            className="p-0.5 hover:bg-red-500/30 rounded text-emerald-300 hover:text-red-400 transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`p-2 text-[10px] font-mono leading-tight whitespace-pre-wrap break-words text-emerald-200/90 ${isFolded ? 'max-h-8 truncate' : 'max-h-48 overflow-y-auto custom-scrollbar'}`}>
                    {displayContent}
                </div>

                {/* Bottom Glow Line */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </div>
        </div>
    );
};

export default PrinterTag;
