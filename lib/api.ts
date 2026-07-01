const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let authToken: string | null = null;
let currentUser: any = null;

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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
    throw new Error(data.message || data.error || 'API call failed');
  }
  
  return data;
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
    return await apiCall('/api/frames');
  },
  
  createFrame: async (name: string, description?: string, start_date?: string, end_date?: string) => {
    return await apiCall('/api/frames', {
      method: 'POST',
      body: JSON.stringify({ name, description, start_date, end_date }),
    });
  },
  
  // Characters
  getCharacters: async () => {
    return await apiCall('/api/characters');
  },

  getCharactersByFrame: async (frameId: string) => {
    return await apiCall(`/api/characters?frame_id=${encodeURIComponent(frameId)}`);
  },
  
  createCharacter: async (name: string, alias?: string, description?: string, image_url?: string) => {
    return await apiCall('/api/characters', {
      method: 'POST',
      body: JSON.stringify({ name, alias, description, image_url }),
    });
  },
  
  // Events
  getEvents: async () => {
    return await apiCall('/api/events');
  },
  
  getMyEvents: async () => {
    return await apiCall('/api/events/my');
  },
  
  createEvent: async (eventData: any) => {
    return await apiCall('/api/events', {
      method: 'POST',
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
    return await apiCall('/api/admin/events/pending');
  },
  
  // Places
  getPlaces: async () => {
    return await apiCall('/api/places');
  },

  getPlacesByFrame: async (frameId: string) => {
    return await apiCall(`/api/places?frame_id=${encodeURIComponent(frameId)}`);
  },
  
  getPlaceTypes: async () => {
    return await apiCall('/api/place-types');
  },
  
  createPlace: async (placeData: { place_type_id: string; current_name: string; previous_name?: string; lat: number; lng: number }) => {
    return await apiCall('/api/places', {
      method: 'POST',
      body: JSON.stringify(placeData),
    });
  },
  
  getNearbyPlaces: async (lat: number, lng: number, radius: number = 10) => {
    return await apiCall(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },
};

export default { auth, api };
