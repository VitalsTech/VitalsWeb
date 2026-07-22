import { apiRequest } from './http';

/**
 * Response shape isn't documented by the contract beyond "200 OK" — fields
 * below are the ones the UI actually needs, kept optional so we degrade
 * gracefully if the backend calls something slightly differently.
 */
export interface UserDto {
  publicId?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  secondName?: string;
  surename?: string;
  birthDate?: string;
  sex?: string;
  [key: string]: unknown;
}

export interface UserProfileDto {
  id?: string;
  profileId?: string;
  profileType?: string;
  [key: string]: unknown;
}

export const usersApi = {
  getUser(publicId: string) {
    return apiRequest<UserDto>(`/api/v1/users/${publicId}`);
  },

  getProfiles(publicId: string) {
    return apiRequest<UserProfileDto[]>(`/api/v1/users/${publicId}/profiles`);
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

/** Finds the patient profile among a user's profiles, if any. */
export function findPatientProfile(profiles: UserProfileDto[] | null | undefined) {
  if (!profiles) return undefined;
  return profiles.find((p) => (p.profileType ?? '').toLowerCase().includes('patient'));
}

export function getProfileId(profile: UserProfileDto | undefined): string | undefined {
  if (!profile) return undefined;
  return profile.id ?? profile.profileId;
}

export function formatUserName(user: UserDto | null | undefined): string {
  if (!user) return 'Пациент';
  const parts = [user.surename, user.firstName, user.secondName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (user.phoneNumber ?? 'Пациент');
}
