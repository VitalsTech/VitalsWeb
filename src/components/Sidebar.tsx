import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { useAuth } from '@/auth/AuthProvider';

export type NavItem = { to: string; label: string; end?: boolean };

export const PATIENT_NAV_ITEMS: NavItem[] = [
  { to: '/patient', label: 'Мой путь', end: true },
  { to: '/patient/triage', label: 'ИИ-триаж' },
  { to: '/patient/documents', label: 'Документы' },
  { to: '/patient/doctors', label: 'Врачи' },
  { to: '/patient/consultations', label: 'Консультации' },
  { to: '/patient/notifications', label: 'Уведомления' },
  { to: '/patient/profile', label: 'Профиль' },
  { to: '/patient/support', label: 'Поддержка' },
];

export const DOCTOR_NAV_ITEMS: NavItem[] = [
  { to: '/doctor', label: 'Рабочий стол', end: true },
  { to: '/doctor/calendar', label: 'Календарь' },
  { to: '/doctor/patients', label: 'Пациенты' },
  { to: '/doctor/notifications', label: 'Уведомления' },
  { to: '/doctor/profile', label: 'Профиль врача' },
];

export function Sidebar({
  roleLabel = 'Пациент',
  navItems = PATIENT_NAV_ITEMS,
  onNavigate,
  onClose,
  showClose = false,
}: {
  roleLabel?: string;
  navItems?: NavItem[];
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const { logout } = useAuth();

  return (
    <aside className="flex h-full w-full flex-col justify-between bg-sidebar px-5 py-6 sm:px-6 sm:py-8 lg:w-[260px]">
      <div>
        <div className="mb-8 flex items-start justify-between gap-3 sm:mb-10">
          <div>
            <Logo variant="sidebar" />
            <p className="mt-2 text-[13px] text-sidebar-foreground-muted">{roleLabel}</p>
          </div>
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-sidebar-foreground-muted transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Закрыть меню"
            >
              <span className="text-[22px] leading-none" aria-hidden>
                ×
              </span>
            </button>
          )}
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative rounded-md py-2.5 pl-4 text-[14px] transition-colors ${
                  isActive
                    ? 'font-semibold text-white'
                    : 'text-sidebar-foreground hover:text-white'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-sidebar-border pt-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-sidebar-foreground-muted">Тема</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={() => {
            void logout().catch(() => {});
          }}
          className="text-left text-[13px] text-sidebar-foreground-muted transition-colors hover:text-white"
        >
          Выйти из аккаунта
        </button>
      </div>
    </aside>
  );
}
