import React, { useState } from 'react';
import Home from './pages/Home';
import TopicSelection from './pages/TopicSelection';
import Interview from './pages/Interview';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home'); // home, topics, interview, dashboard
  const [sessionId, setSessionId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleSessionCreated = (id, topic) => {
    setSessionId(id);
    setSelectedTopic(topic);
    setCurrentTab('interview');
  };

  const handleSessionCompleted = () => {
    setSessionId(null);
    setSelectedTopic(null);
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-slate-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => currentTab !== 'interview' && setCurrentTab('home')}
            className={`flex items-center gap-2 font-black text-xl bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent ${
              currentTab !== 'interview' ? 'cursor-pointer' : ''
            }`}
          >
            🎙️ AI Interview Coach
          </div>
          
          {currentTab !== 'interview' && (
            <nav className="flex items-center gap-6 text-sm font-semibold text-slate-400">
              <button 
                onClick={() => setCurrentTab('home')} 
                className={`transition-colors hover:text-white ${currentTab === 'home' ? 'text-indigo-400' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentTab('dashboard')} 
                className={`transition-colors hover:text-white ${currentTab === 'dashboard' ? 'text-indigo-400' : ''}`}
              >
                Dashboard
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {currentTab === 'home' && (
          <Home 
            onStart={() => setCurrentTab('topics')} 
            onViewDashboard={() => setCurrentTab('dashboard')} 
          />
        )}
        
        {currentTab === 'topics' && (
          <TopicSelection 
            onSessionCreated={handleSessionCreated} 
            onCancel={() => setCurrentTab('home')} 
          />
        )}
        
        {currentTab === 'interview' && (
          <Interview 
            sessionId={sessionId} 
            topicName={selectedTopic} 
            onSessionCompleted={handleSessionCompleted} 
          />
        )}
        
        {currentTab === 'dashboard' && (
          <Dashboard 
            onBackToHome={() => setCurrentTab('home')} 
          />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs font-semibold text-slate-500">
        AI Interview Coach MVP &copy; {new Date().getFullYear()} &middot; Built with FastAPI & React
      </footer>
    </div>
  );
}
