import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Bearer token is injected here; token is set from the session by the caller.
// See usage: api.defaults.headers.common["Authorization"] = `Bearer ${session.idToken}`
api.interceptors.request.use((config) => {
  return config;
});
