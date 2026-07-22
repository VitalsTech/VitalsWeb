import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { doctorsApi, formatDoctorName, formatDoctorSpecialty } from '@/api/doctors';
import { useDoctorChat } from './useDoctorChat';

export function DoctorChat() {
  const { id } = useParams();
  const { patientId } = useAuth();
  const [draft, setDraft] = useState('');

  const { data: doctor, loading: doctorLoading, error: doctorError, reload } = useAsyncData(
    () => (id ? doctorsApi.get(id) : Promise.reject(new Error('Не указан врач'))),
    [id],
  );

  const { messages, loading, sending, error, send } = useDoctorChat(
    patientId,
    id,
    doctor ? formatDoctorName(doctor) : undefined,
  );

  async function submit() {
    if (!draft.trim()) return;
    await send(draft);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title={doctor ? formatDoctorName(doctor) : 'Чат с врачом'}
        description={doctor ? `${formatDoctorSpecialty(doctor)} · Чат` : undefined}
        backTo={`/patient/doctors/${id}`}
        backLabel="Назад к врачу"
      />

      <AsyncState loading={doctorLoading} error={doctorError} onRetry={reload}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">О враче</h3>
            <p className="mt-3 text-[13px] text-text-muted">
              {doctor?.experienceYears != null ? `Стаж ${doctor.experienceYears} лет. ` : ''}
              {doctor?.clinic || doctor?.clinicName
                ? `Клиника-партнёр: ${doctor.clinic ?? doctor.clinicName}. `
                : ''}
              {doctor?.schedule ? `Расписание: ${doctor.schedule}.` : ''}
            </p>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex max-h-[540px] flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
              <AsyncState loading={loading} error={error}>
                {messages.length === 0 ? (
                  <p className="text-[13px] text-text-muted">
                    Напишите первое сообщение врачу — чат создан автоматически.
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
                <Button disabled={sending} onClick={submit}>
                  Отпр.
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AsyncState>
    </div>
  );
}
