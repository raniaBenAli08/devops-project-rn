import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerEmployee } from '../api/registrations';
import { useLocale } from '../contexts/LocaleContext';

const RegisterPage: React.FC = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', firstName: '', lastName: '', phone: '', dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await registerEmployee({
        ...form,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      setSuccess(t('Registration submitted. Check your email to verify your address.'));
      window.setTimeout(() => navigate('/login'), 1800);
    } catch (requestError: any) {
      const response = requestError.response?.data;
      setError(response?.message || Object.values(response?.errors || {}).join(' ') || t('Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-lockup"><span className="brand-mark">HR</span><span>HR Flow</span></div>
        <div className="login-copy">
          <div className="header-eyebrow" style={{ color: '#93c5fd' }}>{t('People operations')}</div>
          <h1>{t('Join your HR workspace.')}</h1>
          <p>{t('Verify your email, then wait for administrator approval.')}</p>
        </div>
        <div className="login-panel-footer">HR Flow · {t('People operations')}</div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-card register-form-card">
          <h2>{t('Employee registration')}</h2>
          <p>{t('Create your employee access request')}</p>
          {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label htmlFor="firstName">{t('First name')}</label><input id="firstName" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
              <div><label htmlFor="lastName">{t('Last name')}</label><input id="lastName" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
            </div>
            <div><label htmlFor="email">{t('Email')}</label><input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
            <div><label htmlFor="username">{t('Username')}</label><input id="username" required autoComplete="username" value={form.username} onChange={(e) => update('username', e.target.value)} /></div>
            <div><label htmlFor="password">{t('Password')}</label><input id="password" type="password" required minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label htmlFor="phone">{t('Phone')}</label><input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
              <div><label htmlFor="dateOfBirth">{t('Date of Birth')}</label><input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></div>
            </div>
            <button type="submit" disabled={loading} className="login-submit">{loading ? t('Creating...') : t('Create access request')}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500"><Link className="font-semibold text-blue-600 hover:underline" to="/login">{t('Back to sign in')}</Link></p>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
