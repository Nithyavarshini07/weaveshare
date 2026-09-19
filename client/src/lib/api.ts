import axios from 'axios';

// Base URL for API calls. Uses .env VITE_API_URL if provided.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Origin of the backend (strip the /api suffix). Used for image URLs.
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Resolve a stored image path into a full URL the browser can load.
 *
 * Handles all cases:
 *  - null/undefined            → fallback image from /public
 *  - http(s)://...             → already absolute, use as-is
 *  - /uploads/...              → prefix with backend origin (server-served file)
 *  - /blue.jpg, /logo.jpeg     → Vite public asset, use as-is
 *  - abc.jpg (bare filename)   → assume it's an uploaded yarn image
 */
export function resolveImageUrl(path?: string | null): string {
  // 1. No path → use a file that ACTUALLY exists in client/public
  if (!path) return '/blue.jpg';

  // 2. Already an absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // 3. Backend-served upload → prefix with backend origin
  //    (server stores: /uploads/yarn/<filename>)
  if (path.startsWith('/uploads')) return `${API_ORIGIN}${path}`;

  // 4. Vite public asset (exists in client/public)
  if (path.startsWith('/')) return path;

  // 5. Bare filename → assume uploaded to server
  return `${API_ORIGIN}/uploads/yarn/${path}`;
}

export default api;