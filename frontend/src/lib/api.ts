import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookies
  headers: { "Content-Type": "application/json" },
});

// No auto-redirect on 401 — components handle unauthenticated state gracefully
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export default api;
