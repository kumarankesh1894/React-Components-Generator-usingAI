"use client";
import { useState, useEffect } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { githubDark } from "@codesandbox/sandpack-themes";
import generateSandboxFiles from "../utils/generateSanboxFiles";

export default function LivePreview({ code, css }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // TypeScript detection
    const isTS = code.includes("interface") || code.includes(":") || code.includes("tsx");

    if (isTS) {
      setFiles(null);
      setError("TypeScript is not supported in the live preview. Please provide only JS/JSX code.");
      return;
    }

    try {
      const generated = generateSandboxFiles(code, css);
      setFiles(generated);
      setError("");
    } catch (err) {
      setFiles(null);
      setError("Something went wrong in live preview generation.");
    }
  }, [code, css]);

  return (
    <div className="border rounded bg-black mt-2 p-4 text-white">
      <h3 className="text-md font-semibold mb-2">Live Preview</h3>

      {error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md shadow text-sm">
          <strong>⚠️ Live Preview Error:</strong> <br />
          {error}
        </div>
      ) : files ? (
        <Sandpack
          template="react"
          files={files}
          theme={githubDark}
          options={{
            showConsole: false,
            showTabs: true,
            wrapContent: true,
            editorHeight: 300,
            previewHeight: 300,
          }}
        />
      ) : (
        <p className="text-gray-300">Preparing preview...</p>
      )}
    </div>
  );
}
