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
  recommendedSpecialization?: string;
  recommendation?: string;
  recommendationText?: string;
  canBeRemote?: boolean;
  messages?: TriageMessageDto[];
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
};

export function getSessionId(session: TriageSessionDto | null | undefined): string | undefined {
  return session?.id ?? session?.sessionId;
}
