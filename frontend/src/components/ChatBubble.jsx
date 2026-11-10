import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ sender, text, timestamp }) {
  const isAI = sender === 'ai';
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 w-full py-4 px-0 border-b border-slate-800/40 animate-fade-in ${
      isAI ? 'bg-slate-900/10 flex-row' : 'bg-indigo-950/5 flex-row-reverse'
    }`}>
      
      {/* Avatar column */}
      <div className="flex-shrink-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
          isAI 
            ? 'bg-slate-800 border-slate-700 text-indigo-400' 
            : 'bg-indigo-900 border-indigo-800 text-white'
        }`}>
          {isAI ? '🤖' : '🙂'}
        </div>
      </div>

      {/* Message content */}
      <div className={`flex-1 space-y-1.5 max-w-[85%] ${!isAI ? 'text-right' : 'text-left'}`}>
        
        {/* Sender Name & Time */}
        <div className={`flex items-baseline gap-2 ${!isAI ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          <span className="text-xs font-black text-slate-300 uppercase tracking-wide">
            {isAI ? 'AI Interviewer' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {formatDate(timestamp)}
          </span>
        </div>

        {/* Text bubble */}
        <div className={`text-slate-100 text-sm leading-relaxed whitespace-pre-wrap select-text`}>
          {isAI ? (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-2">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-slate-200" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-300" {...props} />,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className="bg-slate-800 border border-slate-700/50 rounded px-1.5 py-0.5 text-xs text-indigo-300 font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 overflow-x-auto text-xs text-slate-200 font-mono my-2 shadow-inner">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    );
                  }
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="inline-block bg-indigo-600/15 border border-indigo-500/25 rounded-2xl px-4 py-2 text-left text-slate-200 shadow-md">
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
