import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory, extractHistoryState, parseEventPayload } from '@/api/medicalRecords';
import { prescriptionsApi, normalizePrescriptions, getPrescriptionId, normalizePrescriptionStatus, getPrescriptionStatusLabel } from '@/api/prescriptions';
import type { PrescriptionDto } from '@/api/prescriptions';
import { Modal } from '@/components/ui/Modal';
import { PrescriptionDetailModal, PrescriptionStatusBadge } from '@/components/PrescriptionDetailModal';
import { Badge } from '@/components/ui/Badge';
import { getContact, upsertContact } from './contacts';

type Tab = 'overview' | 'diagnoses' | 'prescriptions';

type DiagnosisPayload = { code?: string; title?: string; icd10Code?: string; description?: string; status?: 'active' | 'closed' };
type DocumentPayload = { title?: string; docType?: string };
type TriagePayload = {
  recommendation?: string;
  recommendedSpecialization?: string;
  urgencyLevel?: number | string;
  route?: string[];
  sessionId?: string;
};
type MoodPayload = {
  mood?: string;
  moodCode?: string;
  severity?: number;
  escalate?: boolean;
};

function isTriagePathEvent(event: { eventType?: string }) {
  return event.eventType === 'AiTriageUrgencyDetermined' || event.eventType === 'triage_session';
}

function isMoodEvent(event: { eventType?: string }) {
  return event.eventType === 'mood_check' || event.eventType === 'VitalSignRecorded';
}

function urgencyLabel(level: number | string | undefined) {
  const n = typeof level === 'string' ? Number(level) : level;
  if (n == null || Number.isNaN(n)) return null;
  if (n >= 5) return 'Срочно';
  if (n >= 4) return 'Скоро';
  return 'Плановая';
}

