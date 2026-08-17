import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { medicalRecordsApi } from '@/api/medicalRecords';

const STEPS = [
  'Вы оставляете заявку с адресом и симптомами.',
  'Диспетчер Vitals назначает врача из клиники-партнёра.',
  'Врач приезжает в выбранный интервал.',
  'Результат визита попадает в ваши документы.',
];

export function HouseCall() {
  const { patientId } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [phone, setPhone] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      // The contract's /consultations endpoint requires a doctorId, which
      // doesn't fit a house-call request (a dispatcher assigns the doctor
      // afterwards) - so we record the request as a medical-record event
      // instead, which the dispatch/back-office can pick up from history.
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'house_call_request',
        sourceService: 'patient-portal',
        payloadJson: JSON.stringify({ address, symptoms, desiredTime, phone, urgent }),
        occurredAt: new Date().toISOString(),
      });
      navigate('/patient');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Вызов врача на дом"
        description="Оформите заявку - диспетчер подберёт врача и время визита"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Данные заявки</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            <div>
              <FieldLabel>Адрес</FieldLabel>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Примерная, д. 12, кв. 45"
                required
              />
            </div>
            <div>
              <FieldLabel>Симптомы</FieldLabel>
              <Input
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Повышенное давление, слабость"
                required
              />
            </div>
            <div>
              <FieldLabel>Желаемое время</FieldLabel>
              <Input
                value={desiredTime}
                onChange={(e) => setDesiredTime(e.target.value)}
                placeholder="Сегодня, 14:00–18:00"
                required
              />
            </div>
            <div>
              <FieldLabel>Контактный телефон</FieldLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 123-45-67" required />
            </div>
            <label className="flex h-12 items-center gap-3 rounded-md border border-border px-4 text-[14px] text-text">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="accent-[var(--color-accent)]"
              />
              ⚠ Срочный вызов (доплата)
            </label>
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <Button type="submit" className="w-fit" disabled={submitting}>
              {submitting ? 'Отправка…' : 'Отправить заявку'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Как это работает</h3>
          <ol className="mt-4 flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step} className="text-[13px] text-text-muted">
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
