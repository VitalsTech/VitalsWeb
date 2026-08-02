import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FieldLabel, Input } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import {
  doctorsApi,
  type DoctorCalendarConsultationDto,
  type DoctorCalendarSlotDto,
  type DoctorCalendarSlotStatus,
} from '@/api/doctors';
import { formatApiError } from '@/api/http';
import {
  formatDayTime,
  formatSlotRange,
  isSlotOnline,
  localDateKey,
  slotEndIso,
  slotKey,
  slotLocalDateKey,
  slotStartIso,
  slotStatus,
  sortSlotsByStart,
} from '@/lib/scheduleSlot';
import { urgencyLabel, urgencyTone } from '@/lib/urgency';
import { CalendarSlotDetails, type CalendarSelection } from './CalendarSlotDetails';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_STYLES: Record<DoctorCalendarSlotStatus, string> = {
  booked: 'border-primary bg-primary/15 text-text hover:bg-primary/25',
  available: 'border-transparent bg-accent/20 text-text hover:bg-accent/30',
  closed: 'border-border bg-surface-muted text-text-muted hover:bg-surface-muted/70',
};

const STATUS_LABELS: Record<DoctorCalendarSlotStatus, string> = {
  booked: 'занят',
  available: 'свободен',
  closed: 'закрыт',
};

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function consultationBadge(consultation: DoctorCalendarConsultationDto) {
  const triage = consultation.triage;
  const level = triage?.urgencyLevel ?? consultation.urgencyLevel;
  const label = urgencyLabel(triage?.urgencyLabel, triage?.urgency, level);
  return label ? { label, tone: urgencyTone(triage?.urgency, level) } : null;
}

type CalendarView = 'week' | 'day';

function SlotCell({
  slot,
  onSelect,
}: {
  slot: DoctorCalendarSlotDto;
  onSelect: (selection: CalendarSelection) => void;
}) {
  const status = slotStatus(slot);
  const consultation = slot.consultation ?? null;
  const badge = consultation ? consultationBadge(consultation) : null;
  return (
    <button
      type="button"
      onClick={() => onSelect({ slot, consultation })}
      title={`${formatSlotRange(slot)} — ${STATUS_LABELS[status]}`}
      className={`w-full rounded-md border px-2 py-2 text-left text-[11px] transition-colors ${STATUS_STYLES[status]}`}
    >
      <p className="font-semibold">{formatSlotRange(slot)}</p>
      <p className="text-[10px] opacity-80">
        {isSlotOnline(slot) ? 'онлайн' : 'очно'} · {STATUS_LABELS[status]}
      </p>
      {consultation && (
        <p className="mt-1 truncate text-[11px] font-semibold">
          {consultation.patient?.fullName ?? 'Пациент'}
        </p>
      )}
      {badge && (
        <Badge tone={badge.tone} className="mt-1 px-2 py-0.5 text-[10px]">
          {badge.label}
        </Badge>
      )}
      {consultation?.unreadCount ? (
        <p className="mt-1 text-[10px] font-semibold text-danger">
          новых сообщений: {consultation.unreadCount}
        </p>
      ) : null}
    </button>
  );
}

