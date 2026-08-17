import { apiRequest } from './http';

/**
 * Response shape isn't documented by the contract beyond "200 OK" - fields
 * below are the ones the UI actually needs, kept optional so we degrade
 * gracefully if the backend calls something slightly differently.
 */
export interface UserProfileDto {
  id?: string;
  profileId?: string;
  profileType?: string;
  isActive?: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UserDto {
  publicId?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  secondName?: string;
  surename?: string;
  birthDate?: string;
  sex?: string;
  /** Активный профиль (Patient/Doctor ProfileId), не путать с publicId. */
  activeProfileId?: string;
  profiles?: UserProfileDto[];
  [key: string]: unknown;
}

export const usersApi = {
  getUser(publicId: string) {
    return apiRequest<UserDto>(`/api/v1/users/${publicId}`);
  },

  getProfiles(publicId: string) {
    return apiRequest<UserProfileDto[] | { items?: UserProfileDto[]; profiles?: UserProfileDto[] }>(
      `/api/v1/users/${publicId}/profiles`,
    );
  },

  addProfile(payload: {
    publicId: string;
    profileType?: string;
    patientProfile?: unknown;
    doctorProfile?: unknown;
    organizationProfile?: unknown;
  }) {
    return apiRequest<unknown>('/api/v1/users/add-profile', { method: 'POST', body: payload });
  },

  switchProfile(publicId: string, profileId: string) {
    return apiRequest<unknown>('/api/v1/users/switch-profile', {
      method: 'POST',
      body: { publicId, profileId },
    });
  },

  hasProfile(publicId: string, profileType: string) {
    return apiRequest<boolean | { hasProfile?: boolean }>(
      `/api/v1/users/${publicId}/has-profile/${profileType}`,
    );
  },
};

export function normalizeProfiles(
  response:
    | UserProfileDto[]
    | { items?: UserProfileDto[]; profiles?: UserProfileDto[] }
    | null
    | undefined,
): UserProfileDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? response.profiles ?? [];
}

/** Finds the patient profile among a user's profiles, if any. */
export function findPatientProfile(profiles: UserProfileDto[] | null | undefined) {
  if (!profiles?.length) return undefined;
  return profiles.find((p) => (p.profileType ?? '').toLowerCase().includes('patient'));
}

/** Finds the doctor profile among a user's profiles, if any. */
export function findDoctorProfile(profiles: UserProfileDto[] | null | undefined) {
  if (!profiles?.length) return undefined;
  return profiles.find((p) => (p.profileType ?? '').toLowerCase().includes('doctor'));
}

export function getProfileId(profile: UserProfileDto | undefined): string | undefined {
  if (!profile) return undefined;
  return profile.profileId ?? profile.id;
}

/**
 * ProfileId для роли: всегда из профиля Patient/Doctor, никогда publicId пользователя.
 */
export function resolveRoleProfileId(
  user: UserDto | null | undefined,
  profiles: UserProfileDto[] | null | undefined,
  role: 'patient' | 'doctor',
): string | undefined {
  const list = profiles?.length ? profiles : normalizeProfiles(user?.profiles);
  const match = role === 'doctor' ? findDoctorProfile(list) : findPatientProfile(list);
  const fromType = getProfileId(match);
  const active = user?.activeProfileId?.trim();
  const publicId = user?.publicId;

  if (fromType && fromType !== publicId) return fromType;
  if (active && active !== publicId) return active;
  return fromType && fromType !== publicId ? fromType : undefined;
}

export function formatUserName(user: UserDto | null | undefined, fallback = 'Пациент'): string {
  if (!user) return fallback;
  const parts = [user.surename, user.firstName, user.secondName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (user.phoneNumber ?? fallback);
}
