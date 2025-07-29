// src/app/dashboard/components/SessionSelector.jsx
"use client";

import { useState, useEffect } from "react";

export default function SessionSelector({
  selectedSessionId,
  onSelectSession,
  onCreateSession,
}) {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sessions`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ name: newSessionName }),
        }
      );

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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select a Session:
        </label>
        <select
          value={selectedSessionId || ""}
          onChange={(e) => onSelectSession(e.target.value)}
          className="input-glass w-full"
        >
          <option value="" className="bg-gray-800 text-white">
            -- Select Session --
          </option>
          {sessions.map((session) => (
            <option
              key={session._id}
              value={session._id}
              className="bg-gray-800 text-white"
            >
              {session.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <input
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="New session name"
          className="input-glass w-full"
          onKeyPress={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!newSessionName.trim()}
          className="btn-primary w-full"
        >
          Create New Session
        </button>
      </div>
    </div>
  );
}
