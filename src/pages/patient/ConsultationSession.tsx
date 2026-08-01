import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { getConsultationTypeLabel } from '@/api/consultations';
import { formatDayTime } from '@/lib/scheduleSlot';
import { useConsultationBySession } from './useConsultationBySession';

export function ConsultationSession() {
  const { sessionId } = useParams();
  const [draft, setDraft] = useState('');
  const { consultation, messages, loading, sending, error, send } =
    useConsultationBySession(sessionId);

  async function submit() {
    if (!draft.trim()) return;
    await send(draft);
    setDraft('');
  }

  const title = consultation?.doctorName?.trim() || 'Консультация';
  const descriptionParts = [
    getConsultationTypeLabel(consultation),
    consultation?.status,
    consultation?.isScheduled && consultation.scheduledAt
      ? `приём ${formatDayTime(consultation.scheduledAt)}`
      : null,
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        title={title}
        description={descriptionParts.join(' · ') || undefined}
        backTo="/patient/consultations"
        backLabel="К моим консультациям"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {consultation?.isScheduled && (
          <Badge tone="accent">Запись на приём</Badge>
        )}
        {consultation?.isScheduled && consultation.scheduledAt && (
          <span className="text-[13px] text-text-muted">
            {formatDayTime(consultation.scheduledAt)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex max-h-[540px] flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
          <AsyncState loading={loading} error={error}>
            {messages.length === 0 ? (
              <p className="text-[13px] text-text-muted">
                Напишите сообщение врачу — вы в конкретной консультации по записи.
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
            <Button disabled={sending || loading} onClick={() => void submit()}>
              Отпр.
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
