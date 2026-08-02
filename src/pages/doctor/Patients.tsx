import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { medicalRecordsApi } from '@/api/medicalRecords';
import { resolvePatientIdentity } from '@/lib/resolvePatientId';
import { upsertContact } from './contacts';
import { useObservedPatients } from './useObservedPatients';

export function Patients() {
  const { doctorId } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { patients, loading, error, reload } = useObservedPatients(doctorId);

  const contacts = patients.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!doctorId || !patientId.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const identity = await resolvePatientIdentity(patientId.trim());
      let summary: string | undefined;
      try {
        const state = await medicalRecordsApi.getState(identity.profileId);
        summary = state?.summary;
      } catch {
        // Patient state may not exist yet — that's fine, we still add the contact.
      }
      upsertContact(doctorId, {
        patientId: identity.profileId,
        label: label.trim() || identity.fullName || undefined,
        summary,
      });
      setPatientId('');
      setLabel('');
      setShowAdd(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось добавить пациента.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Пациенты"
        description="Из ваших консультаций и календаря. Можно добавить пациента вручную по ID."
        actions={<Button onClick={() => setShowAdd((v) => !v)}>Добавить пациента</Button>}
      />

      {showAdd && (
        <Card className="mb-6 max-w-[600px] p-6">
          <h3 className="text-[15px] font-semibold text-text">Добавить пациента по ID</h3>
          <p className="mt-1 text-[12px] text-text-muted">
            Если общей консультации ещё не было — укажите ID пациента, чтобы закрепить карточку.
          </p>
          <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-4">
            <div>
              <FieldLabel>ID пациента</FieldLabel>
              <Input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="например, 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                required
              />
            </div>
            <div>
              <FieldLabel>Отображаемое имя (необязательно)</FieldLabel>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Иванова Анна Сергеевна"
              />
            </div>
            {formError && <p className="text-[13px] text-danger">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Добавление…' : 'Добавить'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по ФИО…"
        className="max-w-[400px]"
      />

      <Card className="mt-6 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_2fr_120px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted">
          <span>Пациент</span>
          <span>Последнее обращение</span>
          <span>Сводка</span>
          <span />
        </div>
        <AsyncState loading={loading} error={error} onRetry={reload}>
          {contacts.length === 0 ? (
            <p className="px-6 py-8 text-[14px] text-text-muted">
              Пациентов пока нет — они появятся из консультаций/календаря или после добавления по
              ID.
            </p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.patientId}
                className="grid grid-cols-[2fr_1.2fr_2fr_120px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0"
              >
                <span className="text-[14px] font-semibold text-text">{c.label}</span>
                <span className="text-[14px] text-text-muted">
                  {new Date(c.lastActivityAt).toLocaleDateString('ru-RU')}
                </span>
                <span className="truncate text-[14px] text-text-muted" title={c.summary}>
                  {c.summary ?? 'Сводка появится после консультации'}
                </span>
                <Button size="sm" onClick={() => navigate(`/doctor/patients/${c.patientId}`)}>
                  Открыть
                </Button>
              </div>
            ))
          )}
        </AsyncState>
      </Card>
    </div>
  );
}
