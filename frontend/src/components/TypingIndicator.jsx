import React from 'react';

export default function TypingIndicator({ text }) {
  return (
    <div className="flex gap-3 w-full p-4 border-b border-slate-800/40 bg-slate-900/10 animate-fade-in">
      
      {/* Avatar column */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border bg-slate-800 border-slate-700 text-indigo-400">
          🤖
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-1.5 max-w-[85%]">
        
        {/* Name */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
            AI Interviewer
          </span>
        </div>

        {/* Typing Bubbles */}
        <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 w-fit shadow-md backdrop-blur-sm">
          <span className="text-sm font-semibold text-slate-400">
            {text || 'AI Interviewer is thinking...'}
          </span>
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>

      </div>
    </div>
  );
}
