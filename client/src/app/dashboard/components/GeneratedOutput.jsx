// components/GeneratedOutput.jsx
"use client";
import { useState } from "react";

export default function GeneratedOutput({ output, css = "" }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("jsx");

  const handleCopy = async () => {
    try {
      const text = tab === "jsx" ? output : css;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExport = () => {
    const blob = new Blob([tab === "jsx" ? output : css], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab === "jsx" ? "component.jsx" : "styles.css";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setTab("jsx")}
          className={`px-3 py-1 rounded text-sm ${tab === "jsx" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          JSX
        </button>
        <button
          onClick={() => setTab("css")}
          className={`px-3 py-1 rounded text-sm ${tab === "css" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          CSS
        </button>
      </div>

      <pre className="p-4 bg-gray-100 border rounded overflow-auto whitespace-pre-wrap text-sm">
        {tab === "jsx" ? output : css || "// No CSS"}
      </pre>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleCopy}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Export
        </button>
      </div>
    </div>
  );
}
