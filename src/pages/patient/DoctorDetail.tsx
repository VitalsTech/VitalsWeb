import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { doctorsApi, normalizeDoctorFromUser, formatDoctorName, formatDoctorSpecialty } from '@/api/doctors';

export function DoctorDetail() {
  const { id } = useParams();

  const { data: rawDoctor, loading, error, reload } = useAsyncData(
    () => (id ? doctorsApi.get(id) : Promise.reject(new Error('Не указан врач'))),
    [id],
  );
  const doctor = normalizeDoctorFromUser(rawDoctor as Parameters<typeof normalizeDoctorFromUser>[0]);

  return (
    <div>
      <PageHeader
        title={doctor ? formatDoctorName(doctor) : 'Врач'}
        description={
          doctor
            ? `${formatDoctorSpecialty(doctor)}${doctor.clinic || doctor.clinicName ? ` · ${doctor.clinic ?? doctor.clinicName}` : ''}${doctor.experienceYears != null ? ` · Стаж ${doctor.experienceYears} лет` : ''}`
            : undefined
        }
        backTo="/patient/doctors"
        backLabel="Назад к списку"
      />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {doctor && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-[16px] font-semibold text-text">О враче</h3>
              <p className="mt-3 text-[14px] text-text-muted">
                {doctor.bio ?? doctor.description ?? 'Информация о враче уточняется.'}
              </p>
              <p className="mt-5 text-[14px] text-text">
                {doctor.schedule && <>Расписание: {doctor.schedule} · </>}
                Онлайн-консультации: {doctor.onlineAvailable ? 'да' : 'нет'}
              </p>
              {doctor.tag && (
                <>
                  <p className="mt-5 text-[13px] font-semibold text-text">Теги</p>
                  <p className="mt-2 text-[13px] text-text-muted">{doctor.tag}</p>
                </>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-[16px] font-semibold text-text">Взаимодействие</h3>
              <div className="mt-4 flex flex-col gap-3">
                <ButtonLink to={`/patient/doctors/${id}/book`} size="lg" fullWidth>
                  Запись на консультацию
                </ButtonLink>
                <ButtonLink
                  to={`/patient/doctors/${id}/book?type=online`}
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  Консультация онлайн
                </ButtonLink>
                <ButtonLink
                  to={`/patient/doctors/${id}/chat`}
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  Чат с врачом
                </ButtonLink>
              </div>
            </Card>
          </div>
        )}
      </AsyncState>
    </div>
  );
}
