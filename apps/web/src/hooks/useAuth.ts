import { useState, useCallback, useEffect } from 'react';
import { UserDto } from '@shams-vision/shared';
import { api } from '../api';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  loading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          loading: false,
        };
      }
    }
    return {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
      loading: false,
    };
  });

  const saveState = useCallback((newState: AuthState) => {
    setState(newState);
    localStorage.setItem('auth', JSON.stringify(newState));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.login(email, password);
        const newState: AuthState = {
          isAuthenticated: true,
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          error: null,
          loading: false,
        };
        saveState(newState);
        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Login failed';
        const newState: AuthState = {
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: errorMsg,
          loading: false,
        };
        setState(newState);
        throw error;
      }
    },
    [saveState],
  );

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
      loading: false,
    });
    localStorage.removeItem('auth');
  }, []);

  const switchDepartment = useCallback(
    async (departmentId: string) => {
      if (!state.accessToken) {
        throw new Error('Not authenticated');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.switchDepartment(state.accessToken, departmentId);
        const newState: AuthState = {
          isAuthenticated: true,
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          error: null,
          loading: false,
        };
        saveState(newState);
        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to switch department';
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [state.accessToken, saveState],
  );

  return {
    ...state,
    login,
    logout,
    switchDepartment,
  };
};
