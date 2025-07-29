// API Configuration
export const API_CONFIG = {
  // Get the API URL from environment variables
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",

  // API endpoints
  endpoints: {
    auth: {
      login: "/api/auth/login",
      signup: "/api/auth/signup",
      logout: "/api/logout",
    },
    ai: {
      generate: "/api/generate",
      edit: "/api/edit",
    },
    sessions: {
      list: "/api/sessions",
      create: "/api/sessions",
      delete: "/api/sessions",
    },
    history: "/api/history",
    autosave: "/api/autosave",
    health: "/api/health",
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Helper function for making API requests with proper headers
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = localStorage.getItem("token");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include", // Important for CORS
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export default API_CONFIG;
