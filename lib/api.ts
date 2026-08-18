const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let authToken: string | null = null;
let currentUser: any = null;

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const parsed = JSON.parse(jsonPayload);

    // Reject expired JWTs on the client so role gating does not trust stale tokens.
    if (parsed?.exp && typeof parsed.exp === 'number') {
      if (Date.now() >= parsed.exp * 1000) {
        return null;
      }
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('auth_token');
  if (authToken) {
    const decoded = parseJwt(authToken);
    if (decoded) {
      currentUser = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : authToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const message = data.message || data.error || 'API call failed';

    // Keep client auth state in sync when backend rejects auth tokens.
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      typeof message === 'string' &&
      (message.includes('Invalid or expired authentication token') ||
        message.includes('Missing authentication token'))
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      authToken = null;
      currentUser = null;
    }

    throw new Error(message);
  }
  
  return data;
}

function asList<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      const data = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        authToken = data.token;
        currentUser = data.user;
      }
      
      return { user: data.user, token: data.token, error: null };
    } catch (error: any) {
      return { user: null, token: null, error: error.message };
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        authToken = data.token;
        currentUser = data.user;
      }
      
      return { user: data.user, token: data.token, error: null };
    } catch (error: any) {
      return { user: null, token: null, error: error.message };
    }
  },
  
  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    return { error: null };
  },
  
  getUser: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) {
          return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
          };
        }
      }
    }
    return currentUser;
  },
  
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return authToken;
  },
  
  onAuthChange: (callback: (user: any) => void) => {
    const user = auth.getUser();
    callback(user);
    
    const handleStorage = () => {
      const user = auth.getUser();
      callback(user);
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },
};

export const api = {
  // Frames
  getFrames: async () => {
    return asList(await apiCall('/api/frames'));
  },
  
  createFrame: async (name: string, description?: string, start_date?: string, end_date?: string) => {
    return await apiCall('/api/frames', {
      method: 'POST',
      body: JSON.stringify({ name, description, start_date, end_date }),
    });
  },
  
  // Characters
  getCharacters: async () => {
    return asList(await apiCall('/api/characters'));
  },

  getCharactersByFrame: async (frameId: string) => {
    return asList(await apiCall(`/api/characters?frame_id=${encodeURIComponent(frameId)}`));
  },
  
  createCharacter: async (name: string, alias?: string, description?: string, image_url?: string) => {
    return await apiCall('/api/characters', {
      method: 'POST',
      body: JSON.stringify({ name, alias, description, image_url }),
    });
  },
  
  // Events
  getEvents: async () => {
    return asList(await apiCall('/api/events'));
  },
  
  getMyEvents: async () => {
    return asList(await apiCall('/api/events/my'));
  },
  
  createEvent: async (eventData: any) => {
    return await apiCall('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  updateEvent: async (eventId: string, eventData: any) => {
    return await apiCall(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },
  
  approveEvent: async (eventId: string) => {
    return await apiCall(`/api/events/${eventId}/approve`, {
      method: 'PATCH',
    });
  },
  
  deleteEvent: async (eventId: string) => {
    return await apiCall(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  },
  
  // Admin
  getPendingEvents: async () => {
    return asList(await apiCall('/api/admin/events/pending'));
  },
  
  // Places
  getPlaces: async () => {
    return asList(await apiCall('/api/places'));
  },

  getPlacesByFrame: async (frameId: string) => {
    return asList(await apiCall(`/api/places?frame_id=${encodeURIComponent(frameId)}`));
  },
  
  getPlaceTypes: async () => {
    return asList(await apiCall('/api/place-types'));
  },

  createPlaceType: async (placeTypeData: { name: string; description?: string; icon?: string }) => {
    return await apiCall('/api/place-types', {
      method: 'POST',
      body: JSON.stringify(placeTypeData),
    });
  },

  updatePlaceType: async (placeTypeId: string, placeTypeData: { name?: string; description?: string; icon?: string }) => {
    return await apiCall(`/api/place-types/${placeTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(placeTypeData),
    });
  },

  deletePlaceType: async (placeTypeId: string) => {
    return await apiCall(`/api/place-types/${placeTypeId}`, {
      method: 'DELETE',
    });
  },
  
  createPlace: async (placeData: { place_type_id: string; current_name: string; previous_name?: string; lat: number; lng: number }) => {
    return await apiCall('/api/places', {
      method: 'POST',
      body: JSON.stringify(placeData),
    });
  },

  updatePlace: async (placeId: string, placeData: { place_type_id?: string; current_name?: string; previous_name?: string; lat?: number; lng?: number }) => {
    return await apiCall(`/api/places/${placeId}`, {
      method: 'PUT',
      body: JSON.stringify(placeData),
    });
  },

  deletePlace: async (placeId: string) => {
    return await apiCall(`/api/places/${placeId}`, {
      method: 'DELETE',
    });
  },

  getUserPreferences: async () => {
    return await apiCall('/api/user/preferences');
  },

  saveUserPreferences: async (payload: {
    last_frame_id: string | null;
    last_year: number | null;
    last_lat: number;
    last_lng: number;
    last_zoom: number;
  }) => {
    return await apiCall('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  getNearbyPlaces: async (lat: number, lng: number, radius: number = 10) => {
    return await apiCall(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },
};

const apiClient = { auth, api };

export default apiClient;
