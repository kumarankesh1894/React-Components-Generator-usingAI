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
    <div className="border rounded bg-black mt-2 p-4 text-white">
      <h3 className="text-md font-semibold mb-2">Live Preview</h3>

      {error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-md shadow text-sm">
          <strong>⚠️ Live Preview Error:</strong>
          <br />
          {error}
        </div>
      ) : files ? (
        <Sandpack
          template={isTSX ? "react-ts" : "react"}
          files={files}
          theme={atomDark}
          options={{
            showConsole: false,
            showTabs: true,
            wrapContent: true,
            editorHeight: 300,
            previewHeight: 300,
            autorun: true,
            recompileMode: "immediate",
            initMode: "user-visible"
          }}
        />
      ) : (
        <p className="text-gray-300">Preparing preview...</p>
      )}
    </div>
  );
}
