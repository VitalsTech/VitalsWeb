import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { medicalRecordsApi } from '@/api/medicalRecords';

export function DocumentNew() {
  const { patientId } = useAuth();
  const navigate = useNavigate();

  const [docType, setDocType] = useState('reference');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasPaper, setHasPaper] = useState(false);
  const [hasDigital, setHasDigital] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'document',
        sourceService: 'patient-portal',
        payloadJson: JSON.stringify({ title, docType, hasPaper, hasDigital }),
        occurredAt: new Date(date).toISOString(),
      });
      navigate('/patient/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить документ.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Добавление документа"
        description="Загрузите скан и/или электронную версию мед. документа"
        backTo="/patient/documents"
        backLabel="К документам"
      />

      <Card className="max-w-[800px] p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Тип документа</FieldLabel>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="reference">Справка</option>
              <option value="extract">Выписка</option>
              <option value="prescription">Рецепт</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Название</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Справка для работы"
              required
            />
          </div>
          <div>
            <FieldLabel>Дата документа</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex h-[120px] cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-[13px] text-text-muted">
              <input
                type="checkbox"
                className="mr-2 accent-[var(--color-accent)]"
                checked={hasPaper}
                onChange={(e) => setHasPaper(e.target.checked)}
              />
              Бумажная версия (скан)
            </label>
            <label className="flex h-[120px] cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-[13px] text-text-muted">
              <input
                type="checkbox"
                className="mr-2 accent-[var(--color-accent)]"
                checked={hasDigital}
                onChange={(e) => setHasDigital(e.target.checked)}
              />
              Электронная версия (FHIR PDF / XML)
            </label>
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/patient/documents')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
