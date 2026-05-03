export function PatientSupport() {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Поддержка и FAQ</h1>
        <p className="page-subtitle">Вопросы и обращение в службу сопровождения</p>
      </header>
      <div className="split">
        <section className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>FAQ</h2>
          <details className="faq-item card" style={{ marginBottom: '0.5rem' }}>
            <summary>Как подключить ЕСИА?</summary>
            <p>На экране входа выберите «Войти через ЕСИА» и подтвердите данные на Госуслугах.</p>
          </details>
          <details className="faq-item card" style={{ marginBottom: '0.5rem' }}>
            <summary>Где мои результаты анализов?</summary>
            <p>Раздел «Документы» синхронизируется с клиникой и лабораторией после интеграции.</p>
          </details>
          <details className="faq-item card">
            <summary>Как изменить записанный приём?</summary>
            <p>Раздел «Врачи» → карточка специалиста → управление записью или отмена.</p>
          </details>
        </section>
        <aside className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Обратиться</h2>
          <div className="field">
            <label htmlFor="subject">Тема</label>
            <select id="subject" defaultValue="tech">
              <option value="tech">Техника</option>
              <option value="med">Триаж и записи</option>
              <option value="finance">Оплата</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="msg">Сообщение</label>
            <textarea id="msg" rows={4} placeholder="Опишите проблему" />
          </div>
          <button type="button" className="btn" style={{ width: '100%' }}>
            Отправить
          </button>
        </aside>
      </div>
    </>
  );
}
