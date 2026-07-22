import { apiRequest } from './http';

export interface DoctorDto {
  id?: string;
  doctorId?: string;
  publicId?: string;
  firstName?: string;
  secondName?: string;
  surename?: string;
  name?: string;
  specialization?: string;
  specialty?: string;
  clinicName?: string;
  clinic?: string;
  experienceYears?: number;
  bio?: string;
  description?: string;
  schedule?: string;
  onlineAvailable?: boolean;
  tag?: string;
  [key: string]: unknown;
}

export interface DoctorListResponse {
  items?: DoctorDto[];
  results?: DoctorDto[];
  data?: DoctorDto[];
  total?: number;
  totalCount?: number;
  [key: string]: unknown;
}

export interface ScheduleSlotDto {
  start?: string;
  startTime?: string;
  end?: string;
  endTime?: string;
  available?: boolean;
  [key: string]: unknown;
}

export const doctorsApi = {
  list(params: { specialization?: string; query?: string; page?: number; pageSize?: number } = {}) {
    return apiRequest<DoctorDto[] | DoctorListResponse>('/api/v1/doctors', { query: params });
  },

  get(doctorId: string) {
    return apiRequest<DoctorDto>(`/api/v1/doctors/${doctorId}`);
  },

  schedule(doctorId: string, params: { from?: string; days?: number } = {}) {
    return apiRequest<ScheduleSlotDto[] | { slots?: ScheduleSlotDto[] }>(
      `/api/v1/doctors/${doctorId}/schedule`,
      { query: params },
    );
  },
};

/** The `/doctors` list endpoint's response shape isn't documented — it may
 * be a bare array or wrapped in a paged object. Normalize to an array. */
export function normalizeDoctorList(response: DoctorDto[] | DoctorListResponse | null | undefined): DoctorDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? response.results ?? response.data ?? [];
}

export function getDoctorId(doctor: DoctorDto): string {
  return doctor.id ?? doctor.doctorId ?? doctor.publicId ?? '';
}

export function formatDoctorName(doctor: DoctorDto): string {
  if (doctor.name) return doctor.name;
  const parts = [doctor.surename, doctor.firstName, doctor.secondName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Врач Vitals';
}

export function formatDoctorSpecialty(doctor: DoctorDto): string {
  return doctor.specialization ?? doctor.specialty ?? 'Специализация не указана';
}

export function normalizeSchedule(
  response: ScheduleSlotDto[] | { slots?: ScheduleSlotDto[] } | null | undefined,
): ScheduleSlotDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.slots ?? [];
}
