import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { doctors } from '@/mock/data';

export function DoctorDetail() {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === id) ?? doctors[0];

  return (
    <div>
      <PageHeader
        title={doctor.name}
        description={`${doctor.specialty} · ${doctor.clinic} · Стаж ${doctor.experienceYears} лет`}
        backTo="/patient/doctors"
        backLabel="Назад к списку"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">О враче</h3>
          <p className="mt-3 text-[14px] text-text-muted">{doctor.bio}</p>
          <p className="mt-5 text-[14px] text-text">
            Расписание: {doctor.schedule} · Онлайн-консультации:{' '}
            {doctor.onlineAvailable ? 'да' : 'нет'}
          </p>
          <p className="mt-5 text-[13px] font-semibold text-text">Теги</p>
          <p className="mt-2 text-[13px] text-text-muted">{doctor.tag}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Взаимодействие</h3>
          <div className="mt-4 flex flex-col gap-3">
            <ButtonLink to={`/patient/doctors/${doctor.id}/book`} size="lg" fullWidth>
              Запись на консультацию
            </ButtonLink>
            <ButtonLink
              to={`/patient/doctors/${doctor.id}/book`}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Консультация онлайн
            </ButtonLink>
            <ButtonLink
              to={`/patient/doctors/${doctor.id}/chat`}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Чат с врачом
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
