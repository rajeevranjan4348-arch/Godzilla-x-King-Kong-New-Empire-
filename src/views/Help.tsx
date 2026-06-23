import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiQuestionLine, RiSearchLine, RiArrowDownSLine, RiTerminalBoxLine, RiKeyboardLine, RiBugLine } from 'react-icons/ri';

const FAQS = [
  {
    question: "How do I use the Global Search?",
    answer: "Press Cmd+K (Mac) or Ctrl+K (Windows) to open the global search from anywhere. You can search across your apps, notes, and tasks."
  },
  {
    question: "What is Circle to Search?",
    answer: "Circle to Search allows you to draw a box around any part of the screen to instantly analyze it with AI. Click the target icon in the top right corner to activate it."
  },
  {
    question: "How does the AI Memory work?",
    answer: "IRIS automatically saves important context from your conversations into the Memory vault. You can also manually add notes. The AI will reference this memory in future conversations to provide personalized responses."
  },
  {
    question: "Can I execute code in the chat?",
    answer: "Yes! When the AI generates code, you can click the 'Run' button on the code block to execute it in the built-in terminal environment."
  }
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open Global Search' },
  { keys: ['Esc'], description: 'Close Modals/Overlays' },
  { keys: ['Enter'], description: 'Send Message' },
  { keys: ['⇧', 'Enter'], description: 'New Line in Chat' },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-3">
            <RiQuestionLine className="text-emerald-500" />
            HELP & SUPPORT
          </h2>
          
          <div className="relative w-full md:w-64">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-widest mb-4 flex items-center gap-2">
              <RiQuestionLine /> FREQUENTLY ASKED QUESTIONS
            </h3>
            
            {filteredFaqs.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-white/5">
                No results found for "{searchQuery}"
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div key={index} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-bold text-sm text-zinc-200">{faq.question}</span>
                    <RiArrowDownSLine 
                      className={`text-zinc-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-white/5">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white tracking-widest mb-4 flex items-center gap-2">
                <RiKeyboardLine /> SHORTCUTS
              </h3>
              <div className="space-y-3">
                {SHORTCUTS.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map(key => (
                        <kbd key={key} className="px-2 py-1 bg-black border border-white/10 rounded text-[10px] font-sans text-zinc-300">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
              <RiBugLine className="text-emerald-500 mx-auto mb-3" size={24} />
              <h3 className="text-sm font-bold text-emerald-400 tracking-widest mb-2">FOUND A BUG?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Help us improve IRIS by reporting any issues you encounter.
              </p>
              <button className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold tracking-widest transition-colors">
                REPORT ISSUE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
