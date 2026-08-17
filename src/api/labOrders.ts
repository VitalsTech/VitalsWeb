import { apiRequest } from './http';

export type LabOrderStatus = 'Ordered' | 'InProgress' | 'Completed' | 'Cancelled' | string;

export interface LabOrderItemDto {
  itemId?: string;
  testName?: string;
  testCode?: string;
  specimenType?: string;
  specialInstructions?: string;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  isCritical?: boolean;
  resultReceivedAt?: string | null;
  resultAttachmentUrl?: string | null;
  resultComment?: string | null;
}

export interface LabOrderDto {
  labOrderId?: string;
  id?: string;
  patientId?: string;
  doctorId?: string;
  consultationId?: string | null;
  status?: LabOrderStatus;
  orderedAt?: string;
  clinicalIndication?: string | null;
  priority?: string;
  doctorComment?: string | null;
  externalLabOrderId?: string | null;
  cancelReason?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
  items?: LabOrderItemDto[];
  [key: string]: unknown;
}

export interface CreateLabOrderPayload {
  patientId: string;
  consultationId?: string | null;
  clinicalIndication?: string;
  priority?: 'routine' | 'urgent' | string;
  doctorComment?: string;
  items: Array<{
    testName: string;
    testCode?: string;
    specimenType?: string;
    specialInstructions?: string;
  }>;
}

export interface LabOrderResultItemPayload {
  itemId: string;
  resultValue?: string;
  referenceRange?: string;
  unit?: string;
  isCritical?: boolean;
  resultAttachmentUrl?: string;
  resultComment?: string;
}

const STATUS_LABELS: Record<string, string> = {
  ordered: 'Назначено',
  inprogress: 'В работе',
  completed: 'Готово',
  cancelled: 'Отменено',
};

const STATUS_TONES: Record<string, 'neutral' | 'warning' | 'success' | 'danger' | 'accent'> = {
  ordered: 'accent',
  inprogress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export const labOrdersApi = {
  create(payload: CreateLabOrderPayload) {
    return apiRequest<LabOrderDto>('/api/v1/lab-orders', { method: 'POST', body: payload });
  },

  get(labOrderId: string) {
    return apiRequest<LabOrderDto>(`/api/v1/lab-orders/${labOrderId}`);
  },

  listForPatient(patientId: string) {
    return apiRequest<LabOrderDto[] | { items?: LabOrderDto[] }>(
      `/api/v1/lab-orders/patients/${patientId}`,
    );
  },

  /** Склейка по profileId + legacy publicId. */
  async listForPatientAliases(patientIds: string[]) {
    const unique = [...new Set(patientIds.map((id) => id.trim()).filter(Boolean))];
    const chunks = await Promise.all(
      unique.map((id) => labOrdersApi.listForPatient(id).catch(() => [] as LabOrderDto[])),
    );
    const byId = new Map<string, LabOrderDto>();
    for (const chunk of chunks) {
      for (const item of normalizeLabOrders(chunk)) {
        const id = getLabOrderId(item);
        if (id) byId.set(id, item);
        else byId.set(`anon-${byId.size}`, item);
      }
    }
    return [...byId.values()];
  },

  start(labOrderId: string, externalLabOrderId?: string) {
    return apiRequest<LabOrderDto>(`/api/v1/lab-orders/${labOrderId}/start`, {
      method: 'POST',
      body: { externalLabOrderId },
    });
  },

  cancel(labOrderId: string, reason: string) {
    return apiRequest<LabOrderDto>(`/api/v1/lab-orders/${labOrderId}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  },

  recordResults(
    labOrderId: string,
    payload: { markCompleted?: boolean; results: LabOrderResultItemPayload[] },
  ) {
    return apiRequest<LabOrderDto>(`/api/v1/lab-orders/${labOrderId}/results`, {
      method: 'POST',
      body: payload,
    });
  },
};

export function getLabOrderId(order: LabOrderDto | null | undefined): string | undefined {
  return order?.labOrderId ?? order?.id;
}

export function normalizeLabOrders(
  response: LabOrderDto[] | { items?: LabOrderDto[] } | null | undefined,
): LabOrderDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function getLabOrderStatusLabel(status?: string | null): string {
  if (!status) return '-';
  return STATUS_LABELS[status.replace(/[\s_-]/g, '').toLowerCase()] ?? status;
}

export function getLabOrderStatusTone(
  status?: string | null,
): 'neutral' | 'warning' | 'success' | 'danger' | 'accent' {
  if (!status) return 'neutral';
  return STATUS_TONES[status.replace(/[\s_-]/g, '').toLowerCase()] ?? 'neutral';
}

export function formatLabOrderItems(order: LabOrderDto): string {
  const names = (order.items ?? []).map((item) => item.testName).filter(Boolean) as string[];
  return names.length > 0 ? names.join(', ') : 'Направление на анализы';
}
