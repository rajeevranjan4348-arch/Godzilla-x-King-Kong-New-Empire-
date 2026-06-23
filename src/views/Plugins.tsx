import React from 'react';
import { motion } from 'motion/react';
import { RiPlugLine, RiPuzzle2Line, RiAddLine, RiCheckDoubleLine } from 'react-icons/ri';

const PluginsView = () => {
  const plugins = [
    { name: 'Discord Bot Connect', provider: 'Official', status: 'Installed', desc: 'Allows IRIS to moderate servers and send autonomous updates.' },
    { name: 'WhatsApp Bridge', provider: 'Community', status: 'Installed', desc: 'Connects voice interactions with WhatsApp.' },
    { name: 'Telegram Core', provider: 'Official', status: 'Available', desc: 'Full conversational capabilities within Telegram.' },
    { name: 'GitHub Manager', provider: 'Tools', status: 'Available', desc: 'Resolve PRs, review code, and manage issues.' }
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-widest flex items-center gap-2">
                <RiPlugLine className="text-emerald-500" /> SKILLS & PLUGINS
            </h2>
            <button className="bg-emerald-500 text-black rounded-lg py-1.5 px-3 text-xs font-bold tracking-widest flex items-center gap-1 hover:bg-emerald-400 transition-colors">
                <RiAddLine size={16} /> ADD SKILL
            </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plugins.map((plug, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg 
                                    ${plug.status === 'Installed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}
                                `}>
                                    <RiPuzzle2Line size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-zinc-200">{plug.name}</h3>
                                    <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">{plug.provider}</span>
                                </div>
                            </div>
                            {plug.status === 'Installed' && (
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <RiCheckDoubleLine /> ACTIVE
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-400 mb-4">{plug.desc}</p>
                        
                        {plug.status !== 'Installed' && (
                            <button className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold tracking-widest text-zinc-300 transition-colors">
                                INSTALL
                            </button>
                        )}
                        {plug.status === 'Installed' && (
                            <button className="w-full py-2 bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg text-xs font-bold tracking-widest text-zinc-500 transition-colors">
                                CONFIGURE
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default PluginsView;
