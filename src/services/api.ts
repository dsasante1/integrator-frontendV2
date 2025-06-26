import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';

export const BASE_URL = 'https://integrator-api.verbgh.com/integrator/api/v1';

interface SnapshotDiffParams {
  pageSize?: number;
  page?: number;
  filterType?: string;
  sortOrder?: string;
}


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    

    if (error.response?.status === 401) {
      localStorage.removeItem('user_auth_token');
      window.location.href = '/';
      return Promise.reject(error);
    }


    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      await new Promise(resolve => setTimeout(resolve, (parseInt(retryAfter) || 60) * 1000));
      return api(originalRequest!);
    }

   
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const errorMessage = error.response.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);


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


export const apiKeyService = {
  saveApiKey: async (apiKey: string) => {
    const response = await api.post('/api-key', { api_key: apiKey });
    return response.data;
  },

  getApiKeys: async () => {
    const response = await api.get('/keys/api-keys');
    return response.data;
  },

  deleteApiKey: async (id: string) => {
    const response = await api.delete(`/keys/api-key/${id}`);
    return response.data;
  },
};

// Collection services
export const collectionService = {
  getCollections: async () => {
    const response = await api.get('/collections');
    return response.data;
  },

  getUserCollections: async () => {
    const response = await api.get('/collections/user');
    return response.data;
  },

  saveCollection: async (collectionId: string, name: string) => {
    const response = await api.post('/collections/save-collection', { collection_id: collectionId, name });
    return response.data;
  },

  getCollectionDetails: async (id: string) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  getCollectionSnapshots: async (id: string, page = 1, pageSize = 10) => {
    const response = await api.get(`/collections/${id}/snapshots`, {
      params: { page, pageSize },
    });
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

//snapshot services

export const snapshotService = {
  // id = collection id
  getSnapshotFolders: async (snapshotId: string, id: string, itemSize: number) => {
    const response = await api.get(`/collections/${id}/snapshots/${snapshotId}/items?fields=name&page_size=${itemSize}`);
    return response.data;
  },

    getEndPointDetails: async (snapshotId: string, id: string, search: string) => {
    const response = await api.get(`/collections/${id}/snapshots/${snapshotId}/items?search=${search}`);
    return response.data;
  },

  refreshSnapShots: async (collectionId: string, collectionName: string) => {
      const response = await api.post('/collections/save-collection', { collection_id: collectionId, name: collectionName });
    return response.data;
  }


};

// collection changes
export const changesService = {
  getSummary: async (collectionId: string) => {
    const response = await api.get(`/collections/${collectionId}/change/summary`)
    return response.data;
  },
  getChanges: async (collectionId: string) => {
     const response = await api.get(`/collections/${collectionId}/changes`)
    return response.data;
  },
  getHierarchy: async (collectionId: string, snapShotId: number) => {
      const response = await api.get(`/collections/${collectionId}/snapshots/${snapShotId}/hierarchy`)
    return response.data;
  },
  getImpactAnalysis: async (collectionId: string, snapshotId: number) => {
      const response = await api.get(`/collections/${collectionId}/snapshots/${snapshotId}/impact-analysis`)
    return response.data;
  },
  getCollectionSnapshots: async (collectionId: string) => {
    const response = await api.get(`/collections/${collectionId}/snapshot-id`);
    return response.data;
  },

  compareSnapshots: async (collectionId: string, snapShotIdOne?: number, snapShotIdTwo?: number) => {
    const response = await api.get(`/collections/snapshot/compare/${collectionId}`,  { params: {snapShotIdOne, snapShotIdTwo},
    })
    return response.data;
  },



  getSnapshotDiff: async (
    collectionId: string, 
    snapshotId: number, 
    params?: SnapshotDiffParams
  ) => {
    const queryParams = new URLSearchParams();
    
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.filterType) {
      queryParams.append('filterType', params.filterType);
    }
    if (params?.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const queryString = queryParams.toString();
    const url = `/collections/${collectionId}/changes/diff/${snapshotId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
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