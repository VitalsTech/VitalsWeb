import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { notificationsApi, normalizeNotifications } from '@/api/notifications';

function formatDate(item: { createdAt?: string; sentAt?: string }) {
  const raw = item.sentAt ?? item.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Notifications() {
  const { data, loading, error, reload } = useAsyncData(() => notificationsApi.getHistory(50), []);
  const notifications = normalizeNotifications(data);

  return (
    <div>
      <PageHeader title="Уведомления" description="Хронология событий с главной страницы" />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {notifications.length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-text-muted">Пока нет уведомлений.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((item, i) => (
              <Card key={item.id ?? i} className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-[15px] font-semibold text-text">
                    {item.title ?? item.message ?? 'Уведомление'}
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">{formatDate(item)}</p>
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
