import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUser, isLoggedIn, logout } from '../utils/auth';

function AppNavbar({ theme, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = isLoggedIn() ? getUser() : null;
  const isAdmin = user?.role === 'admin';

  const signOut = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const links = user
    ? isAdmin
      ? [
          ['Dashboard', '/admin-dashboard'],
          ['Exams', '/admin/exams/create'],
          ['Questions', '/admin/questions/create'],
          ['Aptitude', '/admin/aptitude'],
          ['Coding', '/admin/coding'],
          ['Analytics', '/admin/analytics']
        ]
      : [
          ['Dashboard', '/student-dashboard'],
          ['Exams', '/student/exams'],
          ['Practice', '/student/practice'],
          ['Aptitude', '/student/aptitude'],
          ['Performance', '/student/performance'],
          ['Coding', '/student/coding']
        ]
    : location.pathname === '/'
      ? [['Features', '/#features'], ['How it works', '/#how-it-works']]
      : [];

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <Link to={user ? (isAdmin ? '/admin-dashboard' : '/student-dashboard') : '/'} className="app-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">EF</span>
          <span>ExamForge</span>
        </Link>

        <button
          type="button"
          className={`nav-menu-toggle${menuOpen ? ' is-open' : ''}`}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`app-nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {links.map(([label, path]) => (
            <Link
              key={label}
              to={path}
              className={`nav-link${location.pathname === path ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          <button
            type="button"
            className="nav-theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {user ? (
            <div className="nav-user-actions">
              <span className="nav-user-avatar" aria-hidden="true">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="nav-user-name">{user.name}</span>
              <button type="button" className="nav-signout button button-small button-quiet" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="nav-public-actions">
              {location.pathname === '/register' ? (
                <Link to="/login" className="nav-primary-link button button-primary button-small" onClick={() => setMenuOpen(false)}>Sign in</Link>
              ) : (
                <>
                  <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Sign in</Link>
                  <Link to="/register" className="nav-primary-link button button-primary button-small" onClick={() => setMenuOpen(false)}>Create account</Link>
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default AppNavbar;
