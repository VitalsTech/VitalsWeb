import { ShellLayout } from './ShellLayout';

const LINKS = [
  { to: '/doctor', label: 'Рабочий стол', end: true },
  { to: '/doctor/patients', label: 'Пациенты' },
  { to: '/doctor/profile', label: 'Профиль врача' },
] as const;

export function DoctorLayout() {
  return <ShellLayout links={LINKS} homeHref="/" />;
}
