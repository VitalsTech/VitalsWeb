import { Outlet, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthProvider';
import { listContacts } from './contacts';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function Calendar() {
  const { doctorId } = useAuth();
  const navigate = useNavigate();
  const contacts = listContacts(doctorId);
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Календарь"
        description="Консультации, встречи, вызовы на дом и слоты расписания."
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((label, i) => {
            const isToday = i === (today.getDay() + 6) % 7;
            return (
              <div
                key={label}
                className={`flex h-[72px] w-[100px] flex-col items-center justify-center rounded-md border border-border text-[13px] ${
                  isToday ? 'bg-surface-muted font-semibold text-text' : 'text-text-muted'
                }`}
              >
                <span>{label}</span>
                <span>{i + 1}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-4 max-w-[900px] text-[13px] text-text-muted">
        Контракт API не предоставляет отдельный сервис расписания для врача — ниже показана
        активность по пациентам, известным этому аккаунту, как приблизительная лента дня.
      </p>

      <h3 className="mt-8 text-[16px] font-semibold text-text">Активность</h3>
      {contacts.length === 0 ? (
        <Card className="mt-4 p-6">
          <p className="text-[14px] text-text-muted">Пока нет данных для отображения.</p>
        </Card>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {contacts.map((c) => (
            <Card key={c.patientId} className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold text-text">{c.label}</p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {c.summary ?? 'Сводка появится после консультации'} ·{' '}
                  {new Date(c.lastActivityAt).toLocaleString('ru-RU')}
                </p>
              </div>
              <Button size="sm" onClick={() => navigate(`/doctor/calendar/${c.patientId}`)}>
                Подробнее
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  );
}
