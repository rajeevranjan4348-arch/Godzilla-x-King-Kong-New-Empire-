import { useState } from 'react';
import { 
  RiStarLine,
  RiCodeBoxLine,
  RiFolderOpenLine,
  RiSave3Line,
  RiPlayFill,
  RiPlayCircleLine
} from 'react-icons/ri';
import { playClick, playAction } from '../utils/audio';

export default function CodingView() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center;
    align-items: center; height: 100vh; margin: 0; background-color: #111;
    color: #fff; }
    h1 { color: #10b981; }
  </style>
</head>
<body>
  <h1>Hello, IRIS!</h1>
</body>
</html>`);

  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    playAction();
    setIsLoading(true);
    
    try {
      const apiKey = localStorage.getItem('iris_custom_api_key') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'smmPrdCbtrh6hSdBujbXtWoVWEi463poRTD4eYBk9Ugj0LZXGgxmh3mybXgc';
      if (!apiKey) throw new Error("API key not found");
      
      // Dynamic import to avoid breaking if GoogleGenAI isn't imported at top level
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = 'You are an expert web developer. Write HTML/CSS/JS code based on the user prompt. ONLY output the raw code, no markdown formatting, no explanations.';

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });

      let finalCode = '';
      setCode('');

      for await (const chunk of responseStream) {
        const text = chunk.text;
        finalCode += text;
        setCode(finalCode);
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      alert('Failed to generate code. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-zinc-300 p-6 md:p-10 overflow-y-auto scrollbar-small">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-20">
        
        {/* AI Code Generator Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <RiStarLine size={20} />
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase">AI Code Generator</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build (e.g., 'A simple calculator with a dark t"
              className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors"
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest text-xs uppercase transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <RiStarLine size={16} />
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden mt-4">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-2 text-zinc-400">
              <RiCodeBoxLine size={18} />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Code Editor</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={playClick} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors">
                <RiFolderOpenLine size={14} /> Open
              </button>
              <button onClick={playClick} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors">
                <RiSave3Line size={14} /> Save
              </button>
              <button onClick={playAction} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors">
                <RiPlayFill size={14} /> Run
              </button>
            </div>
          </div>
          
          {/* Editor Area */}
          <div className="relative p-4 font-mono text-sm leading-relaxed overflow-x-auto">
            <div className="flex">
              {/* Line Numbers */}
              <div className="flex flex-col text-zinc-600 text-right pr-4 select-none border-r border-white/5 mr-4">
                {code.split('\\n').map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              {/* Code Content */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none text-zinc-300 resize-none min-h-[300px] whitespace-pre"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden mt-4">
          <div className="flex items-center p-4 bg-black/40">
            <div className="flex items-center gap-2 text-zinc-400">
              <RiPlayCircleLine size={18} />
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase">Live Preview</h3>
            </div>
          </div>
          {/* Preview Area (Empty for now to match screenshot) */}
          <div className="h-0"></div>
        </div>

      </div>
    </div>
  );
}
