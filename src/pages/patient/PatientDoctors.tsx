import { Link } from 'react-router-dom';

const DOCTORS = [
  { id: 'd1', name: 'Пётров Артём Ильич', role: 'Терапевт', tags: ['наблюдает давление'], rec: false },
  { id: 'd2', name: 'Фёдорова Инна Сергеевна', role: 'Кардиолог', tags: ['консультировала онлайн'], rec: true },
  { id: 'd3', name: 'Климова Егор Михайлович', role: 'Уролог', tags: ['очная запись доступна'], rec: true },
];

export function PatientDoctors() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Врачи</h1>
        <p className="page-subtitle">
          Поиск по специальности и фамилии, рекомендации платформы, будущее: чат и консультации в
          одном профиле.
        </p>
      </header>
      <div className="toolbar toolbar-spaced">
        <input aria-label="Поиск врача" placeholder="Фамилия, специальность…" style={{ flex: '1', minWidth: '200px', padding: '0.5rem' }} />
      </div>
      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Рекомендации Vitals</h2>
        <p className="muted" style={{ margin: 0 }}>
          На основе последнего триажа: кардиология и профилактический осмотр в течение недели.
        </p>
        <div className="doctor-cards" style={{ marginTop: '0.85rem' }}>
          {DOCTORS.filter((d) => d.rec).map((d) => (
            <Link key={d.id} to={`/patient/doctors/${d.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>{d.name}</strong>
              <span className="muted" style={{ display: 'block' }}>
                {d.role}
              </span>
              {d.tags.map((t) => (
                <span key={t} className="badge neutral" style={{ marginTop: '0.35rem' }}>
                  {t}
                </span>
              ))}
            </Link>
          ))}
        </div>
      </section>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Все взаимодействия</h2>
      <div className="doctor-cards">
        {DOCTORS.map((d) => (
          <Link key={d.id} to={`/patient/doctors/${d.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <strong>{d.name}</strong>
            <span className="muted" style={{ display: 'block' }}>
              {d.role}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
