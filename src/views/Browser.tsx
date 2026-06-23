import React from 'react';
import { motion } from 'motion/react';
import { RiGlobalLine, RiLinksLine, RiSearchLine, RiLockLine, RiTerminalBoxLine } from 'react-icons/ri';

const BrowserView = () => {
  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-widest flex items-center gap-2">
                <RiGlobalLine className="text-emerald-500" /> BROWSER CONTROL
            </h2>
            <div className="flex gap-2">
                <button className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs hover:bg-zinc-800 transition-colors flex items-center gap-1">
                    <RiTerminalBoxLine /> Remote Debug
                </button>
            </div>
        </div>

        <div className="flex-1 border border-zinc-800 bg-zinc-950 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <RiGlobalLine size={64} className="text-zinc-700 mb-6" />
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Automated Browser Instance</h3>
            <p className="text-sm text-zinc-500 max-w-md mb-8">
                IRIS AI can take control of a headless browser to navigate websites, click elements, fill forms, and extract information — similar to the advanced automation features found in OpenClaw.
            </p>
            
            <div className="flex w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors">
                <div className="bg-zinc-800/50 px-4 flex items-center justify-center border-r border-zinc-800">
                    <RiLockLine size={16} className="text-emerald-500" />
                </div>
                <input 
                    type="text" 
                    placeholder="Enter URL to navigate or analyze..." 
                    className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                    disabled
                />
                <button className="bg-emerald-500 text-black px-6 text-sm font-bold tracking-widest">
                    LAUNCH
                </button>
            </div>
            
            <div className="mt-8 flex gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full"><RiSearchLine /> Deep Search Active</span>
                <span className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-full"><RiLinksLine /> JS Execution Allowed</span>
            </div>
        </div>
    </div>
  );
};

export default BrowserView;
