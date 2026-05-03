import { Link } from 'react-router-dom';
import { LogoMark } from '../components/LogoMark';

function HeroLogo() {
  return (
    <div className="landing-hero-mark-wrap">
      <img
        className="landing-hero-mark"
        src="/logo.png"
        alt="Vitals — знак экосистемы"
        width={520}
        height={520}
        decoding="async"
      />
    </div>
  );
}

export function Landing() {
  return (
    <div className="landing">
      <header className="landing-header landing-header--sticky">
        <Link to="/" className="landing-logo landing-logo--header-bar" aria-label="Vitals — на главную">
          <img
            src="/label-f.png"
            alt=""
            className="landing-header-label"
            width={180}
            height={40}
            decoding="async"
          />
          <span className="visually-hidden">Vitals</span>
        </Link>
        <nav className="landing-nav-cta" aria-label="Быстрые действия">
          <Link className="landing-link-outline" to="/patient/auth">
            Вход
          </Link>
          <Link className="btn landing-btn-header" to="/patient/auth">
            Начать с Vitals
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <div className="landing-hero-shell">
          <section className="landing-hero" aria-labelledby="landing-title">
            <div className="landing-hero-grid">
              <div className="landing-hero-copy">
                <p className="landing-eyebrow">Медицинская экосистема</p>
                <h1 id="landing-title" className="landing-title-xl">
                  Один надёжный путь для пациента, врача и инфраструктуры
                </h1>
                <p className="landing-lead-strong">
                  Vitals заменяет разрозненные офлайн-процессы цельным опытом: от самочувствия и ИИ-триажа до
                  консультаций, документов и записи — система держит маршрут до результата.
                </p>
                <div className="landing-cta-cluster">
                  <Link className="btn landing-btn-hero-primary" to="/patient/auth">
                    Войти как пациент
                  </Link>
                  <Link className="btn secondary landing-btn-hero-secondary" to="/doctor">
                    Кабинет врача
                  </Link>
                </div>
                <dl className="landing-kpis">
                  <div className="landing-kpi">
                    <dt>Маршрут</dt>
                    <dd>Сквозная запись без «перезвона клиники»</dd>
                  </div>
                  <div className="landing-kpi">
                    <dt>Организации</dt>
                    <dd>Живые связи пациента с клиникой, аптекой и лабораторией</dd>
                  </div>
                  <div className="landing-kpi">
                    <dt>Данные</dt>
                    <dd>Стандарты для МИС, FHIR и LIS — без лишней тяжести интерфейса</dd>
                  </div>
                </dl>
              </div>
              <HeroLogo />
            </div>
          </section>
        </div>

        <section className="landing-band" aria-labelledby="how-heading">
          <div className="landing-section-inner">
            <h2 id="how-heading" className="landing-section-title">
              Как это устроено
            </h2>
            <p className="landing-section-lead">
              Три шага без перегрузки интерфейса — каждый блок масштабируется без перелома сетки.
            </p>
            <div className="landing-steps">
              <article className="landing-step card landing-step-card">
                <span className="landing-step-num">01</span>
                <h3>Вход и понимание</h3>
                <p>Самочувствие и ИИ-триаж задают темп: что сделать первым делом без лишних экранов.</p>
              </article>
              <article className="landing-step card landing-step-card">
                <span className="landing-step-num">02</span>
                <h3>Согласованные решения</h3>
                <p>Врач, пациент и организации видят согласованный контур: записи, рецепты, направления.</p>
              </article>
              <article className="landing-step card landing-step-card">
                <span className="landing-step-num">03</span>
                <h3>Результат в документах</h3>
                <p>Единые карточки документов: сканы и электронные версии остаются в одном профиле.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section-inner landing-roles-wrap" aria-labelledby="roles-heading">
          <div className="landing-roles-head">
            <h2 id="roles-heading" className="landing-section-title">
              Выберите роль для демо
            </h2>
            <p className="landing-section-lead landing-section-lead--tight">
              Один стиль платформы — разные профили пациента, врача, клиники, аптеки и лаборатории.
            </p>
          </div>
          <nav className="landing-role-cards" aria-label="Роли платформы">
            <Link className="landing-role-card" to="/patient/auth">
              <span className="landing-role-card__badge">пациент</span>
              <strong>Пациент</strong>
              <span>Вход по телефону или ЕСИА, главная, ИИ-триаж и документы.</span>
            </Link>
            <Link className="landing-role-card" to="/doctor">
              <span className="landing-role-card__badge">специалист</span>
              <strong>Врач</strong>
              <span>Очередь, срочность, консультации и журнал ваших пациентов.</span>
            </Link>
            <Link className="landing-role-card" to="/org/clinic">
              <span className="landing-role-card__badge">организация</span>
              <strong>Клиника</strong>
              <span>Метрики, отделения, распись, финансы и качество без лага от тяжёлых канвасов.</span>
            </Link>
            <Link className="landing-role-card" to="/org/pharmacy">
              <span className="landing-role-card__badge">организация</span>
              <strong>Аптека</strong>
              <span>Электронные рецепты, заказы и контур доставки.</span>
            </Link>
            <Link className="landing-role-card" to="/org/lab">
              <span className="landing-role-card__badge">организация</span>
              <strong>Лаборатория</strong>
              <span>Заказы, направления, интеграции LIS и контур качества.</span>
            </Link>
          </nav>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner landing-footer-inner--centered">
          <div className="landing-footer-brand">
            <LogoMark />
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} Vitals — единый цифровой контур здоровья. Демонстрационные интерфейсы без
            живых данных.
          </p>
        </div>
      </footer>
    </div>
  );
}
