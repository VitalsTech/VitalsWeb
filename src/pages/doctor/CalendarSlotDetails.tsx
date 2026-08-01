import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type {
  DoctorCalendarConsultationDto,
  DoctorCalendarSlotDto,
  DoctorCalendarTriageDto,
} from '@/api/doctors';
import { formatConsultationType } from '@/api/consultations';
import {
  formatDayLabel,
  formatDayTime,
  formatSlotRange,
  isSlotOnline,
  slotStartIso,
  slotStatus,
} from '@/lib/scheduleSlot';
import { urgencyLabel, urgencyTone } from '@/lib/urgency';

export interface CalendarSelection {
  /** Отсутствует для консультаций вне сетки расписания. */
  slot?: DoctorCalendarSlotDto;
  consultation?: DoctorCalendarConsultationDto | null;
}

const SEX_LABELS: Record<string, string> = { male: 'муж.', female: 'жен.' };

function formatPatient(consultation: DoctorCalendarConsultationDto): string {
  const patient = consultation.patient;
  const parts = [
    patient?.age != null ? `${patient.age} лет` : null,
    patient?.sex ? (SEX_LABELS[patient.sex.toLowerCase()] ?? patient.sex) : null,
  ].filter(Boolean);
  return parts.join(', ');
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[12px] font-semibold text-text-muted">{title}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="text-[13px] text-text">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TriageBlock({ triage }: { triage: DoctorCalendarTriageDto }) {
  const symptoms = triage.symptoms ?? [];
  const hypotheses = triage.hypotheses ?? [];

  return (
    <div className="mt-5 rounded-md border border-border bg-surface-muted p-4">
      <p className="text-[13px] font-semibold text-text">Триаж</p>

      {triage.emergencyWarning && (
        <p className="mt-2 rounded-md bg-danger/15 px-3 py-2 text-[13px] font-semibold text-danger">
          Признаки экстренного состояния — требуется немедленная оценка.
        </p>
      )}

      {triage.complaints && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-text-muted">Жалобы</p>
          <p className="mt-1 text-[13px] text-text">{triage.complaints}</p>
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-text-muted">Симптомы</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {symptoms.map((symptom) => (
              <span
                key={symptom}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-text"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>
      )}

      {hypotheses.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-text-muted">Гипотезы</p>
          <ul className="mt-1 flex flex-col gap-1">
            {hypotheses.map((hypothesis) => (
              <li key={hypothesis.condition} className="text-[13px] text-text">
                · {hypothesis.condition}
                {hypothesis.probability != null && (
                  <span className="text-text-muted">
                    {' '}
                    — {Math.round(hypothesis.probability * 100)}%
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(triage.recommendation || triage.recommendedSpecialization) && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-text-muted">Рекомендация ИИ</p>
          <p className="mt-1 text-[13px] text-text">
            {triage.recommendation ?? '—'}
            {triage.recommendedSpecialization ? ` · ${triage.recommendedSpecialization}` : ''}
          </p>
        </div>
      )}

      <p className="mt-3 text-[12px] text-text-muted">
        {triage.canBeRemote ? 'Возможна дистанционная консультация' : 'Рекомендован очный осмотр'}
      </p>
    </div>
  );
}

export function CalendarSlotDetails({
  selection,
  onClose,
  onToggleAvailability,
  onDelete,
  busy = false,
}: {
  selection: CalendarSelection;
  onClose: () => void;
  onToggleAvailability?: (slot: DoctorCalendarSlotDto) => void;
  onDelete?: (slot: DoctorCalendarSlotDto) => void;
  busy?: boolean;
}) {
  const navigate = useNavigate();
  const { slot, consultation } = selection;
  const status = slot ? slotStatus(slot) : 'booked';
  const triage = consultation?.triage;
  const anamnesis = consultation?.anamnesis;
  const badge = consultation
    ? urgencyLabel(triage?.urgencyLabel, triage?.urgency, triage?.urgencyLevel ?? consultation.urgencyLevel)
    : null;

  const when = slot
    ? `${formatDayLabel(slotStartIso(slot))} · ${formatSlotRange(slot)}`
    : formatDayTime(consultation?.scheduledAt ?? consultation?.createdAt);

  return (
    <Modal onClose={onClose} widthClassName="max-w-[640px]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-semibold text-accent">
          {consultation ? 'Консультация' : status === 'available' ? 'Свободный слот' : 'Слот закрыт'}
        </p>
        {badge && (
          <Badge tone={urgencyTone(triage?.urgency, triage?.urgencyLevel ?? consultation?.urgencyLevel)}>
            {badge}
          </Badge>
        )}
        {!slot && consultation && <Badge tone="neutral">вне расписания</Badge>}
      </div>

      <h2 className="mt-2 text-[24px] font-bold text-text">
        {consultation?.patient?.fullName ?? (consultation ? 'Пациент' : 'Приём не занят')}
      </h2>

      <p className="mt-2 text-[14px] text-text-muted">
        {when}
        {slot ? ` · ${isSlotOnline(slot) ? 'онлайн' : 'очно'}` : ''}
        {consultation ? ` · ${formatConsultationType(consultation.type)}` : ''}
      </p>

      {consultation && (
        <p className="mt-1 text-[13px] text-text-muted">
          {formatPatient(consultation) || 'Данные пациента не указаны'}
          {consultation.status ? ` · статус: ${consultation.status}` : ''}
          {consultation.unreadCount ? ` · непрочитанных: ${consultation.unreadCount}` : ''}
        </p>
      )}

      {triage ? (
        <TriageBlock triage={triage} />
      ) : consultation ? (
        <p className="mt-5 text-[13px] text-text-muted">Данных триажа нет.</p>
      ) : null}

      {anamnesis?.hasData && (
        <div className="mt-4 rounded-md border border-border bg-surface-muted p-4">
          <p className="text-[13px] font-semibold text-text">Анамнез</p>
          <div className="mt-3 flex flex-col gap-3">
            <List title="Активные диагнозы" items={anamnesis.activeDiagnoses ?? []} />
            <List title="Препараты" items={anamnesis.activeMedications ?? []} />
            <List title="Аллергии" items={anamnesis.allergies ?? []} />
            <List title="Последние анализы" items={anamnesis.recentLabResults ?? []} />
            {anamnesis.latestVital && (
              <div>
                <p className="text-[12px] font-semibold text-text-muted">Последний показатель</p>
                <p className="mt-1 text-[13px] text-text">{anamnesis.latestVital}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {consultation?.patient?.patientId && (
          <>
            <Button
              onClick={() =>
                navigate(
                  `/doctor/patients/${consultation.patient?.patientId}/chat${
                    consultation.sessionId ? `?sessionId=${consultation.sessionId}` : ''
                  }`,
                )
              }
            >
              Открыть чат консультации
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/doctor/patients/${consultation.patient?.patientId}`)}
            >
              Карта пациента
            </Button>
          </>
        )}

        {slot && !consultation && onToggleAvailability && (
          <Button variant="secondary" disabled={busy} onClick={() => onToggleAvailability(slot)}>
            {status === 'available' ? 'Закрыть для записи' : 'Открыть для записи'}
          </Button>
        )}

        {slot?.id && !consultation && onDelete && (
          <Button variant="secondary" disabled={busy} onClick={() => onDelete(slot)}>
            Удалить слот
          </Button>
        )}
      </div>
    </Modal>
  );
}
