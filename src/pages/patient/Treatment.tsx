import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory } from '@/api/medicalRecords';
import { prescriptionsApi, normalizePrescriptions, getPrescriptionId } from '@/api/prescriptions';

const EVENT_LABELS: Record<string, string> = {
  triage_session: 'ИИ-триаж',
  consultation: 'Консультация',
  document: 'Документ добавлен',
  mood_check: 'Отметка самочувствия',
  support_request: 'Обращение в поддержку',
  house_call_request: 'Вызов врача на дом',
};

const PENDING_STATUSES = new Set(['draft', 'pending', 'created']);

export function Treatment() {
  const { patientId } = useAuth();

  const history = useAsyncData(
    () => (patientId ? medicalRecordsApi.getHistory(patientId) : Promise.resolve(null)),
    [patientId],
  );
  const prescriptions = useAsyncData(
    () => (patientId ? prescriptionsApi.listForPatient(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const events = normalizeHistory(history.data);
  const allPrescriptions = normalizePrescriptions(prescriptions.data);
  const waitingPrescriptions = allPrescriptions.filter((p) => {
    const status = (p.status ?? '').toLowerCase();
    return status === '' || PENDING_STATUSES.has(status);
  });

  return (
    <div>
      <PageHeader
        title="Активное лечение"
        description="Назначения, выполненные шаги и то, что ждёт вас"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Выполнено</h3>
          <div className="mt-4 flex flex-col gap-3">
            <AsyncState loading={history.loading} error={history.error} onRetry={history.reload}>
              {events.length === 0 ? (
                <p className="text-[13px] text-text-muted">Пока нет завершённых шагов.</p>
              ) : (
                events.map((event, i) => (
                  <div key={event.id ?? i} className="rounded-md border border-border px-4 py-3">
                    <p className="text-[14px] text-success">
                      ✓ {EVENT_LABELS[event.eventType ?? ''] ?? event.eventType ?? 'Событие'}
                      {event.occurredAt
                        ? ` — ${new Date(event.occurredAt).toLocaleDateString('ru-RU')}`
                        : ''}
                    </p>
                  </div>
                ))
              )}
            </AsyncState>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Ожидает вас</h3>
          <div className="mt-4 flex flex-col gap-3">
            <AsyncState
              loading={prescriptions.loading}
              error={prescriptions.error}
              onRetry={prescriptions.reload}
            >
              {waitingPrescriptions.length === 0 ? (
                <p className="text-[13px] text-text-muted">Активных назначений пока нет.</p>
              ) : (
                waitingPrescriptions.map((p) => (
                  <div
                    key={getPrescriptionId(p)}
                    className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-4"
                  >
                    <div>
                      <p className="text-[15px] font-semibold text-text">
                        {p.diagnosisForPrescription ?? 'Назначение врача'}
                      </p>
                      <p className="mt-1 text-[13px] text-text-muted">{p.status ?? 'ожидает обработки'}</p>
                    </div>
                    <Button size="sm" className="flex-shrink-0" disabled>
                      Открыть
                    </Button>
                  </div>
                ))
              )}
            </AsyncState>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Текущие назначения врача</h3>
        <p className="mt-3 text-[14px] text-text-muted">
          После консультации здесь появятся рекомендации, рецепты и контрольные точки.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/patient/labs"
            className="rounded-md border border-border px-5 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent"
          >
            Анализы и рецепты
          </Link>
          <Link
            to="/patient/documents"
            className="rounded-md border border-border px-5 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent"
          >
            Документы
          </Link>
        </div>
      </Card>
    </div>
  );
}
