import { ShellLayout } from './ShellLayout';

const LINKS = [
  { to: '/patient', label: 'Главная', end: true },
  { to: '/patient/triage', label: 'ИИ-триаж' },
  { to: '/patient/documents', label: 'Документы' },
  { to: '/patient/doctors', label: 'Врачи' },
  { to: '/patient/notifications', label: 'Уведомления' },
  { to: '/patient/support', label: 'Поддержка' },
  { to: '/patient/profile', label: 'Профиль' },
] as const;

export function PatientLayout() {
  return <ShellLayout links={LINKS} homeHref="/" />;
}
