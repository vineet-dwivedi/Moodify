import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true
})

export async function getSong({mood}){
    const response = await api.get(`/songs?mood=${encodeURIComponent(mood)}`)
    return response.data
}
