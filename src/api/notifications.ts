import { apiRequest } from './http';

export interface NotificationDto {
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  subject?: string;
  category?: string;
  patientId?: string;
  deepLink?: string;
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
  const raw = !response ? [] : Array.isArray(response) ? response : (response.items ?? []);
  return raw.map((item) => {
    const title =
      item.title ??
      (typeof item.subject === 'string' ? item.subject : undefined) ??
      (typeof item.eventType === 'string' ? String(item.eventType) : undefined);
    const message =
      item.message ??
      (typeof item.body === 'string' ? item.body : undefined) ??
      '';
    const category =
      typeof item.category === 'string'
        ? item.category.toLowerCase()
        : undefined;
    return {
      ...item,
      id: item.id ?? (typeof item.deliveryId === 'string' ? item.deliveryId : undefined),
      title,
      message,
      body: item.body ?? message,
      category,
    };
  });
}

export type NotificationCategory =
  | 'all'
  | 'booking'
  | 'triage'
  | 'mood'
  | 'message'
  | 'messages'
  | 'schedule';

const CATEGORY_ALIASES: Record<string, NotificationCategory> = {
  booking: 'booking',
  triage: 'triage',
  mood: 'mood',
  message: 'message',
  messages: 'message',
  schedule: 'schedule',
};

export function notificationCategory(item: NotificationDto): NotificationCategory | 'other' {
  const raw = (item.category ?? '').toLowerCase();
  if (raw && CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];
  const text = `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase();
  if (text.includes('самочувств') || text.includes('лучше') || text.includes('хуже')) return 'mood';
  if (text.includes('триаж') || text.includes('маршрут')) return 'triage';
  if (text.includes('запис') || text.includes('приём') || text.includes('консультац')) return 'booking';
  if (text.includes('сообщен') || text.includes('чат')) return 'message';
  if (text.includes('расписан') || text.includes('слот')) return 'schedule';
  return 'other';
}

export function notificationPatientLink(item: NotificationDto): string | null {
  if (typeof item.deepLink === 'string' && item.deepLink.startsWith('/')) return item.deepLink;
  if (typeof item.patientId === 'string') return `/doctor/patients/${item.patientId}`;
  const payload = item.payload ?? item.data;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.patientId === 'string') return `/doctor/patients/${p.patientId}`;
    if (typeof p.deepLink === 'string') return p.deepLink;
  }
  return null;
}
