import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Interview({ sessionId, topicName, onSessionCompleted }) {
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);

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

  // Load the single interview question on load
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoadingQuestion(true);
      setError(null);
      try {
        const questionData = await api.generateQuestion(sessionId);
        setQuestion(questionData);
      } catch (err) {
        console.error(err);
        setError(parseErrorMessage(err, 'Failed to generate question. Please try again.'));
      } finally {
        setLoadingQuestion(false);
      }
    };
    fetchQuestion();
  }, [sessionId]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !question) return;

    setSubmittingAnswer(true);
    setError(null);
    try {
      const evalData = await api.submitAnswer(question.id, answerText);
      setEvaluation(evalData);
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
      await api.completeSession(sessionId);
      onSessionCompleted();
    } catch (err) {
      console.error(err);
      setError(parseErrorMessage(err, 'Failed to complete session.'));
    } finally {
      setCompletingSession(false);
    }
  };

  if (loadingQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-indigo-400 font-bold text-lg animate-pulse">
          Generating Interview Question...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-8">
      {/* Session Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Mock Interview</h2>
        <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-semibold">
          Topic: {topicName}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-medium text-center">
          {error}
        </div>
      )}

      {question && (
        <div className="space-y-6">
          {/* Question Box */}
          <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-md">
            <h3 className="text-indigo-400 font-bold text-sm tracking-wide uppercase mb-2">
              Question
            </h3>
            <p className="text-slate-100 text-lg leading-relaxed font-semibold">
              {question.question_text}
            </p>
          </div>

          {/* Answer Form */}
          {!evaluation && (
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-slate-400 text-sm font-semibold mb-2">
                  Your Answer
                </label>
                <textarea
                  id="answer"
                  rows="8"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your explanation or response code here..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-medium leading-relaxed resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingAnswer || !answerText.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-lg shadow-lg active:scale-95 transition-all"
              >
                Submit Answer
              </button>
            </form>
          )}

          {/* Simple Processing message */}
          {submittingAnswer && (
            <div className="text-center text-indigo-400 font-medium animate-pulse py-4">
              Processing...
            </div>
          )}

          {/* Evaluation Results */}
          {evaluation && (
            <div className="space-y-6">
              {/* Score Badge Card */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-md">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 text-indigo-400 text-3xl font-extrabold shadow-inner">
                  {evaluation.score}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h4 className="text-xl font-bold text-slate-100">Evaluation Result</h4>
                  <p className="text-slate-400 text-sm font-medium">
                    Your answer was processed and evaluated by Gemini.
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-md">
                <h4 className="text-indigo-400 font-bold text-sm tracking-wide uppercase mb-2">
                  Feedback
                </h4>
                <p className="text-slate-200 text-base leading-relaxed font-medium">
                  {evaluation.feedback}
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 shadow-md">
                <h4 className="text-indigo-400 font-bold text-sm tracking-wide uppercase mb-2">
                  Improvement Suggestions
                </h4>
                <p className="text-slate-200 text-base leading-relaxed font-medium">
                  {evaluation.improvement_suggestions}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                <button
                  onClick={handleCompleteSession}
                  disabled={completingSession}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-lg shadow-lg active:scale-95 transition-all"
                >
                  Complete Session
                </button>
              </div>

              {completingSession && (
                <div className="text-center text-emerald-400 font-medium animate-pulse py-4">
                  Processing...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
