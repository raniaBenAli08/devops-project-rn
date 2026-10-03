import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/employees', label: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { path: '/departments', label: 'Departments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/contracts', label: 'Contracts', icon: 'M8 7h8m-8 4h8m-8 4h5m4-12H7a2 2 0 00-2 2v14l4-3h9a2 2 0 002-2V5a2 2 0 00-2-2z' },
  { path: '/leave', label: 'Leave', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/attendance', label: 'Attendance', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/payroll', label: 'Payroll', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/reviews', label: 'Reviews', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { path: '/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const Sidebar: React.FC = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const username = user?.username || 'User';
  const initials = username.slice(0, 2).toUpperCase();
  const visibleItems = user?.role === 'ADMIN'
    ? [...navItems, { path: '/registrations', label: 'Registrations', icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m9-11a4 4 0 110-8 4 4 0 010 8m7 4v6m3-3h-6' }]
    : navItems.filter((item) => user?.role !== 'EMPLOYEE' || ['/', '/leave', '/attendance', '/payroll'].includes(item.path));

  return (
    <aside className="app-sidebar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 7h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2zM11 21v-3h2v3" />
          </svg>
        </span>
        <div>
          <div className="brand-name">HR Flow</div>
          <div className="brand-caption">{t('People operations')}</div>
        </div>
      </div>
      <div className="sidebar-label">{t('Workspace')}</div>
      <nav className="sidebar-nav" aria-label={t('Workspace')}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-account">
        <div className="sidebar-account-caption">{t('Connected as')}</div>
        <div className="sidebar-account-name">
          <span className="sidebar-account-avatar" aria-hidden="true">{initials}</span>
          <span>{username}</span>
        </div>
        <div className="sidebar-account-role">{user?.role ? t(user.role) : t('People operations')}</div>
      </div>
    </aside>
  );
};

export default Sidebar;
