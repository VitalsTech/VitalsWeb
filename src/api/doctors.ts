import { apiRequest } from './http';
import { formatUserName, type UserDto } from './users';

export interface DoctorDto {
  id?: string;
  doctorId?: string;
  publicId?: string;
  fullName?: string;
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
  biography?: string;
  description?: string;
  schedule?: string;
  onlineAvailable?: boolean;
  rating?: number;
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
  startsAt?: string;
  end?: string;
  endTime?: string;
  endsAt?: string;
  available?: boolean;
  isAvailable?: boolean;
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
  const list = Array.isArray(response) ? response : (response.items ?? response.results ?? response.data ?? []);
  return list.map(normalizeDoctorCard);
}

export function normalizeDoctorCard(doctor: DoctorDto): DoctorDto {
  const profiles = (doctor.profiles as Array<{ profileType?: string; data?: Record<string, unknown> }> | undefined) ?? [];
  const doctorProfile = profiles.find((p) => (p.profileType ?? '').toLowerCase().includes('doctor'));
  const profileData = doctorProfile?.data ?? {};

  return {
    ...doctor,
    doctorId: doctor.doctorId ?? doctor.publicId ?? doctor.id,
    publicId: doctor.publicId ?? doctor.doctorId ?? doctor.id,
    name: doctor.fullName ?? doctor.name ?? formatDoctorName(doctor),
    specialization:
      doctor.specialization ??
      doctor.specialty ??
      (profileData.specialization as string | undefined),
    bio:
      doctor.bio ??
      doctor.biography ??
      doctor.description ??
      (profileData.biography as string | undefined),
    rating: doctor.rating ?? (profileData.rating as number | undefined),
  };
}

/** Maps GET /users/{publicId} response to doctor card fields. */
export function normalizeDoctorFromUser(
  user: (UserDto & { profiles?: Array<{ profileType?: string; data?: Record<string, unknown> }> }) | null | undefined,
): DoctorDto | null {
  if (!user) return null;
  return normalizeDoctorCard({
    ...user,
    publicId: user.publicId,
    doctorId: user.publicId,
    name: formatUserName(user, 'Врач Vitals'),
  });
}

export function getDoctorId(doctor: DoctorDto): string {
  return doctor.doctorId ?? doctor.id ?? doctor.publicId ?? '';
}

export function formatDoctorName(doctor: DoctorDto): string {
  if (doctor.fullName) return doctor.fullName;
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
