import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiCloseCircleLine, RiHistoryLine, RiDeleteBin7Line } from 'react-icons/ri';
import { usePermissionStore } from '../store/permissionStore';
import { useAuditStore } from '../store/auditStore';

export const PermissionsPanel: React.FC = () => {
  const { permissions, revokePermission } = usePermissionStore();
  const { logs, clearLogs } = useAuditStore();
  const [activeTab, setActiveTab] = useState<'permissions' | 'audit'>('permissions');

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200">
      <div className="flex items-center gap-4 border-b border-white/10 p-4 shrink-0">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors ${
            activeTab === 'permissions' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <RiShieldCheckLine size={16} /> Permissions
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors ${
            activeTab === 'audit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <RiHistoryLine size={16} /> Audit Trail
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {activeTab === 'permissions' && (
          <div className="flex flex-col gap-3">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Active Authorizations</h3>
            {permissions.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-zinc-100">{p.name}</span>
                    {p.granted ? (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Granted</span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Revoked</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{p.description}</p>
                </div>
                {p.granted && (
                  <button
                    onClick={() => revokePermission(p.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RiCloseCircleLine size={16} /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">High-Risk Actions Log</h3>
              <button
                onClick={clearLogs}
                className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 hover:text-red-400 transition-colors"
              >
                <RiDeleteBin7Line /> Clear Logs
              </button>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">No actions recorded.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-zinc-900 border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-emerald-500' :
                      log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-bold text-xs text-zinc-200">{log.action}</span>
                    <span className="text-[10px] text-zinc-600 ml-auto font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono bg-black/50 p-2 rounded border border-white/5 whitespace-pre-wrap">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
