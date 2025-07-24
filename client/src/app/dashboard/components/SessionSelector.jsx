// src/app/dashboard/components/SessionSelector.jsx
"use client";

import { useState, useEffect } from "react";

export default function SessionSelector({ selectedSessionId, onSelectSession, onCreateSession }) {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/sessions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };

    fetchSessions();
  }, []);

  const handleCreate = async () => {
    if (!newSessionName.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newSessionName }),
      });

      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
        onSelectSession(data.session._id);
        setNewSessionName("");
      }
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-2">Select a Session:</label>
      <select
        value={selectedSessionId || ""}
        onChange={(e) => onSelectSession(e.target.value)}
        className="border px-3 py-2 w-full rounded"
      >
        <option value="">-- Select Session --</option>
        {sessions.map((session) => (
          <option key={session._id} value={session._id}>
            {session.name}
          </option>
        ))}
      </select>

      <div className="mt-3">
        <input
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="New session name"
          className="border px-3 py-2 rounded w-full mb-2"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Create New Session
        </button>
      </div>
    </div>
  );
}
