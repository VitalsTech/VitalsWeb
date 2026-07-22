import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';

export function TriageResult() {
  return (
    <div>
      <PageHeader
        title="Результат триажа"
        description="Система оценила ситуацию и сформировала маршрут"
        backTo="/patient/triage"
        backLabel="Назад к триажу"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <p className="text-[13px] font-semibold text-text-muted">
              Срочность: <span className="text-warning">Скоро</span>
            </p>
            <p className="mt-2 text-[13px] text-text-muted">
              Не экстренно, но консультация в течение 24–48 ч
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Можно удалённо</h3>
            <p className="mt-3 text-[13px] text-text-muted">
              Да — первичная консультация возможна онлайн. Очный визит — при ухудшении.
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Рекомендованный маршрут</h3>
          <ul className="mt-4 flex flex-col gap-3 text-[14px] text-text">
            <li>• Консультация кардиолога (онлайн или очно)</li>
            <li>• Контроль артериального давления 2 раза в день</li>
            <li>• Общий анализ крови — после приёма врача</li>
          </ul>
          <p className="mt-5 text-[13px] text-text-muted">
            Почему: давление 148/94, головная боль, данные триажа
          </p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <ButtonLink to="/patient/doctors/fedorova/book" size="lg">
          Начать маршрут — записаться к кардиологу
        </ButtonLink>
        <Button variant="secondary" size="lg">
          Сохранить в мой путь
        </Button>
      </div>
    </div>
  );
}
