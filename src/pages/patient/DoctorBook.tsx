import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { doctorsApi, formatDoctorName, formatDoctorSpecialty, normalizeSchedule } from '@/api/doctors';
import { consultationsApi, CONSULTATION_TYPE, formatConsultationType } from '@/api/consultations';
import { ApiError, formatApiError } from '@/api/http';
import {
  formatSlotRange,
  groupSlotsByDayPart,
  isSlotAvailable,
  isSlotOnline,
  localDateKey,
  slotKey,
  slotLocalDateKey,
  slotStartDate,
  sortSlotsByStart,
} from '@/lib/scheduleSlot';

export function DoctorBook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [today] = useState(() => localDateKey(new Date()));
  const [date, setDate] = useState(today);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [type, setType] = useState<'inperson' | 'online'>(
    searchParams.get('type') === 'online' ? 'online' : 'inperson',
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: doctor, loading: doctorLoading, error: doctorError, reload: reloadDoctor } = useAsyncData(
    () => (id ? doctorsApi.get(id) : Promise.reject(new Error('Не указан врач'))),
    [id],
  );

  const {
    data: scheduleData,
    loading: scheduleLoading,
    error: scheduleError,
    reload: reloadSchedule,
  } = useAsyncData(async () => {
    if (!id) return null;
    const response = await doctorsApi.schedule(id, { from: `${date}T00:00:00`, days: 1 });
    return { slots: normalizeSchedule(response), loadedAt: Date.now() };
  }, [id, date]);

  /** Только свободные ячейки (`isAvailable: true`) на выбранную дату; прошедшие скрываем. */
  const freeSlots = useMemo(() => {
    const loadedAt = scheduleData?.loadedAt ?? 0;
    return sortSlotsByStart(
      (scheduleData?.slots ?? []).filter((slot) => {
        if (!isSlotAvailable(slot) || !slot.id) return false;
        if (slotLocalDateKey(slot) !== date) return false;
        const start = slotStartDate(slot);
        return start !== null && start.getTime() > loadedAt;
      }),
    );
  }, [scheduleData, date]);

  const slotGroups = useMemo(() => groupSlotsByDayPart(freeSlots), [freeSlots]);
  const selectedSlot = useMemo(
    () => freeSlots.find((slot) => slotKey(slot) === selectedKey) ?? null,
    [freeSlots, selectedKey],
  );

  const consultationType =
    type === 'inperson' ? CONSULTATION_TYPE.inPerson : CONSULTATION_TYPE.video;

  function selectSlot(slot: (typeof freeSlots)[number]) {
    setSelectedKey(slotKey(slot));
    setType(isSlotOnline(slot) ? 'online' : 'inperson');
    setSubmitError(null);
  }

  async function confirm() {
    if (!id || !selectedSlot?.id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await consultationsApi.book({
        doctorId: id,
        slotId: selectedSlot.id,
        consultationType,
        urgencyLevel: 3,
        triageSessionId: searchParams.get('triageSessionId'),
      });
      setConfirmed(true);
      const sessionId = booking.sessionId;
      setTimeout(
        () => navigate(sessionId ? `/patient/consultations/${sessionId}` : '/patient/consultations'),
        600,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSelectedKey(null);
        setSubmitError('Этот слот только что заняли - выберите другое время.');
        reloadSchedule();
      } else {
        setSubmitError(formatApiError(err, 'Не удалось записаться на приём.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Запись на приём"
        description={doctor ? `${formatDoctorName(doctor)} · ${formatDoctorSpecialty(doctor)}` : undefined}
        backTo={`/patient/doctors/${id}`}
        backLabel="Назад к врачу"
      />

      <AsyncState loading={doctorLoading} error={doctorError} onRetry={reloadDoctor}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Выберите дату и время</h3>

            <div className="mt-5">
              <FieldLabel>Дата</FieldLabel>
              <Input
                type="date"
                value={date}
                min={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedKey(null);
                  setSubmitError(null);
                }}
                className="max-w-[340px]"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel>Время</FieldLabel>
                {!scheduleLoading && !scheduleError && freeSlots.length > 0 && (
                  <span className="mb-1.5 text-[12px] text-text-muted">
                    Свободных ячеек: {freeSlots.length}
                  </span>
                )}
              </div>

              {scheduleLoading ? (
                <p className="text-[13px] text-text-muted">Загрузка расписания…</p>
              ) : scheduleError ? (
                <div className="flex items-center gap-3">
                  <p className="text-[13px] text-danger">{scheduleError}</p>
                  <button
                    type="button"
                    onClick={reloadSchedule}
                    className="text-[13px] font-semibold text-primary underline"
                  >
                    Повторить
                  </button>
                </div>
              ) : freeSlots.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  На выбранную дату свободных слотов нет - попробуйте другую дату.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {slotGroups.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {group.slots.map((slot) => {
                          const key = slotKey(slot);
                          const selected = key === selectedKey;
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => selectSlot(slot)}
                              className={`flex h-[52px] min-w-[128px] flex-col items-center justify-center rounded-md px-3 transition-colors ${
                                selected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border border-border bg-surface text-text hover:border-primary'
                              }`}
                            >
                              <span className="text-[14px] font-semibold leading-none">
                                {formatSlotRange(slot)}
                              </span>
                              <span
                                className={`mt-1 text-[11px] leading-none ${
                                  selected ? 'text-primary-foreground/80' : 'text-text-muted'
                                }`}
                              >
                                {isSlotOnline(slot) ? 'онлайн' : 'очно'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <FieldLabel>Тип приёма</FieldLabel>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('inperson')}
                  className={`h-11 w-[140px] rounded-md text-[13px] font-semibold transition-colors ${
                    type === 'inperson'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-surface text-text'
                  }`}
                >
                  Очный
                </button>
                <button
                  type="button"
                  onClick={() => setType('online')}
                  className={`h-11 w-[140px] rounded-md text-[13px] font-semibold transition-colors ${
                    type === 'online'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-surface text-text'
                  }`}
                >
                  Онлайн
                </button>
              </div>
              {selectedSlot && (
                <p className="mt-2 text-[12px] text-text-muted">
                  Тип взят из выбранной ячейки расписания.
                </p>
              )}
            </div>

            {submitError && <p className="mt-4 text-[13px] text-danger">{submitError}</p>}

            <Button
              size="lg"
              className="mt-6"
              disabled={submitting || !selectedSlot || confirmed}
              onClick={() => void confirm()}
            >
              {confirmed ? 'Запись создана ✓' : submitting ? 'Отправка…' : 'Подтвердить запись'}
            </Button>
            {freeSlots.length > 0 && !selectedSlot && !confirmed && (
              <p className="mt-2 text-[12px] text-text-muted">Выберите свободную ячейку времени.</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Итого</h3>
            <div className="mt-4 flex flex-col gap-2 text-[14px] text-text">
              <p>Врач: {doctor ? formatDoctorName(doctor) : '-'}</p>
              <p>Дата: {date.split('-').reverse().join('.')}</p>
              <p>Время: {selectedSlot ? formatSlotRange(selectedSlot) : 'не выбрано'}</p>
              <p>Тип: {formatConsultationType(consultationType)}</p>
            </div>
            <p className="mt-5 text-[13px] text-text-muted">
              Стоимость уточняется по полису ОМС или тарифу клиники.
            </p>
          </Card>
        </div>
      </AsyncState>
    </div>
  );
}
