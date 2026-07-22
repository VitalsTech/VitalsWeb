import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import { doctors } from '@/mock/data';

const SLOTS = ['10:00', '10:40', '11:20', '14:00', '15:30'];

export function DoctorBook() {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === id) ?? doctors[0];
  const [slot, setSlot] = useState('10:40');
  const [type, setType] = useState<'inperson' | 'online'>('inperson');
  const [date, setDate] = useState('2026-07-15');
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Запись на приём"
        description={`${doctor.name} · ${doctor.specialty}`}
        backTo={`/patient/doctors/${doctor.id}`}
        backLabel="Назад к врачу"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Выберите дату и время</h3>

          <div className="mt-5">
            <FieldLabel>Дата</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[340px]" />
          </div>

          <div className="mt-5">
            <FieldLabel>Время</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`h-11 w-[110px] rounded-md text-[13px] font-semibold transition-colors ${
                    slot === s
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-surface text-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
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
            <Textarea rows={3} defaultValue="Контроль давления после назначения" />
          </div>

          <Button
            size="lg"
            className="mt-6"
            onClick={() => {
              navigate('/patient/treatment');
            }}
          >
            Подтвердить запись
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Итого</h3>
          <div className="mt-4 flex flex-col gap-2 text-[14px] text-text">
            <p>Врач: {doctor.name}</p>
            <p>
              Дата: {date.split('-').reverse().join('.')}, {slot}
            </p>
            <p>Тип: {type === 'inperson' ? 'Очный приём' : 'Онлайн-приём'}</p>
            <p>Клиника: {doctor.clinic}, терапия</p>
          </div>
          <p className="mt-5 text-[13px] text-text-muted">
            Стоимость уточняется по полису ОМС или тарифу клиники.
          </p>
        </Card>
      </div>
    </div>
  );
}
