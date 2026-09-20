import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { VideoCallStage } from '@/components/VideoCallStage';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { useChatAutoScroll } from '@/lib/useChatAutoScroll';
import { useConsultationHub } from '@/lib/useConsultationHub';
import { useConsultationVideo } from '@/lib/useConsultationVideo';
import { doctorsApi, formatDoctorName, formatDoctorSpecialty, getDoctorBiography } from '@/api/doctors';
import { DoctorBioBlock } from '@/components/DoctorBioBlock';
import { useDoctorChat } from './useDoctorChat';

export function DoctorChat() {
  const { id } = useParams();
  const { patientId } = useAuth();
  const [draft, setDraft] = useState('');

  const { data: doctor, loading: doctorLoading, error: doctorError, reload: reloadDoctor } = useAsyncData(
    () => (id ? doctorsApi.get(id) : Promise.reject(new Error('Не указан врач'))),
    [id],
  );

  const { sessionId, messages, loading, sending, error, send, reload: reloadMessages } = useDoctorChat(
    patientId,
    id,
    doctor ? formatDoctorName(doctor) : undefined,
  );
  const chatEndRef = useChatAutoScroll([messages, sending, loading]);
  const hub = useConsultationHub(sessionId);
  const video = useConsultationVideo({
    sessionId,
    hub,
    polite: true,
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    return hub.subscribe({
      onMessage: () => {
        void reloadMessages();
      },
      onClinicalAction: () => {
        void reloadMessages();
      },
    });
  }, [hub, reloadMessages]);

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

      <AsyncState loading={doctorLoading} error={doctorError} onRetry={reloadDoctor}>
        <VideoCallStage
          video={video}
          sessionId={sessionId}
          requireConsent
          hubReady={hub.ready}
          hubError={hub.error}
          before={
            <Card className="p-6">
              <DoctorBioBlock biography={getDoctorBiography(doctor ?? undefined)} />
              {(doctor?.experienceYears != null || doctor?.clinic || doctor?.clinicName || doctor?.schedule) && (
                <p className="mt-3 text-[13px] text-text-muted">
                  {doctor?.experienceYears != null ? `Стаж ${doctor.experienceYears} лет. ` : ''}
                  {doctor?.clinic || doctor?.clinicName
                    ? `Клиника-партнёр: ${doctor.clinic ?? doctor.clinicName}. `
                    : ''}
                  {doctor?.schedule ? `Расписание: ${doctor.schedule}.` : ''}
                </p>
              )}
            </Card>
          }
          chat={
            <>
              <Card className="js-chat-log flex max-h-[540px] min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
                <AsyncState loading={loading} error={error}>
                  {messages.length === 0 ? (
                    <p className="text-[13px] text-text-muted">
                      Напишите первое сообщение врачу — чат создан автоматически.
                    </p>
                  ) : (
                    messages.map((m) => <ChatBubble key={m.id} message={m} />)
                  )}
                  <div ref={chatEndRef} />
                </AsyncState>
              </Card>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
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
            </>
          }
        />
      </AsyncState>
    </div>
  );
}
