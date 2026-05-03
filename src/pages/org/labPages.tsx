function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </header>
  );
}

export function LabDashboard() {
  return (
    <>
      <Header title="Дашборд лаборатории" subtitle="Объём заказов, статусная воронка, загрузка и финансовый блок Vitals." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn secondary">
          Экспорт Excel/PDF
        </button>
        <span className="badge neutral">Не хватает мощностей — см. вкладку «Каталог»</span>
      </div>
      <div className="grid-3">
        {[
          ['Новые заказы сегодня', '312'],
          ['В работе', '54'],
          ['Просрочено SLA', '2'],
          ['Выдано результатов вчера', '402'],
          ['Загрузка мощности', '78%'],
        ].map(([k, v]) => (
          <div key={k} className="card stat-card">
            <p className="stat-card__label">{k}</p>
            <p className="stat-card__value">{v}</p>
          </div>
        ))}
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Срез биоматериалов</strong>
        <p className="muted">Кровь · Моча · Биопсия · PCR</p>
      </section>
    </>
  );
}

export function LabOrders() {
  return (
    <>
      <Header title="Заказы на анализы" subtitle="Подготовка, статусы, загрузки результатов, комментарии врачу." />
      <article className="card">
        <strong>LAB-98231</strong>
        <span className="muted" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Пациент ••9821 • направление врача + МКБ-10 I11
        </span>
        <p className="muted">Подготовка: голодная кровь, до 09:45</p>
        <div className="btn-row">
          <button type="button" className="btn secondary">
            Принят
          </button>
          <button type="button" className="btn secondary">
            Образец получен
          </button>
          <button type="button" className="btn">
            Анализ готов
          </button>
          <button type="button" className="btn ghost">
            Загрузить PDF результат
          </button>
        </div>
      </article>
    </>
  );
}

export function LabCatalog() {
  return (
    <>
      <Header title="Каталог анализов" subtitle="Лок коды LOINC/LIS, SLA, биоматериал, временное отключение." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn secondary">
          Импорт из LIS / Excel
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Анализ</th>
              <th>Биоматериал</th>
              <th>SLA после образца</th>
              <th>Цены</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Общий анализ крови + СОЭ</td>
              <td>Цельная кровь</td>
              <td>до 24 ч</td>
              <td>850 / Vitals 730 ₽</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function LabReferrals() {
  return (
    <>
      <Header title="Направления" subtitle="QR при приёмe, синхронизация с очередью Vitals." />
      <div className="card">
        Реестр направлений с фильтрами «пациент сдал / отменено» • QR блок в карточке.
      </div>
    </>
  );
}

export function LabLocations() {
  return (
    <>
      <Header title="Точки взятия материала" subtitle="Разные типы анализов и графики работы точек." />
      <article className="card">
        <strong>Южный пункт забора крови</strong>
        <p className="muted">Поддерживаются: клинический анализ, PCR</p>
        <button type="button" className="btn secondary">
          Редактор графика
        </button>
      </article>
    </>
  );
}

export function LabStaff() {
  return (
    <>
      <Header title="Сотрудники лаборатории" subtitle="Разграничение прав (просмотр / статус / загрузки)." />
      <button type="button" className="btn">
        Добавить
      </button>
    </>
  );
}

export function LabIntegrations() {
  return (
    <>
      <Header title="Интеграции LIS / LIMS" subtitle="FHIR/HL7/ASTM двусторонняя синхронизация + логи." />
      <div className="grid-2">
        <article className="card">
          <strong>ЛИС «Мультитест»</strong>
          <span className="badge ok">активный</span>
          <button type="button" className="btn secondary" style={{ marginTop: '0.5rem' }}>
            Принудительная синхронизация
          </button>
        </article>
        <article className="card">
          <strong>Учёт</strong>
          <span className="badge warn">задержка</span>
        </article>
      </div>
      <small className="muted">Страница отражает требование из ТЗ без нагрузки на рендер — только текстовые списки.</small>
    </>
  );
}

export function LabBilling() {
  return (
    <>
      <Header title="Финансовый модуль лаборатории" subtitle="Балансы, выплаты, отчёты, отсрочки для партнёрских клиник." />
      <div className="grid-3">
        <div className="card stat-card">
          <p className="stat-card__label">К выплате Vitals</p>
          <p className="stat-card__value">1,94 млн ₽</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Комиссия</p>
          <p className="stat-card__value">11%</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Акт</p>
          <button type="button" className="btn secondary">
            PDF
          </button>
        </div>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Отсрочки</strong>
        <p className="muted">Клиники партнёрской сети • договорные периоды.</p>
      </section>
    </>
  );
}

export function LabQuality() {
  return (
    <>
      <Header title="Качество лаборатории" subtitle="Выдачи, контрольные образцы, аккредитация ISO / жалобы." />
      <section className="card">
        <strong>Выдачи результатов</strong>
        <p className="muted">Журнал: каналы Vitals, email, на руки.</p>
      </section>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Контроль качества</strong>
        <p className="muted">Отметить прохождение контрольных образцов.</p>
      </section>
    </>
  );
}

export function LabSettings() {
  return (
    <>
      <Header title="Настройки лаборатории" subtitle="Юрлицензии, SLA по умолчанию, аккредитация, связь экстренно." />
      <div className="grid-2">
        <div className="field">
          <label>Сроки по умолчанию</label>
          <textarea rows={4} defaultValue="72 ч для биохимических панелей" />
        </div>
        <div className="field">
          <label>Контакты экстр. связи</label>
          <input defaultValue="+7 495 555-98-71" />
        </div>
      </div>
    </>
  );
}

export function LabFieldServices() {
  return (
    <>
      <Header title="Выездные услуги" subtitle="География, слоты, команды выездов." />
      <section className="card">
        <strong>Маршруты мобильных бригад</strong>
        <p className="muted">
          Статусы «назначен / выехали / забор выполнен / отмена» • экспорт маршрутов.
        </p>
        <div className="btn-row">
          <button type="button" className="btn secondary">
            Настройка слотов по 4 ч
          </button>
          <button type="button" className="btn secondary">
            Экспорт маршрутных листов
          </button>
        </div>
      </section>
    </>
  );
}
