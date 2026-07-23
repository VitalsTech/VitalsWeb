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
import { medicalRecordsApi, normalizeHistory, parseEventPayload } from '@/api/medicalRecords';
import { prescriptionsApi, normalizePrescriptions, getPrescriptionId } from '@/api/prescriptions';
import { getContact, upsertContact } from './contacts';

type Tab = 'overview' | 'diagnoses' | 'prescriptions';

type DiagnosisPayload = { code?: string; title?: string; status?: 'active' | 'closed' };
type DocumentPayload = { title?: string; docType?: string };

function dedupeDiagnoses(
  events: ReturnType<typeof normalizeHistory>,
): Array<{ id: string; code: string; title: string; status: string; occurredAt?: string }> {
  const byCode = new Map<string, { id: string; code: string; title: string; status: string; occurredAt?: string }>();
  for (const event of events) {
    const payload = parseEventPayload<DiagnosisPayload>(event) ?? {};
    const code = payload.code ?? 'без кода';
    const existing = byCode.get(code);
    if (!existing || (event.occurredAt ?? '') >= (existing.occurredAt ?? '')) {
      byCode.set(code, {
        id: String(event.id ?? code),
        code,
        title: payload.title ?? 'Диагноз',
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
  const documents = allEvents
    .filter((e) => e.eventType === 'document')
    .slice(0, 3);
  const diagnoses = dedupeDiagnoses(allEvents.filter((e) => e.eventType === 'diagnosis'));
  const prescriptionList = normalizePrescriptions(prescriptions.data);

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
        <AsyncState loading={state.loading} error={state.error} onRetry={state.reload}>
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
              <h3 className="text-[16px] font-semibold text-text">Последние документы</h3>
              <AsyncState loading={history.loading} error={history.error}>
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
              </AsyncState>
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        confirmWarnings: true,
        medications: [
          {
            tradeName,
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
      setShowAdd(false);
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось создать рецепт.');
    } finally {
      setSubmitting(false);
    }
  }

  async function reissue(p: (typeof prescriptions)[number]) {
    if (!patientId) return;
    await prescriptionsApi.create({
      patientId,
      diagnosisForPrescription: p.diagnosisForPrescription,
      isPreferential: p.isPreferential ?? false,
      allowedRefills: p.allowedRefills ?? 0,
      autoRenewalEnabled: p.autoRenewalEnabled ?? false,
      confirmWarnings: true,
      medications: p.medications,
    });
    onCreated();
  }

  return (
    <AsyncState loading={loading} error={error} onRetry={onRetry}>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted">
          <span>Препарат</span>
          <span>Схема</span>
          <span>Выдан</span>
          <span />
        </div>
        {prescriptions.length === 0 ? (
          <p className="px-6 py-8 text-[14px] text-text-muted">Рецептов пока нет.</p>
        ) : (
          prescriptions.map((p) => {
            const med = p.medications?.[0];
            return (
              <div
                key={getPrescriptionId(p)}
                className="grid grid-cols-[2fr_2fr_1fr_140px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0"
              >
                <span className="text-[14px] font-semibold text-text">
                  {med?.tradeName ?? p.diagnosisForPrescription ?? 'Рецепт'}
                </span>
                <span className="text-[14px] text-text-muted">
                  {[med?.dosage, med?.frequency].filter(Boolean).join(' · ') || '—'}
                </span>
                <span className="text-[14px] text-text-muted">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('ru-RU') : '—'}
                </span>
                <Button size="sm" onClick={() => void reissue(p)}>
                  Повторить
                </Button>
              </div>
            );
          })
        )}
      </Card>

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
            <div className="grid grid-cols-2 gap-4">
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
