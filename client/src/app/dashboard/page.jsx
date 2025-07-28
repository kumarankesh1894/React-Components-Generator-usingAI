"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Auto-save related state and refs
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedStateRef = useRef(null);

  // Helper function to get current state for comparison and saving
  const getCurrentState = useCallback(() => {
    return {
      prompt,
      code: output,
      css: cssCode,
      chatMessages,
      expandedSection,
      sessionId: selectedSessionId,
    };
  }, [prompt, output, cssCode, chatMessages, expandedSection, selectedSessionId]);

  // Helper function to check if state has changed
  const hasStateChanged = useCallback((currentState) => {
    const lastSaved = lastSavedStateRef.current;
    if (!lastSaved) return true;
    
    return (
      lastSaved.prompt !== currentState.prompt ||
      lastSaved.code !== currentState.code ||
      lastSaved.css !== currentState.css ||
      lastSaved.expandedSection !== currentState.expandedSection ||
      JSON.stringify(lastSaved.chatMessages) !== JSON.stringify(currentState.chatMessages)
    );
  }, []);

  // Debounced auto-save function
  const performAutoSave = useCallback(async (currentState) => {
    if (!selectedSessionId || !hasStateChanged(currentState)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          currentCode: currentState.code,
          currentCss: currentState.css,
          currentPrompt: currentState.prompt,
          chatMessages: currentState.chatMessages,
          expandedSection: currentState.expandedSection,
        }),
      });

      if (response.ok) {
        lastSavedStateRef.current = { ...currentState };
        console.log('Auto-save successful');
      } else {
        console.warn('Auto-save failed:', response.status);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [selectedSessionId, hasStateChanged]);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentState = getCurrentState();
      performAutoSave(currentState);
    }, 2000); // 2 second debounce
  }, [getCurrentState, performAutoSave]);

  // Auto-save effect - monitor changes in prompt, output, CSS, chat messages, and expanded section
  useEffect(() => {
    if (!selectedSessionId) return;
    
    // Skip auto-save during loading to avoid saving intermediate states
    if (loading) return;
    
    triggerAutoSave();
  }, [prompt, output, cssCode, chatMessages, expandedSection, selectedSessionId, loading, triggerAutoSave]);

  // Resume session effect - load saved state when session changes
  useEffect(() => {
    const resumeSession = async () => {
      if (!selectedSessionId) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/autosave/${selectedSessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const savedState = await response.json();
          
          // Restore saved state
          if (savedState.currentPrompt) setPrompt(savedState.currentPrompt);
          if (savedState.currentCode) setOutput(savedState.currentCode);
          if (savedState.currentCss) setCssCode(savedState.currentCss);
          if (savedState.chatMessages) setChatMessages(savedState.chatMessages);
          if (savedState.expandedSection) setExpandedSection(savedState.expandedSection);
          
          // Update last saved state reference
          lastSavedStateRef.current = {
            prompt: savedState.currentPrompt || '',
            code: savedState.currentCode || '',
            css: savedState.currentCss || '',
            chatMessages: savedState.chatMessages || [],
            expandedSection: savedState.expandedSection || 'prompt',
            sessionId: selectedSessionId,
          };
          
          console.log('Session state resumed successfully');
        } else if (response.status === 404) {
          // No saved state exists for this session - this is normal for new sessions
          console.log('No saved state found for session - starting fresh');
        } else {
          console.warn('Failed to resume session state:', response.status);
        }
      } catch (error) {
        console.error('Error resuming session state:', error);
      }
    };
    
    resumeSession();
  }, [selectedSessionId]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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

  const handleGenerate = async (images = []) => {
    if ((!prompt.trim() && images.length === 0) || !selectedSessionId) {
      alert("Please select or create a session and provide a prompt or images before generating code.");
      return;
    }

    setLoading(true);
    setOutput("");
    setChatMessages([]);

    try {
      // Prepare form data for multipart upload if images are present
      let requestBody;
      let headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      if (images.length > 0) {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('sessionId', selectedSessionId);
        
        images.forEach((image, index) => {
          formData.append(`images`, image.file);
        });
        
        requestBody = formData;
        // Don't set Content-Type header - let browser set it with boundary for multipart
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({ prompt, sessionId: selectedSessionId });
      }

      const res = await fetch("http://localhost:5000/api/generate", {
        method: "POST",
        headers,
        body: requestBody,
      });

      const data = await res.json();
      setOutput(data.code || "// No code returned");
      setCssCode(data.css || "");
      setExpandedSection("output");
    } catch (err) {
      console.error('Generation error:', err);
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
