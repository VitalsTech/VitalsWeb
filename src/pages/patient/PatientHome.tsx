import { Link } from 'react-router-dom';

export function PatientHome() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Здравствуйте, Анна</h1>
        <p className="page-subtitle">Быстрый доступ и текущее самочувствие</p>
      </header>
      <div className="grid-2">
        <section className="card">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>Как себя чувствуете?</h2>
          <p className="muted" style={{ margin: '0 0 1rem' }}>
            Краткая отметка для врача и рекомендаций.
          </p>
          <div className="btn-row">
            <button type="button" className="btn secondary">
              Хорошо
            </button>
            <button type="button" className="btn secondary">
              Устала
            </button>
            <button type="button" className="btn">
              Стало хуже
            </button>
          </div>
        </section>
        <section className="card">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>На сегодня</h2>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Электронный рецепт № 482391 — активен до 15.06</li>
            <li>Запись: терапевт Петров А.И., завтра 10:40</li>
          </ul>
          <Link to="/patient/notifications" className="muted" style={{ display: 'block', marginTop: '0.75rem' }}>
            Все уведомления →
          </Link>
        </section>
      </div>
      <h2 style={{ margin: '2rem 0 0.75rem', fontSize: '1.05rem', color: 'var(--vitals-primary)' }}>
        Что нужно прямо сейчас
      </h2>
      <div className="quick-actions">
        <Link to="/patient/triage">ИИ-триаж</Link>
        <Link to="/patient/documents">Электронные рецепты</Link>
        <button type="button" className="btn secondary" style={{ borderRadius: '999px' }}>
          Вызов врача на дом
        </button>
        <Link to="/patient/doctors">Записаться к врачу</Link>
        <Link to="/patient/documents">Мои документы</Link>
      </div>
    </>
  );
}
