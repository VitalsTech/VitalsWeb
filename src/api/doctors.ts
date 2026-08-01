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
  id?: string;
  start?: string;
  startTime?: string;
  startsAt?: string;
  startAt?: string;
  end?: string;
  endTime?: string;
  endsAt?: string;
  endAt?: string;
  available?: boolean;
  isAvailable?: boolean;
  isOnline?: boolean;
  [key: string]: unknown;
}

export interface DoctorCalendarPatientDto {
  patientId?: string;
  fullName?: string | null;
  age?: number | null;
  sex?: string | null;
}

export interface DoctorCalendarHypothesisDto {
  condition?: string;
  probability?: number;
}

export interface DoctorCalendarTriageDto {
  sessionId?: string;
  status?: string;
  urgencyLevel?: number;
  /** emergency | urgent | routine */
  urgency?: string | null;
  urgencyLabel?: string | null;
  recommendedSpecialization?: string | null;
  recommendation?: string | null;
  canBeRemote?: boolean;
  complaints?: string | null;
  symptoms?: string[];
  hypotheses?: DoctorCalendarHypothesisDto[];
  emergencyWarning?: boolean;
  createdAt?: string;
}

export interface DoctorCalendarAnamnesisDto {
  activeDiagnoses?: string[];
  activeMedications?: string[];
  allergies?: string[];
  recentLabResults?: string[];
  latestVital?: string | null;
  /** false — карта пациента пуста либо сервис недоступен */
  hasData?: boolean;
}

export interface DoctorCalendarConsultationDto {
  sessionId?: string;
  type?: string;
  status?: string;
  isOpen?: boolean;
  urgencyLevel?: number;
  expectedDurationMinutes?: number;
  scheduledAt?: string;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastActivityAt?: string;
  unreadCount?: number;
  videoRoomId?: string | null;
  patient?: DoctorCalendarPatientDto;
  /** null — AITriageService недоступен или триажа не было */
  triage?: DoctorCalendarTriageDto | null;
  /** null — MedicalRecordService недоступен */
  anamnesis?: DoctorCalendarAnamnesisDto | null;
}

export type DoctorCalendarSlotStatus = 'booked' | 'available' | 'closed';

export interface DoctorCalendarSlotDto extends ScheduleSlotDto {
  isBooked?: boolean;
  /** booked | available | closed */
  status?: string;
  consultation?: DoctorCalendarConsultationDto | null;
}

export interface DoctorCalendarResponseDto {
  doctorId?: string;
  from?: string;
  to?: string;
  slots?: DoctorCalendarSlotDto[];
  /** Консультации врача вне сетки приёма */
  unscheduledConsultations?: DoctorCalendarConsultationDto[];
}

export interface DoctorProfileUpdatePayload {
  biography?: string;
  specialization?: string;
  academicDegree?: string;
}

export interface DoctorScheduleSlotPayload {
  id?: string;
  startTime?: string;
  endTime?: string;
  startsAt?: string;
  endsAt?: string;
  isOnline?: boolean;
  isAvailable?: boolean;
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

  updateMyProfile(payload: DoctorProfileUpdatePayload) {
    return apiRequest<DoctorDto>('/api/v1/doctors/me/profile', { method: 'PATCH', body: payload });
  },

  schedule(doctorId: string, params: { from?: string; days?: number } = {}) {
    return apiRequest<ScheduleSlotDto[] | { slots?: ScheduleSlotDto[] }>(
      `/api/v1/doctors/${doctorId}/schedule`,
      { query: params },
    );
  },

  /** Календарь врача с деталями занятости слотов (роль Doctor). */
  myCalendar(params: { from?: string; days?: number } = {}) {
    return apiRequest<DoctorCalendarResponseDto>('/api/v1/doctors/me/calendar', { query: params });
  },

  createOrUpdateScheduleSlot(payload: DoctorScheduleSlotPayload) {
    return apiRequest<ScheduleSlotDto>('/api/v1/doctors/me/schedule/slots', {
      method: 'POST',
      body: payload,
    });
  },

  deleteScheduleSlot(slotId: string) {
    return apiRequest<unknown>(`/api/v1/doctors/me/schedule/slots/${slotId}`, { method: 'DELETE' });
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

export const DOCTOR_BIO_PLACEHOLDER = 'Информация уточняется';

export function getDoctorBiography(doctor: DoctorDto | null | undefined): string | null {
  if (!doctor) return null;
  const bio = doctor.bio ?? doctor.biography ?? doctor.description;
  return bio?.trim() ? bio.trim() : null;
}

export function normalizeSchedule(
  response: ScheduleSlotDto[] | { slots?: ScheduleSlotDto[] } | null | undefined,
): ScheduleSlotDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.slots ?? [];
}
