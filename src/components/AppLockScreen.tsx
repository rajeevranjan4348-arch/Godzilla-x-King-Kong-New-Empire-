import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RiLockPasswordLine, RiFingerprintLine, RiScan2Line, RiGridFill } from 'react-icons/ri';
import { playClick, playAction } from '../utils/audio';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export default function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const [lockType, setLockType] = useState(localStorage.getItem('iris_app_lock_type') || 'none');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [patternPhase, setPatternPhase] = useState(0);

  // Simple Pattern logic mock
  const handlePatternClick = (num: number) => {
    playClick();
    setPin(prev => prev + num);
  };

  useEffect(() => {
    if (lockType === 'pattern' && pin.length >= 4) {
      checkUnlock(pin);
    } else if (lockType === 'pin' && pin.length >= 4) {
      checkUnlock(pin);
    }
  }, [pin, lockType]);

  const hashPin = async (value: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(value)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const checkUnlock = async (value: string) => {
    const saved = localStorage.getItem('iris_app_lock_value');
    if (!saved) {
      // If it's somehow enabled but no value, just unlock
      onUnlock();
      return;
    }
    const hashed = await hashPin(value);
    if (hashed === saved) {
      playAction();
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
        setPatternPhase(0);
      }, 500);
    }
  };

  const simulateBiometric = () => {
    playClick();
    setTimeout(() => {
      playAction();
      onUnlock();
    }, 1500);
  };

  if (lockType === 'none') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 bg-zinc-950 border border-white/10 rounded-3xl"
      >
        <div className="bg-[#111] p-5 rounded-full mb-8 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          {lockType === 'pin' && <RiLockPasswordLine size={40} className="text-white" />}
          {lockType === 'pattern' && <RiGridFill size={40} className="text-white" />}
          {lockType === 'fingerprint' && <RiFingerprintLine size={40} className="text-white" />}
          {lockType === 'face' && <RiScan2Line size={40} className="text-white" />}
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">
          SYSTEM LOCKED
        </h2>
        <p className="text-sm text-zinc-400 mb-8 font-mono">
          Authentication required
        </p>

        {lockType === 'pin' && (
          <div className="flex flex-col items-center">
            <input
              type="password"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={(e) => {
                playClick();
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              className={`bg-[#050505] border w-40 rounded-lg text-center text-2xl tracking-[0.5em] py-3 text-white outline-none transition-colors ${
                error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-emerald-500'
              }`}
              placeholder="PIN"
            />
          </div>
        )}

        {lockType === 'pattern' && (
          <div className={`grid grid-cols-3 gap-4 p-4 ${error ? 'animate-shake' : ''}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handlePatternClick(num)}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                  pin.includes(num.toString()) 
                    ? error ? 'bg-red-500 border-red-500' : 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : 'border-white/20 bg-[#111] hover:bg-white/5'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${pin.includes(num.toString()) ? 'bg-black' : 'bg-white/20'}`} />
              </button>
            ))}
          </div>
        )}

        {(lockType === 'fingerprint' || lockType === 'face') && (
          <div className="flex flex-col items-center">
            <button 
              onClick={simulateBiometric}
              className={`group flex items-center justify-center w-24 h-24 rounded-full border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 transition-all shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_50px_rgba(16,185,129,0.3)]`}
            >
              {lockType === 'fingerprint' ? (
                <RiFingerprintLine size={48} className="text-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <RiScan2Line size={48} className="text-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            <p className="mt-6 text-xs text-emerald-500/70 uppercase tracking-widest font-bold">
              {lockType === 'fingerprint' ? 'Scan Fingerprint' : 'Scan Face'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
