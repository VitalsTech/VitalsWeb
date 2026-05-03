import { Link } from 'react-router-dom';

export function PatientProfile() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Профиль пациента</h1>
        <p className="page-subtitle">
          Основные сведения, состояние здоровья и переход к сервисам.
        </p>
      </header>
      <div className="grid-2">
        <section className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--vitals-primary)' }}>
            Основное
          </h2>
          <div className="field">
            <label htmlFor="fio">ФИО</label>
            <input id="fio" defaultValue="Иванова Анна Сергеевна" />
          </div>
          <div className="field">
            <label htmlFor="birth">Дата рождения</label>
            <input id="birth" type="date" defaultValue="1991-04-08" />
          </div>
          <div className="field">
            <label htmlFor="policy">Номер полиса ОМС</label>
            <input id="policy" defaultValue="7734 8921 0912 4512" />
          </div>
          <button type="button" className="btn">
            Сохранить изменения
          </button>
        </section>
        <section className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--vitals-primary)' }}>
            Текущее состояние
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Последнее обращение 28.05 — наблюдается повышенное артериальное давление, назначены
            обследования.
          </p>
          <div className="btn-row">
            <Link className="btn secondary" to="/patient/documents">
              Документы
            </Link>
            <Link className="btn secondary" to="/patient/doctors">
              Запись к врачу
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
