import { apiRequest } from './http';
import {
  clearSession,
  extractSession,
  getDeviceFingerprint,
  getRefreshToken,
  setSession,
} from './tokenStore';
import type { Session } from './tokenStore';

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
};

export type LoginPayload = {
  phoneNumber: string;
  password: string;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<Session> {
    const data = await apiRequest<unknown>('/api/v1/auth/login', {
      method: 'POST',
      body: { ...payload, deviceFingerprint: getDeviceFingerprint() },
      skipAuth: true,
    });
    const session = extractSession(data);
    if (!session) {
      throw new Error('Сервер не вернул токены доступа при входе.');
    }
    setSession(session);
    return session;
  },

  async register(payload: RegisterPayload): Promise<Session> {
    const data = await apiRequest<unknown>('/api/v1/auth/register', {
      method: 'POST',
      body: {
        ...payload,
        // The contract doesn't document the shape of `patientProfile` — an
        // empty object marks "create a patient profile for this account".
        patientProfile: {},
      },
      skipAuth: true,
    });

    const session = extractSession(data);
    if (session) {
      setSession(session);
      return session;
    }

    // Registration may not return tokens directly (undocumented response) —
    // fall back to an explicit login with the same credentials.
    return authApi.login({ phoneNumber: payload.phoneNumber, password: payload.password });
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
