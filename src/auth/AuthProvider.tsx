import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { LoginPayload, RegisterPayload } from '@/api/auth';
import { usersApi, findPatientProfile, getProfileId, formatUserName } from '@/api/users';
import type { UserDto } from '@/api/users';
import {
  getPatientId,
  getPublicId,
  hasSession,
  setPatientId as persistPatientId,
  subscribeToSession,
} from '@/api/tokenStore';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  patientId: string | null;
  publicId: string | null;
  patientName: string;
  user: UserDto | null;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const [isLoading, setIsLoading] = useState(hasSession);
  const [patientId, setPatientIdState] = useState<string | null>(getPatientId);
  const [publicId, setPublicIdState] = useState<string | null>(getPublicId);
  const [user, setUser] = useState<UserDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    const currentPublicId = getPublicId();
    if (!currentPublicId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [userDto, profiles] = await Promise.all([
        usersApi.getUser(currentPublicId).catch(() => null),
        getPatientId() ? Promise.resolve(null) : usersApi.getProfiles(currentPublicId).catch(() => null),
      ]);

      if (userDto) setUser(userDto);

      if (!getPatientId() && profiles) {
        const patientProfileId = getProfileId(findPatientProfile(profiles));
        if (patientProfileId) {
          persistPatientId(patientProfileId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSession(() => {
      setIsAuthenticated(hasSession());
      setPatientIdState(getPatientId());
      setPublicIdState(getPublicId());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void hydrate();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, hydrate]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setError(null);
      try {
        await authApi.login(payload);
        setIsAuthenticated(true);
        setPatientIdState(getPatientId());
        setPublicIdState(getPublicId());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось войти.';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setError(null);
      try {
        await authApi.register(payload);
        setIsAuthenticated(true);
        setPatientIdState(getPatientId());
        setPublicIdState(getPublicId());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось зарегистрироваться.';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setIsAuthenticated(false);
      setPatientIdState(null);
      setPublicIdState(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      patientId,
      publicId,
      patientName: formatUserName(user),
      user,
      error,
      login,
      register,
      logout,
    }),
    [isAuthenticated, isLoading, patientId, publicId, user, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
