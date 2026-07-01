import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Dashboard({ onBackToHome }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleViewDetails = async (sessionId) => {
    setLoadingDetail(true);
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
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
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
    <div className="max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Performance Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Review your past practice sessions and feedback.</p>
        </div>
        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors active:scale-95"
        >
          Back to Home
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-medium text-center">
          {error}
        </div>
      )}

      {/* Main Grid: Session List & Inline Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Session List Table */}
        <div className={`space-y-4 ${selectedSession ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <h3 className="text-lg font-bold text-slate-200">Previous Interview Sessions</h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/20 border border-slate-700/50 rounded-2xl text-slate-500 font-medium">
              No sessions found. Start a practice interview to see your records!
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/75 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">Topic</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Score</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 text-slate-200 text-sm font-medium">
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          selectedSession?.id === session.id ? 'bg-indigo-500/5' : ''
                        }`}
                      >
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${
                            session.topic === 'Python'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : session.topic === 'DSA'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {session.topic}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{formatDate(session.created_at)}</td>
                        <td className="p-4 font-bold text-slate-100">
                          {session.is_completed ? `${Math.round(session.overall_score)}/100` : 'In Progress'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleViewDetails(session.id)}
                            className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white text-xs font-bold rounded transition-all active:scale-95"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Inline Detailed View */}
        {selectedSession && (
          <div className="lg:col-span-6 bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-lg space-y-6 h-fit">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Session Review</h3>
                <p className="text-slate-400 text-xs mt-0.5">{formatDate(selectedSession.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors font-medium text-sm"
              >
                Close details
              </button>
            </div>

            {/* Overall Score */}
            <div className="flex items-center gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-700/40">
              <span className="text-3xl font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-lg">
                {Math.round(selectedSession.overall_score)}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-300">Overall Score</h4>
                <p className="text-xs text-slate-500">Averaged from session evaluations</p>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Summary</h4>
              <p className="text-slate-200 text-sm leading-relaxed font-medium bg-slate-900/20 border border-slate-800 rounded-lg p-3">
                {selectedSession.summary}
              </p>
            </div>

            {/* Questions Detailed Logs */}
            {selectedSession.questions && selectedSession.questions.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Question Logs</h4>
                {selectedSession.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-3 border-t border-slate-700/40 pt-3">
                    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs font-bold text-indigo-400">Q: </span>
                      <span className="text-slate-200 text-sm font-semibold">{q.question_text}</span>
                    </div>

                    <div className="bg-slate-900/10 border border-slate-800 rounded-lg p-3">
                      <span className="text-xs font-bold text-slate-500">Your Answer: </span>
                      <p className="text-slate-300 text-sm leading-relaxed mt-1 whitespace-pre-wrap font-medium">{q.user_answer || '(No answer submitted)'}</p>
                    </div>

                    {q.score !== null && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3">
                          <span className="text-xs font-bold text-indigo-400 block mb-1">Feedback</span>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">{q.feedback}</p>
                        </div>
                        <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3">
                          <span className="text-xs font-bold text-indigo-400 block mb-1">Suggestions</span>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">{q.improvement_suggestions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No questions logged in database.</p>
            )}

          </div>
        )}

      </div>
      
      {/* Simple Processing message for details */}
      {loadingDetail && (
        <div className="text-center text-indigo-400 font-medium animate-pulse">
          Processing...
        </div>
      )}
    </div>
  );
}
