import React from 'react';

export default function Home({ onStart, onViewDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-2xl w-full text-center space-y-8 bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-8 sm:p-12 shadow-xl shadow-slate-950/50">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          AI-Powered Mock Practice
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            AI Interview Coach
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            Practice Python, Data Structures, and HR interviews. Receive realistic scores and actionable feedback to excel in your next role.
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 bg-indigo-500/40 mx-auto rounded-full"></div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-lg"
          >
            Start Practice
          </button>
          
          <button
            onClick={onViewDashboard}
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 border border-slate-700 text-slate-200 active:scale-95 transition-all font-bold rounded-xl text-lg"
          >
            View Dashboard
          </button>
        </div>

        {/* Footer info */}
        <p className="text-slate-500 text-xs sm:text-sm font-medium">
          No signups, no credentials. Fully local historical tracking.
        </p>

      </div>
    </div>
  );
}
