export type UrgencyKey = 'emergency' | 'urgent' | 'routine';
export type UrgencyTone = 'danger' | 'warning' | 'neutral';

const LABELS: Record<UrgencyKey, string> = {
  emergency: 'Экстренно',
  urgent: 'Срочно',
  routine: 'Плановая',
};

const TONES: Record<UrgencyKey, UrgencyTone> = {
  emergency: 'danger',
  urgent: 'warning',
  routine: 'neutral',
};

/** Бэкенд отдаёт `urgency` строкой, но при недоступном триаже остаётся только
 * `urgencyLevel` (1–5), поэтому поддерживаем оба источника. */
export function urgencyKey(urgency?: string | null, level?: number | null): UrgencyKey | null {
  const raw = (urgency ?? '').toLowerCase();
  if (raw === 'emergency' || raw === 'urgent' || raw === 'routine') return raw;
  if (level == null) return null;
  if (level >= 5) return 'emergency';
  if (level >= 4) return 'urgent';
  return 'routine';
}

export function urgencyTone(urgency?: string | null, level?: number | null): UrgencyTone {
  const key = urgencyKey(urgency, level);
  return key ? TONES[key] : 'neutral';
}

/** Готовый `urgencyLabel` из ответа имеет приоритет над локальным словарём. */
export function urgencyLabel(
  label?: string | null,
  urgency?: string | null,
  level?: number | null,
): string | null {
  if (label) return label;
  const key = urgencyKey(urgency, level);
  return key ? LABELS[key] : null;
}
