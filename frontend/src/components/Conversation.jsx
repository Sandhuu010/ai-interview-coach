import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import EvaluationCard from './EvaluationCard';

export default function Conversation({ messages }) {
  const bottomRef = useRef(null);

  // Smooth scroll to latest bubble on update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950/20 rounded-xl border border-slate-800/40 divide-y divide-slate-900/40">
      {messages.map((msg) => {
        switch (msg.type) {
          case 'chat':
            return (
              <ChatBubble
                key={msg.id}
                sender={msg.sender}
                text={msg.text}
                timestamp={msg.timestamp}
              />
            );
          case 'typing':
            return (
              <TypingIndicator
                key={msg.id}
                text={msg.text}
              />
            );
          case 'evaluation':
            return (
              <EvaluationCard
                key={msg.id}
                score={msg.score}
                feedback={msg.feedback}
                improvementSuggestions={msg.improvementSuggestions}
                timestamp={msg.timestamp}
              />
            );
          default:
            return null;
        }
      })}
      <div ref={bottomRef} />
    </div>
  );
}
