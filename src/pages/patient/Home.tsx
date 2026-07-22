import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthProvider';
import { careSteps } from '@/mock/data';

const MOODS = ['Хорошо', 'Устала', 'Стало хуже'];

const STEP_LINK: Record<string, string> = {
  triage: '/patient/ai-chat',
  consult: '/patient/doctors/fedorova',
  labs: '/patient/labs',
  prescription: '/patient/labs',
};

export function Home() {
  const { patientName } = useAuth();
  const [mood, setMood] = useState('Стало хуже');

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${patientName}`}
        description="Система ведёт вас по маршруту лечения — следующий шаг всегда под рукой"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_302px]">
        <Card className="p-6">
          <h2 className="text-[20px] font-bold text-text">Ваш маршрут</h2>
          <p className="mt-1 text-[13px] text-text-muted">Активный процесс · шаг 2 из 4</p>

          <div className="mt-6 flex flex-col gap-3">
            {careSteps.map((step) => (
              <Link
                key={step.id}
                to={STEP_LINK[step.id] ?? '/patient'}
                className="flex items-center gap-4 rounded-md border border-border px-4 py-5 transition-colors hover:border-accent"
              >
                <span
                  className={`h-6 w-6 flex-shrink-0 rounded-full ${
                    step.status === 'done'
                      ? 'bg-success'
                      : step.status === 'current'
                        ? 'bg-primary'
                        : 'border border-border bg-surface'
                  }`}
                />
                <div>
                  <p className="text-[15px] font-semibold text-text">{step.title}</p>
                  <p className="mt-1 text-[13px] text-text-muted">{step.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <Button size="lg" className="mt-6 w-full max-w-[400px] justify-start">
            Следующий шаг: подготовиться к приёму
          </Button>
        </Card>

        <Card className="flex flex-col p-6">
          <h3 className="text-center text-[16px] font-semibold text-text">Как себя чувствуете?</h3>
          <p className="mt-1 text-center text-[13px] text-text-muted">
            Краткая отметка обновит маршрут
          </p>

          <div className="mx-auto mt-5 flex flex-col gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`h-11 w-[92px] rounded-md text-[13px] font-semibold transition-colors ${
                  mood === m
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-surface text-text'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <h3 className="mt-8 text-center text-[16px] font-semibold text-text">На сегодня</h3>
          <p className="mt-4 text-center text-[13px] text-text-muted">
            Рецепт №482391 активен до 15.06
          </p>
          <p className="mt-2 text-center text-[13px] text-text-muted">
            Напоминание: измерить давление утром
          </p>

          <div className="mx-auto mt-6 flex w-full flex-col gap-3">
            <Link
              to="/patient/house-call"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Вызов врача на дом
            </Link>
            <Link
              to="/patient/treatment"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Активное лечение
            </Link>
            <Link
              to="/patient/labs"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Анализы и рецепты
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
