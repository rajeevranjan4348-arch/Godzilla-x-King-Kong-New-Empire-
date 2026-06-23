import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const WaveformIndicator: React.FC<{ isActive: boolean; isListening: boolean }> = ({ isActive, isListening }) => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(10));

  useEffect(() => {
    if (!isActive || !isListening) {
      setBars(Array(12).fill(4)); // Minimum idle height
      return;
    }
    
    // Simulate audio reactivity (in a real app, this connects to AudioContext analyser)
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 10 + Math.random() * 40));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive, isListening]);

  if (!isActive) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-20">
      <div className="flex items-center gap-1.5 h-32">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            animate={{ height: `${height}px` }}
            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
            className={`w-3 rounded-full ${isListening ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}
          />
        ))}
      </div>
    </div>
  );
};
