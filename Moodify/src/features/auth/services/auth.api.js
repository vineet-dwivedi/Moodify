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

export async function register({email,password,username}){
    const response = await api.post('/auth/register',{email,password,username})

    return response.data;
}

export async function login({email,password,username}){
    const response = await api.post('/auth/login',{email,password,username})

    return response.data;
}

export async function getMe(){
    const response = await api.post('/auth/get-me');
    return response.data;
}

export async function logout(){
    const response = await api.get('/auth/logout');
    return response.data;
}
