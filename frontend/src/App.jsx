import React, { useState } from 'react';
import Home from './pages/Home';
import Interview from './pages/Interview';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' or 'interview'

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 flex flex-col text-slate-100 font-sans">
      {currentTab === 'home' ? (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Global header is only shown on Home page to maintain immersive chatbot UI during practice */}
          <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0">
            <div className="w-full px-6 h-16 flex items-center justify-between">
              <div 
                onClick={() => setCurrentTab('home')}
                className="flex items-center gap-2 font-black text-xl bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
              >
                🎙️ AI Interview Coach
              </div>
              
              <nav className="flex items-center gap-6 text-sm font-semibold text-slate-400">
                <button 
                  onClick={() => setCurrentTab('home')} 
                  className="transition-colors hover:text-white text-indigo-400"
                >
                  Home
                </button>
                <button 
                  onClick={() => setCurrentTab('interview')} 
                  className="transition-colors hover:text-white"
                >
                  Coach Workspace
                </button>
              </nav>
            </div>
          </header>

          {/* Main Content Area for Home */}
          <main className="flex-1 w-full px-6 py-8 flex flex-col justify-center shrink-0">
            <Home 
              onStart={() => setCurrentTab('interview')} 
              onViewDashboard={() => setCurrentTab('interview')} 
            />
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 py-6 text-center text-xs font-semibold text-slate-500 shrink-0">
            AI Interview Coach &copy; {new Date().getFullYear()} &middot; Built with FastAPI & React
          </footer>
        </div>
      ) : (
        <main className="flex-1 w-full flex flex-col overflow-hidden">
          <Interview onBackToHome={() => setCurrentTab('home')} />
        </main>
      )}
    </div>
  );
}
