import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi } from '@/api/medicalRecords';
import { consultationsApi, normalizeMine } from '@/api/consultations';
import {
  pickLatestConsultation,
  summaryFromConsultation,
} from '@/lib/consultationSummary';
import { patientIdCandidates, resolvePatientIdentity } from '@/lib/resolvePatientId';
import { useChatAutoScroll } from '@/lib/useChatAutoScroll';
import { useConsultationChat } from './useConsultationChat';
import { getContact, removeContact, upsertContact } from './contacts';
import { CompleteConsultationModal } from './CompleteConsultationModal';

export function PatientChat() {
  const { patientId: rawPatientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { doctorId } = useAuth();
  const [draft, setDraft] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const sessionIdParam = searchParams.get('sessionId');

  const identityQuery = useAsyncData(
    () => (rawPatientId ? resolvePatientIdentity(rawPatientId) : Promise.resolve(null)),
    [rawPatientId],
  );
  const patientId = identityQuery.data?.profileId;
  const patientAliases = patientIdCandidates(identityQuery.data ?? undefined);

  const contact =
    getContact(doctorId, patientId) ?? getContact(doctorId, rawPatientId);

  const state = useAsyncData(
    () =>
      patientId
        ? medicalRecordsApi.getStateAliases(
            patientAliases.length > 0 ? patientAliases : [patientId],
          )
        : Promise.resolve(null),
    [patientId, patientAliases.join('|')],
  );

  const mineQuery = useAsyncData(
    () => consultationsApi.listMine({ includeCompleted: true, limit: 100 }).catch(() => null),
    [patientId, doctorId],
  );

  const latestConsultation = pickLatestConsultation(
    normalizeMine(mineQuery.data),
    patientId,
    patientAliases,
  );
  const consultationSummary = summaryFromConsultation(latestConsultation);
  const summaryText =
    state.data?.summary ??
    consultationSummary ??
    contact?.summary ??
    'Сводка появится после консультации.';

  const { sessionId, messages, loading, sending, error, send } = useConsultationChat(
    doctorId,
    patientId,
    sessionIdParam,
    patientAliases,
  );
  const chatEndRef = useChatAutoScroll([messages, sending, loading]);

  useEffect(() => {
    const identity = identityQuery.data;
    if (!doctorId || !identity) return;
    upsertContact(doctorId, {
      patientId: identity.profileId,
      label: identity.fullName,
      summary: consultationSummary ?? state.data?.summary,
    });
    if (identity.publicId && identity.publicId !== identity.profileId) {
      removeContact(doctorId, identity.publicId);
    }
    if (rawPatientId && rawPatientId !== identity.profileId) {
      const qs = sessionIdParam ? `?sessionId=${sessionIdParam}` : '';
      navigate(`/doctor/patients/${identity.profileId}/chat${qs}`, { replace: true });
    }
  }, [
    doctorId,
    identityQuery.data,
    rawPatientId,
    consultationSummary,
    state.data?.summary,
    navigate,
    sessionIdParam,
  ]);

  async function submit() {
    if (!draft.trim() || completed) return;
    await send(draft);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title={contact?.label ?? identityQuery.data?.fullName ?? 'Пациент'}
        description={
          completed
            ? 'Консультация завершена · протокол сохранён'
            : 'Консультация онлайн · Чат с пациентом'
        }
        backTo={`/doctor/patients/${patientId ?? rawPatientId}`}
        backLabel="К карте пациента"
        actions={
          sessionId && !completed ? (
            <Button variant="secondary" onClick={() => setCompleteOpen(true)}>
              Завершить консультацию
            </Button>
          ) : undefined
        }
      />

      {completed && (
        <Card className="mb-6 border-accent/40 bg-accent/10 p-4">
          <p className="text-[14px] font-semibold text-text">Протокол сохранён</p>
          <p className="mt-1 text-[13px] text-text-muted">
            Пациент получит уведомление. Можно вернуться к карте или календарю.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={() => navigate(`/doctor/patients/${patientId ?? rawPatientId}`)}
            >
              К карте пациента
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/doctor/calendar')}>
              В календарь
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Контекст пациента</h3>
          <AsyncState
            loading={state.loading || mineQuery.loading || identityQuery.loading}
            error={null}
            onRetry={() => {
              state.reload();
              mineQuery.reload();
              identityQuery.reload();
            }}
          >
            <p className="mt-3 text-[13px] text-text-muted">{summaryText}</p>
            <p className="mt-3 text-[13px] text-text-muted">
              Аллергии: {state.data?.allergies ?? 'не указаны'}
            </p>
            {state.error && (
              <p className="mt-3 text-[12px] text-text-muted">Сводка недоступна.</p>
            )}
          </AsyncState>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex max-h-[540px] flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
            <AsyncState loading={loading || identityQuery.loading} error={error}>
              {messages.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  Напишите первое сообщение пациенту - чат создан автоматически.
                </p>
              ) : (
                messages.map((m) => <ChatBubble key={m.id} message={m} />)
              )}
              <div ref={chatEndRef} />
            </AsyncState>
          </Card>

          {!completed && (
            <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Напишите сообщение…"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />
              <div className="flex gap-3">
                <Button variant="secondary" disabled>
                  Файл
                </Button>
                <Button variant="secondary" disabled>
                  Рецепт
                </Button>
                <Button disabled={sending || !sessionId} onClick={() => void submit()}>
                  Отправить
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {completeOpen && sessionId && (
        <CompleteConsultationModal
          sessionId={sessionId}
          patientId={patientId}
          onClose={() => setCompleteOpen(false)}
          onCompleted={() => {
            setCompleteOpen(false);
            setCompleted(true);
            mineQuery.reload();
            state.reload();
          }}
        />
      )}
    </div>
  );
}
