import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiShieldKeyholeLine, RiCloseLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import { usePermissionStore } from '../store/permissionStore';
import { useAuditStore } from '../store/auditStore';

export const PermissionManager: React.FC = () => {
  const { pendingRequest, resolvePendingRequest, isAutomationActive, setAutomationActive } = usePermissionStore();
  const logAction = useAuditStore(state => state.logAction);

  const handleGrant = () => {
    if (pendingRequest) {
      logAction(`Permission Granted: ${pendingRequest.name}`, 'User explicitly granted permission in runtime dialog', 'success');
      resolvePendingRequest(true);
    }
  };

  const handleDeny = () => {
    if (pendingRequest) {
      logAction(`Permission Denied: ${pendingRequest.name}`, 'User explicitly denied permission in runtime dialog', 'denied');
      resolvePendingRequest(false);
    }
  };

  return (
    <>
      {/* Pending Request Dialog */}
      <AnimatePresence>
        {pendingRequest && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-emerald-500/30 w-full max-w-sm p-6 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                  <RiShieldKeyholeLine size={24} />
                </div>
                <div>
                  <h3 className="text-zinc-100 font-bold text-lg leading-tight mb-1">
                    Permission Request
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    IRIS requires your authorization.
                  </p>
                </div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5">
                <div className="text-emerald-400 font-bold text-sm mb-1 uppercase tracking-wider">{pendingRequest.name}</div>
                <div className="text-zinc-300 text-sm">{pendingRequest.description}</div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeny}
                  className="flex-1 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2"
                >
                  <RiCloseLine /> Deny
                </button>
                <button
                  onClick={handleGrant}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2"
                >
                  <RiCheckLine /> Allow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Automation Indicator and Kill Switch */}
      <AnimatePresence>
        {isAutomationActive && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 w-full z-[9998] flex justify-center pointer-events-none"
          >
            <div className="bg-red-900 border-b border-x border-red-500 px-6 py-2 rounded-b-2xl shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center gap-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <RiErrorWarningLine className="text-red-400 animate-pulse" size={20} />
                <span className="text-red-100 font-bold tracking-widest text-xs uppercase animate-pulse">
                  IRIS OS Automation Active
                </span>
              </div>
              <button 
                onClick={() => {
                  setAutomationActive(false);
                  logAction('Kill Switch Activated', 'User forcibly stopped ongoing automation', 'failed');
                  window.dispatchEvent(new CustomEvent('iris-kill-switch'));
                }}
                className="bg-red-500 hover:bg-red-400 text-black px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Kill Switch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
