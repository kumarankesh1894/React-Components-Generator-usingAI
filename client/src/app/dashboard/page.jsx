"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PromptInput from "./components/PromptInput";
import GeneratedOutput from "./components/GeneratedOutput";
import EditChat from "./components/EditChat";
import GenerationHistory from "./components/GenerationHistory";
import SessionSelector from "./components/SessionSelector";
import LivePreview from "./components/Livepreview";
import CodeTabs from "./components/CodeTabs";

export default function DashboardPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [editMessage, setEditMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [generations, setGenerations] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [expandedSection, setExpandedSection] = useState("prompt");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/history?sessionId=${selectedSessionId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setGenerations(data.generations || []);
      } catch (err) {
        console.error("Failed to load generation history", err);
      }
    };

    if (!isCheckingAuth && selectedSessionId) {
      fetchHistory();
    }
  }, [isCheckingAuth, selectedSessionId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedSessionId) {
      alert("Please select or create a session before generating code.");
      return;
    }

    setLoading(true);
    setOutput("");
    setChatMessages([]);

    try {
      const res = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt, sessionId: selectedSessionId }),
      });

      const data = await res.json();
      setOutput(data.code || "// No code returned");
      setCssCode(data.css || "");
      setExpandedSection("output");
    } catch (err) {
      setOutput("// Error generating code");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editMessage.trim() || !output) return;
    setLoading(true);
    const userMessage = { sender: "user", text: editMessage };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:5000/api/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: editMessage, code: output }),
      });

      const data = await res.json();
      const aiResponse = { sender: "ai", text: data.code || "// No edit returned" };
      setOutput(data.code || output);
      setCssCode(data.css || cssCode);

      setChatMessages((prev) => [...prev, aiResponse]);
      setEditMessage("");
    } catch {
      setChatMessages((prev) => [...prev, { sender: "ai", text: "// Error editing code" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeneration = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        setGenerations((prev) => prev.filter((g) => g._id !== id));
      }
    } catch (err) {
      console.error("Error deleting generation", err);
    }
  };

  const handleEditGeneration = async (id, newPrompt) => {
    try {
      const generation = generations.find((g) => g._id === id);
      if (!generation) return;

      const aiRes = await fetch("http://localhost:5000/api/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: newPrompt, code: generation.code }),
      });

      const aiData = await aiRes.json();
      const updatedCode = aiData.code || generation.code;

      const dbRes = await fetch(`http://localhost:5000/api/history/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: newPrompt, code: updatedCode }),
      });

      if (dbRes.ok) {
        setGenerations((prev) =>
          prev.map((g) => (g._id === id ? { ...g, prompt: newPrompt, code: updatedCode } : g))
        );
        setOutput(updatedCode);
        setExpandedSection("output");
      }
    } catch (err) {
      console.error("Error editing generation", err);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">AI Component Generator</h1>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Section: Prompt Input */}
          <section className="bg-white shadow rounded p-4">
            <button
              className="w-full text-left font-semibold text-lg"
              onClick={() => setExpandedSection("prompt")}
            >
              ▶ Prompt Input
            </button>
            {expandedSection === "prompt" && (
              <div className="mt-4">
                <PromptInput
                  prompt={prompt}
                  setPrompt={setPrompt}
                  handleGenerate={handleGenerate}
                  loading={loading}
                />
              </div>
            )}
          </section>

          {/* Section: Output + Live Preview */}
          {output && (
            <section className="bg-white shadow rounded p-4">
              <button
                className="w-full text-left font-semibold text-lg"
                onClick={() => setExpandedSection("output")}
              >
                ▶ Generated Output + Preview
              </button>
              {expandedSection === "output" && (
                <div className="mt-4 space-y-4">
                  <GeneratedOutput/>
                  <CodeTabs jsxCode={output} cssCode={cssCode} />
                  <LivePreview code={output} css={cssCode} />

                </div>
              )}
              
            </section>
          )}

          {/* Section: Edit Chat */}
          {output && (
            <section className="bg-white shadow rounded p-4">
              <button
                className="w-full text-left font-semibold text-lg"
                onClick={() => setExpandedSection("edit")}
              >
                ▶ Chat-based Editing
              </button>
              {expandedSection === "edit" && (
                <div className="mt-4">
                  <EditChat
                    chatMessages={chatMessages}
                    editMessage={editMessage}
                    setEditMessage={setEditMessage}
                    handleEditSubmit={handleEditSubmit}
                    loading={loading}
                  />
                </div>
              )}
            </section>
          )}

          {/* Section: History + Sessions */}
          <section className="bg-white shadow rounded p-4">
            <button
              className="w-full text-left font-semibold text-lg"
              onClick={() => setExpandedSection("history")}
            >
              ▶ Generation History & Sessions
            </button>
            {expandedSection === "history" && (
              <div className="mt-4 space-y-4">
                <SessionSelector
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onCreateSession={setSelectedSessionId}
                />
                <GenerationHistory
                  generations={generations}
                  onDelete={handleDeleteGeneration}
                  onEdit={handleEditGeneration}
                />
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
