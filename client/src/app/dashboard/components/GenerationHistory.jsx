"use client";

import { useState } from "react";

export default function GenerationHistory({ generations, onDelete, onEdit }) {
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
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Generation History</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto text-sm">
        {generations.map((g) => (
          <div key={g._id} className="border rounded p-3 bg-gray-50 relative">
            <button
              onClick={() => onDelete(g._id)}
              className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
            >
              Delete
            </button>

            {editingId === g._id ? (
              <>
                <p className="text-gray-700 font-medium">Edit Prompt:</p>
                <input
                  className="w-full border rounded p-2 mb-2 text-sm"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                />
                <div className="flex gap-2 text-xs mt-1">
                  <button
                    onClick={() => saveEdit(g._id)}
                    className="text-green-600 hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => startEdit(g)}
                  className="absolute top-2 right-14 text-blue-500 text-xs hover:underline"
                >
                  Edit
                </button>
                <p className="text-gray-700 font-medium">Prompt:</p>
                <p className="mb-2">{g.prompt}</p>
              </>
            )}

            <p className="text-gray-700 font-medium">Code:</p>
            <pre className="whitespace-pre-wrap text-xs bg-white p-2 border rounded overflow-x-auto">
              {g.code}
            </pre>
            <p className="text-gray-500 text-xs mt-2">
              {new Date(g.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
