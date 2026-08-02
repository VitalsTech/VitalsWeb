import { apiRequest, ApiError } from './http';

export interface AppendEventPayload {
  eventType?: string;
  sourceService?: string;
  payloadJson?: string;
  occurredAt?: string;
}

export interface MedicalRecordEventDto {
  id?: string;
  eventId?: string;
  eventType?: string;
  sourceService?: string;
  payloadJson?: string;
  payload?: unknown;
  occurredAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface DiagnosisDto {
  icd10Code?: string;
  description?: string;
  recordedAt?: string;
  sourceEventId?: string;
}

export interface PatientStateDto {
  patientId?: string;
  summary?: string;
  allergies?: string;
  bloodType?: string;
  activeConditions?: string[];
  activeDiagnoses?: DiagnosisDto[];
  lastVisitAt?: string;
  [key: string]: unknown;
}

export interface PatientHistoryDto {
  patientId?: string;
  currentState?: PatientStateDto;
  events?: MedicalRecordEventDto[];
  items?: MedicalRecordEventDto[];
}

export interface AttachmentDto {
  id?: string;
  attachmentId?: string;
  fileName?: string;
  title?: string;
  contentType?: string;
  eventType?: string;
  prescriptionId?: string;
  createdAt?: string;
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
    return apiRequest<MedicalRecordEventDto[] | PatientHistoryDto>(
      `/api/v1/medical-records/patients/${patientId}/history`,
      { query: params },
    );
  },

  getState(patientId: string) {
    return apiRequest<PatientStateDto>(`/api/v1/medical-records/patients/${patientId}/state`);
  },

  /**
   * Читает state по всем известным id пациента (profile + public).
   * 403/404 на одном id не роняет весь запрос — врач с консультацией часто
   * упирается в рассинхрон publicId/profileId.
   */
  async getStateAliases(patientIds: string[]): Promise<PatientStateDto | null> {
    const unique = [...new Set(patientIds.map((id) => id.trim()).filter(Boolean))];
    for (const id of unique) {
      try {
        const state = await medicalRecordsApi.getState(id);
        if (state) return state;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) continue;
        throw error;
      }
    }
    return null;
  },

  /**
   * История по алиасам; при полном 403 возвращает null (не бросает).
   */
  async getHistoryAliases(
    patientIds: string[],
    params: { from?: string; to?: string; eventTypes?: string } = {},
  ): Promise<MedicalRecordEventDto[] | PatientHistoryDto | null> {
    const unique = [...new Set(patientIds.map((id) => id.trim()).filter(Boolean))];
    let sawForbidden = false;
    for (const id of unique) {
      try {
        return await medicalRecordsApi.getHistory(id, params);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          sawForbidden = true;
          continue;
        }
        if (error instanceof ApiError && error.status === 404) continue;
        throw error;
      }
    }
    return sawForbidden ? null : null;
  },

  getAttachments(patientId: string) {
    return apiRequest<AttachmentDto[] | { items?: AttachmentDto[] }>(
      `/api/v1/medical-records/patients/${patientId}/attachments`,
    );
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

function mapHistoryEvent(event: MedicalRecordEventDto): MedicalRecordEventDto {
  const payload = event.payload ?? event.payloadJson;
  return {
    ...event,
    id: String(event.id ?? event.eventId ?? ''),
    payloadJson:
      typeof payload === 'string'
        ? payload
        : payload != null
          ? JSON.stringify(payload)
          : event.payloadJson,
  };
}

export function normalizeHistory(
  response: MedicalRecordEventDto[] | PatientHistoryDto | null | undefined,
): MedicalRecordEventDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response.map(mapHistoryEvent);
  const events = response.events ?? response.items ?? [];
  return events.map(mapHistoryEvent);
}

export function extractHistoryState(
  response: MedicalRecordEventDto[] | PatientHistoryDto | null | undefined,
): PatientStateDto | null {
  if (!response || Array.isArray(response)) return null;
  return response.currentState ?? null;
}

export function parseEventPayload<T = Record<string, unknown>>(
  event: MedicalRecordEventDto,
): T | null {
  const raw = event.payloadJson ?? event.payload;
  if (!raw) return null;
  try {
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

export function normalizeAttachments(
  response: AttachmentDto[] | { items?: AttachmentDto[] } | null | undefined,
): AttachmentDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export const DOCUMENT_EVENT_TYPES = 'DocumentUploaded,PrescriptionIssued,document,prescription';
