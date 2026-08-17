import { apiRequest } from './http';

/** Gateway валидирует тип консультации по этому списку (алиасы вида `chat`
 * тоже принимаются, но отправляем канонические значения). */
export type ConsultationTypeValue = 'SyncChat' | 'Video' | 'Async' | 'InPerson' | 'HomeVisit';

export const CONSULTATION_TYPE = {
  chat: 'SyncChat',
  video: 'Video',
  async: 'Async',
  inPerson: 'InPerson',
  homeVisit: 'HomeVisit',
} as const satisfies Record<string, ConsultationTypeValue>;

const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  syncchat: 'Чат с врачом',
  asyncchat: 'Отложенная консультация',
  async: 'Отложенная консультация',
  audio: 'Аудиоконсультация',
  video: 'Онлайн-приём',
  inperson: 'Очный приём',
  homevisit: 'Вызов на дом',
};

export function formatConsultationType(value: string | undefined | null): string {
  if (!value) return '—';
  return CONSULTATION_TYPE_LABELS[value.replace(/[\s_-]/g, '').toLowerCase()] ?? value;
}

export interface CreateConsultationPayload {
  patientId: string;
  doctorId: string;
  doctorName?: string;
  consultationType?: ConsultationTypeValue;
  /** Выбранная ячейка расписания врача (ISO) */
  scheduledAt?: string;
  slotId?: string;
  primarySymptom?: string;
  urgency?: string;
  urgencyLevel?: number;
  routingDecisionId?: string;
  triageSessionId?: string;
}

/** Запись пациента на слот: резервирует слот и создаёт консультацию на его время. */
export interface BookConsultationPayload {
  doctorId: string;
  slotId: string;
  consultationType?: ConsultationTypeValue;
  urgencyLevel?: number;
  triageSessionId?: string | null;
}

export interface BookConsultationResponse {
  sessionId?: string;
  doctorId?: string;
  patientId?: string;
  slotId?: string;
  startsAt?: string;
  endsAt?: string;
  isOnline?: boolean;
  type?: string;
  status?: string;
  /** false — консультация создана, но слот не связали; календарь сопоставит по времени */
  slotLinked?: boolean;
}

/** Протокол из GET /consultations/{id} после complete. */
export interface ConsultationProtocolDto {
  complaints?: string;
  anamnesis?: string;
  examinationNotes?: string;
  preliminaryDiagnosisIcd10?: string;
  preliminaryDiagnosisText?: string;
  recommendations?: string;
  prescriptions?: string[];
  labOrders?: string[];
  nextVisitDate?: string | null;
}

export interface ConsultationDto {
  id?: string;
  sessionId?: string;
  patientId?: string;
  doctorId?: string;
  doctorName?: string;
  /** В ответе `mine` поле называется `type` */
  type?: string;
  consultationType?: string;
  status?: string;
  urgencyLevel?: number;
  scheduledAt?: string | null;
  scheduledSlotId?: string | null;
  /** true — запись на слот; false — свободный чат без брони */
  isScheduled?: boolean;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastActivityAt?: string;
  patientUnreadCount?: number;
  doctorUnreadCount?: number;
  videoRoomId?: string | null;
  videoActive?: boolean;
  patientConsentGiven?: boolean;
  protocol?: ConsultationProtocolDto | null;
  protocolSignature?: string | null;
  hasProtocol?: boolean;
  [key: string]: unknown;
}

export interface MyConsultationsResponse {
  items?: ConsultationDto[];
}

export interface ConsultationMessageDto {
  id?: string;
  messageId?: string;
  sequence?: number;
  sequenceNumber?: number;
  senderRole?: string;
  role?: string;
  messageType?: string;
  content?: string;
  attachmentUrl?: string;
  isImportant?: boolean;
  createdAt?: string;
  sentAt?: string;
  readAt?: string | null;
  [key: string]: unknown;
}

/** Протокол завершения консультации врачом. */
export interface CompleteConsultationPayload {
  complaints: string;
  anamnesis: string;
  examinationNotes?: string;
  preliminaryDiagnosisIcd10: string;
  preliminaryDiagnosisText: string;
  recommendations: string;
  prescriptions?: string[];
  /** Названия направлений на анализы */
  labOrders?: string[];
  nextVisitDate?: string | null;
}

