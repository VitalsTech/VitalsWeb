import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DONE = [
  'ИИ-триаж — 12.07.2026',
  'Запись к кардиологу — 15.07, 10:40',
  'Измерение АД перед приёмом',
];

const WAITING = [
  { title: 'Консультация кардиолога', meta: '15.07, 10:40', hasAction: true },
  { title: 'Назначить анализы', meta: 'После приёма' },
  { title: 'Получить рецепт', meta: 'После назначения' },
];

export function Treatment() {
  return (
    <div>
      <PageHeader
        title="Активное лечение"
        description="Назначения, выполненные шаги и то, что ждёт вас"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Выполнено</h3>
          <div className="mt-4 flex flex-col gap-3">
            {DONE.map((item) => (
              <div key={item} className="rounded-md border border-border px-4 py-3">
                <p className="text-[14px] text-success">✓ {item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Ожидает вас</h3>
          <div className="mt-4 flex flex-col gap-3">
            {WAITING.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-4"
              >
                <div>
                  <p className="text-[15px] font-semibold text-text">{item.title}</p>
                  <p className="mt-1 text-[13px] text-text-muted">{item.meta}</p>
                </div>
                {item.hasAction && (
                  <Button size="sm" className="flex-shrink-0">
                    Открыть
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Текущие назначения врача</h3>
        <p className="mt-3 text-[14px] text-text-muted">
          После консультации здесь появятся рекомендации, рецепты и контрольные точки.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/patient/labs"
            className="rounded-md border border-border px-5 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent"
          >
            Анализы и рецепты
          </Link>
          <Link
            to="/patient/documents"
            className="rounded-md border border-border px-5 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent"
          >
            Документы
          </Link>
        </div>
      </Card>
    </div>
  );
}
