import React, { useRef, useEffect } from 'react';

export default function ChatInput({ value, onChange, onSend, disabled, placeholder }) {
  const textareaRef = useRef(null);

  // Auto-expand helper
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/60 p-4 sticky bottom-0 z-10 backdrop-blur-md">
      <div className="max-w-3xl mx-auto flex items-end gap-3 bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-xl px-4 py-2.5 shadow-lg transition-colors">
        
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Waiting for AI response...' : (placeholder || 'Type your message...')}
          className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none text-sm leading-relaxed resize-none max-h-[200px] overflow-y-auto font-medium py-1.5"
          style={{ height: 'auto' }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all active:scale-95 flex items-center justify-center shadow-md shrink-0"
          title="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>

      </div>
    </div>
  );
}
