"use client";

import { useState } from "react";

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard');
  };

  const downloadCode = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

export default function GenerationHistory({ generations, onDelete, onEdit, onPreview }) {
  const [editingId, setEditingId] = useState(null);
  const [editPrompt, setEditPrompt] = useState("");

  const startEdit = (generation) => {
    setEditingId(generation._id);
    setEditPrompt(generation.prompt);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrompt("");
  };

  const saveEdit = async (id) => {
    await onEdit(id, editPrompt);
    cancelEdit();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {generations.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No generations yet. Create some components!
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {generations.map((g) => (
            <div key={g._id} className="glass bg-white/5 border-white/10 rounded-lg p-4 relative">
              <div className="flex justify-end gap-2 mb-2">
                <button
                  onClick={() => startEdit(g)}
                  className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(g._id)}
                  className="text-red-400 text-xs hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>

              {editingId === g._id ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-300 font-medium text-sm mb-1">Edit Prompt:</p>
                    <input
                      className="input-glass w-full text-sm"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(g._id)}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="btn-ghost text-xs px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-300 font-medium text-sm">Prompt:</p>
                  <p className="text-gray-200 text-sm">{g.prompt}</p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onPreview(g.code, g.css || '')}
                      className="text-green-400 text-xs hover:text-green-300 transition-colors"
                    >
                      Live Preview
                    </button>
                    <button
                      onClick={() => copyToClipboard(g.code)}
                      className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadCode(`component-${g._id}.js`, g.code)}
                      className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium text-sm mb-2">Code:</p>
                    <div className="bg-black/30 p-3 rounded border border-white/10 max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                        {g.code}
                      </pre>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">
                    {new Date(g.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
