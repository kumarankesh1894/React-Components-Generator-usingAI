// components/CodeTabs.jsx
"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const CodeTabs = ({ jsxCode, cssCode, activeTab, onTabChange, onShowPreview }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const codeToCopy = activeTab === "css" ? cssCode : jsxCode;
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file("component.tsx", jsxCode || "// No JSX Code");
    zip.file("styles.css", cssCode || "/* No CSS Code */");

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "component-files.zip");
  };

  const tabs = [
    { id: "jsx", label: "JSX / TSX", language: "jsx" },
    { id: "css", label: "CSS", language: "css" }
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row border-b border-white/20 mb-4">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-auto overflow-x-auto">
          <button
            onClick={handleCopy}
            className="btn-ghost text-xs whitespace-nowrap px-2 sm:px-3"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onShowPreview}
            className="btn-ghost text-xs whitespace-nowrap px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Live Preview</span>
            <span className="sm:hidden">Preview</span>
          </button>
          <button
            onClick={handleDownloadZip}
            className="btn-ghost text-xs whitespace-nowrap px-2 sm:px-3"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeTabs;
