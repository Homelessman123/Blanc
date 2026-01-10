import { apiCache, sessionCache, localCache, CACHE_TTL } from './cache';

// API Configuration
const apiBaseUrlRaw =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');
const API_BASE_URL = apiBaseUrlRaw.replace(/\/+$/, '');

// Optional Bearer token support (fallback when cookies are blocked in cross-site deployments)
const ACCESS_TOKEN_KEY = 'access_token';

export const authToken = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (sessionToken) return sessionToken;

      // Backward compatibility: migrate any previously persisted token to sessionStorage.
      const localToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (localToken) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, localToken);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return localToken;
      }

      return null;
    } catch {
      return null;
    }
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    const value = String(token || '').trim();
    if (!value) return;

    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, value);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // ignore storage failures
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map<string, Promise<unknown>>();

let cachedCsrfToken: string | null = null;
let csrfTokenInFlight: Promise<string | null> | null = null;

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (csrfTokenInFlight) return csrfTokenInFlight;

  csrfTokenInFlight = (async () => {
    try {
      const url = `${API_BASE_URL}/auth/csrf`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        return null;
      }

      const data = (await res.json().catch(() => null)) as null | { csrfToken?: string };
      const token = data?.csrfToken ? String(data.csrfToken) : null;
      cachedCsrfToken = token;
      return token;
    } finally {
      csrfTokenInFlight = null;
    }
  })();

  return csrfTokenInFlight;
}

function mergeHeaders(into: Record<string, string>, extra?: HeadersInit): void {
  if (!extra) return;
  if (typeof Headers !== 'undefined' && extra instanceof Headers) {
    extra.forEach((value, key) => {
      into[key] = value;
    });
    return;
  }

  if (Array.isArray(extra)) {
    for (const [key, value] of extra) {
      into[key] = value;
    }
    return;
  }

  Object.assign(into, extra);
}

// Generic fetch wrapper with error handling and caching
async function fetchAPI<T>(
  endpoint: string,
  options?: Omit<RequestInit, 'cache'> & {
    useCache?: boolean;
    cacheTTL?: number;
    cacheKey?: string;
    persist?: 'session' | 'local';
  }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { useCache = false, cacheTTL, cacheKey, persist = 'session', ...fetchOptions } = options || {};

  // Generate cache key
  const key = cacheKey || `api:${endpoint}`;
  const persistentCache = persist === 'local' ? localCache : sessionCache;

  // Check memory cache first (for GET requests only)
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = apiCache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Also check persistent storage (sessionStorage or localStorage)
    const persistentCached = persistentCache.get<T>(key);
    if (persistentCached) {
      apiCache.set(key, persistentCached, cacheTTL);
      return persistentCached;
    }
  }

  // Request deduplication for GET requests
  const isGet = !fetchOptions.method || fetchOptions.method === 'GET';
  if (isGet && pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  mergeHeaders(headers, fetchOptions?.headers);

  const accessToken = authToken.get();
  if (accessToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    credentials: 'include',
    ...fetchOptions,
    headers,
  };

  // CSRF token for cookie-based auth (required for state-changing requests)
  const method = String(config.method || 'GET').toUpperCase();
  const isSafeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const hasAuthHeader = Boolean(headers.Authorization || headers.authorization);
  if (!isSafeMethod && !hasAuthHeader) {
    const csrfFromCookie = getCookieValue('csrf_token');
    const csrf = csrfFromCookie || (await fetchCsrfToken());
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (useCache && isGet && cacheTTL) {
        apiCache.set(key, data, cacheTTL);
        persistentCache.set(key, data, cacheTTL);
      }

      return data as T;
    } finally {
      // Clean up pending request
      if (isGet) {
        pendingRequests.delete(key);
      }
    }
  })();

  // Store pending request for deduplication
  if (isGet) {
    pendingRequests.set(key, requestPromise);
  }

  return requestPromise;
}

// API exports with cache support
export const api = {
  get: <T>(
    endpoint: string,
    options?: { useCache?: boolean; cacheTTL?: number; cacheKey?: string; persist?: 'session' | 'local' }
  ) =>
    fetchAPI<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, data?: unknown) =>
    fetchAPI<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    fetchAPI<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, { method: 'DELETE' }),
};

// Cached API helpers for common endpoints
export const cachedApi = {
  getStats: () => api.get('/stats', { useCache: true, cacheTTL: CACHE_TTL.STATS, persist: 'local' }),

  getContests: (limit = 10) =>
    api.get(`/contests?limit=${limit}`, { useCache: true, cacheTTL: CACHE_TTL.CONTESTS, persist: 'local' }),

  getCourses: (limit = 10, level?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (level) params.append('level', level);
    return api.get(`/courses?${params}`, { useCache: true, cacheTTL: CACHE_TTL.COURSES, persist: 'local' });
  },

  getCourseDetail: (id: string) =>
    api.get(`/courses/${id}`, { useCache: true, cacheTTL: CACHE_TTL.COURSE_DETAIL, cacheKey: `course:${id}` }),

  getContestDetail: (id: string) =>
    api.get(`/contests/${id}`, { useCache: true, cacheTTL: CACHE_TTL.COURSE_DETAIL, cacheKey: `contest:${id}` }),

  getMembershipPlans: () =>
    api.get('/membership/plans', { useCache: true, cacheTTL: CACHE_TTL.MEMBERSHIP_PLANS, cacheKey: 'membership:plans', persist: 'local' }),
};

// Cache invalidation helpers
export const invalidateCache = {
  all: () => {
    apiCache.clear();
    sessionCache.clear();
    localCache.clear();
  },
  stats: () => apiCache.invalidate('api:/stats'),
  contests: () => apiCache.invalidatePattern('contest'),
  courses: () => apiCache.invalidatePattern('course'),
  course: (id: string) => apiCache.invalidate(`course:${id}`),
};

export { API_BASE_URL, CACHE_TTL };
