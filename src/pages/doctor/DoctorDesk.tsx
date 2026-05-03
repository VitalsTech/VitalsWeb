export function DoctorDesk() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Рабочий стол</h1>
        <p className="page-subtitle">
          Активные консультации, пациенты в ожидании, новые сообщения.
        </p>
      </header>
      <div className="toolbar toolbar-spaced">
        <div className="btn-row" style={{ margin: 0 }}>
          <button type="button" className="btn">
            Начать приём
          </button>
          <button type="button" className="btn secondary">
            Онлайн-консультация
          </button>
        </div>
      </div>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Ожидают пациенты</h2>
      <div className="doctor-queue">
        <article className="card patient-mini patient-mini--urgent">
          <div className="toolbar" style={{ marginBottom: '0.25rem', justifyContent: 'space-between' }}>
            <strong>Ковалёва М.Ю.</strong>
            <span className="badge danger">срочно</span>
          </div>
          <span className="muted">Триаж: одышка, SpO₂ 93%</span>
          <button type="button" className="btn" style={{ marginTop: '0.65rem', width: '100%' }}>
            Продолжить приём
          </button>
        </article>
        <article className="card patient-mini patient-mini--soon">
          <div className="toolbar" style={{ marginBottom: '0.25rem', justifyContent: 'space-between' }}>
            <strong>Иванова А.С.</strong>
            <span className="badge warn">скоро</span>
          </div>
          <span className="muted">Измерить давление, скорректировать терапию</span>
          <button type="button" className="btn secondary" style={{ marginTop: '0.65rem', width: '100%' }}>
            Начать
          </button>
        </article>
        <article className="card patient-mini patient-mini--stable">
          <div className="toolbar" style={{ marginBottom: '0.25rem', justifyContent: 'space-between' }}>
            <strong>Наумова Т.Е.</strong>
            <span className="badge ok">план</span>
          </div>
          <span className="muted">Повторный приём после анализа</span>
          <button type="button" className="btn secondary" style={{ marginTop: '0.65rem', width: '100%' }}>
            Открыть
          </button>
        </article>
      </div>
      <h2 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1rem' }}>Новые сообщения</h2>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          Петров П.Г. — отправил фото результатов аппарата.
        </p>
      </div>
    </>
  );
}