export const consultationsApi = {
  create(payload: CreateConsultationPayload) {
    return apiRequest<ConsultationDto>('/api/v1/consultations', { method: 'POST', body: payload });
  },

  /** Запись на слот расписания. 409 — слот уже занят. Не использовать `create` для брони. */
  book(payload: BookConsultationPayload) {
    return apiRequest<BookConsultationResponse>('/api/v1/consultations/book', {
      method: 'POST',
      body: payload,
    });
  },

  get(sessionId: string) {
    return apiRequest<ConsultationDto>(`/api/v1/consultations/${sessionId}`);
  },

  /** Список консультаций текущего пользователя (пациент — записи и чаты). */
  listMine(params: { includeCompleted?: boolean; limit?: number } = {}) {
    return apiRequest<MyConsultationsResponse | ConsultationDto[]>('/api/v1/consultations/mine', {
      query: {
        includeCompleted: params.includeCompleted ?? false,
        limit: params.limit ?? 50,
      },
    });
  },

  getActive(patientId: string, doctorId: string) {
    return apiRequest<ConsultationDto>('/api/v1/consultations/active', {
      query: { patientId, doctorId },
    });
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

  getMessages(sessionId: string, afterSequence = 0, options: { markAsRead?: boolean } = {}) {
    return apiRequest<ConsultationMessageDto[] | { items?: ConsultationMessageDto[] }>(
      `/api/v1/consultations/${sessionId}/messages`,
      { query: { afterSequence, ...(options.markAsRead ? { markAsRead: true } : {}) } },
    );
  },

  markMessagesRead(sessionId: string) {
    return apiRequest<unknown>(`/api/v1/consultations/${sessionId}/messages/read`, {
      method: 'POST',
    });
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

  complete(sessionId: string, payload: CompleteConsultationPayload) {
    return apiRequest<ConsultationDto>(`/api/v1/consultations/${sessionId}/complete`, {
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

  startVideo(sessionId: string) {
    return apiRequest<VideoRoomResponse>(`/api/v1/consultations/${sessionId}/video/start`, {
      method: 'POST',
    });
  },

  getVideo(sessionId: string) {
    return apiRequest<VideoRoomResponse>(`/api/v1/consultations/${sessionId}/video`);
  },

  stopVideo(sessionId: string) {
    return apiRequest<void>(`/api/v1/consultations/${sessionId}/video/stop`, { method: 'POST' });
  },

  getClinical(sessionId: string) {
    return apiRequest<ClinicalActionsResponse | ClinicalActionDto[]>(
      `/api/v1/consultations/${sessionId}/clinical`,
    );
  },

  addDiagnosis(sessionId: string, payload: { icd10?: string; text?: string }) {
    return apiRequest<ClinicalActionDto>(`/api/v1/consultations/${sessionId}/diagnoses`, {
      method: 'POST',
      body: payload,
    });
  },

  addPrescriptions(sessionId: string, payload: { lines: string[] }) {
    return apiRequest<ClinicalActionDto>(`/api/v1/consultations/${sessionId}/prescriptions`, {
      method: 'POST',
      body: payload,
    });
  },

  issueCertificate(sessionId: string, payload: IssueCertificatePayload) {
    return apiRequest<ClinicalActionDto>(`/api/v1/consultations/${sessionId}/certificates`, {
      method: 'POST',
      body: payload,
    });
  },
};

export type VideoMode = 'p2p' | 'sfu' | string;

export interface IceServerDto {
  urls?: string | string[];
  username?: string;
  credential?: string;
}

export interface VideoRoomResponse {
  mode?: VideoMode;
  roomId?: string;
  serverUrl?: string;
  accessToken?: string;
  role?: string;
  chatAvailable?: boolean;
  signalingHub?: string;
  iceServers?: IceServerDto[];
}

export type RtcSignalType = 'offer' | 'answer' | 'ice' | 'hangup' | 'media';

export interface RtcSignal {
  type: RtcSignalType;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  audio?: boolean;
  video?: boolean;
}

export interface RtcSignalEvent extends RtcSignal {
  sessionId?: string;
  fromUserId?: string;
}

export type ClinicalActionKind = 'Diagnosis' | 'Prescription' | 'Certificate' | string;

export type CertificateType = 'HealthStatus' | 'StudyExcuse' | 'WorkExcuse' | 'Other';

export interface ClinicalActionDto {
  id?: string;
  kind?: ClinicalActionKind;
  createdAt?: string;
  createdByDoctorId?: string;
  payload?: unknown;
}

export interface ClinicalActionsResponse {
  items?: ClinicalActionDto[];
}

export interface IssueCertificatePayload {
  type: CertificateType;
  title: string;
  body: string;
  validFrom?: string;
  validUntil?: string;
}

export function normalizeClinical(
  response: ClinicalActionsResponse | ClinicalActionDto[] | null | undefined,
): ClinicalActionDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function isConsultationVideoActive(consultation: ConsultationDto | null | undefined): boolean {
  if (!consultation) return false;
  if (consultation.videoActive === true) return true;
  if (consultation.videoActive === false) return false;
  return Boolean(consultation.videoRoomId);
}

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

export function normalizeMine(
  response: MyConsultationsResponse | ConsultationDto[] | null | undefined,
): ConsultationDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function getConsultationTypeLabel(consultation: ConsultationDto | null | undefined): string {
  return formatConsultationType(consultation?.type ?? consultation?.consultationType);
}
