import { useState } from 'react';

const PRESETS = ['Стало хуже', 'Нужна консультация', 'После процедуры', 'Высокая температура'];

export function PatientTriage() {
  const [text, setText] = useState('');

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">ИИ-триаж</h1>
        <p className="page-subtitle">
          Опишите симптомы — система оценит срочность и предложит маршрут.
        </p>
      </header>
      <div className="split">
        <div className="card chat" aria-live="polite">
          <div className="chat-bubble chat-bubble--ai">
            Здравствуйте! Что беспокоит сегодня? Можете выбрать фразу ниже или написать
            своими словами.
          </div>
          <div className="chat-bubble chat-bubble--user">Нужна консультация по давлению</div>
          <div className="chat-bubble chat-bubble--ai">
            Поняла. Измерили ли давление сегодня? Есть ли головная боль или затуманивание зрения?
          </div>
        </div>
        <aside className="card">
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Быстрые фразы</h2>
          <div className="quick-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className="btn secondary"
                onClick={() => setText((t) => (t ? `${t}; ${p}` : p))}
              >
                {p}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="card" style={{ marginTop: '1rem', maxWidth: '640px' }}>
        <label className="field">
          <span className="visually-hidden">Сообщение</span>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Опишите симптомы…" />
        </label>
        <div className="toolbar">
          <button type="button" className="btn">
            Отправить
          </button>
          <span className="badge warn">Подсказка</span>
          <span className="muted">При угрозе жизни наберите скорую: 112 / 103</span>
        </div>
      </div>
    </>
  );
}
