// components/CodeTabs.jsx
"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const CodeTabs = ({ jsxCode, cssCode }) => {
  const [activeTab, setActiveTab] = useState("jsx");
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

  return (
    <div className="bg-white rounded shadow mt-4">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("jsx")}
          className={`px-4 py-2 ${activeTab === "jsx" ? "bg-blue-100 font-semibold" : ""}`}
        >
          JSX / TSX
        </button>
        <button
          onClick={() => setActiveTab("css")}
          className={`px-4 py-2 ${activeTab === "css" ? "bg-blue-100 font-semibold" : ""}`}
        >
          CSS
        </button>
      </div>

      {/* Code Viewer */}
      <div className="p-4 overflow-auto max-h-[500px]">
        <SyntaxHighlighter language={activeTab === "css" ? "css" : "tsx"} style={materialDark}>
          {activeTab === "css" ? cssCode || "/* No CSS Code */" : jsxCode || "// No JSX Code"}
        </SyntaxHighlighter>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={handleCopy}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          onClick={handleDownloadZip}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Download .zip
        </button>
      </div>
    </div>
  );
};

export default CodeTabs;
