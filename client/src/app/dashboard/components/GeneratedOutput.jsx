// components/GeneratedOutput.jsx
"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function GeneratedOutput({ code, activeTab, cssCode }) {
  const getLanguage = () => {
    switch (activeTab) {
      case 'css': return 'css';
      default: return 'jsx';
    }
  };

  const getCode = () => {
    if (activeTab === 'css') {
      return cssCode || '/* No CSS code generated yet... */';
    }
    return code || '// No JSX code generated yet...';
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-auto">
        <SyntaxHighlighter 
          language={getLanguage()} 
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.5rem',
          }}
        >
          {getCode()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
