const ITEMS = [
  { title: 'Напоминание о записи', time: 'сегодня, 09:12', unread: true },
  { title: 'Рецепт готов к получению', time: 'вчера', unread: false },
  { title: 'Результаты анализов добавлены', time: '28.05', unread: false },
];

export function PatientNotifications() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Уведомления</h1>
        <p className="page-subtitle">Хронология событий с главной страницы</p>
      </header>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {ITEMS.map((n) => (
          <li key={n.title} className="card" style={{ marginBottom: '0.65rem' }}>
            <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 0 }}>
              <strong>{n.title}</strong>
              {n.unread ? <span className="badge ok">новое</span> : null}
            </div>
            <span className="muted">{n.time}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
