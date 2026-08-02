import { apiRequest } from './http';

export interface CreateTriageSessionPayload {
  patientId: string;
  chiefComplaint?: string;
  locale?: string;
}

export interface TriageMessageDto {
  id?: string;
  role?: string;
  from?: string;
  sender?: string;
  content?: string;
  text?: string;
  message?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface TriageHypothesisDto {
  condition?: string;
  probability?: number;
}

export interface TriageLlmResultDto {
  urgencyLevel?: number;
  recommendedAction?: string;
  nextQuestion?: string;
  readyToComplete?: boolean;
  completeSuggestion?: string | null;
  hypotheses?: TriageHypothesisDto[];
  [key: string]: unknown;
}

export interface TriageSessionDto {
  id?: string;
  sessionId?: string;
  patientId?: string;
  status?: string;
  urgency?: string;
  urgencyLevel?: number;
  latestUrgencyLevel?: number;
  recommendedSpecialization?: string;
  recommendation?: string;
  recommendationText?: string;
  canBeRemote?: boolean;
  messages?: TriageMessageDto[];
  /** ИИ предлагает завершить триаж */
  readyToComplete?: boolean;
  completeSuggestion?: string | null;
  latestAssessment?: {
    urgencyLevel?: number;
    llmResult?: TriageLlmResultDto;
    assistantReply?: string;
    readyToComplete?: boolean;
    completeSuggestion?: string | null;
  };
  /** Поля после POST .../complete (sync routing). */
  routingDecisionId?: string;
  routingOutcomeType?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  recommendedLabs?: string[];
  consultationSessionId?: string;
  [key: string]: unknown;
}

export const triageApi = {
  createSession(payload: CreateTriageSessionPayload) {
    return apiRequest<TriageSessionDto>('/api/v1/triage/sessions', { method: 'POST', body: payload });
  },

  getSession(sessionId: string) {
    return apiRequest<TriageSessionDto>(`/api/v1/triage/sessions/${sessionId}`);
  },

  sendMessage(sessionId: string, message: string) {
    return apiRequest<TriageMessageDto | TriageSessionDto>(
      `/api/v1/triage/sessions/${sessionId}/messages`,
      { method: 'POST', body: { message } },
    );
  },

  completeSession(sessionId: string) {
    return apiRequest<TriageSessionDto>(`/api/v1/triage/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  /** Список сессий пациента (для врача с доступом). */
  listForPatient(patientId: string, limit = 10, alsoPatientIds: string[] = []) {
    const also = [...new Set(alsoPatientIds.map((id) => id.trim()).filter(Boolean))]
      .filter((id) => id !== patientId)
      .join(',');
    return apiRequest<TriageSessionDto[] | { items?: TriageSessionDto[] }>(
      `/api/v1/triage/patients/${patientId}/sessions`,
      { query: { limit, alsoPatientIds: also || undefined } },
    );
  },

  /** Перебор алиасов + alsoPatientIds — чтобы не потерять триаж при publicId≠profileId. */
  async listForPatientAliases(patientIds: string[], limit = 10) {
    const unique = [...new Set(patientIds.map((id) => id.trim()).filter(Boolean))];
    if (unique.length === 0) return [] as TriageSessionDto[];
    const [primary, ...rest] = unique;
    try {
      return normalizeTriageSessions(
        await triageApi.listForPatient(primary, limit, rest),
      );
    } catch {
      for (const id of rest) {
        try {
          const sessions = normalizeTriageSessions(
            await triageApi.listForPatient(id, limit, unique.filter((x) => x !== id)),
          );
          if (sessions.length > 0) return sessions;
        } catch {
          /* next alias */
        }
      }
      return [] as TriageSessionDto[];
    }
  },
};

export function getSessionId(session: TriageSessionDto | null | undefined): string | undefined {
  return session?.id ?? session?.sessionId;
}

export function normalizeTriageSessions(
  response: TriageSessionDto[] | { items?: TriageSessionDto[] } | null | undefined,
): TriageSessionDto[] {
  if (!response) return [];
  const list = Array.isArray(response) ? response : (response.items ?? []);
  return list.map((s) => normalizeTriageSession(s)).filter(Boolean) as TriageSessionDto[];
}

function pickReady(session: TriageSessionDto): boolean {
  return Boolean(
    session.readyToComplete ??
      session.latestAssessment?.readyToComplete ??
      session.latestAssessment?.llmResult?.readyToComplete,
  );
}

function pickSuggestion(session: TriageSessionDto): string | undefined {
  const raw =
    session.completeSuggestion ??
    session.latestAssessment?.completeSuggestion ??
    session.latestAssessment?.llmResult?.completeSuggestion;
  const text = typeof raw === 'string' ? raw.trim() : '';
  return text || undefined;
}

function pickHypotheses(session: TriageSessionDto): TriageHypothesisDto[] {
  const fromLlm = session.latestAssessment?.llmResult?.hypotheses;
  if (Array.isArray(fromLlm) && fromLlm.length > 0) return fromLlm;
  const top = session.hypotheses;
  if (Array.isArray(top) && top.length > 0) return top as TriageHypothesisDto[];
  return [];
}

/** Maps backend triage response to frontend-friendly fields. */
export function normalizeTriageSession(session: TriageSessionDto | null | undefined): TriageSessionDto | null {
  if (!session) return null;

  const llm = session.latestAssessment?.llmResult;
  const urgencyLevel =
    session.urgencyLevel ??
    session.latestUrgencyLevel ??
    session.latestAssessment?.urgencyLevel ??
    llm?.urgencyLevel;

  const recommendation =
    session.recommendation ??
    session.recommendationText ??
    llm?.recommendedAction ??
    session.latestAssessment?.assistantReply;

  const urgency =
    session.urgency ??
    (urgencyLevel != null
      ? urgencyLevel >= 5
        ? 'emergency'
        : urgencyLevel >= 4
          ? 'urgent'
          : 'routine'
      : undefined);

  const labs = Array.isArray(session.recommendedLabs)
    ? session.recommendedLabs.filter(Boolean)
    : [];

  const readyToComplete = pickReady(session);
  const completeSuggestion = pickSuggestion(session);
  const hypotheses = pickHypotheses(session);

  return {
    ...session,
    id: getSessionId(session),
    urgencyLevel,
    urgency,
    recommendation,
    recommendationText: recommendation,
    recommendedSpecialization: session.recommendedSpecialization ?? undefined,
    canBeRemote: session.canBeRemote ?? (urgencyLevel == null || urgencyLevel <= 3),
    readyToComplete,
    completeSuggestion: completeSuggestion ?? null,
    routingDecisionId: session.routingDecisionId,
    routingOutcomeType: session.routingOutcomeType,
    assignedDoctorId: session.assignedDoctorId,
    assignedDoctorName: session.assignedDoctorName,
    recommendedLabs: labs,
    consultationSessionId: session.consultationSessionId,
    latestAssessment: session.latestAssessment
      ? {
          ...session.latestAssessment,
          llmResult: llm
            ? { ...llm, hypotheses, readyToComplete, completeSuggestion }
            : llm,
        }
      : session.latestAssessment,
  };
}

/** Триаж завершён (complete уже вызван / есть routing). Не путать с промежуточной срочностью ИИ. */
export function isTriageCompleted(session: TriageSessionDto | null | undefined): boolean {
  if (!session) return false;
  return (
    String(session.status ?? '').toLowerCase() === 'completed' ||
    Boolean(session.routingDecisionId) ||
    Boolean(session.consultationSessionId)
  );
}
