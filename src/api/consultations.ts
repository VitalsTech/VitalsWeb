import { apiRequest } from './http';

export interface CreateConsultationPayload {
  patientId: string;
  doctorId: string;
  doctorName?: string;
  consultationType?: string;
  primarySymptom?: string;
  urgency?: string;
  urgencyLevel?: number;
  routingDecisionId?: string;
  triageSessionId?: string;
}

export interface ConsultationDto {
  id?: string;
  sessionId?: string;
  patientId?: string;
  doctorId?: string;
  doctorName?: string;
  consultationType?: string;
  status?: string;
  scheduledAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ConsultationMessageDto {
  id?: string;
  sequence?: number;
  sequenceNumber?: number;
  senderRole?: string;
  role?: string;
  messageType?: string;
  content?: string;
  attachmentUrl?: string;
  isImportant?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export const consultationsApi = {
  create(payload: CreateConsultationPayload) {
    return apiRequest<ConsultationDto>('/api/v1/consultations', { method: 'POST', body: payload });
  },

  get(sessionId: string) {
    return apiRequest<ConsultationDto>(`/api/v1/consultations/${sessionId}`);
  },

  join(sessionId: string, role?: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/join`, {
      method: 'POST',
      body: { role },
    });
  },

  consent(sessionId: string, dataProcessingConsent: boolean, videoRecordingConsent: boolean) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/consent`, {
      method: 'POST',
      body: { dataProcessingConsent, videoRecordingConsent },
    });
  },

  getMessages(sessionId: string, afterSequence = 0) {
    return apiRequest<ConsultationMessageDto[] | { items?: ConsultationMessageDto[] }>(
      `/api/v1/consultations/${sessionId}/messages`,
      { query: { afterSequence } },
    );
  },

  sendMessage(
    sessionId: string,
    payload: { messageType?: string; content: string; attachmentUrl?: string; isImportant?: boolean },
  ) {
    return apiRequest<ConsultationMessageDto>(`/api/v1/consultations/${sessionId}/messages`, {
      method: 'POST',
      body: payload,
    });
  },

  pause(sessionId: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/pause`, { method: 'POST' });
  },

  resume(sessionId: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/resume`, { method: 'POST' });
  },

  confirm(sessionId: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/confirm`, { method: 'POST' });
  },

  cancel(sessionId: string, reason?: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  },

  complete(
    sessionId: string,
    payload: {
      complaints?: string;
      anamnesis?: string;
      examinationNotes?: string;
      preliminaryDiagnosisIcd10?: string;
      preliminaryDiagnosisText?: string;
      recommendations?: string;
      nextVisitDate?: string;
    },
  ) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/complete`, {
      method: 'POST',
      body: payload,
    });
  },

  submitRating(
    sessionId: string,
    payload: { role?: string; score: number; feedback?: string },
  ) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/ratings`, {
      method: 'POST',
      body: payload,
    });
  },
};

export function normalizeMessages(
  response: ConsultationMessageDto[] | { items?: ConsultationMessageDto[] } | null | undefined,
): ConsultationMessageDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function getConsultationId(consultation: ConsultationDto | null | undefined): string | undefined {
  return consultation?.id ?? consultation?.sessionId;
}