function formatEventWhen(raw?: string) {
  if (!raw) return '—';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function moodTone(code?: string, severity?: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (code === 'worse' || (severity != null && severity >= 3)) return 'danger';
  if (code === 'same' || code === 'tired' || (severity != null && severity === 2)) return 'warning';
  if (code === 'better' || code === 'good' || severity === 1) return 'success';
  return 'neutral';
}

function diagnosesFromHistory(
  events: ReturnType<typeof normalizeHistory>,
  stateDiagnoses: Array<{ icd10Code?: string; description?: string; recordedAt?: string; sourceEventId?: string }>,
): Array<{ id: string; code: string; title: string; status: string; occurredAt?: string }> {
  if (stateDiagnoses.length > 0) {
    return stateDiagnoses.map((d) => ({
      id: d.sourceEventId ?? d.icd10Code ?? String(Math.random()),
      code: d.icd10Code ?? '—',
      title: d.description ?? 'Диагноз',
      status: 'active',
      occurredAt: d.recordedAt,
    }));
  }

  const byCode = new Map<string, { id: string; code: string; title: string; status: string; occurredAt?: string }>();
  for (const event of events) {
    if (event.eventType !== 'diagnosis' && event.eventType !== 'DiagnosisConfirmed') continue;
    const payload = parseEventPayload<DiagnosisPayload>(event) ?? {};
    const code = payload.icd10Code ?? payload.code ?? 'без кода';
    const title = payload.description ?? payload.title ?? 'Диагноз';
    const existing = byCode.get(code);
    if (!existing || (event.occurredAt ?? '') >= (existing.occurredAt ?? '')) {
      byCode.set(code, {
        id: String(event.id ?? code),
        code,
        title,
        status: payload.status ?? 'active',
        occurredAt: event.occurredAt,
      });
    }
  }
  return Array.from(byCode.values()).sort((a, b) => ((a.occurredAt ?? '') < (b.occurredAt ?? '') ? 1 : -1));
}

export function PatientDetail() {
  const { patientId } = useParams();
  const { doctorId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const contact = getContact(doctorId, patientId);

  const state = useAsyncData(
    () => (patientId ? medicalRecordsApi.getState(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const history = useAsyncData(
    () => (patientId ? medicalRecordsApi.getHistory(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const prescriptions = useAsyncData(
    () => (patientId ? prescriptionsApi.listForPatient(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const allEvents = normalizeHistory(history.data);
  const historyState = extractHistoryState(history.data);
  const stateDiagnoses = historyState?.activeDiagnoses ?? state.data?.activeDiagnoses ?? [];
  const documents = allEvents
    .filter((e) => e.eventType === 'document' || e.eventType === 'DocumentUploaded')
    .slice(0, 3);
  const diagnoses = diagnosesFromHistory(allEvents, stateDiagnoses);
  const prescriptionList = normalizePrescriptions(prescriptions.data);

  const latestTriageEvent = allEvents.find(isTriagePathEvent) ?? null;
  const latestTriage = latestTriageEvent
    ? parseEventPayload<TriagePayload>(latestTriageEvent)
    : null;
  const recentMoods = allEvents.filter(isMoodEvent).slice(0, 5);
  const latestMood = recentMoods[0]
    ? parseEventPayload<MoodPayload>(recentMoods[0])
    : null;

  async function appendReferral() {
    if (!patientId) return;
    await medicalRecordsApi.appendEvent(patientId, {
      eventType: 'referral',
      sourceService: 'doctor-portal',
      payloadJson: JSON.stringify({ note: 'Направление оформлено врачом.' }),
      occurredAt: new Date().toISOString(),
    });
    if (doctorId) upsertContact(doctorId, { patientId });
    history.reload();
  }

  async function toggleDiagnosis(code: string, title: string, nextStatus: string) {
    if (!patientId) return;
    await medicalRecordsApi.appendEvent(patientId, {
      eventType: 'diagnosis',
      sourceService: 'doctor-portal',
      payloadJson: JSON.stringify({ code, title, status: nextStatus }),
      occurredAt: new Date().toISOString(),
    });
    history.reload();
  }

  return (
    <div>
      <PageHeader
        title={contact?.label ?? 'Пациент'}
        description={
          contact?.summary ??
          state.data?.summary ??
          `ID пациента: ${patientId ?? '—'}`
        }
        backTo="/doctor/patients"
        backLabel="К списку пациентов"
        actions={
          <Button
            variant="secondary"
            onClick={() => patientId && navigate(`/doctor/patients/${patientId}/chat`)}
          >
            Чат с пациентом
          </Button>
        }
      />

      <div className="mb-6 flex gap-2">
        {(
          [
            ['overview', 'Обзор'],
            ['diagnoses', 'Диагнозы'],
            ['prescriptions', 'Рецепты'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-10 rounded-md border border-border px-4 text-[13px] font-semibold transition-colors ${
              tab === key ? 'bg-primary text-primary-foreground' : 'bg-surface text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <AsyncState loading={state.loading || history.loading} error={state.error ?? history.error} onRetry={() => { state.reload(); history.reload(); }}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-[16px] font-semibold text-text">Сводка</h3>
              <p className="mt-3 text-[14px] text-text-muted">
                {state.data?.summary ?? 'Сводка появится после первой консультации.'}
              </p>
              <p className="mt-3 text-[13px] text-text-muted">
                Аллергии: {state.data?.allergies ?? 'не указаны'}. Группа крови:{' '}
                {state.data?.bloodType ?? 'не указана'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => patientId && navigate(`/doctor/patients/${patientId}/chat`)}
                >
                  Начать приём
                </Button>
                <Button variant="secondary" onClick={() => void appendReferral()}>
                  Направление
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-semibold text-text">Самочувствие</h3>
                {latestMood?.mood ? (
                  <Badge tone={moodTone(latestMood.moodCode, latestMood.severity)}>
                    {latestMood.mood}
                  </Badge>
                ) : null}
              </div>
              {!latestMood ? (
                <p className="mt-3 text-[14px] text-text-muted">
                  Пациент ещё не оставлял отметок самочувствия.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-[14px] text-text">
                    Последняя отметка: <span className="font-semibold">{latestMood.mood}</span>
                    {latestMood.escalate ? ' · требуется внимание' : ''}
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {formatEventWhen(recentMoods[0]?.occurredAt ?? recentMoods[0]?.createdAt)}
                  </p>
                  {recentMoods.length > 1 && (
                    <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                      {recentMoods.slice(1).map((event) => {
                        const payload = parseEventPayload<MoodPayload>(event) ?? {};
                        return (
                          <li
                            key={String(event.id ?? event.eventId)}
                            className="flex items-center justify-between gap-3 text-[13px]"
                          >
                            <span className="text-text">{payload.mood ?? 'Отметка'}</span>
                            <span className="text-text-muted">
                              {formatEventWhen(event.occurredAt ?? event.createdAt)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </Card>

            <Card className="p-6 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold text-text">Результат ИИ-триажа</h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Последний маршрут из медкарты пациента
                  </p>
                </div>
                {urgencyLabel(latestTriage?.urgencyLevel) && (
                  <Badge tone={Number(latestTriage?.urgencyLevel) >= 4 ? 'warning' : 'accent'}>
                    {urgencyLabel(latestTriage?.urgencyLevel)}
                  </Badge>
                )}
              </div>

              {!latestTriageEvent ? (
                <p className="mt-4 text-[14px] text-text-muted">
                  Результат триажа пока отсутствует — пациент ещё не завершил ИИ-триаж или событие не
                  попало в медкарту.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                  <div className="rounded-md border border-border bg-surface-muted px-4 py-4">
                    <p className="text-[12px] font-semibold text-text-muted">Специализация</p>
                    <p className="mt-1 text-[14px] font-semibold text-text">
                      {latestTriage?.recommendedSpecialization ?? 'Терапевт'}
                    </p>
                    <p className="mt-4 text-[12px] font-semibold text-text-muted">Дата</p>
                    <p className="mt-1 text-[13px] text-text">
                      {formatEventWhen(latestTriageEvent.occurredAt ?? latestTriageEvent.createdAt)}
                    </p>
                    {latestTriage?.sessionId && (
                      <>
                        <p className="mt-4 text-[12px] font-semibold text-text-muted">Сессия</p>
                        <p className="mt-1 break-all text-[12px] text-text-muted">
                          {latestTriage.sessionId}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-text-muted">Рекомендация</p>
                    {latestTriage?.recommendation ? (
                      <p className="mt-2 whitespace-pre-wrap text-[14px] text-text">
                        {latestTriage.recommendation}
                      </p>
                    ) : (
                      <p className="mt-2 text-[14px] text-text-muted">
                        Текст рекомендации в событии не сохранён.
                      </p>
                    )}
                    {(latestTriage?.route?.length ?? 0) > 0 && (
                      <ol className="mt-4 flex flex-col gap-2">
                        {latestTriage!.route!.map((step, index) => (
                          <li key={step} className="flex items-center gap-3 text-[14px] text-text">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="text-[16px] font-semibold text-text">Последние документы</h3>
              {documents.length === 0 ? (
                <p className="mt-3 text-[14px] text-text-muted">Документов пока нет.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {documents.map((doc) => {
                    const payload = parseEventPayload<DocumentPayload>(doc) ?? {};
                    return (
                      <li key={doc.id} className="text-[14px] text-text-muted">
                        • {payload.title ?? payload.docType ?? 'Документ'} от{' '}
                        {doc.occurredAt ? new Date(doc.occurredAt).toLocaleDateString('ru-RU') : '—'}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </AsyncState>
      )}

      {tab === 'diagnoses' && (
        <DiagnosesTab
          diagnoses={diagnoses}
          loading={history.loading}
          error={history.error}
          onRetry={history.reload}
          onToggle={toggleDiagnosis}
          onAdded={history.reload}
          patientId={patientId}
        />
      )}

      {tab === 'prescriptions' && (
        <PrescriptionsTab
          prescriptions={prescriptionList}
          loading={prescriptions.loading}
          error={prescriptions.error}
          onRetry={prescriptions.reload}
          onCreated={prescriptions.reload}
          patientId={patientId}
        />
      )}
    </div>
  );
}

function DiagnosesTab({
  diagnoses,
  loading,
  error,
  onRetry,
  onToggle,
  onAdded,
  patientId,
}: {
  diagnoses: Array<{ id: string; code: string; title: string; status: string; occurredAt?: string }>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggle: (code: string, title: string, nextStatus: string) => Promise<void>;
  onAdded: () => void;
  patientId: string | undefined;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    try {
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'diagnosis',
        sourceService: 'doctor-portal',
        payloadJson: JSON.stringify({ code, title, status: 'active' }),
        occurredAt: new Date().toISOString(),
      });
      setCode('');
      setTitle('');
      setShowAdd(false);
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AsyncState loading={loading} error={error} onRetry={onRetry}>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted">
          <span>Диагноз</span>
          <span>Дата</span>
          <span>Статус</span>
          <span />
        </div>
        {diagnoses.length === 0 ? (
          <p className="px-6 py-8 text-[14px] text-text-muted">Диагнозы пока не добавлены.</p>
        ) : (
          diagnoses.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[2fr_1fr_1fr_120px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0"
            >
              <span className="text-[14px] font-semibold text-text">
                {d.code} — {d.title}
              </span>
              <span className="text-[14px] text-text-muted">
                {d.occurredAt ? new Date(d.occurredAt).toLocaleDateString('ru-RU') : '—'}
              </span>
              <span className="text-[14px] text-text-muted">
                {d.status === 'closed' ? 'закрыт' : 'активный'}
              </span>
              <Button
                size="sm"
                variant={d.status === 'closed' ? 'secondary' : 'primary'}
                onClick={() => void onToggle(d.code, d.title, d.status === 'closed' ? 'active' : 'closed')}
              >
                {d.status === 'closed' ? 'Открыть' : 'Закрыть'}
              </Button>
            </div>
          ))
        )}
      </Card>

      {showAdd ? (
        <Card className="mt-6 max-w-[600px] p-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <FieldLabel>Код МКБ-10</FieldLabel>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="I10" required />
            </div>
            <div>
              <FieldLabel>Название</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Гипертензия"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button className="mt-6" onClick={() => setShowAdd(true)}>
          Добавить диагноз
        </Button>
      )}
    </AsyncState>
  );
}

function PrescriptionsTab({
  prescriptions,
  loading,
  error,
  onRetry,
  onCreated,
  patientId,
}: {
  prescriptions: ReturnType<typeof normalizePrescriptions>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreated: () => void;
  patientId: string | undefined;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [courseDays, setCourseDays] = useState('10');
  const [signImmediately, setSignImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PrescriptionDto | null>(null);
  const [cancelReason, setCancelReason] = useState('Ошибка в дозировке');
  const [detailTarget, setDetailTarget] = useState<PrescriptionDto | null>(null);
  const [sendConfirm, setSendConfirm] = useState<PrescriptionDto | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await prescriptionsApi.create({
        patientId,
        diagnosisForPrescription: diagnosis,
        isPreferential: false,
        allowedRefills: 0,
        autoRenewalEnabled: false,
        confirmWarnings: signImmediately,
        medications: [
          {
            tradeName,
            inn: tradeName,
            dosage,
            frequency,
            courseDays: Number(courseDays) || 0,
          },
        ],
      });
      setDiagnosis('');
      setTradeName('');
      setDosage('');
      setFrequency('');
      setCourseDays('10');
      setSignImmediately(true);
      setShowAdd(false);
      setActionOk(signImmediately ? 'Рецепт создан и подписан.' : 'Черновик рецепта создан.');
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось создать рецепт.');
    } finally {
      setSubmitting(false);
    }
  }

  async function reissue(p: PrescriptionDto) {
    if (!patientId) return;
    const id = getPrescriptionId(p);
    setActionId(id);
    setActionError(null);
    setActionOk(null);
    try {
      await prescriptionsApi.create({
        patientId,
        diagnosisForPrescription: p.diagnosisForPrescription,
        isPreferential: p.isPreferential ?? false,
        allowedRefills: p.allowedRefills ?? 0,
        autoRenewalEnabled: p.autoRenewalEnabled ?? false,
        confirmWarnings: true,
        medications: (p.medications ?? []).map((m) => ({
          ...m,
          inn: m.inn || m.tradeName || 'не указано',
          tradeName: m.tradeName || m.inn || 'Препарат',
        })),
      });
      setActionOk('Создан повторный подписанный рецепт.');
      onCreated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось повторить рецепт.');
    } finally {
      setActionId(null);
    }
  }

  async function runStatusAction(
    prescription: PrescriptionDto,
    action: 'sign' | 'send' | 'cancel',
    reason?: string,
  ) {
    const id = getPrescriptionId(prescription);
    if (!id) return;
    setActionId(id);
    setActionError(null);
    setActionOk(null);
    try {
      if (action === 'sign') {
        await prescriptionsApi.sign(id, true);
        setActionOk('Рецепт подписан.');
      } else if (action === 'send') {
        await prescriptionsApi.sendToPharmacy(id, { autoSelectNearest: true });
        setActionOk('Рецепт отправлен в аптеку.');
        setSendConfirm(null);
      } else {
        await prescriptionsApi.cancel(id, reason || 'Отменено врачом');
        setActionOk('Рецепт отменён.');
      }
      setCancelTarget(null);
      onCreated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось изменить статус.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <AsyncState loading={loading} error={error} onRetry={onRetry}>
      {(actionError || actionOk) && (
        <p className={`mb-4 text-[13px] ${actionError ? 'text-danger' : 'text-success'}`} role="status">
          {actionError ?? actionOk}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="hidden gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted lg:grid lg:grid-cols-[2fr_2fr_1.4fr_minmax(240px,auto)]">
          <span>Препарат</span>
          <span>Схема</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>
        {prescriptions.length === 0 ? (
          <p className="px-6 py-8 text-[14px] text-text-muted">Рецептов пока нет.</p>
        ) : (
          prescriptions.map((p) => {
            const med = p.medications?.[0];
            const id = getPrescriptionId(p);
            const status = normalizePrescriptionStatus(p.status);
            const busy = actionId === id;
            const scheme = [med?.dosage, med?.frequency].filter(Boolean).join(' · ') || '—';

            return (
              <div
                key={id}
                className="border-b border-border px-4 py-4 last:border-b-0 sm:px-6 sm:py-5"
              >
                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[2fr_2fr_1.4fr_minmax(240px,auto)] lg:items-center lg:gap-4">
                  <button
                    type="button"
                    onClick={() => setDetailTarget(p)}
                    className="min-w-0 text-left"
                  >
                    <p className="text-[14px] font-semibold text-text transition-colors hover:text-primary">
                      {med?.tradeName ?? p.diagnosisForPrescription ?? 'Рецепт'}
                    </p>
                    <p className="mt-1 text-[12px] text-text-muted lg:hidden">{scheme}</p>
                    <p className="mt-2 lg:hidden">
                      <PrescriptionStatusBadge status={p.status} />
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTarget(p)}
                    className="hidden text-left text-[14px] text-text-muted transition-colors hover:text-text lg:block"
                  >
                    {scheme}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailTarget(p)}
                    className="hidden text-left lg:block"
                  >
                    <PrescriptionStatusBadge status={p.status} />
                  </button>

                  <div
                    className="flex flex-wrap items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="secondary" onClick={() => setDetailTarget(p)}>
                      Открыть
                    </Button>
                    {status === 'draft' && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void runStatusAction(p, 'sign')}
                      >
                        {busy ? '…' : 'Подписать'}
                      </Button>
                    )}
                    {status === 'signed' && (
                      <Button size="sm" disabled={busy} onClick={() => setSendConfirm(p)}>
                        В аптеку
                      </Button>
                    )}
                    {(status === 'draft' || status === 'signed' || status === 'sent_to_pharmacy') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setCancelReason('Ошибка в дозировке');
                          setCancelTarget(p);
                        }}
                      >
                        Отменить
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void reissue(p)}
                    >
                      Повторить
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {detailTarget && (
        <PrescriptionDetailModal
          prescription={detailTarget}
          variant="doctor"
          onClose={() => setDetailTarget(null)}
          onUpdated={onCreated}
        />
      )}

      {sendConfirm && (
        <Modal onClose={() => setSendConfirm(null)} widthClassName="max-w-[440px]">
          <h3 className="text-[18px] font-bold text-text">Отправить в аптеку?</h3>
          <p className="mt-2 text-[14px] text-text-muted">
            {sendConfirm.medications?.[0]?.tradeName ??
              sendConfirm.diagnosisForPrescription ??
              'Рецепт'}{' '}
            будет передан в ближайшую аптеку-партнёр.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={actionId === getPrescriptionId(sendConfirm)}
              onClick={() => void runStatusAction(sendConfirm, 'send')}
            >
              {actionId === getPrescriptionId(sendConfirm) ? 'Отправка…' : 'Отправить'}
            </Button>
            <Button variant="secondary" onClick={() => setSendConfirm(null)}>
              Назад
            </Button>
          </div>
        </Modal>
      )}

      {cancelTarget && (
        <Modal onClose={() => setCancelTarget(null)} widthClassName="max-w-[480px]">
          <h3 className="text-[18px] font-bold text-text">Отмена рецепта</h3>
          <p className="mt-2 text-[14px] text-text-muted">
            {cancelTarget.medications?.[0]?.tradeName ??
              cancelTarget.diagnosisForPrescription ??
              'Рецепт'}{' '}
            · {getPrescriptionStatusLabel(cancelTarget.status)}
          </p>
          <div className="mt-5">
            <FieldLabel>Причина</FieldLabel>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
              autoFocus
            />
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              disabled={!cancelReason.trim() || actionId === getPrescriptionId(cancelTarget)}
              onClick={() => void runStatusAction(cancelTarget, 'cancel', cancelReason.trim())}
            >
              {actionId === getPrescriptionId(cancelTarget) ? 'Отмена…' : 'Подтвердить отмену'}
            </Button>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Закрыть
            </Button>
          </div>
        </Modal>
      )}

      {showAdd ? (
        <Card className="mt-6 max-w-[600px] p-6">
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <FieldLabel>Диагноз</FieldLabel>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
            </div>
            <div>
              <FieldLabel>Препарат</FieldLabel>
              <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Схема приёма</FieldLabel>
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="1 таб. утром"
                />
              </div>
              <div>
                <FieldLabel>Курс, дней</FieldLabel>
                <Input
                  type="number"
                  value={courseDays}
                  onChange={(e) => setCourseDays(e.target.value)}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Частота</FieldLabel>
              <Textarea
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                rows={2}
                placeholder="1 раз в день"
              />
            </div>
            <label className="flex items-start gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                checked={signImmediately}
                onChange={(e) => setSignImmediately(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                Сразу подписать рецепт
                <span className="mt-0.5 block text-text-muted">
                  Без галочки останется черновик — его можно подписать позже.
                </span>
              </span>
            </label>
            {formError && <p className="text-[13px] text-danger">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Создание…' : 'Создать рецепт'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button className="mt-6" onClick={() => setShowAdd(true)}>
          Новый рецепт
        </Button>
      )}
    </AsyncState>
  );
}
