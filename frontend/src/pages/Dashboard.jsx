import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Conversation from '../components/Conversation';

export default function Dashboard({ onBackToHome }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listSessions();
        setSessions(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load interview history. Please check that the server is active.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSelectSession = async (sessionId) => {
    setLoadingDetail(true);
    setMobileView('chat');
    setError(null);
    try {
      const data = await api.getSessionDetails(sessionId);
      setSelectedSession(data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve session details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Derive conversation message logs for history reviews
  const deriveSessionMessages = (session) => {
    if (!session) return [];

    const list = [
      {
        id: `welcome-${session.id}`,
        type: 'chat',
        sender: 'ai',
        text: `Welcome to your **${session.topic} Interview**.\n\nThe AI interviewer will ask exactly one technical question. Type your answer in the box below and submit for scoring.`,
        timestamp: session.created_at
      }
    ];

    if (session.questions && session.questions.length > 0) {
      const q = session.questions[0];
      list.push({
        id: `question-${q.id}`,
        type: 'chat',
        sender: 'ai',
        text: q.question_text,
        timestamp: q.timestamp || session.created_at
      });

      if (q.user_answer) {
        list.push({
          id: `answer-${q.id}`,
          type: 'chat',
          sender: 'user',
          text: q.user_answer,
          timestamp: q.timestamp || session.created_at
        });

        if (q.score !== null) {
          list.push({
            id: `evaluation-${q.id}`,
            type: 'evaluation',
            score: q.score,
            feedback: q.feedback,
            improvementSuggestions: q.improvement_suggestions,
            timestamp: q.timestamp || session.created_at
          });
        }
      }
    }

    if (session.is_completed) {
      list.push({
        id: `summary-${session.id}`,
        type: 'chat',
        sender: 'ai',
        text: `Great job! Your interview has been completed.\n\n**Overall Score**: ${Math.round(session.overall_score)}/100\n\n**Summary**:\n${session.summary}`,
        timestamp: session.created_at
      });
    }

    return list;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-indigo-400 font-bold text-lg animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[82vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Layout Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Sidebar Pane */}
        <div className={`${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-80 border-r border-slate-850 bg-slate-950/20 flex-col p-4 shrink-0 min-h-0 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Previous Interviews</h3>
            <button
              onClick={onBackToHome}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Exit History
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-4 text-xs font-semibold text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No previous interviews found. Complete a track to log history.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
              {sessions.map((session) => {
                const isActive = selectedSession?.id === session.id;
                const isPython = session.topic === 'Python';
                const isDSA = session.topic === 'DSA';
                const topicEmoji = isPython ? '🐍' : isDSA ? '💻' : '🤝';

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-98 flex flex-col gap-2 ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-650/5' 
                        : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{topicEmoji}</span>
                        <span>{session.topic} Interview</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {session.is_completed ? 'Completed' : 'In Progress'}
                      </span>
                      <span className={`text-xs font-black ${
                        isActive ? 'text-indigo-400' : 'text-slate-300'
                      }`}>
                        {session.is_completed ? `${Math.round(session.overall_score)}/100` : '—'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Conversation Pane */}
        <div className={`${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        } flex-1 flex-col p-4 sm:p-6 min-h-0 bg-slate-950/5`}>
          
          {selectedSession ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              
              {/* Session Context Header */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg mr-1 active:scale-95 transition-all"
                    title="Back to history"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div>
                    <h4 className="text-sm font-black text-slate-200">
                      Transcript: {selectedSession.topic} Track
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      Session ID: #{selectedSession.id}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Close Transcript
                </button>
              </div>

              {/* Chat View */}
              <Conversation messages={deriveSessionMessages(selectedSession)} />

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-slate-650 text-5xl mb-4">💬</div>
              <h3 className="text-slate-300 font-bold text-lg">Conversation History</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1">
                Select a previous interview to view the conversation.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Loading detail indicator overlay */}
      {loadingDetail && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="text-indigo-400 font-bold text-sm animate-pulse">
            Retrieving details...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border-t border-rose-500/25 p-4 text-center text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

    </div>
  );
}
