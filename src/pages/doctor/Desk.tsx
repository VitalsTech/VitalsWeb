import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { notificationsApi, normalizeNotifications } from '@/api/notifications';
import { useObservedPatients } from './useObservedPatients';

export function Desk() {
  const { doctorId, doctorName } = useAuth();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState('');
  const [openError, setOpenError] = useState<string | null>(null);

  const { patients, loading: patientsLoading, error: patientsError, reload } =
    useObservedPatients(doctorId);

  const { data, loading } = useAsyncData(() => notificationsApi.getHistory(50), []);
  const notifications = normalizeNotifications(data);
  const unreadCount = notifications.filter((n) => n.isRead === false || n.read === false).length;

  function handleOpen(e: FormEvent) {
    e.preventDefault();
    if (!openId.trim()) {
      setOpenError('Укажите ID пациента.');
      return;
    }
    navigate(`/doctor/patients/${openId.trim()}`);
  }

  return (
    <div>
      <PageHeader
        title="Рабочий стол"
        description={doctorName}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] text-text-muted">Пациентов в наблюдении</p>
          <p className="mt-2 text-[20px] font-bold text-text">
            {patientsLoading ? '…' : patients.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-text-muted">Новых уведомлений</p>
          <p className="mt-2 text-[20px] font-bold text-text">{loading ? '…' : unreadCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-text-muted">Последняя активность</p>
          <p className="mt-2 text-[15px] font-semibold text-text">
            {patients[0]
              ? new Date(patients[0].lastActivityAt).toLocaleString('ru-RU')
              : '-'}
          </p>
        </Card>
      </div>

      <Card className="mt-6 max-w-[600px] p-6">
        <h3 className="text-[15px] font-semibold text-text">Открыть приём по ID пациента</h3>
        <form onSubmit={handleOpen} className="mt-4 flex gap-3">
          <Input
            value={openId}
            onChange={(e) => setOpenId(e.target.value)}
            placeholder="ID пациента"
            className="flex-1"
          />
          <Button type="submit">Начать приём</Button>
        </form>
        {openError && <p className="mt-2 text-[13px] text-danger">{openError}</p>}
      </Card>

      <h3 className="mt-8 text-[16px] font-semibold text-text">Пациенты в наблюдении</h3>
      <AsyncState loading={patientsLoading} error={patientsError} onRetry={reload}>
        {patients.length === 0 ? (
          <Card className="mt-4 p-6">
            <p className="text-[14px] text-text-muted">
              Пациентов пока нет.
            </p>
          </Card>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((c) => (
              <Card key={c.patientId} className="p-5">
                <p className="text-[15px] font-semibold text-text">{c.label}</p>
                <p className="mt-2 text-[13px] text-text-muted">
                  {c.summary ?? 'Сводка появится после консультации'}
                </p>
                <p className="mt-2 text-[12px] text-text-muted">
                  {new Date(c.lastActivityAt).toLocaleString('ru-RU')}
                </p>
                <Button
                  size="sm"
                  fullWidth
                  className="mt-5"
                  onClick={() => navigate(`/doctor/patients/${c.patientId}`)}
                >
                  Открыть
                </Button>
              </Card>
            ))}
          </div>
        )}
      </AsyncState>

      <h3 className="mt-8 text-[16px] font-semibold text-text">Новые сообщения</h3>
      <Card className="mt-4 p-6">
        <AsyncState loading={loading} error={null}>
          {notifications.length === 0 ? (
            <p className="text-[14px] text-text-muted">Пока нет уведомлений.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.slice(0, 3).map((n, i) => (
                <p key={n.id ?? i} className="text-[14px] text-text-muted">
                  {n.title ?? n.message ?? 'Уведомление'}
                </p>
              ))}
            </div>
          )}
        </AsyncState>
      </Card>
    </div>
  );
}