export function Calendar() {
  const [view, setView] = useState<CalendarView>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slotBusy, setSlotBusy] = useState(false);
  const [selection, setSelection] = useState<CalendarSelection | null>(null);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isOnline, setIsOnline] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const dayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const fromIso = view === 'week' ? weekStart.toISOString() : dayDate.toISOString();
  const days = view === 'week' ? 7 : 1;

  const calendarQuery = useAsyncData(
    () => doctorsApi.myCalendar({ from: fromIso, days }),
    [fromIso, days],
  );

  const slots = useMemo(() => calendarQuery.data?.slots ?? [], [calendarQuery.data]);
  const unscheduled = useMemo(
    () => calendarQuery.data?.unscheduledConsultations ?? [],
    [calendarQuery.data],
  );

  const weekDays = useMemo(() => {
    return WEEK_DAYS.map((label, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      const key = localDateKey(day);
      return {
        label,
        date: day,
        key,
        slots: sortSlotsByStart(slots.filter((slot) => slotLocalDateKey(slot) === key)),
      };
    });
  }, [weekStart, slots]);

  const daySlots = useMemo(
    () => sortSlotsByStart(slots.filter((slot) => slotLocalDateKey(slot) === localDateKey(dayDate))),
    [slots, dayDate],
  );

  const summary = useMemo(() => {
    const counters = { booked: 0, available: 0, closed: 0 };
    for (const slot of slots) counters[slotStatus(slot)] += 1;
    return counters;
  }, [slots]);

  async function handleCreateSlot(e: FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;
    setSaving(true);
    setFormError(null);
    try {
      await doctorsApi.createOrUpdateScheduleSlot({
        // Локальное время формы переводим в UTC с суффиксом Z — так ждёт gateway.
        startsAt: new Date(`${date}T${startTime}:00`).toISOString(),
        endsAt: new Date(`${date}T${endTime}:00`).toISOString(),
        isOnline,
        isAvailable,
        available: isAvailable,
      });
      calendarQuery.reload();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailability(slot: DoctorCalendarSlotDto) {
    setSlotBusy(true);
    setFormError(null);
    try {
      const nextAvailable = slotStatus(slot) !== 'available';
      await doctorsApi.createOrUpdateScheduleSlot({
        id: slot.id,
        startsAt: slotStartIso(slot),
        endsAt: slotEndIso(slot),
        isOnline: isSlotOnline(slot),
        isAvailable: nextAvailable,
        available: nextAvailable,
      });
      setSelection(null);
      calendarQuery.reload();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSlotBusy(false);
    }
  }

  async function handleDeleteSlot(slot: DoctorCalendarSlotDto) {
    if (!slot.id) return;
    setSlotBusy(true);
    setFormError(null);
    try {
      await doctorsApi.deleteScheduleSlot(slot.id);
      setSelection(null);
      calendarQuery.reload();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSlotBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Календарь"
        description="Слоты расписания и занятость: нажмите на ячейку, чтобы увидеть детали."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => setView('week')}
            className={`h-9 px-3 text-[13px] font-semibold transition-colors ${
              view === 'week' ? 'bg-primary text-primary-foreground' : 'bg-surface text-text'
            }`}
          >
            Неделя
          </button>
          <button
            type="button"
            onClick={() => setView('day')}
            className={`h-9 px-3 text-[13px] font-semibold transition-colors ${
              view === 'day' ? 'bg-primary text-primary-foreground' : 'bg-surface text-text'
            }`}
          >
            День
          </button>
        </div>

        {view === 'week' ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset((v) => v - 1)}>
              ← Неделя
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setWeekOffset(0);
                setDayOffset(0);
              }}
            >
              Сегодня
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekOffset((v) => v + 1)}>
              Неделя →
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => setDayOffset((v) => v - 1)}>
              ← День
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDayOffset(0);
                setWeekOffset(0);
              }}
            >
              Сегодня
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDayOffset((v) => v + 1)}>
              День →
            </Button>
            <span className="text-[13px] font-semibold text-text">
              {dayDate.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </span>
          </>
        )}

        <span className="text-[13px] text-text-muted">
          Занято: {summary.booked} · Свободно: {summary.available} · Закрыто: {summary.closed}
        </span>
      </div>

      <AsyncState
        loading={calendarQuery.loading}
        error={calendarQuery.error}
        onRetry={calendarQuery.reload}
      >
        {view === 'week' ? (
          <Card className="overflow-x-auto p-4">
            <div className="flex min-w-[720px] gap-2">
              {weekDays.map((day) => (
                <div key={day.key} className="min-w-[110px] flex-1 rounded-md border border-border p-2">
                  <p className="text-center text-[12px] font-semibold text-text">{day.label}</p>
                  <p className="text-center text-[11px] text-text-muted">
                    {day.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {day.slots.length === 0 ? (
                      <p className="text-center text-[11px] text-text-muted">—</p>
                    ) : (
                      day.slots.map((slot) => (
                        <SlotCell key={slotKey(slot)} slot={slot} onSelect={setSelection} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            {daySlots.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-text-muted">
                На этот день слотов нет.
              </p>
            ) : (
              <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {daySlots.map((slot) => (
                  <SlotCell key={slotKey(slot)} slot={slot} onSelect={setSelection} />
                ))}
              </div>
            )}
          </Card>
        )}
      </AsyncState>

      {unscheduled.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="text-[16px] font-semibold text-text">Вне расписания</h3>
          <p className="mt-1 text-[13px] text-text-muted">
            Незакрытые консультации без брони — созданы триажем или записаны до появления
            бронирования.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {unscheduled.map((consultation) => {
              const badge = consultationBadge(consultation);
              return (
                <button
                  key={consultation.sessionId ?? consultation.patient?.patientId}
                  type="button"
                  onClick={() => setSelection({ consultation })}
                  className="rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-text">
                      {consultation.patient?.fullName ?? 'Пациент'}
                    </p>
                    {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
                  </div>
                  <p className="mt-1 text-[12px] text-text-muted">
                    {formatDayTime(consultation.scheduledAt ?? consultation.createdAt)}
                    {consultation.status ? ` · ${consultation.status}` : ''}
                  </p>
                  {consultation.triage?.complaints && (
                    <p className="mt-2 line-clamp-2 text-[13px] text-text">
                      {consultation.triage.complaints}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Новый слот</h3>
        <form onSubmit={(e) => void handleCreateSlot(e)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Дата</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <FieldLabel>Начало</FieldLabel>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <FieldLabel>Конец</FieldLabel>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-[14px] text-text">
            <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
            Онлайн
          </label>
          <label className="flex items-center gap-2 text-[14px] text-text">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Доступен для записи
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить слот'}
            </Button>
          </div>
        </form>
        {formError && <p className="mt-3 text-[13px] text-danger">{formError}</p>}
      </Card>

      {selection && (
        <CalendarSlotDetails
          selection={selection}
          busy={slotBusy}
          onClose={() => setSelection(null)}
          onToggleAvailability={(slot) => void handleToggleAvailability(slot)}
          onDelete={(slot) => void handleDeleteSlot(slot)}
          onConsultationCompleted={() => calendarQuery.reload()}
        />
      )}
    </div>
  );
}
