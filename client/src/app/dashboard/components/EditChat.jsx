export default function EditChat({
  chatMessages,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  loading,
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 lg:h-0">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
            No conversation yet. Start editing your code!
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm break-words ${
                    msg.sender === "user" 
                      ? "bg-purple-600 text-white" 
                      : "bg-white/10 text-gray-200 border border-white/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 p-3 flex-shrink-0">
        <div className="flex flex-col gap-3">
          <input
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            placeholder="E.g., make the button red"
            className="input-glass w-full text-sm"
            style={{ height: '40px' }}
            onKeyPress={(e) => e.key === 'Enter' && !loading && editMessage.trim() && handleEditSubmit()}
          />
          <button
            onClick={handleEditSubmit}
            disabled={loading || !editMessage.trim()}
            className="btn-primary px-4 py-2 flex items-center justify-center gap-2 text-sm whitespace-nowrap w-full"
          >
            {loading && <div className="spinner w-4 h-4"></div>}
            {loading ? "Editing..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
