import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ChatHeader from '../components/ChatHeader';
import Conversation from '../components/Conversation';
import ChatInput from '../components/ChatInput';
import ConfirmModal from '../components/ConfirmModal';

export default function Interview({ onBackToHome }) {
  // --- Workspace Navigation & Sidebar States ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  
  // --- Custom Confirm Modal States ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // --- Active Practice Interview States ---
  const [topicSelected, setTopicSelected] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [started, setStarted] = useState(false);
  
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  
  const [question, setQuestion] = useState(null);
  const [tempAnswer, setTempAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(null);
  
  const [answerText, setAnswerText] = useState('');
  const [error, setError] = useState(null);

  // --- Load Session Logs on Mount ---
  const fetchSessionHistory = async () => {
    try {
      const historyList = await api.listSessions();
      setSessions(historyList);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const parseErrorMessage = (err, defaultMsg) => {
    const detail = err.response?.data?.detail;
    if (!detail) return defaultMsg;
    if (Array.isArray(detail)) {
      return detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
    }
    if (typeof detail === 'object') {
      return JSON.stringify(detail);
    }
    return detail;
  };

  // --- Check if there is an active running practice ---
  const hasActiveSession = () => {
    return started && !sessionCompleted;
  };

  // --- Exit Action Guard Coordinator ---
  const executeGuard = (action) => {
    if (hasActiveSession()) {
      setPendingAction(() => action);
      setConfirmOpen(true);
    } else {
      action();
    }
  };

  // --- Active Session Initiation ---
  const selectTopic = async (topic) => {
    setError(null);
    setTopicSelected(topic);
    setLoadingSession(true);
    try {
      // 1. Create session in backend
      const newSession = await api.createSession(topic);
      setSessionId(newSession.id);
      setStarted(true);

      // 2. Automatically generate the first question
      setLoadingSession(false);
      setLoadingQuestion(true);
      const questionData = await api.generateQuestion(newSession.id);
      setQuestion(questionData);
    } catch (err) {
      console.error(err);
      setError(parseErrorMessage(err, 'Failed to initiate mock practice.'));
      // Reset starting states
      setTopicSelected(null);
      setSessionId(null);
      setStarted(false);
    } finally {
      setLoadingSession(false);
      setLoadingQuestion(false);
    }
  };

  // --- Heuristic Intent Recognition for typed topics ---
  const handleTypedTopicIntent = (text) => {
    const cleaned = text.toLowerCase().trim();
    if (cleaned.includes('py') || cleaned.includes('python')) {
      selectTopic('Python');
    } else if (
      cleaned.includes('dsa') || 
      cleaned.includes('algo') || 
      cleaned.includes('struct') || 
      cleaned.includes('data structure') || 
      cleaned.includes('complexity')
    ) {
      selectTopic('DSA');
    } else if (
      cleaned.includes('hr') || 
      cleaned.includes('behavior') || 
      cleaned.includes('soft') || 
      cleaned.includes('star') || 
      cleaned.includes('people')
    ) {
      selectTopic('HR');
    } else {
      setError("I didn't quite catch that. Please click one of the suggestion chips or write 'Python', 'DSA', or 'HR'.");
    }
  };

  const handleInputSubmit = (text) => {
    if (!topicSelected) {
      // Conversational topic selection intent
      handleTypedTopicIntent(text);
      setAnswerText('');
    } else {
      // Candidate answer submission
      handleSubmitAnswer(text);
    }
  };

  const handleSubmitAnswer = async (text) => {
    if (!text.trim() || !question) return;

    setTempAnswer(text);
    setSubmittingAnswer(true);
    setAnswerText('');
    setError(null);
    try {
      const evalData = await api.submitAnswer(question.id, text);
      setEvaluation(evalData);
      // Update local question representation
      setQuestion(prev => ({
        ...prev,
        user_answer: text,
        score: evalData.score,
        feedback: evalData.feedback,
        improvement_suggestions: evalData.improvement_suggestions
      }));
    } catch (err) {
      console.error(err);
      setError(parseErrorMessage(err, 'Evaluation failed. Please try again.'));
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleCompleteSession = async () => {
    setCompletingSession(true);
    setError(null);
    try {
      const completed = await api.completeSession(sessionId);
      setSessionCompleted(completed);
      // Sync list sidebar history
      fetchSessionHistory();
    } catch (err) {
      console.error(err);
      setError(parseErrorMessage(err, 'Failed to complete session.'));
    } finally {
      setCompletingSession(false);
    }
  };

  // --- Reset view to clean starting state ---
  const handleResetPractice = () => {
    setTopicSelected(null);
    setSessionId(null);
    setStarted(false);
    setQuestion(null);
    setTempAnswer('');
    setEvaluation(null);
    setSessionCompleted(null);
    setAnswerText('');
    setError(null);
    setActiveHistoryId(null);
    setSelectedSessionDetail(null);
  };

  // --- Clicked History Session from Sidebar ---
  const handleSelectHistory = (historyId) => {
    executeGuard(async () => {
      setActiveHistoryId(historyId);
      setError(null);
      try {
        const detail = await api.getSessionDetails(historyId);
        setSelectedSessionDetail(detail);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve session transcript details.');
      }
    });
  };

  const handleHomeClick = () => {
    executeGuard(() => {
      onBackToHome();
    });
  };

  const handleConfirmModal = () => {
    setConfirmOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // --- Derive conversation messages based on current workspace view ---
  const deriveWorkspaceMessages = () => {
    // A. Historic Transcript View
    if (activeHistoryId && selectedSessionDetail) {
      const s = selectedSessionDetail;
      const list = [
        {
          id: `hist-greeting-${s.id}`,
          type: 'chat',
          sender: 'ai',
          text: `Welcome to your **${s.topic} Interview**.\n\nThe AI interviewer will ask exactly one technical question. Type your answer in the box below and submit for scoring.`,
          timestamp: s.created_at
        }
      ];

      if (s.questions && s.questions.length > 0) {
        const q = s.questions[0];
        list.push({
          id: `hist-q-${q.id}`,
          type: 'chat',
          sender: 'ai',
          text: q.question_text,
          timestamp: q.timestamp || s.created_at
        });

        if (q.user_answer) {
          list.push({
            id: `hist-ans-${q.id}`,
            type: 'chat',
            sender: 'user',
            text: q.user_answer,
            timestamp: q.timestamp || s.created_at
          });

          if (q.score !== null) {
            list.push({
              id: `hist-eval-${q.id}`,
              type: 'evaluation',
              score: q.score,
              feedback: q.feedback,
              improvementSuggestions: q.improvement_suggestions,
              timestamp: q.timestamp || s.created_at
            });
          }
        }
      }

      if (s.is_completed) {
        list.push({
          id: `hist-summary-${s.id}`,
          type: 'chat',
          sender: 'ai',
          text: `Great job! Your interview has been completed.\n\n**Overall Score**: ${Math.round(s.overall_score)}/100\n\n**Summary**:\n${s.summary}`,
          timestamp: s.created_at
        });
      }

      return list;
    }

    // B. Active Practice Interview Flow (Greeting -> Selection -> Answering -> Summary)
    const list = [
      {
        id: 'welcome-greeting',
        type: 'chat',
        sender: 'ai',
        text: "Hello! 👋\n\nWelcome to AI Interview Coach. I'm your AI interviewer today. Which domain would you like to practice?",
        timestamp: new Date()
      }
    ];

    if (topicSelected) {
      list.push({
        id: 'user-topic-msg',
        type: 'chat',
        sender: 'user',
        text: topicSelected,
        timestamp: new Date()
      });

      if (loadingSession) {
        list.push({
          id: 'creating-session-status',
          type: 'typing',
          text: 'Starting your interview session...',
          timestamp: new Date()
        });
      } else if (started) {
        list.push({
          id: 'ai-topic-confirm',
          type: 'chat',
          sender: 'ai',
          text: `Excellent choice! Let's start your **${topicSelected}** interview.`,
          timestamp: new Date()
        });

        if (loadingQuestion) {
          list.push({
            id: 'thinking-question',
            type: 'typing',
            text: 'AI Interviewer is thinking...',
            timestamp: new Date()
          });
        } else if (question) {
          list.push({
            id: 'question-msg',
            type: 'chat',
            sender: 'ai',
            text: question.question_text,
            timestamp: question.timestamp || new Date()
          });

          if (question.user_answer) {
            list.push({
              id: 'user-answer-msg',
              type: 'chat',
              sender: 'user',
              text: question.user_answer,
              timestamp: new Date()
            });

            if (question.score !== null) {
              list.push({
                id: 'evaluation-msg',
                type: 'evaluation',
                score: question.score,
                feedback: question.feedback,
                improvementSuggestions: question.improvement_suggestions,
                timestamp: new Date()
              });
            }
          } else if (submittingAnswer) {
            if (tempAnswer) {
              list.push({
                id: 'temp-user-answer',
                type: 'chat',
                sender: 'user',
                text: tempAnswer,
                timestamp: new Date()
              });
            }
            list.push({
              id: 'evaluating-indicator',
              type: 'typing',
              text: 'Evaluating your answer...',
              timestamp: new Date()
            });
          }
        }
      }
    }

    if (sessionCompleted) {
      list.push({
        id: 'completion-summary',
        type: 'chat',
        sender: 'ai',
        text: `Great job! Your interview has been completed.\n\n**Overall Score**: ${Math.round(sessionCompleted.overall_score)}/100\n\n**Summary**:\n${sessionCompleted.summary}`,
        timestamp: new Date()
      });
    } else if (completingSession) {
      list.push({
        id: 'completing-indicator',
        type: 'typing',
        text: 'Finishing interview...',
        timestamp: new Date()
      });
    }

    return list;
  };

  const statusTextText = activeHistoryId 
    ? 'Viewing Transcript Logs' 
    : sessionCompleted 
    ? 'Session Completed'
    : completingSession 
    ? 'Concluding session...'
    : evaluation 
    ? 'Feedback generated' 
    : submittingAnswer 
    ? 'Evaluating answer...' 
    : started 
    ? 'Interview in progress' 
    : 'Selecting Interview Domain';

  const isInputDisabled = 
    activeHistoryId !== null || 
    submittingAnswer || 
    loadingQuestion || 
    loadingSession || 
    completingSession || 
    (started && !question) || 
    !!evaluation || 
    !!sessionCompleted;

  return (
    <div className="flex flex-col lg:flex-row h-[82vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* 1. Left Collapsible Sidebar History Pane */}
      <div className={`
        ${sidebarOpen ? 'flex' : 'hidden'}
        absolute lg:relative z-20 inset-y-0 left-0 w-80 lg:w-72 border-r border-slate-850 bg-slate-955 bg-opacity-95 lg:bg-slate-950/20 backdrop-blur-md lg:backdrop-blur-none flex-col p-4 shrink-0 min-h-0 space-y-4 transition-all duration-300
      `}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Practice History</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-xs font-bold text-slate-500 hover:text-slate-300"
          >
            Close
          </button>
        </div>

        {/* Start New Practice Button */}
        <button
          onClick={() => executeGuard(handleResetPractice)}
          className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-sm font-bold transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>New Practice</span>
        </button>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center p-4 text-xs font-semibold text-slate-500 border border-dashed border-slate-850 rounded-xl">
            No previous sessions logged.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none text-slate-100">
            {sessions.map((session) => {
              const isActive = activeHistoryId === session.id;
              const isPython = session.topic === 'Python';
              const isDSA = session.topic === 'DSA';
              const topicEmoji = isPython ? '🐍' : isDSA ? '💻' : '🤝';

              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectHistory(session.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-98 flex flex-col gap-2 ${
                    isActive 
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-650/5' 
                      : 'bg-slate-800/20 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{topicEmoji}</span>
                      <span>{session.topic} Track</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {session.is_completed ? 'Completed' : 'Draft'}
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

      {/* 2. Right Main Chat Pane */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/5">
        
        {/* Header */}
        <ChatHeader 
          topicName={activeHistoryId ? selectedSessionDetail?.topic : topicSelected} 
          statusText={statusTextText} 
          onHistoryToggle={() => setSidebarOpen(prev => !prev)} 
          onHomeClick={handleHomeClick} 
        />

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-medium text-center text-sm">
            {error}
          </div>
        )}

        {/* Conversation Message List */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col min-h-0">
          <Conversation messages={deriveWorkspaceMessages()} />
        </div>

        {/* Suggestion Chips (when no topic is selected on New Practice) */}
        {!activeHistoryId && !topicSelected && (
          <div className="flex flex-col items-center gap-3 p-6 bg-slate-905 border-t border-slate-800/80 backdrop-blur-md">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Choose domain chip to launch interview:</p>
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
              <button
                onClick={() => selectTopic('Python')}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-indigo-650 border border-slate-700 hover:border-indigo-500 rounded-xl text-sm font-bold transition-all text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                🐍 Python
              </button>
              <button
                onClick={() => selectTopic('DSA')}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-indigo-650 border border-slate-700 hover:border-indigo-500 rounded-xl text-sm font-bold transition-all text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                💻 DSA
              </button>
              <button
                onClick={() => selectTopic('HR')}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-indigo-650 border border-slate-700 hover:border-indigo-500 rounded-xl text-sm font-bold transition-all text-slate-200 hover:text-white flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                🤝 HR
              </button>
            </div>
          </div>
        )}

        {/* Ending Action Footer (when evaluated, waiting to complete) */}
        {!activeHistoryId && evaluation && !sessionCompleted && (
          <div className="flex flex-col items-center gap-3 p-6 bg-slate-905 border-t border-slate-800/80 backdrop-blur-md">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Finish practice to log summary and score:</p>
            <button
              onClick={handleCompleteSession}
              disabled={completingSession}
              className="w-full max-w-sm py-4 bg-emerald-650 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-800 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
            >
              End Interview
            </button>
          </div>
        )}

        {/* Restart/View History inline footers (upon session completed) */}
        {!activeHistoryId && sessionCompleted && (
          <div className="flex flex-col sm:flex-row gap-3 p-6 bg-slate-905 border-t border-slate-800/80 backdrop-blur-md justify-center">
            <button
              onClick={handleResetPractice}
              className="w-full sm:w-auto sm:px-8 py-4 bg-indigo-650 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-md"
            >
              Start New Interview
            </button>
            <button
              onClick={() => {
                setSidebarOpen(true);
              }}
              className="w-full sm:w-auto sm:px-8 py-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold rounded-xl text-sm transition-all active:scale-95"
            >
              View Previous Logs
            </button>
          </div>
        )}

        {/* Sticky Chat Input (Default typing box during active conversation) */}
        {(!evaluation && !sessionCompleted && (!activeHistoryId || selectedSessionDetail)) && (
          <ChatInput 
            value={answerText} 
            onChange={setAnswerText} 
            onSend={handleInputSubmit} 
            disabled={isInputDisabled} 
            placeholder={!topicSelected ? "Choose topic above or type it here..." : "Answer this question..."}
          />
        )}

      </div>

      {/* 3. Custom Exit Confirmation Dialog */}
      <ConfirmModal 
        isOpen={confirmOpen} 
        title="Exit Active Practice?" 
        message="Your mock interview is currently running. Exiting this screen will discard the current progress. Are you sure you want to exit?" 
        onConfirm={handleConfirmModal} 
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }} 
      />

    </div>
  );
}
