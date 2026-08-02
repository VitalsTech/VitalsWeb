import type { DoctorCalendarSlotDto, DoctorCalendarSlotStatus, ScheduleSlotDto } from '@/api/doctors';

/** Gateway отдаёт слоты с разными именами полей (`startsAt`, `startTime`, …),
 * поэтому читаем время только через эти хелперы. */
export function slotStartIso(slot: ScheduleSlotDto): string {
  return slot.startsAt ?? slot.startAt ?? slot.startTime ?? slot.start ?? '';
}

export function slotEndIso(slot: ScheduleSlotDto): string {
  return slot.endsAt ?? slot.endAt ?? slot.endTime ?? slot.end ?? '';
}

export function slotKey(slot: ScheduleSlotDto): string {
  return String(slot.id ?? `${slotStartIso(slot)}-${slotEndIso(slot)}`);
}

export function isSlotAvailable(slot: ScheduleSlotDto): boolean {
  return slot.isAvailable ?? slot.available ?? true;
}

export function isSlotOnline(slot: ScheduleSlotDto): boolean {
  return slot.isOnline === true;
}

/** `status` из `me/calendar`; для публичного расписания выводим из флагов. */
export function slotStatus(slot: DoctorCalendarSlotDto): DoctorCalendarSlotStatus {
  const raw = (slot.status ?? '').toLowerCase();
  if (raw === 'booked' || raw === 'available' || raw === 'closed') return raw;
  if (slot.isBooked || slot.consultation) return 'booked';
  return isSlotAvailable(slot) ? 'available' : 'closed';
}

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function slotStartDate(slot: ScheduleSlotDto): Date | null {
  return parseIso(slotStartIso(slot));
}

export function formatTime(iso: string): string {
  const date = parseIso(iso);
  if (!date) return '—';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** `сб, 01.08` */
export function formatDayLabel(iso: string): string {
  const date = parseIso(iso);
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

/** `01.08, 14:00` */
export function formatDayTime(iso: string | undefined | null): string {
  const date = parseIso(iso ?? '');
  if (!date) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `14:00 – 15:00`, либо просто начало, если конец слота неизвестен. */
export function formatSlotRange(slot: ScheduleSlotDto): string {
  const start = formatTime(slotStartIso(slot));
  const end = formatTime(slotEndIso(slot));
  if (start === '—') return '—';
  return end === '—' ? start : `${start} – ${end}`;
}

/** `YYYY-MM-DD` в местной зоне — слоты приходят в UTC, а дату пользователь
 * выбирает в своей зоне, поэтому сравнивать ISO-строки напрямую нельзя. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function slotLocalDateKey(slot: ScheduleSlotDto): string {
  const date = slotStartDate(slot);
  return date ? localDateKey(date) : '';
}

export function sortSlotsByStart<T extends ScheduleSlotDto>(slots: T[]): T[] {
  return [...slots].sort((a, b) => slotStartIso(a).localeCompare(slotStartIso(b)));
}

const DAY_PARTS = [
  { label: 'Утро', until: 12 },
  { label: 'День', until: 17 },
  { label: 'Вечер', until: 24 },
] as const;

export interface SlotGroup<T extends ScheduleSlotDto = ScheduleSlotDto> {
  label: string;
  slots: T[];
}

/** Разбивает слоты на утро / день / вечер; пустые группы не возвращаются. */
export function groupSlotsByDayPart<T extends ScheduleSlotDto>(slots: T[]): SlotGroup<T>[] {
  const groups: SlotGroup<T>[] = DAY_PARTS.map((part) => ({ label: part.label, slots: [] }));

  for (const slot of sortSlotsByStart(slots)) {
    const date = slotStartDate(slot);
    const hour = date ? date.getHours() : 0;
    const index = DAY_PARTS.findIndex((part) => hour < part.until);
    groups[index === -1 ? DAY_PARTS.length - 1 : index].slots.push(slot);
  }

  return groups.filter((group) => group.slots.length > 0);
}
