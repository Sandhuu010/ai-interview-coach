import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-950/80 animate-fade-in text-center space-y-6">
        
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-2xl">
          ⚠️
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">{title || 'Confirm Action'}</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            {message || 'Are you sure you want to proceed? Any unsaved progress will be lost.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 hover:border-slate-600 text-slate-300 font-bold rounded-xl text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-rose-600/20"
          >
            Exit Session
          </button>
        </div>

      </div>
    </div>
  );
}
