import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { AsyncState } from '@/components/AsyncState';
import { getConsultationTypeLabel, type ConsultationProtocolDto } from '@/api/consultations';
import { formatDayTime } from '@/lib/scheduleSlot';
import { useConsultationBySession } from './useConsultationBySession';

function ProtocolBlock({ protocol }: { protocol: ConsultationProtocolDto }) {
  const diagnosis = [protocol.preliminaryDiagnosisIcd10, protocol.preliminaryDiagnosisText]
    .filter(Boolean)
    .join(' — ');
  const prescriptions = protocol.prescriptions ?? [];
  const labs = protocol.labOrders ?? [];

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-text">Протокол консультации</h3>
        <Badge tone="success">Завершена</Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {protocol.complaints && (
          <div>
            <p className="text-[12px] font-semibold text-text-muted">Жалобы</p>
            <p className="mt-1 text-[14px] text-text">{protocol.complaints}</p>
          </div>
        )}
        {diagnosis && (
          <div>
            <p className="text-[12px] font-semibold text-text-muted">Диагноз</p>
            <p className="mt-1 text-[14px] text-text">{diagnosis}</p>
          </div>
        )}
        {protocol.anamnesis && (
          <div className="sm:col-span-2">
            <p className="text-[12px] font-semibold text-text-muted">Анамнез</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] text-text">{protocol.anamnesis}</p>
          </div>
        )}
        {protocol.examinationNotes && (
          <div className="sm:col-span-2">
            <p className="text-[12px] font-semibold text-text-muted">Осмотр</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] text-text">
              {protocol.examinationNotes}
            </p>
          </div>
        )}
        {protocol.recommendations && (
          <div className="sm:col-span-2">
            <p className="text-[12px] font-semibold text-text-muted">Рекомендации</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] text-text">
              {protocol.recommendations}
            </p>
          </div>
        )}
      </div>

      {(prescriptions.length > 0 || labs.length > 0) && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {prescriptions.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-text-muted">Рецепты в протоколе</p>
              <ul className="mt-2 list-inside list-disc text-[13px] text-text">
                {prescriptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-text-muted">
                Оформленные рецепты с QR — в{' '}
                <Link to="/patient/labs" className="font-semibold text-primary underline">
                  Анализы и рецепты
                </Link>
                .
              </p>
            </div>
          )}
          {labs.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-text-muted">Направления на анализы</p>
              <ul className="mt-2 list-inside list-disc text-[13px] text-text">
                {labs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <ButtonLink to="/patient/labs" size="sm" variant="secondary" className="mt-3">
                Статусы анализов
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

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

  const status = (consultation?.status ?? '').toLowerCase();
  const closed =
    consultation?.hasProtocol ||
    Boolean(consultation?.protocol) ||
    status === 'completed' ||
    status === 'doctorleft';
  const protocol = consultation?.protocol ?? null;

  return (
    <div>
      <PageHeader
        title={title}
        description={descriptionParts.join(' · ') || undefined}
        backTo="/patient/consultations"
        backLabel="К моим консультациям"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {consultation?.isScheduled && <Badge tone="accent">Запись на приём</Badge>}
        {closed && <Badge tone="success">Протокол доступен</Badge>}
        {consultation?.isScheduled && consultation.scheduledAt && (
          <span className="text-[13px] text-text-muted">
            {formatDayTime(consultation.scheduledAt)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {protocol && <ProtocolBlock protocol={protocol} />}

        <Card className="flex max-h-[540px] flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
          <AsyncState loading={loading} error={error}>
            {messages.length === 0 ? (
              <p className="text-[13px] text-text-muted">
                {closed
                  ? 'Сообщений в этой консультации нет.'
                  : 'Напишите сообщение врачу — вы в конкретной консультации.'}
              </p>
            ) : (
              messages.map((m) => <ChatBubble key={m.id} message={m} />)
            )}
          </AsyncState>
        </Card>

        {!closed && (
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
        )}
      </div>
    </div>
  );
}
