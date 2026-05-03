import { Link, useParams } from 'react-router-dom';

const NAMES: Record<string, string> = {
  d1: 'Пётров Артём Ильич',
  d2: 'Фёдорова Инна Сергеевна',
  d3: 'Климова Егор Михайлович',
};

export function PatientDoctorDetail() {
  const { id } = useParams();
  const name = (id && NAMES[id]) ?? 'Врач';

  return (
    <>
      <Link to="/patient/doctors" className="link-back">
        ← Назад к списку
      </Link>
      <header className="page-header">
        <h1 className="page-title">{name}</h1>
        <p className="page-subtitle">Подробнее и взаимодействие (макет расширяемый)</p>
      </header>
      <div className="grid-2">
        <section className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Специальность, стаж, клиника-партнёр, расписание.
          </p>
          <div className="btn-row">
            <button type="button" className="btn">
              Запись на консультацию
            </button>
            <button type="button" className="btn secondary">
              Консультация онлайн
            </button>
            <button type="button" className="btn ghost">
              Чат с врачом
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
