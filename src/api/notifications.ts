import { apiRequest } from './http';

export interface NotificationDto {
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  createdAt?: string;
  sentAt?: string;
  isRead?: boolean;
  read?: boolean;
  [key: string]: unknown;
}

export interface UserPreferenceDto {
  category?: string;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  voiceEnabled?: boolean;
}

export const notificationsApi = {
  registerPushToken(platform: string, token: string) {
    return apiRequest<unknown>('/api/v1/notifications/push-tokens', {
      method: 'POST',
      body: { platform, token },
    });
  },

  getPreferences() {
    return apiRequest<UserPreferenceDto[]>('/api/v1/notifications/preferences');
  },

  updatePreferences(preference: UserPreferenceDto) {
    return apiRequest<unknown>('/api/v1/notifications/preferences', {
      method: 'PUT',
      body: preference,
    });
  },

  getHistory(limit = 50) {
    return apiRequest<NotificationDto[] | { items?: NotificationDto[] }>(
      '/api/v1/notifications/history',
      { query: { limit } },
    );
  },
};

export function normalizeNotifications(
  response: NotificationDto[] | { items?: NotificationDto[] } | null | undefined,
): NotificationDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}
