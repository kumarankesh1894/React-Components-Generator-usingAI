"use client";

import { useState, useEffect } from "react";
import { getApiUrl, apiRequest } from "../../config/api";

export default function TestCORS() {
  const [status, setStatus] = useState("Testing...");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const testCORS = async () => {
    try {
      setStatus("Testing CORS connection...");
      setError(null);

      const res = await apiRequest("/api/health", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setStatus("✅ CORS connection successful!");
    } catch (err) {
      setError(err.message);
      setStatus("❌ CORS connection failed");
      console.error("CORS test error:", err);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      setStatus("Testing auth endpoint...");
      setError(null);

      const res = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "testpassword123",
        }),
      });

      // Even if signup fails (user exists), we're testing CORS, not the actual signup
      const data = await res.json();
      setResponse(data);
      setStatus("✅ CORS with auth endpoint working!");
    } catch (err) {
      setError(err.message);
      setStatus("❌ Auth endpoint CORS failed");
      console.error("Auth CORS test error:", err);
    }
  };

  useEffect(() => {
    testCORS();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          CORS Connection Test
        </h1>

        <div className="glass p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Connection Status
          </h2>
          <p className="text-lg text-gray-200 mb-4">{status}</p>

          <div className="flex gap-4 mb-6">
            <button onClick={testCORS} className="btn-primary">
              Test Health Endpoint
            </button>
            <button onClick={testAuthEndpoint} className="btn-secondary">
              Test Auth Endpoint
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg mb-4">
              <h3 className="text-red-400 font-semibold mb-2">Error:</h3>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {response && (
            <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-lg">
              <h3 className="text-green-400 font-semibold mb-2">
                Server Response:
              </h3>
              <pre className="text-green-300 text-sm overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-white mb-4">
            CORS Configuration Info
          </h2>
          <div className="text-gray-300 space-y-2">
            <p>
              <strong>Client URL:</strong> http://localhost:3000
            </p>
            <p>
              <strong>Server URL:</strong> http://localhost:5000
            </p>
            <p>
              <strong>Credentials:</strong> Enabled
            </p>
            <p>
              <strong>Methods:</strong> GET, POST, PUT, DELETE, OPTIONS, PATCH
            </p>
            <p>
              <strong>Headers:</strong> Authorization, Content-Type, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
