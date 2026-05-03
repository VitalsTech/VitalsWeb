import { ShellLayout } from './ShellLayout';

type OrgKind = 'clinic' | 'pharmacy' | 'lab';

const CONFIG: Record<
  OrgKind,
  {
    title: string;
    base: string;
    links: readonly { segment: string; label: string; end?: boolean }[];
  }
> = {
  clinic: {
    title: 'Клиника',
    base: '/org/clinic',
    links: [
      { segment: '', label: 'Главная', end: true },
      { segment: 'departments', label: 'Отделения' },
      { segment: 'doctors', label: 'Управление врачами' },
      { segment: 'schedule', label: 'Расписание и слоты' },
      { segment: 'patients', label: 'Пациенты клиники' },
      { segment: 'integrations', label: 'Интеграции' },
      { segment: 'billing', label: 'Финансы' },
      { segment: 'quality', label: 'Качество и аудит' },
      { segment: 'settings', label: 'Настройки' },
      { segment: 'partners', label: 'Партнёры' },
    ],
  },
  pharmacy: {
    title: 'Аптека',
    base: '/org/pharmacy',
    links: [
      { segment: '', label: 'Главная', end: true },
      { segment: 'orders', label: 'Заказы' },
      { segment: 'inventory', label: 'Ассортимент' },
      { segment: 'prescriptions', label: 'Рецепты' },
      { segment: 'locations', label: 'Точки обслуживания' },
      { segment: 'staff', label: 'Сотрудники' },
      { segment: 'integrations', label: 'Интеграции' },
      { segment: 'billing', label: 'Финансы' },
      { segment: 'quality', label: 'Качество' },
      { segment: 'settings', label: 'Настройки' },
      { segment: 'delivery', label: 'Доставка' },
    ],
  },
  lab: {
    title: 'Лаборатория',
    base: '/org/lab',
    links: [
      { segment: '', label: 'Главная', end: true },
      { segment: 'orders', label: 'Заказы на анализы' },
      { segment: 'catalog', label: 'Каталог анализов' },
      { segment: 'referrals', label: 'Направления' },
      { segment: 'locations', label: 'Точки приёма' },
      { segment: 'staff', label: 'Сотрудники' },
      { segment: 'integrations', label: 'Интеграции' },
      { segment: 'billing', label: 'Финансы' },
      { segment: 'quality', label: 'Качество' },
      { segment: 'settings', label: 'Настройки' },
      { segment: 'field', label: 'Выездные услуги' },
    ],
  },
};

export function OrgLayout({ kind }: { kind: OrgKind }) {
  const { base, links } = CONFIG[kind];
  const nav = links.map((l) => ({
    to: l.segment === '' ? base : `${base}/${l.segment}`,
    label: l.label,
    end: l.end,
  }));

  return <ShellLayout links={nav} homeHref="/" />;
}
