import { useEffect, useMemo } from 'react';
import { useAsyncData } from '@/lib/useAsyncData';
import { consultationsApi, normalizeMine, type ConsultationDto } from '@/api/consultations';
import { doctorsApi, type DoctorCalendarConsultationDto } from '@/api/doctors';
import {
  consultationActivityAt,
  summaryFromConsultation,
} from '@/lib/consultationSummary';
import {
  resolvePatientIdentityMap,
  type ResolvedPatientIdentity,
} from '@/lib/resolvePatientId';
import { listContacts, removeContact, upsertContact } from './contacts';

export type ObservedPatient = {
  /** Всегда Patient ProfileId */
  patientId: string;
  publicId?: string;
  label: string;
  summary?: string;
  lastActivityAt: string;
  source: 'consultation' | 'calendar' | 'manual';
  openSessionId?: string;
  latestConsultation?: ConsultationDto | null;
};

function defaultLabel(patientId: string, fullName?: string | null) {
  const name = fullName?.trim();
  if (name) return name;
  return `Пациент #${patientId.slice(0, 8)}`;
}

function calendarConsultations(
  calendar: Awaited<ReturnType<typeof doctorsApi.myCalendar>> | null,
): DoctorCalendarConsultationDto[] {
  if (!calendar) return [];
  const fromSlots = (calendar.slots ?? [])
    .map((s) => s.consultation)
    .filter((c): c is DoctorCalendarConsultationDto => Boolean(c?.patient?.patientId));
  const unscheduled = calendar.unscheduledConsultations ?? [];
  return [...fromSlots, ...unscheduled];
}

function triageSummary(c: DoctorCalendarConsultationDto): string | undefined {
  const triage = c.triage;
  if (!triage) return undefined;
  if (triage.recommendation?.trim()) return triage.recommendation.trim().slice(0, 180);
  if (triage.complaints?.trim()) return triage.complaints.trim().slice(0, 180);
  const hyp = triage.hypotheses?.[0]?.condition?.trim();
  if (hyp) return hyp;
  return undefined;
}

type RawEntry = {
  rawPatientId: string;
  labelHint?: string;
  summary?: string;
  lastActivityAt: string;
  source: ObservedPatient['source'];
  openSessionId?: string;
  latestConsultation?: ConsultationDto | null;
};

/**
 * Пациенты «в наблюдении»: консультации + календарь.
 * Id всегда приводятся к Patient ProfileId (не User.PublicId).
 */
export function useObservedPatients(doctorId: string | null | undefined) {
  const dataQuery = useAsyncData(async () => {
    if (!doctorId) return { patients: [] as ObservedPatient[], sessions: [] as ConsultationDto[] };

    const [mine, calendar] = await Promise.all([
      consultationsApi.listMine({ includeCompleted: true, limit: 100 }).catch(() => null),
      doctorsApi.myCalendar({ days: 45 }).catch(() => null),
    ]);

    const sessions = normalizeMine(mine);
    const raw: RawEntry[] = [];
    const locals = listContacts(doctorId);

    for (const local of locals) {
      raw.push({
        rawPatientId: local.patientId,
        labelHint: local.label,
        summary: local.summary,
        lastActivityAt: local.lastActivityAt,
        source: 'manual',
      });
    }

    for (const session of sessions) {
      if (!session.patientId) continue;
      const open =
        (session.status ?? '').toLowerCase() !== 'completed' &&
        (session.status ?? '').toLowerCase() !== 'cancelled' &&
        (session.status ?? '').toLowerCase() !== 'expired';
      raw.push({
        rawPatientId: session.patientId,
        summary: summaryFromConsultation(session),
        lastActivityAt: consultationActivityAt(session) || new Date().toISOString(),
        source: 'consultation',
        openSessionId: open ? (session.id ?? session.sessionId) : undefined,
        latestConsultation: session,
      });
    }

    for (const consult of calendarConsultations(calendar)) {
      const pid = consult.patient?.patientId;
      if (!pid) continue;
      raw.push({
        rawPatientId: pid,
        labelHint: consult.patient?.fullName ?? undefined,
        summary: triageSummary(consult),
        lastActivityAt:
          consult.lastActivityAt ??
          consult.completedAt ??
          consult.startedAt ??
          consult.scheduledAt ??
          consult.createdAt ??
          new Date().toISOString(),
        source: 'calendar',
        openSessionId: consult.isOpen ? consult.sessionId : undefined,
      });
    }

    const identityMap = await resolvePatientIdentityMap(raw.map((r) => r.rawPatientId));
    const byProfile = new Map<string, ObservedPatient>();

    for (const entry of raw) {
      const identity: ResolvedPatientIdentity =
        identityMap.get(entry.rawPatientId) ??
        ({ profileId: entry.rawPatientId, rawId: entry.rawPatientId } satisfies ResolvedPatientIdentity);

      const profileId = identity.profileId;
      const existing = byProfile.get(profileId);
      const isNewer = !existing || entry.lastActivityAt >= (existing.lastActivityAt || '');

      const label =
        (entry.labelHint && !entry.labelHint.startsWith('Пациент #')
          ? entry.labelHint
          : undefined) ??
        identity.fullName ??
        existing?.label ??
        defaultLabel(profileId, entry.labelHint);

      byProfile.set(profileId, {
        patientId: profileId,
        publicId: identity.publicId ?? existing?.publicId,
        label,
        summary: isNewer
          ? (entry.summary ?? existing?.summary)
          : (existing?.summary ?? entry.summary),
        lastActivityAt: isNewer ? entry.lastActivityAt : existing!.lastActivityAt,
        source:
          entry.source === 'consultation' || existing?.source === 'consultation'
            ? 'consultation'
            : entry.source,
        openSessionId: entry.openSessionId ?? existing?.openSessionId,
        latestConsultation: isNewer
          ? (entry.latestConsultation ?? existing?.latestConsultation)
          : (existing?.latestConsultation ?? entry.latestConsultation),
      });
    }

    const patients = [...byProfile.values()].sort((a, b) =>
      a.lastActivityAt < b.lastActivityAt ? 1 : -1,
    );

    return { patients, sessions };
  }, [doctorId]);

  const patients = dataQuery.data?.patients ?? [];
  const sessions = useMemo(() => dataQuery.data?.sessions ?? [], [dataQuery.data?.sessions]);

  useEffect(() => {
    if (!doctorId || patients.length === 0) return;
    for (const p of patients) {
      upsertContact(doctorId, {
        patientId: p.patientId,
        label: p.label,
        summary: p.summary,
        touchActivity: false,
        lastActivityAt: p.lastActivityAt,
      });
      if (p.publicId && p.publicId !== p.patientId) {
        removeContact(doctorId, p.publicId);
      }
    }
  }, [doctorId, patients]);

  return {
    patients,
    sessions,
    loading: dataQuery.loading,
    error: dataQuery.error,
    reload: dataQuery.reload,
  };
}

export function findObservedPatient(
  patients: ObservedPatient[],
  patientId: string | null | undefined,
): ObservedPatient | undefined {
  if (!patientId) return undefined;
  return patients.find(
    (p) => p.patientId === patientId || p.publicId === patientId,
  );
}
