function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </header>
  );
}

export function ClinicDashboard() {
  return (
    <>
      <PageHeader title="Главная клиники" subtitle="Метрики в реальном времени и действия для руководителя." />
      <div className="toolbar toolbar-spaced">
        <select defaultValue="therapy" aria-label="Отделение">
          <option value="therapy">Терапия</option>
          <option value="surgery">Хирургия</option>
          <option value="lab">Лаборатория</option>
        </select>
        <div className="btn-row" style={{ margin: 0 }}>
          <button type="button" className="btn secondary">
            Экспорт PDF
          </button>
          <button type="button" className="btn secondary">
            Экспорт Excel
          </button>
        </div>
      </div>
      <div className="grid-3">
        <div className="card stat-card">
          <p className="stat-card__label">Обращения «ожидают врача»</p>
          <p className="stat-card__value">18</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">На консультации</p>
          <p className="stat-card__value">9</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Ждут анализы</p>
          <p className="stat-card__value">6</p>
        </div>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Загрузка врачей</strong>
        <p className="muted" style={{ margin: '0.35rem 0 0.5rem', fontSize: '0.88rem' }}>
          Кто на приёме, кто свободен, кто перегружен — сводная лента без тяжёлых диаграмм.
        </p>
        <div className="progress-bar" aria-hidden style={{ marginBottom: '0.35rem' }}>
          <span style={{ width: '72%' }} />
        </div>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          Терапия: 72% слотов занято • Хирургия: перегруз
        </span>
      </section>
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <section className="card">
          <strong>Среднее ожидание по отделениям</strong>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                <tr>
                  <td>Терапия</td>
                  <td>11 мин.</td>
                </tr>
                <tr>
                  <td>Лаборатория</td>
                  <td>28 мин.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <strong>Финансы Vitals</strong>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            День · Неделя · Месяц: начисления, долги, оплаченные слоты.
          </p>
          <table className="data" style={{ marginTop: '0.5rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td>Сегодня</td>
                <td>842 900 ₽</td>
              </tr>
              <tr>
                <td>Задолженность</td>
                <td>129 400 ₽</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <section className="card">
          <strong>NPS и жалобы</strong>
          <p className="stat-card__value" style={{ margin: '0.25rem 0 0', fontSize: '1.25rem' }}>
            +44
          </p>
          <span className="muted">активные жалобы: 3</span>
        </section>
        <section className="card">
          <strong>Очередь на очный приём</strong>
          <span className="badge warn">расширяемые карточки</span>
          <ol className="muted" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
            <li>Детское отделение — 12 записей после маршрутизации</li>
            <li>УЗИ кабинет — технический перерыв</li>
          </ol>
        </section>
      </div>
    </>
  );
}

export function ClinicDepartments() {
  return (
    <>
      <PageHeader title="Отделения" subtitle="Иерархия, удалённые филиалы, параметры работы и статистика." />
      <div className="btn-row toolbar-spaced">
        <button type="button" className="btn">
          Добавить отделение
        </button>
      </div>
      <div className="grid-2">
        <article className="card">
          <strong>Терапия — центр г. Москва</strong>
          <span className="muted" style={{ display: 'block', marginBottom: '0.35rem' }}>
            ул. Свободы, 41 • зав.: Ветров Е.Ю. • врачей 24
          </span>
          <div className="btn-row">
            <button type="button" className="btn secondary">
              Редактировать
            </button>
            <button type="button" className="btn ghost">
              Дашборд отделения
            </button>
          </div>
          <span className="badge ok" style={{ marginTop: '0.65rem', display: 'inline-block' }}>
            круглосуточно: нет
          </span>
        </article>
        <article className="card">
          <strong>Филиал — Тверская область</strong>
          <span className="muted" style={{ display: 'block', marginBottom: '0.35rem' }}>
            г. Конаково • зав.: Бекасова З.Ш. • врачей 9
          </span>
          <div className="btn-row">
            <button type="button" className="btn secondary">
              Редактировать
            </button>
          </div>
        </article>
      </div>
    </>
  );
}

export function ClinicDoctorsHr() {
  return (
    <>
      <PageHeader title="Управление врачами" subtitle="Подбор, отделения, лимиты, блокировки, заявки на вступление." />
      <div className="toolbar toolbar-spaced">
        <select defaultValue="all">
          <option value="all">Все отделения</option>
          <option value="therapy">Терапия</option>
        </select>
        <input placeholder="Специальность, статус" style={{ flex: '1', minWidth: '180px' }} />
        <button type="button" className="btn secondary">
          Добавить врача
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Врач</th>
              <th>Специальность</th>
              <th>Отделение</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Савельев Н.Ю.</td>
              <td>Хирург</td>
              <td>Хирургия / ТДЦ</td>
              <td>
                <span className="badge ok">работает</span>
              </td>
              <td>
                <button type="button" className="btn secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}>
                  Профиль
                </button>
              </td>
            </tr>
            <tr>
              <td>Гречухина В.Е.</td>
              <td>Лабораторная диагностика</td>
              <td>Лаборатория</td>
              <td>
                <span className="badge warn">отставлен</span>
              </td>
              <td>
                <button type="button" className="btn secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}>
                  История блокировки
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Заявки врачей на присоединение</strong>
        <p className="muted" style={{ margin: '0.35rem 0 0' }}>
          Интеграция с Integration Service: проверка лицензий и связка с аккаунтом.
        </p>
      </section>
    </>
  );
}

export function ClinicSchedule() {
  return (
    <>
      <PageHeader title="Расписание и слоты" subtitle="Сводка врачей, лимиты, блокировки, переназначение пациента, Routing Service." />
      <section className="card" style={{ marginBottom: '1rem' }}>
        <strong>Сводное расписание</strong>
        <p className="muted">
          Календарь недели • цветовая индикация нагрузки (демо-блок без тяжёлых канвасов).
        </p>
        <button type="button" className="btn secondary">
          Открыть вид «неделя»
        </button>
      </section>
      <div className="grid-2">
        <section className="card">
          <strong>Глобальный лимит</strong>
          <div className="field">
            <label>Пациентов в день (терапевт)</label>
            <input type="number" defaultValue={5} />
          </div>
          <button type="button" className="btn">
            Сохранить
          </button>
        </section>
        <section className="card">
          <strong>Routing Service</strong>
          <p className="muted">Автоматическое назначение записи</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
            <input type="checkbox" defaultChecked /> Включено
          </label>
          <button type="button" className="btn secondary" style={{ marginTop: '0.5rem' }}>
            Переназначить пациента
          </button>
        </section>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Эпидблокировка слотов</strong>
        <p className="muted" style={{ marginTop: '0.35rem' }}>
          Отметить диапазон дат поверх уже занятых слотов.
        </p>
      </section>
    </>
  );
}

export function ClinicPatientsRegistry() {
  return (
    <>
      <PageHeader title="Пациенты клиники" subtitle="Единый регистр: поиск, фильтры, метаданные без нарушения тайны." />
      <div className="toolbar toolbar-spaced">
        <input placeholder="Полис, телефон, фамилия" style={{ flex: '1', minWidth: '200px' }} />
        <select defaultValue="">
          <option value="">Отделение</option>
          <option>Терапия</option>
        </select>
        <select defaultValue="">
          <option value="">Статус</option>
          <option>лечится</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Последнее обращение</th>
              <th>Прикреплённый врач</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Обезличено в демо</td>
              <td>03.06.2026</td>
              <td>Савельев Н.Ю.</td>
              <td>
                <span className="badge neutral">лечится</span>
              </td>
              <td>
                <button type="button" className="btn secondary" style={{ fontSize: '0.78rem' }}>
                  Принудительно прикрепить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ClinicIntegrations() {
  return (
    <>
      <PageHeader title="Интеграции МИС" subtitle="Подключённые системы, статусы, логи, форматы FHIR / HL7 / JSON." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn">
          Ручная синхронизация
        </button>
      </div>
      <div className="grid-2">
        <article className="card">
          <div className="toolbar" style={{ marginBottom: '0.35rem', justifyContent: 'space-between' }}>
            <strong>МИС «Медлок»</strong>
            <span className="badge ok">активно</span>
          </div>
          <span className="muted">Последний обмен успешный • FHIR ImagingReport</span>
        </article>
        <article className="card">
          <div className="toolbar" style={{ marginBottom: '0.35rem', justifyContent: 'space-between' }}>
            <strong>Собственная лаборатория</strong>
            <span className="badge warn">задержка</span>
          </div>
          <span className="muted">2 ошибочных сообщения HL7 за сутки</span>
          <details style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}>
            <summary>Лог ошибок</summary>
            ORU^R01 14:03 — недостаточно полей
          </details>
        </article>
      </div>
    </>
  );
}

export function ClinicBilling() {
  return (
    <>
      <PageHeader title="Финансы" subtitle="Баланс клиники, детализация, тарифы, акты сверки, модели расчётов Vitals." />
      <div className="grid-3">
        <div className="card stat-card">
          <p className="stat-card__label">Заработано</p>
          <p className="stat-card__value">3,4 млн ₽</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Выплачено</p>
          <p className="stat-card__value">3,09 млн ₽</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Ожидание платежей</p>
          <p className="stat-card__value">214 тыс ₽</p>
        </div>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Тарифы консультаций</strong>
        <div className="grid-2" style={{ marginTop: '0.65rem' }}>
          <div className="field">
            <label>Первичный приём</label>
            <input defaultValue="2 500 ₽" />
          </div>
          <div className="field">
            <label>Повторный</label>
            <input defaultValue="1 400 ₽" />
          </div>
        </div>
        <button type="button" className="btn secondary">
          Акт сверки (PDF)
        </button>
      </section>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Модели</strong>
        <p className="muted" style={{ margin: '0.35rem 0 0' }}>
          Постоплата, предоплатные пакеты, абонентская поддержка платформы.
        </p>
      </section>
    </>
  );
}

export function ClinicQuality() {
  return (
    <>
      <PageHeader title="Качество и аудит" subtitle="Журнал действий, жалобы внутренние проверки, KPI платформы." />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Событие</th>
              <th>Врач</th>
              <th>Пациент</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Изменена терапия</td>
              <td>Ветров Е.Ю.</td>
              <td>••8291</td>
              <td>07:54</td>
            </tr>
          </tbody>
        </table>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Жалобы пациента</strong>
        <div className="muted">Список статусов «принято / в работе / ответ отправлен»</div>
      </section>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>KPI</strong>
        <ul className="muted" style={{ paddingLeft: '1.25rem', marginBottom: 0 }}>
          <li>Сообщения до 24ч: 93%</li>
          <li>Отменённых онлайнов: 4%</li>
        </ul>
      </section>
    </>
  );
}

export function ClinicSettings() {
  return (
    <>
      <PageHeader title="Настройки клиники" subtitle="Юрлица, адреса, лицензии, платежные реквизиты и брендирование." />
      <div className="grid-2">
        <section className="card">
          <div className="field">
            <label>Наименование</label>
            <input defaultValue='ООО "Меднео Клиники"' />
          </div>
          <div className="field">
            <label>ИНН</label>
            <input defaultValue="7709876543" />
          </div>
          <div className="field">
            <label>Лицензия №</label>
            <input defaultValue="ЛО - 928171" />
          </div>
        </section>
        <section className="card">
          <div className="field">
            <label>Реквизиты для выплат Vitals</label>
            <textarea rows={4} placeholder="Банк, счёт, БИК" />
          </div>
          <div className="field">
            <label>Брендирование пациента</label>
            <button type="button" className="btn secondary">
              Загрузить логотип
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

export function ClinicPartners() {
  return (
    <>
      <PageHeader title="Партнёры" subtitle="Лаборатории и аптеки, статистика направлений, проверки Integration Service." />
      <section className="card" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn">
          Добавить партнёра
        </button>
      </section>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Партнёр</th>
              <th>Направлений за месяц</th>
              <th>Оплачено</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Центральная медлаборатория</td>
              <td>842</td>
              <td>96%</td>
              <td>
                <span className="badge ok">подключена</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
