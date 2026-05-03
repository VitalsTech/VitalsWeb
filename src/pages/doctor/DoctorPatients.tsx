const ROWS = [
  { id: '1', name: 'Иванова А.С.', last: '30.05.2026', dx: 'Гипертензия, наблюдение', tag: 'лечится' },
  { id: '2', name: 'Ковалёва М.Ю.', last: 'сегодня', dx: 'Одышка, обследование', tag: 'остро' },
  { id: '3', name: 'Наумова Т.Е.', last: '12.05.2026', dx: 'Профилактика', tag: 'стабильно' },
];

export function DoctorPatients() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Пациенты</h1>
        <p className="page-subtitle">
          Список под наблюдением: карточка — просмотр и правки диагноза, документов, рецептов.
        </p>
      </header>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Пациент</th>
              <th>Последнее обращение</th>
              <th>Сводка</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.last}</td>
                <td>{r.dx}</td>
                <td>
                  <span className="badge neutral">{r.tag}</span>
                </td>
                <td>
                  <button type="button" className="btn secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>
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
