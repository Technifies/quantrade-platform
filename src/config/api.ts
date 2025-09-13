// API Configuration for QuantTrade Platform
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  timeout: 10000,
  retries: 3,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
    logout: '/api/auth/logout',
  },
  trading: {
    strategies: '/api/strategies',
    positions: '/api/positions',
    orders: '/api/orders',
    portfolio: '/api/portfolio',
  },
  market: {
    data: '/api/market/data',
    symbols: '/api/market/symbols',
  },
} as const;

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// HTTP client configuration
export const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.timeout,
};

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create authenticated request headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    ...fetchConfig.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};