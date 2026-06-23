import React from 'react';
import { motion } from 'motion/react';
import { RiCpuLine, RiHardDriveLine, RiServerLine, RiListSettingsLine } from 'react-icons/ri';

const SystemView = () => {
  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-widest flex items-center gap-2">
                <RiCpuLine className="text-emerald-500" /> SYSTEM ACCESS
            </h2>
            <div className="flex gap-2">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg py-1 px-3 text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Host Secure Tunnel Status: ONLINE
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-6">
                <h3 className="text-xs font-bold tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                    <RiHardDriveLine /> FULL OS INTEGRATION
                </h3>
                <p className="text-sm text-zinc-400 mb-6 font-mono leading-relaxed">
                    Like OpenClaw's deep system integration, IRIS AI can execute local scripts, manage files, and interact natively with your environment.
                </p>

                <div className="space-y-4">
                    <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg flex items-start gap-4">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                            <RiServerLine size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-zinc-200">Local Processes Manager</h4>
                            <p className="text-xs text-zinc-500 mt-1">Spawn, track, and terminate daemonized background tasks autonomously.</p>
                        </div>
                    </div>

                    <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg flex items-start gap-4">
                        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                            <RiListSettingsLine size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-zinc-200">Config Mutator</h4>
                            <p className="text-xs text-zinc-500 mt-1">Direct read/write access to user environment paths and configuration layers.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-zinc-800 bg-black rounded-xl p-0 flex flex-col font-mono text-[10px] md:text-xs">
                <div className="bg-zinc-900 border-b border-zinc-800 p-2 text-zinc-500 flex justify-between items-center">
                    <span>system_daemon.log</span>
                    <span className="text-emerald-500">TAILING</span>
                </div>
                <div className="p-4 text-emerald-400/70 flex-1 overflow-auto opacity-75">
                    <p>[SYS] Initializing access protocols...</p>
                    <p className="text-zinc-500">[WARN] User permission block bypassed via interactive approval.</p>
                    <p>[SYS] Established kernel-level hooks (read-only mode active)</p>
                    <p>[SYS] Heartbeat signal sent to IRIS Core</p>
                    <p className="animate-pulse">_</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SystemView;
