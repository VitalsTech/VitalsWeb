import { apiRequest } from './http';
import {
  clearSession,
  extractSession,
  getDeviceFingerprint,
  getRefreshToken,
  setSession,
} from './tokenStore';
import type { Role, Session } from './tokenStore';

export type RegisterPayload = {
  phoneNumber: string;
  password: string;
  email?: string;
  firstName?: string;
  secondName?: string;
  surename?: string;
  /** ISO date-time, e.g. `1991-04-08` */
  birthDate: string;
  sex?: string;
  /** Doctor-only fields, sent inside `doctorProfile` when role === 'doctor'. */
  specialization?: string;
  licenseNumber?: string;
  biography?: string;
};

export type LoginPayload = {
  phoneNumber: string;
  password: string;
};

export const authApi = {
  async login(payload: LoginPayload, role: Role = 'patient'): Promise<Session> {
    const data = await apiRequest<unknown>('/api/v1/auth/login', {
      method: 'POST',
      body: {
        ...payload,
        deviceFingerprint: getDeviceFingerprint(),
        // Activates Doctor/Patient profile so JWT roles match the portal being used.
        preferredProfileType: role === 'doctor' ? 'Doctor' : 'Patient',
      },
      skipAuth: true,
    });
    const session = extractSession(data);
    if (!session) {
      throw new Error('Сервер не вернул токены доступа при входе.');
    }
    setSession(session, role);
    return session;
  },

  async register(payload: RegisterPayload, role: Role = 'patient'): Promise<Session> {
    const { specialization, licenseNumber, biography, ...rest } = payload;
    const data = await apiRequest<unknown>('/api/v1/auth/register', {
      method: 'POST',
      body: {
        ...rest,
        ...(role === 'doctor'
          ? {
              doctorProfile: {
                specialization,
                licenseNumber,
                ...(biography?.trim() ? { biography: biography.trim() } : {}),
              },
            }
          : { patientProfile: {} }),
      },
      skipAuth: true,
    });

    const session = extractSession(data);
    if (session) {
      setSession(session, role);
      return session;
    }

    // Registration may not return tokens directly (undocumented response) —
    // fall back to an explicit login with the same credentials.
    return authApi.login({ phoneNumber: payload.phoneNumber, password: payload.password }, role);
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } });
      }
    } finally {
      clearSession();
    }
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<void>('/api/v1/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
  },

  forgotPassword(phoneNumber: string, channel = 'sms') {
    return apiRequest<void>('/api/v1/auth/password/forgot', {
      method: 'POST',
      body: { phoneNumber, channel },
      skipAuth: true,
    });
  },

  resetPassword(phoneNumber: string, code: string, newPassword: string) {
    return apiRequest<void>('/api/v1/auth/password/reset', {
      method: 'POST',
      body: { phoneNumber, code, newPassword },
      skipAuth: true,
    });
  },
};
