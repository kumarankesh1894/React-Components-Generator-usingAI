"use client";
import { useState } from "react";

export default function GeneratedOutput({ output }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExport = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "component.jsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Generated Code",
          text: output,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  return (
    <div className="mt-6">
      <pre className="p-4 bg-gray-100 border rounded overflow-auto whitespace-pre-wrap text-sm">
        {output}
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

        <button
          onClick={handleShare}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
        >
          Share
        </button>
      </div>
    </div>
  );
}
