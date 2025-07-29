"use client";
import { useState, useEffect } from "react";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import generateSandboxFiles from "../utils/generateSanboxFiles";

export default function LivePreview({ code, css }) {
  const [files, setFiles] = useState(null);
  const [isTSX, setIsTSX] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("🔍 LivePreview - Received code:", code?.substring(0, 200) + "...");
    console.log("🔍 LivePreview - Received CSS:", css?.substring(0, 100) + "...");
    
    if (!code?.trim()) {
      setError("No code provided for preview");
      return;
    }

    try {
      const { files, isTSX } = generateSandboxFiles(code, css);
      console.log("🔍 Generated files keys:", Object.keys(files));
      console.log("🔍 Generated files content:");
      console.log("📄 /App file:", files[Object.keys(files).find(key => key.includes('App'))]);
      console.log("📄 Component file:", files[Object.keys(files).find(key => !key.includes('App') && !key.includes('style'))]);
      console.log("🔍 All files:", files);
      
      if (!files || Object.keys(files).length === 0) {
        throw new Error("No files generated");
      }
      
      setFiles(files);
      setIsTSX(isTSX);
      setError("");
    } catch (err) {
      console.error("Live Preview Error:", err);
      setFiles(null);
      setError(`⚠️ Live Preview Error: ${err.message}`);
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
          <SandpackProvider
            template={isTSX ? "react-ts" : "react"}
            files={files}
            theme={atomDark}
            options={{
              autorun: true,
              recompileMode: "immediate",
              initMode: "user-visible"
            }}
          >
            <SandpackPreview
              style={{ height: "100%", width: "100%" }}
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
            />
          </SandpackProvider>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Preparing preview...</p>
        </div>
      )}
    </div>
  );
}
