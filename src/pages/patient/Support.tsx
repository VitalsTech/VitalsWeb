import { useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Select, Textarea } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { medicalRecordsApi } from '@/api/medicalRecords';

const FAQ_ITEMS = [
  {
    q: 'Как подключить ЕСИА?',
    a: 'На экране входа выберите «Войти через ЕСИА» и подтвердите данные на Госуслугах.',
  },
  {
    q: 'Где мои результаты анализов?',
    a: 'Раздел «Документы» синхронизируется с клиникой и лабораторией после интеграции.',
  },
  {
    q: 'Как изменить записанный приём?',
    a: 'Раздел «Врачи» → карточка специалиста → управление записью или отмена.',
  },
];

export function Support() {
  const { patientId } = useAuth();
  const [topic, setTopic] = useState('tech');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'support_request',
        sourceService: 'patient-portal',
        payloadJson: JSON.stringify({ topic, message }),
        occurredAt: new Date().toISOString(),
      });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить обращение.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Поддержка и FAQ" description="Вопросы и обращение в службу сопровождения" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">FAQ</h3>
          <div className="mt-4 flex flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-md border border-border px-4 py-3 open:bg-surface-muted"
              >
                <summary className="cursor-pointer list-none text-[14px] font-semibold text-text">
                  {item.q}
                </summary>
                <p className="mt-2 text-[13px] text-text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Обратиться</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            <div>
              <FieldLabel>Тема</FieldLabel>
              <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="tech">Техника</option>
                <option value="billing">Оплата</option>
                <option value="medical">Медицинский вопрос</option>
                <option value="other">Другое</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Сообщение</FieldLabel>
              <Textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите проблему"
                required
              />
            </div>
            {error && <p className="text-[13px] text-danger">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {sent ? 'Отправлено ✓' : submitting ? 'Отправка…' : 'Отправить'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
