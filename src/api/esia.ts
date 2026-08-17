import { apiRequest, ApiError, formatApiError } from './http';
import { extractSession, getRole, setSession, type Role, type Session } from './tokenStore';
import { findPatientProfile, type UserDto } from './users';

export type EsiaConfig = {
  enabled?: boolean;
  mode?: string;
  configured?: boolean;
  portal?: string;
  redirectUri?: string;
  intents?: string[];
  collects?: string[];
  generates?: string[];
  skipped?: string[];
};

export type EsiaStatus = {
  linked: boolean;
  linkedAt?: string | null;
  snilsMasked?: string | null;
};

export type EsiaStubRegisterPayload = {
  lastName: string;
  firstName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
};

export type EsiaSyncResult = {
  linked?: boolean;
  fullName?: string | null;
  omsImported?: boolean;
  addressImported?: boolean;
  medicalRecordSnapshotWritten?: boolean;
  existingAccount?: boolean;
  devPassword?: string | null;
  skipped?: string[];
};

export type EsiaAuthResult = {
  session: Session;
  esia: EsiaSyncResult;
};

export type ResidenceAddress = {
  postCode?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  area?: string | null;
  street?: string | null;
  house?: string | null;
  flat?: string | null;
};

export const ESIA_DISABLED_MESSAGE = 'Вход через Госуслуги на этой среде выключен';
export const ESIA_EXISTING_ACCOUNT_MESSAGE = 'Вошли в существующий аккаунт с этим телефоном';

export function isEsiaStubEnabled(config: EsiaConfig | null | undefined): boolean {
  return config?.enabled === true && config.mode === 'stub';
}

export const esiaApi = {
  getConfig() {
    return apiRequest<EsiaConfig>('/api/v1/auth/esia/config', { skipAuth: true });
  },

  getStatus() {
    return apiRequest<EsiaStatus>('/api/v1/auth/esia/status');
  },

  stubRegister(payload: EsiaStubRegisterPayload) {
    return apiRequest<unknown>('/api/v1/auth/esia/stub/register', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  },

  stubLink() {
    return apiRequest<unknown>('/api/v1/auth/esia/stub/link', {
      method: 'POST',
      body: {},
    });
  },
};

export function parseEsiaAuthResult(data: unknown): EsiaAuthResult {
  const session = extractSession(data);
  if (!session) {
    throw new Error('Сервер не вернул токены доступа.');
  }
  const esia =
    data && typeof data === 'object' && (data as { esia?: EsiaSyncResult }).esia
      ? ((data as { esia: EsiaSyncResult }).esia ?? {})
      : {};
  return { session, esia };
}

export function applyEsiaSession(result: EsiaAuthResult, role?: Role) {
  setSession(result.session, role ?? getRole() ?? 'patient');
}

export function mapEsiaError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) return ESIA_DISABLED_MESSAGE;
    const message = error.message || '';
    if (message.toLowerCase().includes('not configured') || message.includes('выключен')) {
      return ESIA_DISABLED_MESSAGE;
    }
    return formatApiError(error, 'Не удалось войти через Госуслуги');
  }
  return formatApiError(error, 'Не удалось войти через Госуслуги');
}

export function formatResidenceAddress(address: unknown): string | null {
  if (!address || typeof address !== 'object') return null;
  const a = address as ResidenceAddress;
  const parts = [
    a.postCode,
    a.region,
    a.city,
    a.area,
    a.street,
    a.house ? `д. ${a.house}` : null,
    a.flat ? `кв. ${a.flat}` : null,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function pickDataString(data: Record<string, unknown> | undefined, keys: string[]): string | null {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function maskSensitive(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/\s/g, '');
  if (compact.length <= 4) return '••••';
  return `•••${compact.slice(-4)}`;
}

export function patientImportedFields(user: UserDto | null | undefined) {
  const profile = findPatientProfile(user?.profiles);
  const data = (profile?.data ?? {}) as Record<string, unknown>;
  return {
    insuranceNumber: pickDataString(data, ['insuranceNumber', 'oms', 'omsNumber']),
    snils: pickDataString(data, ['snils']),
    residenceAddress: formatResidenceAddress(data.residenceAddress ?? data.registrationAddress),
  };
}
