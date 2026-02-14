import axios from 'axios';
import { storage } from '../utils/storage';

// Single API client keeps auth headers and base URL consistent across all queries.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
