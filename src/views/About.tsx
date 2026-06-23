import { motion } from 'framer-motion';
import { RiInformationLine, RiGithubFill, RiTwitterXLine, RiGlobalLine } from 'react-icons/ri';

export default function About() {
  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <RiInformationLine className="text-emerald-500" size={24} />
          <h2 className="text-xl font-bold tracking-widest text-white">ABOUT IRIS</h2>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <h1 className="text-4xl font-bold text-white tracking-widest mb-2">I.R.I.S.</h1>
          <p className="text-emerald-400 text-sm tracking-[0.2em] mb-6">INTELLIGENT RESPONSIVE INFORMATION SYSTEM</p>
          <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
            A next-generation personal AI assistant and operating environment designed for seamless integration of tasks, memory, and intelligent computation.
          </p>
          <div className="mt-8 inline-block px-4 py-1 bg-black rounded-full border border-white/10 text-xs text-zinc-500">
            VERSION 1.0.0-BETA
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white tracking-widest mb-4">CORE CAPABILITIES</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">▹</span>
                Advanced Natural Language Processing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">▹</span>
                Context-Aware Memory Management
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">▹</span>
                Integrated Task & Workflow Automation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">▹</span>
                Real-time Code Execution & Analysis
              </li>
            </ul>
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white tracking-widest mb-4">SYSTEM ARCHITECTURE</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">▹</span>
                Frontend: React 18 + Vite + Tailwind CSS
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">▹</span>
                State: Zustand + React Context
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">▹</span>
                Database: Firebase Firestore
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">▹</span>
                AI Engine: Google Gemini Pro
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center gap-6 pt-8 border-t border-white/5">
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">
            <RiGithubFill size={24} />
          </a>
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">
            <RiTwitterXLine size={24} />
          </a>
          <a href="#" className="text-zinc-500 hover:text-white transition-colors">
            <RiGlobalLine size={24} />
          </a>
        </div>
      </div>
    </div>
  );
}
