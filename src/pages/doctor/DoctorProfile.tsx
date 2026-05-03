export function DoctorProfile() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Профиль врача</h1>
        <p className="page-subtitle">Профессиональные данные и привязка к организациям</p>
      </header>
      <div className="grid-2">
        <section className="card">
          <div className="field">
            <label>ФИО</label>
            <input defaultValue="Пётров Артём Ильич" />
          </div>
          <div className="field">
            <label>Специальность</label>
            <input defaultValue="Врач-терапевт участковый" />
          </div>
          <div className="field">
            <label>Сертификат специалиста</label>
            <input defaultValue="№778291 / до 2030" />
          </div>
        </section>
        <section className="card">
          <div className="field">
            <label>Клиники Vitals</label>
            <input defaultValue="ГК №4, ул. Свободы" readOnly />
          </div>
          <div className="field">
            <label>Рабочее время по умолчанию</label>
            <textarea rows={4} defaultValue="Пн–Пт 9:00–18:00, суббота по записи." />
          </div>
          <button type="button" className="btn">
            Сохранить
          </button>
        </section>
      </div>
    </>
  );
}
