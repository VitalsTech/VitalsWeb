import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import {
  consultationsApi,
  getConsultationId,
  getConsultationTypeLabel,
  normalizeMine,
  type ConsultationDto,
} from '@/api/consultations';
import { formatDayTime } from '@/lib/scheduleSlot';
import { urgencyLabel, urgencyTone } from '@/lib/urgency';

function sortByActivity(a: ConsultationDto, b: ConsultationDto) {
  const aKey = a.scheduledAt ?? a.lastActivityAt ?? a.createdAt ?? '';
  const bKey = b.scheduledAt ?? b.lastActivityAt ?? b.createdAt ?? '';
  return bKey.localeCompare(aKey);
}

function ConsultationRow({
  item,
  onOpen,
}: {
  item: ConsultationDto;
  onOpen: (sessionId: string) => void;
}) {
  const sessionId = getConsultationId(item);
  const unread = item.patientUnreadCount ?? 0;
  const badge = urgencyLabel(null, null, item.urgencyLevel);

  return (
    <button
      type="button"
      disabled={!sessionId}
      onClick={() => sessionId && onOpen(sessionId)}
      className="flex w-full flex-col gap-1 rounded-md border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary disabled:opacity-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-text">
            {item.doctorName?.trim() || 'Врач'}
          </p>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {getConsultationTypeLabel(item)}
            {item.status ? ` · ${item.status}` : ''}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          {badge && <Badge tone={urgencyTone(null, item.urgencyLevel)}>{badge}</Badge>}
          {unread > 0 && (
            <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
              {unread}
            </span>
          )}
        </div>
      </div>

      {item.isScheduled && item.scheduledAt ? (
        <p className="mt-1 text-[13px] font-semibold text-text">
          Приём: {formatDayTime(item.scheduledAt)}
        </p>
      ) : (
        <p className="mt-1 text-[12px] text-text-muted">
          Активность: {formatDayTime(item.lastActivityAt ?? item.createdAt)}
        </p>
      )}
    </button>
  );
}

export function MyConsultations() {
  const navigate = useNavigate();

  const query = useAsyncData(
    () => consultationsApi.listMine({ includeCompleted: false, limit: 50 }),
    [],
  );

  const items = useMemo(() => normalizeMine(query.data), [query.data]);

  const scheduled = useMemo(
    () => items.filter((item) => item.isScheduled === true).sort(sortByActivity),
    [items],
  );
  const chats = useMemo(
    () => items.filter((item) => item.isScheduled !== true).sort(sortByActivity),
    [items],
  );

  function openSession(sessionId: string) {
    navigate(`/patient/consultations/${sessionId}`);
  }

  return (
    <div>
      <PageHeader
        title="Мои консультации"
        description="Записи на приём и чаты с врачами"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <AsyncState loading={query.loading} error={query.error} onRetry={query.reload}>
        {items.length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-text-muted">
              Пока нет консультаций. Запишитесь к врачу или напишите в чат — записи появятся здесь.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-[16px] font-semibold text-text">Запланированные</h3>
              <p className="mt-1 text-[13px] text-text-muted">
                Записи на слот расписания — с датой и временем приёма.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {scheduled.length === 0 ? (
                  <p className="text-[13px] text-text-muted">Нет запланированных приёмов.</p>
                ) : (
                  scheduled.map((item) => (
                    <ConsultationRow
                      key={getConsultationId(item)}
                      item={item}
                      onOpen={openSession}
                    />
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-[16px] font-semibold text-text">Чаты</h3>
              <p className="mt-1 text-[13px] text-text-muted">
                Свободные консультации без брони слота.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {chats.length === 0 ? (
                  <p className="text-[13px] text-text-muted">Нет активных чатов.</p>
                ) : (
                  chats.map((item) => (
                    <ConsultationRow
                      key={getConsultationId(item)}
                      item={item}
                      onOpen={openSession}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </AsyncState>
    </div>
  );
}
