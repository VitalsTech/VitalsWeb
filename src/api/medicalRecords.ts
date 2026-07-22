import { apiRequest } from './http';

export interface AppendEventPayload {
  eventType?: string;
  sourceService?: string;
  payloadJson?: string;
  occurredAt?: string;
}

export interface MedicalRecordEventDto {
  id?: string;
  eventType?: string;
  sourceService?: string;
  payloadJson?: string;
  occurredAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface PatientStateDto {
  patientId?: string;
  summary?: string;
  allergies?: string;
  bloodType?: string;
  activeConditions?: string[];
  lastVisitAt?: string;
  [key: string]: unknown;
}

export const medicalRecordsApi = {
  appendEvent(patientId: string, payload: AppendEventPayload) {
    return apiRequest<MedicalRecordEventDto>(`/api/v1/medical-records/patients/${patientId}/events`, {
      method: 'POST',
      body: payload,
    });
  },

  getHistory(
    patientId: string,
    params: { from?: string; to?: string; eventTypes?: string } = {},
  ) {
    return apiRequest<MedicalRecordEventDto[] | { items?: MedicalRecordEventDto[] }>(
      `/api/v1/medical-records/patients/${patientId}/history`,
      { query: params },
    );
  },

  getState(patientId: string) {
    return apiRequest<PatientStateDto>(`/api/v1/medical-records/patients/${patientId}/state`);
  },

  createAccessGrant(
    patientId: string,
    payload: { granteeUserId: string; granteeRole?: string; expiresAt?: string; reason?: string },
  ) {
    return apiRequest<unknown>(`/api/v1/medical-records/patients/${patientId}/access-grants`, {
      method: 'POST',
      body: payload,
    });
  },

  revokeAccessGrant(patientId: string, grantId: string) {
    return apiRequest<unknown>(
      `/api/v1/medical-records/patients/${patientId}/access-grants/${grantId}`,
      { method: 'DELETE' },
    );
  },
};

export function normalizeHistory(
  response: MedicalRecordEventDto[] | { items?: MedicalRecordEventDto[] } | null | undefined,
): MedicalRecordEventDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function parseEventPayload<T = Record<string, unknown>>(
  event: MedicalRecordEventDto,
): T | null {
  if (!event.payloadJson) return null;
  try {
    return JSON.parse(event.payloadJson) as T;
  } catch {
    return null;
  }
}
