import axios from 'axios';

export const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '/api';

const api = axios.create({
  baseURL: apiBaseUrl
});

export default api;
