// components/PreviewModal.jsx
"use client";

import { useEffect } from "react";
import LivePreview from "./LivePreview";

export default function PreviewModal({ isOpen, onClose, code, css }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-4 h-5/6 glass-card animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
          <h2 className="text-xl font-semibold text-white">Live Preview</h2>
          <button
            onClick={onClose}
            className="btn-ghost p-2 hover:bg-white/10 rounded-lg"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 h-full">
          <LivePreview code={code} css={css} />
        </div>
      </div>
    </div>
  );
}
