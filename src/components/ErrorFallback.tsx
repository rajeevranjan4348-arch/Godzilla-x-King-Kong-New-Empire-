import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <RiErrorWarningLine className="text-red-500" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 tracking-widest">SYSTEM ERROR</h2>
          <p className="text-sm text-zinc-400 mb-6">
            A critical error occurred in the application.
          </p>

          <div className="w-full bg-black/50 rounded-lg p-4 mb-8 text-left overflow-x-auto border border-white/5">
            <code className="text-xs text-red-400 whitespace-pre-wrap break-words">
              {error.message}
            </code>
          </div>

          <button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-bold tracking-widest hover:bg-zinc-200 transition-colors"
          >
            <RiRefreshLine size={18} />
            REBOOT SYSTEM
          </button>
        </div>
      </div>
    </div>
  );
}
