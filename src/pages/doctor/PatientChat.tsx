import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi } from '@/api/medicalRecords';
import { useConsultationChat } from './useConsultationChat';
import { getContact, upsertContact } from './contacts';

export function PatientChat() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const { doctorId } = useAuth();
  const [draft, setDraft] = useState('');
  /** Календарь открывает конкретную консультацию из слота. */
  const sessionIdParam = searchParams.get('sessionId');

  const contact = getContact(doctorId, patientId);

  const state = useAsyncData(
    () => (patientId ? medicalRecordsApi.getState(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const { messages, loading, sending, error, send } = useConsultationChat(
    doctorId,
    patientId,
    sessionIdParam,
  );

  useEffect(() => {
    if (doctorId && patientId) upsertContact(doctorId, { patientId });
  }, [doctorId, patientId]);

  async function submit() {
    if (!draft.trim()) return;
    await send(draft);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title={contact?.label ?? 'Пациент'}
        description="Консультация онлайн · Чат с пациентом"
        backTo={`/doctor/patients/${patientId}`}
        backLabel="К карте пациента"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Контекст пациента</h3>
          <AsyncState loading={state.loading} error={state.error}>
            <p className="mt-3 text-[13px] text-text-muted">
              {state.data?.summary ?? contact?.summary ?? 'Сводка появится после консультации.'}
            </p>
            <p className="mt-3 text-[13px] text-text-muted">
              Аллергии: {state.data?.allergies ?? 'не указаны'}
            </p>
          </AsyncState>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex max-h-[540px] flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
            <AsyncState loading={loading} error={error}>
              {messages.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  Напишите первое сообщение пациенту — чат создан автоматически.
                </p>
              ) : (
                messages.map((m) => <ChatBubble key={m.id} message={m} />)
              )}
            </AsyncState>
          </Card>

          <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишите сообщение…"
              className="flex-1"
            />
            <div className="flex gap-3">
              <Button variant="secondary" disabled>
                Файл
              </Button>
              <Button variant="secondary" disabled>
                Рецепт
              </Button>
              <Button disabled={sending} onClick={() => void submit()}>
                Отправить
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
