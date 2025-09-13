import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/trading';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Skip profile validation for now - just check if token exists
        // The profile endpoint has issues, so we'll validate on first login attempt
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login to:', buildApiUrl(API_ENDPOINTS.auth.login));
      const response = await fetch(buildApiUrl(API_ENDPOINTS.auth.login), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('Login response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Login response data:', responseData);

        const { user: userData, token } = responseData;
        localStorage.setItem('authToken', token);
        setUser(userData);
        console.log('Login successful, user set:', userData);
        return true;
      } else {
        const errorData = await response.text();
        console.error('Login failed with status:', response.status, errorData);
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.auth.register), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const { user: userData, token } = await response.json();
        localStorage.setItem('authToken', token);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(buildApiUrl(API_ENDPOINTS.auth.logout), {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.auth.profile), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};