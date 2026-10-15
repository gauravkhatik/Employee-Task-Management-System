
import axios from 'axios';

// When deployed as a single project on Vercel, requests to /api are same-origin.
const configuredBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
export const apiBaseUrl = configuredBaseUrl || '/api';

const api = axios.create({
  baseURL: apiBaseUrl
});

export default api;
