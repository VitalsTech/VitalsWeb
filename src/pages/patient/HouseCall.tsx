import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';

const STEPS = [
  'Вы оставляете заявку с адресом и симптомами.',
  'Диспетчер Vitals назначает врача из клиники-партнёра.',
  'Врач приезжает в выбранный интервал.',
  'Результат визита попадает в ваши документы.',
];

export function HouseCall() {
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate('/patient');
  }

  return (
    <div>
      <PageHeader
        title="Вызов врача на дом"
        description="Оформите заявку — диспетчер подберёт врача и время визита"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Данные заявки</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            <div>
              <FieldLabel>Адрес</FieldLabel>
              <Input defaultValue="ул. Примерная, д. 12, кв. 45" required />
            </div>
            <div>
              <FieldLabel>Симптомы</FieldLabel>
              <Input defaultValue="Повышенное давление, слабость" required />
            </div>
            <div>
              <FieldLabel>Желаемое время</FieldLabel>
              <Input defaultValue="Сегодня, 14:00–18:00" required />
            </div>
            <div>
              <FieldLabel>Контактный телефон</FieldLabel>
              <Input defaultValue="+7 900 123-45-67" required />
            </div>
            <label className="flex h-12 items-center gap-3 rounded-md border border-border px-4 text-[14px] text-text">
              <input type="checkbox" className="accent-[var(--color-accent)]" />
              ⚠ Срочный вызов (доплата)
            </label>
            <Button type="submit" className="w-fit">
              Отправить заявку
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Как это работает</h3>
          <ol className="mt-4 flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step} className="text-[13px] text-text-muted">
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
