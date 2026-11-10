import React from 'react';

export default function ChatHeader({ topicName, statusText, onHistoryToggle, onHomeClick }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-4 backdrop-blur-md sticky top-0 z-10">
      
      {/* Title / Avatar Info */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <span className="text-2xl">🤖</span>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-slate-900 rounded-full"></span>
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">AI Interview Coach</h3>
          <p className="text-xs text-slate-400 font-medium">
            {statusText || 'Conversational Session'}
          </p>
        </div>
      </div>
      
      {/* Navigation & Badge Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {topicName && (
          <span className="hidden sm:inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase">
            {topicName}
          </span>
        )}
        
        {/* History Toggle */}
        <button
          onClick={onHistoryToggle}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
          title="Toggle Previous Interviews History"
        >
          <span>📜</span>
          <span className="hidden md:inline">History</span>
        </button>

        {/* Exit Home Button */}
        <button
          onClick={onHomeClick}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 text-xs font-bold rounded-lg transition-all active:scale-95"
          title="Go back to Welcome Page"
        >
          Home
        </button>

      </div>
    </div>
  );
}
