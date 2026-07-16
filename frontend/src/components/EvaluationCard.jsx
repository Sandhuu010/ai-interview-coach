import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function EvaluationCard({ score, feedback, improvementSuggestions, timestamp }) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-3 w-full py-4 px-0 border-b border-slate-800/40 bg-slate-900/10 animate-fade-in">
      
      {/* Avatar column */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border bg-slate-800 border-slate-700 text-indigo-400">
          🤖
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-3 max-w-[85%]">
        
        {/* Name & Time */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
            AI Interviewer
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {formatDate(timestamp)}
          </span>
        </div>

        {/* Unified Card Container */}
        <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
          
          {/* Header Score Banner */}
          <div className="flex items-center gap-4 bg-indigo-500/10 border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-650/20 border border-indigo-500/35 text-indigo-400 font-black text-xl shadow-inner">
              {score}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Evaluation Result</h4>
              <p className="text-xs text-slate-400 font-medium">Gemini response assessment score</p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            
            {/* Feedback Section */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Qualitative Critique</h5>
              <div className="text-slate-200 text-sm leading-relaxed select-text">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-2">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-300" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return isInline ? (
                          <code className="bg-slate-800 border border-slate-750 rounded px-1.5 py-0.5 text-xs text-indigo-300 font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-x-auto text-xs text-slate-200 font-mono my-2">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        );
                      }
                    }}
                  >
                    {feedback}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Suggestions Section */}
            {improvementSuggestions && (
              <div className="space-y-1.5 border-t border-slate-700/40 pt-4">
                <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Improvement Suggestions</h5>
                <div className="text-slate-200 text-sm leading-relaxed select-text">
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-2">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-300" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match;
                          return isInline ? (
                            <code className="bg-slate-800 border border-slate-750 rounded px-1.5 py-0.5 text-xs text-indigo-300 font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-x-auto text-xs text-slate-200 font-mono my-2">
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          );
                        }
                      }}
                    >
                      {improvementSuggestions}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
