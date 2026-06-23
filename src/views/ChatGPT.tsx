import React from 'react';

export default function ChatGPTView() {
  return (
    <div className="bg-background text-on-background font-body-md text-body-md h-full flex flex-col overflow-hidden relative theme-chatgpt">
      {/* TopAppBar */}
      <header className="absolute top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center h-16 px-md max-w-container-max mx-auto left-0 right-0">
        <button className="p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors text-on-surface-variant flex items-center justify-center">
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 24 }}>menu</span>
        </button>
        <div className="font-headline-md text-headline-md font-semibold text-on-surface">
          ChatGPT
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors text-on-surface-variant flex items-center justify-center">
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 24 }}>edit_square</span>
        </button>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto pt-20 pb-32 px-md md:px-lg flex flex-col items-center w-full">
        <div className="w-full max-w-container-max flex flex-col gap-md">
          {/* Assistant Message */}
          <div className="flex flex-col gap-sm self-start max-w-[85%] md:max-w-[75%]">
            <div className="flex items-start gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mt-1">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 text-on-surface">
                <p className="font-body-md text-body-md mb-2">Hello! How can I help you today? I'm ready to assist with any questions or tasks you might have.</p>
                <p className="font-body-md text-body-md text-on-surface-variant">Here are a few things you could ask:</p>
                <ul className="list-disc list-inside mt-2 font-body-md text-body-md text-on-surface-variant ml-sm space-y-1">
                  <li>Explain quantum computing in simple terms</li>
                  <li>Help me write a professional email</li>
                  <li>Brainstorm ideas for a marketing campaign</li>
                </ul>
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-xs ml-10">
              <button className="p-1.5 rounded-md hover:bg-surface-container-low transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
              <button className="p-1.5 rounded-md hover:bg-surface-container-low transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              </button>
              <button className="p-1.5 rounded-md hover:bg-surface-container-low transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">thumb_down</span>
              </button>
            </div>
          </div>

          {/* User Message */}
          <div className="flex flex-col gap-sm self-end max-w-[85%] md:max-w-[75%] mt-lg">
            <div className="bg-surface-container-low rounded-xl p-md text-on-surface">
              <p className="font-body-md text-body-md">Can you help me outline a presentation on sustainable architecture? I need about 5 main points.</p>
            </div>
            {/* Edit Action */}
            <div className="flex justify-end gap-xs mr-2">
              <button className="p-1.5 rounded-md hover:bg-surface-container-highest transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex flex-col gap-sm self-start max-w-[85%] md:max-w-[75%] mt-md">
            <div className="flex items-start gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mt-1">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 text-on-surface">
                <p className="font-body-md text-body-md mb-4">Certainly! Here is an outline for a presentation on sustainable architecture, broken down into five main points:</p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold mb-1">1. Introduction to Sustainable Architecture</h3>
                    <ul className="list-disc list-inside font-body-md text-body-md text-on-surface-variant ml-sm space-y-1">
                      <li>Definition and core principles (minimizing environmental impact, energy efficiency).</li>
                      <li>The urgent need: Addressing climate change and resource depletion in the construction industry.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold mb-1">2. Passive Design Strategies</h3>
                    <ul className="list-disc list-inside font-body-md text-body-md text-on-surface-variant ml-sm space-y-1">
                      <li>Optimizing building orientation for natural light and solar gain.</li>
                      <li>Utilizing natural ventilation and thermal mass to regulate temperature without mechanical systems.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-semibold mb-1">3. Sustainable Materials and Construction</h3>
                    <ul className="list-disc list-inside font-body-md text-body-md text-on-surface-variant ml-sm space-y-1">
                      <li>Sourcing local, recycled, and rapidly renewable materials (e.g., bamboo, reclaimed wood).</li>
                      <li>Embodied energy: understanding the life-cycle impact of building materials.</li>
                    </ul>
                  </div>
                </div>
                <p className="font-body-md text-body-md mt-4">Would you like me to expand on any of these specific points?</p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-xs ml-10">
              <button className="p-1.5 rounded-md hover:bg-surface-container-low transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
              <button className="p-1.5 rounded-md hover:bg-surface-container-low transition-colors text-secondary">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Pinned Input Area */}
      <footer className="absolute bottom-0 w-full bg-background border-t border-outline-variant/20 pt-sm pb-lg px-md md:px-lg z-40" style={{ boxShadow: '0px -4px 20px rgba(0,0,0,0.02)' }}>
        <div className="max-w-container-max mx-auto flex flex-col gap-sm">
          {/* Suggestions Chips */}
          <div className="flex gap-sm overflow-x-auto pb-2 scrollbar-hide">
            <button className="whitespace-nowrap px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors">
              Expand on point 2
            </button>
            <button className="whitespace-nowrap px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors">
              Add a conclusion
            </button>
            <button className="whitespace-nowrap px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors">
              Make it more formal
            </button>
          </div>
          {/* Input Box */}
          <div className="relative flex items-end bg-surface-container-low rounded-xl border border-outline-variant/50 focus-within:border-primary/50 focus-within:bg-surface-container-lowest transition-all">
            <button className="p-3 text-secondary hover:text-on-surface transition-colors flex items-center justify-center shrink-0 mb-1">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-2 font-body-md text-body-md text-on-surface placeholder-on-surface-variant/70 max-h-[150px] overflow-y-auto outline-none" placeholder="Message ChatGPT..." rows={1}></textarea>
            <button className="p-3 text-primary hover:text-primary-fixed-dim transition-colors flex items-center justify-center shrink-0 mb-1">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <div className="text-center">
            <span className="font-label-md text-label-md text-on-surface-variant/70">ChatGPT can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
