import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { doctorsApi, formatDoctorName, formatDoctorSpecialty, normalizeSchedule } from '@/api/doctors';
import { consultationsApi } from '@/api/consultations';

function formatSlotTime(slot: { start?: string; startTime?: string }): string {
  const raw = slot.start ?? slot.startTime;
  if (!raw) return '—';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function DoctorBook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { patientId } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string | null>(null);
  const [type, setType] = useState<'inperson' | 'online'>(
    searchParams.get('type') === 'online' ? 'online' : 'inperson',
  );
  const [comment, setComment] = useState('Контроль состояния после назначения');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: doctor, loading: doctorLoading, error: doctorError, reload: reloadDoctor } = useAsyncData(
    () => (id ? doctorsApi.get(id) : Promise.reject(new Error('Не указан врач'))),
    [id],
  );

  const { data: scheduleData, loading: scheduleLoading } = useAsyncData(
    () => (id ? doctorsApi.schedule(id, { from: `${date}T00:00:00`, days: 1 }) : Promise.resolve(null)),
    [id, date],
  );

  const slots = normalizeSchedule(scheduleData);

  async function confirm() {
    if (!id || !patientId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await consultationsApi.create({
        patientId,
        doctorId: id,
        doctorName: doctor ? formatDoctorName(doctor) : undefined,
        consultationType: type === 'inperson' ? 'in_person' : 'online',
        primarySymptom: comment,
      });
      setConfirmed(true);
      setTimeout(() => navigate('/patient/treatment'), 800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не удалось создать запись.');
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
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
                className="max-w-[340px]"
              />
            </div>

            <div className="mt-5">
              <FieldLabel>Время</FieldLabel>
              {scheduleLoading ? (
                <p className="text-[13px] text-text-muted">Загрузка расписания…</p>
              ) : slots.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  На выбранную дату свободных слотов не найдено — попробуйте другую дату.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {slots.map((s, i) => {
                    const time = formatSlotTime(s);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={s.available === false}
                        onClick={() => setSlot(time)}
                        className={`h-11 w-[110px] rounded-md text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                          slot === time
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-surface text-text'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
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
            </div>

            <div className="mt-5">
              <FieldLabel>Комментарий</FieldLabel>
              <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            {submitError && <p className="mt-4 text-[13px] text-danger">{submitError}</p>}

            <Button size="lg" className="mt-6" disabled={submitting} onClick={confirm}>
              {confirmed ? 'Запись создана ✓' : submitting ? 'Отправка…' : 'Подтвердить запись'}
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Итого</h3>
            <div className="mt-4 flex flex-col gap-2 text-[14px] text-text">
              <p>Врач: {doctor ? formatDoctorName(doctor) : '—'}</p>
              <p>
                Дата: {date.split('-').reverse().join('.')}
                {slot ? `, ${slot}` : ''}
              </p>
              <p>Тип: {type === 'inperson' ? 'Очный приём' : 'Онлайн-приём'}</p>
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
