/**
 * The contract has no "list my patients" or "list my consultations" endpoint
 * for doctors — a doctor only reaches a specific patient through a known
 * `patientId` (e.g. shared via a referral, a triage escalation, or a
 * consultation the doctor has already opened). We keep a small local
 * address-book of patients the doctor has added/interacted with, scoped per
 * doctor account, so the "Пациенты" / "Рабочий стол" screens have something
 * real to list and reopen.
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
  contact: { patientId: string; label?: string; summary?: string },
): DoctorContact {
  const contacts = listContacts(doctorId);
  const now = new Date().toISOString();
  const existingIndex = contacts.findIndex((c) => c.patientId === contact.patientId);
  const merged: DoctorContact = {
    patientId: contact.patientId,
    label: contact.label ?? contacts[existingIndex]?.label ?? `Пациент #${contact.patientId.slice(0, 8)}`,
    summary: contact.summary ?? contacts[existingIndex]?.summary,
    addedAt: contacts[existingIndex]?.addedAt ?? now,
    lastActivityAt: now,
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
