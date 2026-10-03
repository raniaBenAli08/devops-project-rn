import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-lockup">
          <span className="brand-mark" aria-hidden="true">HR</span>
          <span>HR Admin</span>
        </div>
        <div className="login-copy">
          <div className="header-eyebrow" style={{ color: '#93c5fd' }}>{t('People operations')}</div>
          <h1>{t('Manage your people, all in one place.')}</h1>
          <p>{t('Sign in to continue to your workspace.')}</p>
          <div className="login-dots" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <div className="login-panel-footer">HR Admin · {t('People operations')}</div>
      </section>
      <section className="login-form-panel">
        <div className="locale-switch login-locale" role="group" aria-label={t('Language')}>
          <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          <button type="button" aria-pressed={locale === 'fr'} onClick={() => setLocale('fr')}>FR</button>
        </div>
        <div className="login-form-card">
          <h2>{t('Welcome back')}</h2>
          <p>{t('Sign in to your account')}</p>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username">{t('Username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('Enter username')}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password">{t('Password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Enter password')}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit"
          >
            {loading ? t('Signing in...') : t('Sign in')}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          {t('No account yet?')}{' '}
          <Link className="font-semibold text-blue-600 hover:underline" to="/register">{t('Register as an employee')}</Link>
        </p>
        </div>
        <div className="mt-5 text-xs text-slate-400">HR Admin · {t('Secure workspace')}</div>
      </section>
    </div>
  );
};

export default LoginPage;
