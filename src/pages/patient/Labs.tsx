import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';

const LAB_STEPS = [
  { title: 'Направление от врача', status: '—' },
  { title: 'Сдача биоматериала', status: '—' },
  { title: 'Результаты в документах', status: '—' },
];

const PHARM_STEPS = [
  { title: 'Электронный рецепт', status: 'Ожидает врача' },
  { title: 'Бронирование в аптеке', status: '—' },
  { title: 'Готов к выдаче', status: '—' },
];

function StatusList({ items }: { items: { title: string; status: string }[] }) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex items-center justify-between rounded-md border border-border px-4 py-4"
        >
          <span className="text-[14px] font-semibold text-text">{item.title}</span>
          <span className="text-[14px] text-text-muted">{item.status}</span>
        </div>
      ))}
    </div>
  );
}

export function Labs() {
  return (
    <div>
      <PageHeader
        title="Статус анализов и рецепта"
        description="Связь с лабораторией и аптекой внутри одного маршрута"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Лаборатория Vitals Lab</h3>
          <p className="mt-2 text-[14px] text-text-muted">Статус: ожидает назначения врача</p>
          <StatusList items={LAB_STEPS} />
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Аптека-партнёр</h3>
          <p className="mt-2 text-[14px] text-text-muted">Статус: рецепт ещё не выписан</p>
          <StatusList items={PHARM_STEPS} />
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Всё в одном контексте</h3>
        <p className="mt-3 max-w-[900px] text-[14px] text-text-muted">
          Когда врач назначит анализы и рецепт, статусы обновятся автоматически. Вам не нужно
          переходить на сторонние сайты.
        </p>
        <ButtonLink to="/patient/treatment" className="mt-5">
          Вернуться к маршруту
        </ButtonLink>
      </Card>
    </div>
  );
}
