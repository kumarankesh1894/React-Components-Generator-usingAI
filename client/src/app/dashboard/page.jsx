"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PromptInput from "./components/PromptInput";
import GeneratedOutput from "./components/GeneratedOutput";
import EditChat from "./components/EditChat";
import GenerationHistory from "./components/GenerationHistory";
import SessionSelector from "./components/SessionSelector";
import CodeTabs from "./components/CodeTabs";
import PreviewModal from "./components/PreviewModal";

const Sidebar = ({
  onSelectSession,
  selectedSessionId,
  onCreateSession,
  chatMessages,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  loading,
  isOpen,
  onClose,
}) => (
  <>
    {/* Mobile overlay */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
    )}

    <aside
      className={`
      fixed lg:relative top-0 left-0 h-screen lg:h-screen
      w-80 glass p-4 flex flex-col overflow-hidden
      transform transition-transform duration-300 ease-in-out z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
          <h1 className="text-xl font-bold">AI Components</h1>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Session Selector */}
      <div className="mb-6 flex-shrink-0">
        <SessionSelector
          selectedSessionId={selectedSessionId}
          onSelectSession={onSelectSession}
          onCreateSession={onCreateSession}
        />
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-3 flex-shrink-0">Chat</h2>
        <EditChat
          chatMessages={chatMessages}
          editMessage={editMessage}
          setEditMessage={setEditMessage}
          handleEditSubmit={handleEditSubmit}
          loading={loading}
        />
      </div>
    </aside>
  </>
);

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
  const [activeTab, setActiveTab] = useState("jsx"); // jsx, css
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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
      sessionId: selectedSessionId,
    };
  }, [prompt, output, cssCode, chatMessages, selectedSessionId]);

  // Helper function to check if state has changed
  const hasStateChanged = useCallback((currentState) => {
    const lastSaved = lastSavedStateRef.current;
    if (!lastSaved) return true;

    return (
      lastSaved.prompt !== currentState.prompt ||
      lastSaved.code !== currentState.code ||
      lastSaved.css !== currentState.css ||
      JSON.stringify(lastSaved.chatMessages) !==
        JSON.stringify(currentState.chatMessages)
    );
  }, []);

  // Debounced auto-save function
  const performAutoSave = useCallback(
    async (currentState) => {
      if (!selectedSessionId || !hasStateChanged(currentState)) {
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/autosave`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              sessionId: selectedSessionId,
              currentCode: currentState.code,
              currentCss: currentState.css,
              currentPrompt: currentState.prompt,
              chatMessages: currentState.chatMessages,
            }),
          }
        );

        if (response.ok) {
          lastSavedStateRef.current = { ...currentState };
          console.log("Auto-save successful");
        } else {
          console.warn("Auto-save failed:", response.status);
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    },
    [selectedSessionId, hasStateChanged]
  );

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

  // Auto-save effect - monitor changes in prompt, output, CSS, chat messages
  useEffect(() => {
    if (!selectedSessionId) return;
    if (loading) return;
    triggerAutoSave();
  }, [
    prompt,
    output,
    cssCode,
    chatMessages,
    selectedSessionId,
    loading,
    triggerAutoSave,
  ]);

  // Resume session effect - load saved state when session changes
  useEffect(() => {
    const resumeSession = async () => {
      if (!selectedSessionId) return;

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/autosave/${selectedSessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const savedState = await response.json();
          if (savedState.currentPrompt) setPrompt(savedState.currentPrompt);
          if (savedState.currentCode) setOutput(savedState.currentCode);
          if (savedState.currentCss) setCssCode(savedState.currentCss);
          if (savedState.chatMessages) setChatMessages(savedState.chatMessages);

          lastSavedStateRef.current = {
            prompt: savedState.currentPrompt || "",
            code: savedState.currentCode || "",
            css: savedState.currentCss || "",
            chatMessages: savedState.chatMessages || [],
            sessionId: selectedSessionId,
          };

          console.log("Session state resumed successfully");
        } else if (response.status === 404) {
          console.log("No saved state found for session - starting fresh");
        } else {
          console.warn("Failed to resume session state:", response.status);
        }
      } catch (error) {
        console.error("Error resuming session state:", error);
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
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/history?sessionId=${selectedSessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
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
      alert(
        "Please select or create a session and provide a prompt or images before generating code."
      );
      return;
    }

    setLoading(true);
    setOutput("");
    setChatMessages([]);

    try {
      let requestBody;
      let headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      if (images.length > 0) {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("sessionId", selectedSessionId);

        images.forEach((image, index) => {
          formData.append(`images`, image.file);
        });

        requestBody = formData;
      } else {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify({ prompt, sessionId: selectedSessionId });
      }

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/generate`,
        {
          method: "POST",
          headers,
          body: requestBody,
        }
      );

      const data = await res.json();
      setOutput(data.code || "// No code returned");
      setCssCode(data.css || "");
    } catch (err) {
      console.error("Generation error:", err);
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
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ prompt: editMessage, code: output }),
        }
      );

      const data = await res.json();
      const aiResponse = {
        sender: "ai",
        text: data.code || "// No edit returned",
      };
      setOutput(data.code || output);
      setCssCode(data.css || cssCode);

      setChatMessages((prev) => [...prev, aiResponse]);
      setEditMessage("");
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "// Error editing code" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeneration = async (id) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/history/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

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

      const aiRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ prompt: newPrompt, code: generation.code }),
        }
      );

      const aiData = await aiRes.json();
      const updatedCode = aiData.code || generation.code;

      const dbRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/history/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ prompt: newPrompt, code: updatedCode }),
        }
      );

      if (dbRes.ok) {
        setGenerations((prev) =>
          prev.map((g) =>
            g._id === id ? { ...g, prompt: newPrompt, code: updatedCode } : g
          )
        );
        setOutput(updatedCode);
      }
    } catch (err) {
      console.error("Error editing generation", err);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <div className="min-h-screen flex text-white relative">
      <Sidebar
        onSelectSession={setSelectedSessionId}
        selectedSessionId={selectedSessionId}
        onCreateSession={setSelectedSessionId}
        chatMessages={chatMessages}
        editMessage={editMessage}
        setEditMessage={setEditMessage}
        handleEditSubmit={handleEditSubmit}
        loading={loading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col p-2 sm:p-4 max-h-screen overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">AI Chat Helper</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile history toggle */}
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Mobile History Panel */}
        {historyOpen && (
          <div className="md:hidden mb-4">
            <div className="card max-h-64 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/20">
                <h2 className="text-lg font-semibold">Generation History</h2>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <GenerationHistory
                generations={generations}
                onDelete={handleDeleteGeneration}
                onEdit={handleEditGeneration}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
          {/* Main Panel: Code Editor and Prompt */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="card flex-1 flex flex-col overflow-hidden min-h-0">
              <CodeTabs
                jsxCode={output}
                cssCode={cssCode}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onShowPreview={() => setShowPreviewModal(true)}
              />
              <GeneratedOutput
                code={output}
                activeTab={activeTab}
                cssCode={cssCode}
              />
            </div>

            <div className="card flex-shrink-0">
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                handleGenerate={handleGenerate}
                loading={loading}
              />
            </div>
          </div>

          {/* Desktop History Panel */}
          <aside className="hidden md:flex w-80 lg:w-96 flex-col min-h-0">
            <div className="card flex-1 flex flex-col overflow-hidden min-h-0">
              <h2 className="text-lg font-semibold px-4 py-3 border-b border-white/20 flex-shrink-0">
                Generation History
              </h2>
              <GenerationHistory
                generations={generations}
                onDelete={handleDeleteGeneration}
                onEdit={handleEditGeneration}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        code={output}
        css={cssCode}
      />
    </div>
  );
}
