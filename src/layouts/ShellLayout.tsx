import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogoMark } from '../components/LogoMark';

export type ShellNavItem = { to: string; label: string; end?: boolean };

export function ShellLayout({
  links,
  homeHref = '/',
}: {
  links: readonly ShellNavItem[];
  homeHref?: string;
}) {
  return (
    <div className="shell">
      <aside className="shell__aside">
        <div className="shell__logo-panel">
          <Link
            to={homeHref}
            className="landing-logo landing-logo--shell"
            aria-label="На главную Vitals"
          >
            <LogoMark />
          </Link>
        </div>
        <nav className="shell__nav" aria-label="Раздел">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                'shell__link' + (isActive ? ' shell__link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
