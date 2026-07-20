import { useCallback } from 'react';

export function useAuth() {
  const getUser = useCallback(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }, []);

  const getAccessToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('userInfo') && !!localStorage.getItem('accessToken');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  return {
    user: getUser(),
    accessToken: getAccessToken(),
    isAuthenticated: isAuthenticated(),
    logout,
  };
}
