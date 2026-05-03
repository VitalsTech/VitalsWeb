import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '../../components/LogoMark';
import { useState } from 'react';

export function PatientAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="auth-page">
      <div className="auth-panel-wrap">
        <div className="auth-brand-panel">
          <LogoMark />
        </div>
        <div className="auth-panel card">
        <Link to="/" className="link-back">
          ← На главную
        </Link>
        <div className="tab-row" role="tablist">
          <button
            type="button"
            className="tab"
            data-active={mode === 'login'}
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className="tab"
            data-active={mode === 'register'}
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>
        {mode === 'login' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/patient');
            }}
          >
            <div className="field">
              <label htmlFor="phone">Номер телефона</label>
              <input id="phone" name="phone" type="tel" placeholder="+7 900 000-00-00" />
            </div>
            <div className="field">
              <label htmlFor="password">Пароль</label>
              <input id="password" name="password" type="password" placeholder="••••••••" />
            </div>
            <button className="btn" type="submit" style={{ width: '100%' }}>
              Войти
            </button>
            <button type="button" className="btn ghost" style={{ width: '100%', marginTop: '0.5rem' }}>
              Войти через ЕСИА (Госуслуги)
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/patient/profile');
            }}
          >
            <div className="field">
              <label htmlFor="reg-phone">Телефон</label>
              <input id="reg-phone" name="phone" type="tel" />
            </div>
            <div className="field">
              <label htmlFor="code">SMS-код</label>
              <input id="code" type="text" placeholder="Из сообщения" />
            </div>
            <button className="btn" type="submit" style={{ width: '100%' }}>
              Создать аккаунт
            </button>
            <button type="button" className="btn ghost" style={{ width: '100%', marginTop: '0.5rem' }}>
              Подключить ЕСИА
            </button>
          </form>
        )}
        <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
          Демо-интерфейс без бэкенда. Кнопки ведут в мок-приложение.
        </p>
        </div>
      </div>
    </div>
  );
}
