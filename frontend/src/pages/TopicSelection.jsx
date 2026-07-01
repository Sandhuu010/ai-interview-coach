import React, { useState } from 'react';
import { api } from '../services/api';

export default function TopicSelection({ onSessionCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const topics = [
    {
      name: 'Python',
      title: 'Python Programming',
      description: 'Core concepts, OOP structure, memory managers, decorators, generators, and standard libraries.',
      icon: '🐍',
      borderColor: 'hover:border-yellow-500/50',
      badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    {
      name: 'DSA',
      title: 'Data Structures & Algorithms',
      description: 'Data structure logic, search/sort algorithms, dynamic complexity, recursion, and Big-O explanations.',
      icon: '💻',
      borderColor: 'hover:border-blue-500/50',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      name: 'HR',
      title: 'HR Interview',
      description: 'Behavioral inquiries, conflict resolution scenarios, professional experience framing, and soft-skill assessments.',
      icon: '🤝',
      borderColor: 'hover:border-emerald-500/50',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

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

  const handleSelectTopic = async (topicName) => {
    setLoading(true);
    setError(null);
    try {
      const session = await api.createSession(topicName);
      onSessionCreated(session.id, topicName);
    } catch (err) {
      console.error(err);
      setError(parseErrorMessage(err, 'Failed to initialize session. Please check that the server is active.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Select Interview Topic
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Choose a domain path to begin your simulated interview session.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-medium text-center">
          {error}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.name}
            onClick={() => !loading && handleSelectTopic(topic.name)}
            className={`flex flex-col justify-between bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
              loading ? 'opacity-50 cursor-not-allowed' : topic.borderColor
            }`}
          >
            <div className="space-y-4">
              {/* Icon & Badge */}
              <div className="flex items-center justify-between">
                <span className="text-4xl">{topic.icon}</span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${topic.badgeColor}`}>
                  {topic.name}
                </span>
              </div>

              {/* Card Title & Desc */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100">{topic.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{topic.description}</p>
              </div>
            </div>

            {/* Select Button */}
            <div className="mt-8">
              <button
                disabled={loading}
                className="w-full py-2.5 bg-slate-700 hover:bg-indigo-600 transition-colors text-slate-200 font-bold rounded-lg text-sm"
              >
                Select {topic.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="text-center mt-12">
        <button
          onClick={onCancel}
          disabled={loading}
          className="text-slate-500 hover:text-slate-300 font-medium text-sm transition-colors"
        >
          Cancel and go back
        </button>
      </div>

      {/* Simple Processing message */}
      {loading && (
        <div className="text-center mt-8 text-indigo-400 font-medium animate-pulse">
          Processing...
        </div>
      )}
    </div>
  );
}
