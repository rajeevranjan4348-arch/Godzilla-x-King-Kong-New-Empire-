import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiTerminalBoxLine, RiPlayCircleLine, RiDeleteBinLine } from 'react-icons/ri';

interface Command {
  id: string;
  input: string;
  output: string;
  status: 'success' | 'error' | 'running';
  timestamp: Date;
}

export default function TerminalView() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commands]);

  const handleExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const newCommand: Command = {
      id: Math.random().toString(36).substring(7),
      input: input.trim(),
      output: '',
      status: 'running',
      timestamp: new Date()
    };

    setCommands(prev => [...prev, newCommand]);
    setInput('');
    setIsExecuting(true);

    try {
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 800));

      let output = '';
      let status: 'success' | 'error' = 'success';

      const cmd = newCommand.input.toLowerCase();
      if (cmd === 'help') {
        output = `Available commands:
  help    - Show this help message
  clear   - Clear terminal output
  date    - Show current date and time
  echo    - Print text to terminal
  sysinfo - Display system information`;
      } else if (cmd === 'clear') {
        setCommands([]);
        setIsExecuting(false);
        return;
      } else if (cmd === 'date') {
        output = new Date().toString();
      } else if (cmd.startsWith('echo ')) {
        output = newCommand.input.substring(5);
      } else if (cmd === 'sysinfo') {
        output = `IRIS Neural Interface v1.0.0
OS: Web Environment
Memory: ${Math.round(Math.random() * 16 + 8)}GB
CPU: Neural Processing Unit (Virtual)`;
      } else {
        output = `Command not found: ${newCommand.input}`;
        status = 'error';
      }

      setCommands(prev => prev.map(c => 
        c.id === newCommand.id 
          ? { ...c, output, status }
          : c
      ));
    } catch (error: any) {
      setCommands(prev => prev.map(c => 
        c.id === newCommand.id 
          ? { ...c, output: error.message, status: 'error' }
          : c
      ));
    } finally {
      setIsExecuting(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 font-mono p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <h2 className="text-lg font-bold tracking-widest text-emerald-500 flex items-center gap-3">
          <RiTerminalBoxLine />
          SYSTEM TERMINAL
        </h2>
        <button
          onClick={() => setCommands([])}
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
          title="Clear Terminal"
        >
          <RiDeleteBinLine size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4">
        {commands.length === 0 ? (
          <div className="text-zinc-600 text-sm">
            IRIS Terminal initialized. Type 'help' for available commands.
          </div>
        ) : (
          commands.map((cmd) => (
            <div key={cmd.id} className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-zinc-500">➜</span>
                <span className="text-blue-400">~</span>
                <span>{cmd.input}</span>
              </div>
              {cmd.status === 'running' ? (
                <div className="text-zinc-500 animate-pulse">Executing...</div>
              ) : (
                <pre className={`whitespace-pre-wrap text-sm ${cmd.status === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>
                  {cmd.output}
                </pre>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleExecute} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
          ➜
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isExecuting}
          placeholder="Enter command..."
          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || isExecuting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-emerald-400 disabled:opacity-50 transition-colors"
        >
          <RiPlayCircleLine size={20} />
        </button>
      </form>
    </div>
  );
}
