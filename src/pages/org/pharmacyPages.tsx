function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </header>
  );
}

export function PharmacyDashboard() {
  return (
    <>
      <Header title="Дашборд аптеки" subtitle="Электронные рецепты, заказы и ключевые показатели." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn secondary">
          Отчёт Excel
        </button>
        <button type="button" className="btn secondary">
          Отчёт PDF
        </button>
      </div>
      <div className="grid-3">
        {[
          ['Новые заказы', '142'],
          ['В сборке', '54'],
          ['Ожидают выдачи', '61'],
          ['Доставлены', '3 982'],
          ['Отмены', '12'],
        ].map(([k, v]) => (
          <div key={k} className="card stat-card">
            <p className="stat-card__label">{k}</p>
            <p className="stat-card__value">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <section className="card">
          <strong>Финансы Vitals</strong>
          <p className="muted">Выручка · ожидание выплат · комиссии</p>
        </section>
        <section className="card">
          <strong>Критический остаток</strong>
          <span className="badge danger">метформин 850 мг ниже минимума</span>
        </section>
      </div>
      <button type="button" className="btn" style={{ marginTop: '1rem' }}>
        Перейти к новым заказам
      </button>
    </>
  );
}

export function PharmacyOrders() {
  return (
    <>
      <Header title="Управление заказами" subtitle="Список статусов, комментарий пациенту, история и печать." />
      <div className="toolbar toolbar-spaced">
        <select defaultValue="new">
          <option value="new">Новые</option>
          <option>В сборке</option>
          <option>Выдача</option>
        </select>
        <button type="button" className="btn secondary">
          Печать этикетки
        </button>
      </div>
      <article className="card">
        <strong>Заказ #VTR-98312</strong>
        <span className="muted" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Пациент ••9281 • e-рецепт № ER-77412
        </span>
        <div className="btn-row">
          <button type="button" className="btn secondary">
            Принят
          </button>
          <button type="button" className="btn secondary">
            В сборке
          </button>
          <button type="button" className="btn">
            Готов
          </button>
          <button type="button" className="btn ghost">
            Курьер
          </button>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Комментарий для пациента: «Сток резерва истёк через 48 ч — см. смс».
        </p>
        <small className="muted">История: фармацевт Р — статус изменён на «В сборке» 12:58</small>
      </article>
    </>
  );
}

export function PharmacyInventory() {
  return (
    <>
      <Header title="Ассортимент и остатки" subtitle="Отключение SKU, минимумы, цены для Vitals, импорт Excel." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn secondary">
          Импорт остатков
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Остаток</th>
              <th>Порог</th>
              <th>Цена пациента</th>
              <th>Цена Vitals</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Омепразол 20 мг №30</td>
              <td>180</td>
              <td>40</td>
              <td>410 ₽</td>
              <td>379 ₽</td>
              <td>
                <button type="button" className="btn secondary" style={{ fontSize: '0.76rem', padding: '0.35rem' }}>
                  Скрыть для Vitals
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PharmacyPrescriptions() {
  return (
    <>
      <Header title="Реестр рецептов" subtitle="QR, действие, фильтры по статусу и пациенту." />
      <div className="toolbar toolbar-spaced">
        <input placeholder="Номер, пациент, врач" style={{ flex: '1', minWidth: '200px' }} />
        <select>
          <option>Действителен</option>
          <option>Просрочен</option>
          <option>Выдан</option>
        </select>
      </div>
      <div className="card">
        <strong>QR рецепта</strong>
        <div style={{ marginTop: '0.65rem', width: '120px', height: '120px', border: '1px dashed var(--vitals-border)' }} />
      </div>
      <button type="button" className="btn secondary" style={{ marginTop: '0.75rem' }}>
        Отметить использованием
      </button>
      <button type="button" className="btn ghost">
        Инициировать возврат
      </button>
    </>
  );
}

export function PharmacyLocations() {
  return (
    <>
      <Header title="Точки обслуживания" subtitle="Филиалы, режим работы и геолокации для записи пациента." />
      <div className="grid-2">
        <article className="card">
          <strong>Москва, Шелепихинская наб.</strong>
          <span className="muted" style={{ display: 'block' }}>
            Ответственный: Бикмаев Р.Ю. • 24/7
          </span>
          <button type="button" className="btn secondary">
            Изменить график праздников
          </button>
        </article>
        <article className="card">
          <strong>Московская область, Домодедово</strong>
          <span className="muted" style={{ display: 'block' }}>
            Статус: временно закрыта
          </span>
          <button type="button" className="btn secondary">
            Изменить
          </button>
        </article>
      </div>
    </>
  );
}

export function PharmacyStaff() {
  return (
    <>
      <Header title="Сотрудники аптеки" subtitle="Роли, ограничения, привязка к точке, блокировка." />
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn">
          Добавить сотрудника
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Роль</th>
              <th>Точка</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Бикмаев Р.Ю.</td>
              <td>Выпуск без рецепта</td>
              <td>Центральная №1</td>
              <td>
                <span className="badge ok">активен</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PharmacyIntegrations() {
  return (
    <>
      <Header title="Интеграции склада и касс" subtitle="Обмен JSON/XML, ручная синхронизация, логи." />
      <div className="grid-2">
        <article className="card">
          <strong>1С Warehouse</strong>
          <span className="badge ok">зелёный</span>
        </article>
        <article className="card">
          <strong>ПО кассовая зона</strong>
          <span className="badge warn">жёлтый</span>
          <button type="button" className="btn secondary" style={{ marginTop: '0.5rem' }}>
            Обновить остатки
          </button>
        </article>
      </div>
    </>
  );
}

export function PharmacyBilling() {
  return (
    <>
      <Header title="Финансы аптеки" subtitle="Расчёт с платформой и пациентом, тарификация марж." />
      <div className="grid-3">
        <div className="card stat-card">
          <p className="stat-card__label">В пути выплат Vitals</p>
          <p className="stat-card__value">612 тыс ₽</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Комиссии</p>
          <p className="stat-card__value">14%</p>
        </div>
        <div className="card stat-card">
          <p className="stat-card__label">Акт сверки</p>
          <button type="button" className="btn secondary">
            PDF
          </button>
        </div>
      </div>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Наценка для Vitals</strong>
        <label className="field">
          тип
          <select defaultValue="%">
            <option>% </option>
            <option>фикс ₽</option>
          </select>
        </label>
      </section>
    </>
  );
}

export function PharmacyAudit() {
  return (
    <>
      <Header title="Качество и аудит отпуска" subtitle="Журнал рецептурной выдачи, жалобы, отмены." />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Время</th>
              <th>Сотрудник</th>
              <th>Событие</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>11:54</td>
              <td>Бикмаев Р.Ю.</td>
              <td>Выполнен заказ №VTR-98312</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PharmacySettings() {
  return (
    <>
      <Header title="Профиль аптеки" subtitle="Юрлицензия, контакты, политики возврата." />
      <div className="grid-2">
        <div className="field">
          <label>Юрнаименование</label>
          <input />
        </div>
        <div className="field">
          <label>Часы работы по умолчанию</label>
          <textarea rows={4} placeholder="Отображаются при бронировании" />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Политика возврата</label>
          <textarea rows={5} placeholder="Неоткрытые упаковки — до 14 дней" />
        </div>
      </div>
    </>
  );
}

export function PharmacyDelivery() {
  return (
    <>
      <Header title="Доставка" subtitle="Зоны, тарификация слотов и подключённые службы." />
      <section className="card">
        <strong>Службы через Integration Service</strong>
        <div className="btn-row">
          <span className="badge neutral">Яндекс.Доставка</span>
          <span className="badge neutral">СДЭК</span>
          <span className="badge neutral">Свои курьеры</span>
        </div>
      </section>
      <section className="card" style={{ marginTop: '1rem' }}>
        <strong>Зона доставки</strong>
        <p className="muted">Геозоны, радиус, зональный тариф, бесплатно от суммы.</p>
        <button type="button" className="btn secondary">
          Редактор зоны
        </button>
      </section>
      <button type="button" className="btn secondary">
        Экспорт маршрутных листов
      </button>
    </>
  );
}
