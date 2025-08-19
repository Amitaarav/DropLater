import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'your-secret-admin-token-here';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    throw new Error(message);
  }
);

export const createNote = async (noteData) => {
  const response = await api.post('/api/notes', noteData);
  return response.data;
};

export const fetchNotes = async (params = {}) => {
  const response = await api.get('/api/notes', { params });
  return response.data;
};

export const replayNote = async (noteId) => {
  const response = await api.post(`/api/notes/${noteId}/replay`);
  return response.data;
};

export const getNote = async (noteId) => {
  const response = await api.get(`/api/notes/${noteId}`);
  return response.data;
};