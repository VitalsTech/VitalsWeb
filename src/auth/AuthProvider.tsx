import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import type { LoginPayload, RegisterPayload } from '@/api/auth';
import {
  usersApi,
  findPatientProfile,
  findDoctorProfile,
  getProfileId,
  formatUserName,
} from '@/api/users';
import type { UserDto } from '@/api/users';
import {
  getDoctorId,
  getPatientId,
  getPublicId,
  getRole,
  hasSession,
  setDoctorId as persistDoctorId,
  setPatientId as persistPatientId,
  subscribeToSession,
} from '@/api/tokenStore';
import type { Role } from '@/api/tokenStore';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  patientId: string | null;
  doctorId: string | null;
  publicId: string | null;
  patientName: string;
  doctorName: string;
  user: UserDto | null;
  error: string | null;
  login: (payload: LoginPayload, role: Role) => Promise<void>;
  register: (payload: RegisterPayload, role: Role) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const [isLoading, setIsLoading] = useState(hasSession);
  const [role, setRoleState] = useState<Role | null>(getRole);
  const [patientId, setPatientIdState] = useState<string | null>(getPatientId);
  const [doctorId, setDoctorIdState] = useState<string | null>(getDoctorId);
  const [publicId, setPublicIdState] = useState<string | null>(getPublicId);
  const [user, setUser] = useState<UserDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    const currentPublicId = getPublicId();
    if (!currentPublicId) {
      setIsLoading(false);
      return;
    }

    const currentRole = getRole() ?? 'patient';
    setIsLoading(true);
    try {
      const needsProfileLookup =
        currentRole === 'doctor' ? !getDoctorId() : !getPatientId();

      const [userDto, profiles] = await Promise.all([
        usersApi.getUser(currentPublicId).catch(() => null),
        needsProfileLookup ? usersApi.getProfiles(currentPublicId).catch(() => null) : Promise.resolve(null),
      ]);

      if (userDto) setUser(userDto);

      if (needsProfileLookup && profiles) {
        if (currentRole === 'doctor') {
          const doctorProfileId = getProfileId(findDoctorProfile(profiles));
          if (doctorProfileId) {
            persistDoctorId(doctorProfileId);
            setDoctorIdState(doctorProfileId);
          }
        } else {
          const patientProfileId = getProfileId(findPatientProfile(profiles));
          if (patientProfileId) {
            persistPatientId(patientProfileId);
            setPatientIdState(patientProfileId);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSession(() => {
      setIsAuthenticated(hasSession());
      setRoleState(getRole());
      setPatientIdState(getPatientId());
      setDoctorIdState(getDoctorId());
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

  const login = useCallback(async (payload: LoginPayload, loginRole: Role) => {
    setError(null);
    try {
      await authApi.login(payload, loginRole);
      setIsAuthenticated(true);
      setRoleState(getRole());
      setPatientIdState(getPatientId());
      setDoctorIdState(getDoctorId());
      setPublicIdState(getPublicId());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось войти.';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload, registerRole: Role) => {
    setError(null);
    try {
      await authApi.register(payload, registerRole);
      setIsAuthenticated(true);
      setRoleState(getRole());
      setPatientIdState(getPatientId());
      setDoctorIdState(getDoctorId());
      setPublicIdState(getPublicId());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось зарегистрироваться.';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setIsAuthenticated(false);
      setRoleState(null);
      setPatientIdState(null);
      setDoctorIdState(null);
      setPublicIdState(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      role,
      patientId,
      doctorId,
      publicId,
      patientName: formatUserName(user, 'Пациент'),
      doctorName: formatUserName(user, 'Врач'),
      user,
      error,
      login,
      register,
      logout,
    }),
    [isAuthenticated, isLoading, role, patientId, doctorId, publicId, user, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
