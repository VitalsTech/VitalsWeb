import { apiRequest } from './http';

export interface MedicationItemDto {
  tradeName?: string;
  inn?: string;
  dosageForm?: string;
  dosage?: string;
  packageQuantity?: string;
  route?: string;
  frequency?: string;
  courseDays?: number;
  specialInstructions?: string;
  atcCode?: string;
  requiresPrescription?: boolean;
  maxDailyDose?: string;
}

export interface PrescriptionDto {
  id?: string;
  prescriptionId?: string;
  patientId?: string;
  status?: string;
  diagnosisForPrescription?: string;
  isPreferential?: boolean;
  allowedRefills?: number;
  autoRenewalEnabled?: boolean;
  medications?: MedicationItemDto[];
  createdAt?: string;
  validUntil?: string;
  signedAt?: string;
  sentToPharmacyAt?: string;
  [key: string]: unknown;
}

export const PRESCRIPTION_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  signed: 'Подписан врачом',
  sent_to_pharmacy: 'Отправлен в аптеку',
  partially_fulfilled: 'Частично выдан',
  fulfilled: 'Полностью выдан',
  dispensed: 'Выдан',
  expired: 'Истёк',
  cancelled: 'Отменён',
};

/** Normalizes API status (Draft / SentToPharmacy / sent_to_pharmacy) to snake_case. */
export function normalizePrescriptionStatus(status?: string | null): string {
  if (!status) return '';
  return status
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
}

export function getPrescriptionStatusLabel(status?: string | null): string {
  const key = normalizePrescriptionStatus(status);
  return PRESCRIPTION_STATUS_LABELS[key] ?? status ?? '—';
}

export type PrescriptionStatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export function getPrescriptionStatusTone(status?: string | null): PrescriptionStatusTone {
  switch (normalizePrescriptionStatus(status)) {
    case 'signed':
      return 'accent';
    case 'sent_to_pharmacy':
    case 'partially_fulfilled':
      return 'warning';
    case 'fulfilled':
    case 'dispensed':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'expired':
    case 'draft':
    default:
      return 'neutral';
  }
}

export function canCancelPrescription(status?: string | null): boolean {
  const key = normalizePrescriptionStatus(status);
  return key === 'draft' || key === 'signed' || key === 'sent_to_pharmacy';
}

export function canSendPrescriptionToPharmacy(status?: string | null): boolean {
  return normalizePrescriptionStatus(status) === 'signed';
}

export function canShowPrescriptionQr(status?: string | null): boolean {
  const key = normalizePrescriptionStatus(status);
  return key !== '' && key !== 'draft' && key !== 'cancelled' && key !== 'expired';
}

export const prescriptionsApi = {
  create(payload: {
    patientId: string;
    consultationId?: string;
    diagnosisForPrescription?: string;
    isPreferential?: boolean;
    preferentialCategory?: string;
    allowedRefills?: number;
    autoRenewalEnabled?: boolean;
    pharmacistComment?: string;
    medications?: MedicationItemDto[];
    confirmWarnings?: boolean;
  }) {
    return apiRequest<PrescriptionDto>('/api/v1/prescriptions', { method: 'POST', body: payload });
  },

  get(prescriptionId: string) {
    return apiRequest<PrescriptionDto>(`/api/v1/prescriptions/${prescriptionId}`);
  },

  listForPatient(patientId: string) {
    return apiRequest<PrescriptionDto[] | { items?: PrescriptionDto[] }>(
      `/api/v1/prescriptions/patients/${patientId}`,
    );
  },

  /**
   * Склейка списков по нескольким id одного пациента
   * (profileId + legacy publicId после путаницы идентификаторов).
   */
  async listForPatientAliases(patientIds: string[]) {
    const unique = [...new Set(patientIds.map((id) => id.trim()).filter(Boolean))];
    const chunks = await Promise.all(
      unique.map((id) => prescriptionsApi.listForPatient(id).catch(() => [] as PrescriptionDto[])),
    );
    const byId = new Map<string, PrescriptionDto>();
    for (const chunk of chunks) {
      for (const item of normalizePrescriptions(chunk)) {
        const id = getPrescriptionId(item);
        if (id) byId.set(id, item);
        else byId.set(`anon-${byId.size}`, item);
      }
    }
    return [...byId.values()];
  },

  /** Draft → Signed (author only). */
  sign(prescriptionId: string, confirmWarnings = true) {
    return apiRequest<PrescriptionDto>(`/api/v1/prescriptions/${prescriptionId}/sign`, {
      method: 'POST',
      query: { confirmWarnings },
    });
  },

  /** Signed → SentToPharmacy. */
  sendToPharmacy(
    prescriptionId: string,
    payload: { pharmacyId?: string; autoSelectNearest?: boolean } = {},
  ) {
    return apiRequest<PrescriptionDto>(`/api/v1/prescriptions/${prescriptionId}/send-to-pharmacy`, {
      method: 'POST',
      body: {
        pharmacyId: payload.pharmacyId,
        autoSelectNearest: payload.autoSelectNearest ?? !payload.pharmacyId,
      },
    });
  },

  cancel(prescriptionId: string, reason?: string) {
    return apiRequest<unknown>(`/api/v1/prescriptions/${prescriptionId}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  },

  validate(prescriptionId: string) {
    return apiRequest<unknown>(`/api/v1/prescriptions/${prescriptionId}/validate`, {
      method: 'POST',
    });
  },

  getInstructions(prescriptionId: string) {
    return apiRequest<unknown>(`/api/v1/prescriptions/${prescriptionId}/instructions`);
  },

  getQr(prescriptionId: string) {
    return apiRequest<unknown>(`/api/v1/prescriptions/${prescriptionId}/qr`);
  },
};

export function normalizePrescriptions(
  response: PrescriptionDto[] | { items?: PrescriptionDto[] } | null | undefined,
): PrescriptionDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export function getPrescriptionId(prescription: PrescriptionDto): string {
  return prescription.id ?? prescription.prescriptionId ?? '';
}
