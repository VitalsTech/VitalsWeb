import type { ConsultationDto, ConsultationProtocolDto } from '@/api/consultations';

/** Краткая сводка из протокола завершённой консультации. */
export function summaryFromProtocol(
  protocol?: ConsultationProtocolDto | null,
): string | undefined {
  if (!protocol) return undefined;

  const diagnosis = [protocol.preliminaryDiagnosisIcd10, protocol.preliminaryDiagnosisText]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  if (diagnosis) return clip(diagnosis, 180);

  if (protocol.complaints?.trim()) return clip(protocol.complaints.trim(), 180);
  if (protocol.recommendations?.trim()) return clip(protocol.recommendations.trim(), 180);

  const labs = (protocol.labOrders ?? []).map((n) => n.trim()).filter(Boolean);
  const rx = (protocol.prescriptions ?? []).map((n) => n.trim()).filter(Boolean);
  if (labs.length === 0 && rx.length === 0) return undefined;

  const parts: string[] = [];
  if (labs.length > 0) {
    parts.push(
      `анализы: ${labs.slice(0, 2).join(', ')}${labs.length > 2 ? '…' : ''}`,
    );
  }
  if (rx.length > 0) parts.push(`рецепты: ${rx.length}`);
  return parts.join(' · ');
}

export function consultationActivityAt(c: ConsultationDto): string {
  return c.completedAt ?? c.lastActivityAt ?? c.startedAt ?? c.createdAt ?? '';
}

/** Последняя консультация (по активности / завершению). */
export function pickLatestConsultation(
  sessions: ConsultationDto[],
  patientId?: string | null,
  /** Доп. id того же пациента (publicId ↔ profileId). */
  altPatientIds: string[] = [],
): ConsultationDto | null {
  const ids = new Set(
    [patientId, ...altPatientIds].filter((id): id is string => Boolean(id)),
  );
  const filtered =
    ids.size > 0 ? sessions.filter((s) => s.patientId && ids.has(s.patientId)) : sessions;
  if (filtered.length === 0) return null;
  return [...filtered].sort((a, b) =>
    consultationActivityAt(a) < consultationActivityAt(b) ? 1 : -1,
  )[0];
}

export function summaryFromConsultation(
  consultation?: ConsultationDto | null,
): string | undefined {
  if (!consultation) return undefined;
  return summaryFromProtocol(consultation.protocol);
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
