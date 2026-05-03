const MOCK = [
  { id: '1', type: 'Справка для работы', hasScan: true, hasElec: true, date: '12.03.2026' },
  { id: '2', type: 'Выписка амб.', hasScan: true, hasElec: true, date: '01.03.2026' },
  { id: '3', type: 'Электронный рецепт', hasScan: false, hasElec: true, date: '30.05.2026' },
];

export function PatientDocuments() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Документы</h1>
        <p className="page-subtitle">
          Скан и электронная версия. Просмотр, редактирование и добавление.
        </p>
      </header>
      <div className="toolbar toolbar-spaced">
        <button type="button" className="btn">
          Добавить документ
        </button>
        <button type="button" className="btn secondary">
          Импорт из МИС
        </button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Бумажная версия</th>
              <th>Электронная версия</th>
              <th>Дата</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {MOCK.map((d) => (
              <tr key={d.id}>
                <td>{d.type}</td>
                <td>{d.hasScan ? <span className="badge ok">Скан</span> : '—'}</td>
                <td>{d.hasElec ? <span className="badge neutral">FHIR PDF</span> : '—'}</td>
                <td>{d.date}</td>
                <td>
                  <button type="button" className="btn secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
