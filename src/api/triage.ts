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
  createdAt?: string;
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
  latestAssessment?: {
    urgencyLevel?: number;
    llmResult?: {
      urgencyLevel?: number;
      recommendedAction?: string;
      nextQuestion?: string;
    };
    assistantReply?: string;
  };
  [key: string]: unknown;
}

export const triageApi = {
  createSession(payload: CreateTriageSessionPayload) {
    return apiRequest<TriageSessionDto>('/api/v1/triage/sessions', { method: 'POST', body: payload });
  },

  getSession(sessionId: string) {
    return apiRequest<TriageSessionDto>(`/api/v1/triage/sessions/${sessionId}`);
  },

  sendMessage(sessionId: string, content: string) {
    return apiRequest<TriageMessageDto | TriageSessionDto>(
      `/api/v1/triage/sessions/${sessionId}/messages`,
      { method: 'POST', body: { content } },
    );
  },

  completeSession(sessionId: string) {
    return apiRequest<TriageSessionDto>(`/api/v1/triage/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  },
};

export function getSessionId(session: TriageSessionDto | null | undefined): string | undefined {
  return session?.id ?? session?.sessionId;
}

/** Maps backend triage response to frontend-friendly fields. */
export function normalizeTriageSession(session: TriageSessionDto | null | undefined): TriageSessionDto | null {
  if (!session) return null;

  const urgencyLevel =
    session.urgencyLevel ??
    session.latestUrgencyLevel ??
    session.latestAssessment?.urgencyLevel ??
    session.latestAssessment?.llmResult?.urgencyLevel;

  const recommendation =
    session.recommendation ??
    session.recommendationText ??
    session.latestAssessment?.llmResult?.recommendedAction ??
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

  return {
    ...session,
    id: getSessionId(session),
    urgencyLevel,
    urgency,
    recommendation,
    recommendationText: recommendation,
    recommendedSpecialization: session.recommendedSpecialization ?? 'Терапевт',
    canBeRemote: session.canBeRemote ?? (urgencyLevel == null || urgencyLevel <= 3),
  };
}
