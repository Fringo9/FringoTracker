import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-storage");
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      } else {
        console.warn("Token non trovato in auth-storage.state.token");
      }
    } catch (e) {
      console.error("Errore parsing auth token", e);
    }
  } else {
    console.warn("auth-storage non trovato nel localStorage");
  }
  return config;
});

// Add response error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Errore 401: Non autorizzato. Token invalido o scaduto.");
      // Don't redirect if we're already on an auth route
      const requestUrl = error.config?.url || "";
      const isAuthRoute =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/reset");
      if (!isAuthRoute) {
        // Clear auth state and redirect to login
        localStorage.removeItem("auth-storage");
        window.location.href = "/";
      }
    } else if (error.response) {
      console.error("Errore API:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Errore: Nessuna risposta dal server", error.request);
    } else {
      console.error("Errore:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
