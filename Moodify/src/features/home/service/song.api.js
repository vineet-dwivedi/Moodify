import axios from "axios";

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://moodify-f2gk.onrender.com/api";
  }

  return "http://localhost:3000/api";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

export async function getSong({mood}){
    const response = await api.get(`/songs?mood=${encodeURIComponent(mood)}`)
    return response.data
}
