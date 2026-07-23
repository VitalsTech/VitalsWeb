import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { notificationsApi, normalizeNotifications } from '@/api/notifications';
import type { NotificationDto } from '@/api/notifications';

type Category = 'all' | 'booking' | 'triage' | 'mood' | 'message' | 'schedule';

const CATEGORY_TABS: [Category, string][] = [
  ['all', 'Все'],
  ['booking', 'Записи'],
  ['triage', 'Триаж'],
  ['mood', 'Самочувствие'],
  ['message', 'Сообщения'],
  ['schedule', 'Расписание'],
];

const CATEGORY_KEYWORDS: Record<Exclude<Category, 'all'>, string[]> = {
  booking: ['запис', 'приём', 'консультац'],
  triage: ['триаж', 'срочн', 'маршрут'],
  mood: ['самочувств', 'отметк', 'лучше', 'хуже', 'без изменений', 'mood'],
  message: ['сообщен', 'чат'],
  schedule: ['расписан', 'перенес', 'вызов'],
};

function matchesCategory(item: NotificationDto, category: Category): boolean {
  if (category === 'all') return true;
  const text = `${item.title ?? ''} ${item.message ?? item.body ?? ''}`.toLowerCase();
  return CATEGORY_KEYWORDS[category].some((keyword) => text.includes(keyword));
}

function formatDate(item: { createdAt?: string; sentAt?: string }) {
  const raw = item.sentAt ?? item.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Notifications() {
  const [category, setCategory] = useState<Category>('all');
  const { data, loading, error, reload } = useAsyncData(() => notificationsApi.getHistory(50), []);
  const notifications = normalizeNotifications(data).filter((n) => matchesCategory(n, category));

  return (
    <div>
      <PageHeader
        title="Уведомления"
        description="Записи пациентов, триаж, самочувствие, сообщения и изменения расписания."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`h-10 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              category === key ? 'bg-accent text-[#11442f]' : 'bg-surface-muted text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {notifications.length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-text-muted">Уведомлений в этой категории пока нет.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((item, i) => (
              <Card key={item.id ?? i} className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-[15px] font-semibold text-text">
                    {item.title ?? item.message ?? 'Уведомление'}
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {item.message && item.message !== item.title ? item.message : ''}{' '}
                    {formatDate(item)}
                  </p>
                </div>
                {item.isRead === false || item.read === false ? (
                  <Badge tone="success">новое</Badge>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </AsyncState>
    </div>
  );
}
