import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { notifications } from '@/mock/data';

export function Notifications() {
  return (
    <div>
      <PageHeader title="Уведомления" description="Хронология событий с главной страницы" />

      <div className="flex flex-col gap-4">
        {notifications.map((item) => (
          <Card key={item.id} className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-[15px] font-semibold text-text">{item.title}</p>
              <p className="mt-1 text-[13px] text-text-muted">{item.date}</p>
            </div>
            {item.isNew && <Badge tone="success">новое</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}
