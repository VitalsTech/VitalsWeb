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

  cancel(prescriptionId: string, reason?: string) {
    return apiRequest<unknown>(`/api/v1/prescriptions/${prescriptionId}/cancel`, {
      method: 'POST',
      body: { reason },
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
