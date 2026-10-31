import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_USER_KEY = 'agriverse_auth_user';
const STORAGE_TOKEN_KEY = 'agriverse_auth_token';

const buildUserState = (user) => {
  if (!user) return null;
  return {
    ...user,
    provider: user.provider || 'Username & Password Auth',
    authMethod: user.authMethod || 'Username & Password Auth',
    photoUrl: user.photoUrl || null,
  };
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_USER_KEY) : null;
    return cached ? buildUserState(safeParse(cached)) : null;
  });
  const [authToken, setAuthToken] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : '') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user && !!authToken);
  const [showAuthModal, setShowAuthModal] = useState(() => !authToken);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem(STORAGE_TOKEN_KEY, authToken);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const cachedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (!cachedToken) {
        setIsAuthReady(true);
        setShowAuthModal(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${cachedToken}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Session expired');
        }

        if (cancelled) return;
        setAuthToken(cachedToken);
        setUser(buildUserState(data.user));
        setIsAuthenticated(true);
        setShowAuthModal(false);
      } catch (error) {
        if (cancelled) return;
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        setAuthToken('');
        setUser(null);
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    };

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestJson = async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }
    return data;
  };

  const register = async (username, email, password) => {
    if (!username || !email || !password) {
      return { success: false, error: 'All fields (Username, Email, Password) are required.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    try {
      const data = await requestJson('/api/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      const nextUser = buildUserState(data.user);
      setUser(nextUser);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      return { success: true, user: nextUser };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed.' };
    }
  };

  const login = async (usernameOrEmail, password) => {
    if (!usernameOrEmail || !password) {
      return { success: false, error: 'Please enter both Username/Email and Password.' };
    }

    try {
      const data = await requestJson('/api/auth/login', {
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });
      const nextUser = buildUserState(data.user);
      setUser(nextUser);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      return { success: true, user: nextUser };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed.' };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken('');
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setShowAuthModal(true);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAuthReady,
      showAuthModal,
      setShowAuthModal,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
