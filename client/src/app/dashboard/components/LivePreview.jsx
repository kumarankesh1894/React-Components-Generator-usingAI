"use client";
import { useState, useEffect } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import generateSandboxFiles from "../utils/generateSanboxFiles";

export default function LivePreview({ code, css }) {
  const [files, setFiles] = useState(null);
  const [isTSX, setIsTSX] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code?.trim()) return;

    try {
      const { files, isTSX } = generateSandboxFiles(code, css);
      setFiles(files);
      setIsTSX(isTSX);
      setError("");
    } catch (err) {
      console.error("Live Preview Error:", err);
      setFiles(null);
      setError("⚠️ Live Preview Error: Something went wrong rendering the component.");
    }
  }, [code, css]);

  return (
    <div className="h-full flex flex-col">
      {error ? (
        <div className="glass bg-red-500/10 border-red-500/20 p-4 rounded-lg text-red-400 text-sm">
          <strong>⚠️ Live Preview Error:</strong>
          <br />
          {error}
        </div>
      ) : files ? (
        <div className="flex-1 overflow-hidden rounded-lg">
          <Sandpack
            template={isTSX ? "react-ts" : "react"}
            files={files}
            theme={atomDark}
            options={{
              showConsole: false,
              showTabs: false,
              wrapContent: true,
              editorHeight: 0,
              previewHeight: "100%",
              autorun: true,
              recompileMode: "immediate",
              initMode: "user-visible",
              showNavigator: false,
              showLineNumbers: false,
              showInlineErrors: true,
              layout: "preview"
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Preparing preview...</p>
        </div>
      )}
    </div>
  );
}
