/**
 * Локальные ярлыки/заметки врача по patientId (имя, кэш сводки).
 * Сам список «в наблюдении» строится из консультаций и календаря
 * (`useObservedPatients`) - localStorage только дополняет отображаемые имена.
 */
export interface DoctorContact {
  patientId: string;
  label: string;
  summary?: string;
  addedAt: string;
  lastActivityAt: string;
}

function storageKey(doctorId: string) {
  return `vitals.doctor.contacts.${doctorId}`;
}

export function listContacts(doctorId: string | null | undefined): DoctorContact[] {
  if (!doctorId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(doctorId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DoctorContact[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1))
      : [];
  } catch {
    return [];
  }
}

export function getContact(
  doctorId: string | null | undefined,
  patientId: string | null | undefined,
): DoctorContact | undefined {
  if (!doctorId || !patientId) return undefined;
  return listContacts(doctorId).find((c) => c.patientId === patientId);
}

export function upsertContact(
  doctorId: string,
  contact: {
    patientId: string;
    label?: string;
    summary?: string;
    /** false - не обновлять lastActivityAt (фоновый sync сводки/имени) */
    touchActivity?: boolean;
    lastActivityAt?: string;
  },
): DoctorContact {
  const contacts = listContacts(doctorId);
  const now = new Date().toISOString();
  const existingIndex = contacts.findIndex((c) => c.patientId === contact.patientId);
  const existing = existingIndex >= 0 ? contacts[existingIndex] : undefined;
  const touch = contact.touchActivity !== false;
  const merged: DoctorContact = {
    patientId: contact.patientId,
    label: contact.label ?? existing?.label ?? `Пациент #${contact.patientId.slice(0, 8)}`,
    summary: contact.summary ?? existing?.summary,
    addedAt: existing?.addedAt ?? now,
    lastActivityAt: touch
      ? (contact.lastActivityAt ?? now)
      : (contact.lastActivityAt ?? existing?.lastActivityAt ?? now),
  };

  if (existingIndex >= 0) {
    contacts[existingIndex] = merged;
  } else {
    contacts.push(merged);
  }

  window.localStorage.setItem(storageKey(doctorId), JSON.stringify(contacts));
  return merged;
}

export function removeContact(doctorId: string, patientId: string) {
  const contacts = listContacts(doctorId).filter((c) => c.patientId !== patientId);
  window.localStorage.setItem(storageKey(doctorId), JSON.stringify(contacts));
}
