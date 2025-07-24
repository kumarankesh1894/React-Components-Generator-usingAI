export default function EditChat({
  chatMessages,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  loading,
}) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Edit with Instructions</h3>

      <div className="bg-gray-50 border rounded p-4 max-h-60 overflow-y-auto text-sm mb-4">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3 py-1 rounded ${
                msg.sender === "user" ? "bg-blue-100" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          placeholder="E.g., make the button red"
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={handleEditSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Editing..." : "Send"}
        </button>
      </div>
    </div>
  );
}
