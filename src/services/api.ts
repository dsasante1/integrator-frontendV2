import axios from 'axios';

const BASE_URL = 'http://localhost:8080/integrator/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  signup: async (email: string, password: string) => {
    const response = await api.post('/signup', { email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('user_auth_token', token);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user_auth_token');
  },
};

// API Key services
export const apiKeyService = {
  storeApiKey: async (apiKey: string) => {
    const response = await api.post('/api-key', { api_key: apiKey });
    return response.data;
  },
};

// Collection services
export const collectionService = {
  getCollections: async () => {
    const response = await api.get('/collections');
    return response.data;
  },

  storeCollection: async (collectionId: string, name: string) => {
    const response = await api.post('/collections/store', { collection_id: collectionId, name });
    return response.data;
  },

  getCollectionDetails: async (id: string) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  getCollectionSnapshots: async (id: string) => {
    const response = await api.get(`/collections/${id}/snapshots`);
    return response.data;
  },

  compareSnapshots: async (id: string) => {
    const response = await api.get(`/collections/compare/${id}`);
    return response.data;
  },

  getCollectionChanges: async (id: string) => {
    const response = await api.get(`/collections/${id}/changes`);
    return response.data;
  },
};

// Health check service
export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/health-check');
    return response.data;
  },
};

export default api; 