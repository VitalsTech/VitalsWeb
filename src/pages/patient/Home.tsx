import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory, parseEventPayload } from '@/api/medicalRecords';
import type { MedicalRecordEventDto } from '@/api/medicalRecords';
import { useTriageSession } from './useTriageSession';

const MOODS = ['Хорошо', 'Устала', 'Стало хуже'];

const EVENT_LABELS: Record<string, string> = {
  triage_session: 'ИИ-триаж',
  AiTriageUrgencyDetermined: 'ИИ-триаж завершён',
  consultation: 'Консультация',
  ConsultationStarted: 'Консультация',
  document: 'Документ',
  DocumentUploaded: 'Документ',
  prescription: 'Рецепт',
  PrescriptionIssued: 'Рецепт',
  mood_check: 'Отметка самочувствия',
  VitalSignRecorded: 'Отметка самочувствия',
  support_request: 'Обращение в поддержку',
  house_call_request: 'Вызов врача на дом',
};

type TriagePayload = {
  recommendation?: string;
  recommendedSpecialization?: string;
  urgencyLevel?: number;
  route?: string[];
};

function formatEventTitle(event: MedicalRecordEventDto) {
  const type = event.eventType ?? 'event';
  return EVENT_LABELS[type] ?? type;
}

function formatEventDate(event: MedicalRecordEventDto) {
  const raw = event.occurredAt ?? event.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Home() {
  const { patientName, patientId } = useAuth();
  const [mood, setMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const triage = useTriageSession(patientId);

  const history = useAsyncData(
    () => (patientId ? medicalRecordsApi.getHistory(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const events = normalizeHistory(history.data).slice(0, 6);
  const triageEvent = normalizeHistory(history.data).find(
    (e) => e.eventType === 'AiTriageUrgencyDetermined' || e.eventType === 'triage_session',
  );
  const triagePayload = triageEvent ? parseEventPayload<TriagePayload>(triageEvent) : null;
  const pathSteps =
    triagePayload?.route ??
    (triage.session?.recommendation
      ? ['ИИ-триаж', triage.session.recommendedSpecialization ?? 'Терапевт', 'Консультация']
      : null);

  async function submitMood(nextMood: string) {
    setMood(nextMood);
    if (!patientId) return;
    setSavingMood(true);
    try {
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'mood_check',
        sourceService: 'patient-portal',
        payloadJson: JSON.stringify({ mood: nextMood }),
        occurredAt: new Date().toISOString(),
      });
      history.reload();
    } finally {
      setSavingMood(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${patientName}`}
        description="Система ведёт вас по маршруту лечения — следующий шаг всегда под рукой"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_302px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-[20px] font-bold text-text">Ваш маршрут</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              Шаги лечения после ИИ-триажа и консультаций
            </p>

            {pathSteps && pathSteps.length > 0 ? (
              <ol className="mt-6 flex flex-col gap-3">
                {pathSteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-4 rounded-md border border-border px-4 py-4"
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="text-[15px] font-semibold text-text">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-6 rounded-md border border-border px-4 py-5">
                <p className="text-[14px] text-text-muted">
                  Маршрут появится после завершения ИИ-триажа.
                </p>
                <ButtonLink to="/patient/triage" size="md" className="mt-4">
                  Пройти ИИ-триаж
                </ButtonLink>
              </div>
            )}

            {triagePayload?.recommendation && (
              <p className="mt-5 text-[13px] text-text-muted">{triagePayload.recommendation}</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-[20px] font-bold text-text">История</h2>
            <p className="mt-1 text-[13px] text-text-muted">Последние события вашей карты</p>

            <div className="mt-6 flex flex-col gap-3">
              <AsyncState loading={history.loading} error={history.error} onRetry={history.reload}>
                {events.length === 0 ? (
                  <p className="rounded-md border border-border px-4 py-5 text-[13px] text-text-muted">
                    Пока нет событий — начните с ИИ-триажа или запишитесь к врачу.
                  </p>
                ) : (
                  events.map((event, i) => {
                    const payload = parseEventPayload<{ mood?: string }>(event);
                    return (
                      <div
                        key={event.id ?? i}
                        className="flex items-center gap-4 rounded-md border border-border px-4 py-5"
                      >
                        <span className="h-6 w-6 flex-shrink-0 rounded-full bg-primary" />
                        <div>
                          <p className="text-[15px] font-semibold text-text">
                            {formatEventTitle(event)}
                            {payload?.mood ? `: ${payload.mood}` : ''}
                          </p>
                          <p className="mt-1 text-[13px] text-text-muted">{formatEventDate(event)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </AsyncState>
            </div>

            <ButtonLink to="/patient/triage" size="lg" className="mt-6 w-full max-w-[400px] justify-start">
              {pathSteps ? 'Продолжить ИИ-триаж' : 'Начать ИИ-триаж'}
            </ButtonLink>
          </Card>
        </div>

        <Card className="flex flex-col p-6">
          <h3 className="text-center text-[16px] font-semibold text-text">Как себя чувствуете?</h3>
          <p className="mt-1 text-center text-[13px] text-text-muted">
            Краткая отметка обновит маршрут
          </p>

          <div className="mx-auto mt-5 flex flex-col gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={savingMood}
                onClick={() => submitMood(m)}
                className={`h-11 w-[92px] rounded-md text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                  mood === m
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-surface text-text'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 flex w-full flex-col gap-3">
            <Link
              to="/patient/house-call"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Вызов врача на дом
            </Link>
            <Link
              to="/patient/treatment"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Активное лечение
            </Link>
            <Link
              to="/patient/labs"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Анализы и рецепты
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
