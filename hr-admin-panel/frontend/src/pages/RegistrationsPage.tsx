import React, { useEffect, useState } from 'react';
import {
  approveRegistration,
  getPendingRegistrations,
  PendingRegistration,
  rejectRegistration,
} from '../api/registrations';
import { useLocale } from '../contexts/LocaleContext';

const RegistrationsPage: React.FC = () => {
  const { t, locale } = useLocale();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setRegistrations(await getPendingRegistrations());
      setError('');
    } catch (loadError: any) {
      setError(loadError.response?.data?.message || t('Could not load registrations.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const decide = async (registration: PendingRegistration, action: 'approve' | 'reject') => {
    if (action === 'reject' && !window.confirm(t('Reject this registration?'))) return;
    setBusyId(registration.id);
    try {
      if (action === 'approve') await approveRegistration(registration.id);
      else await rejectRegistration(registration.id);
      await load();
    } catch (actionError: any) {
      setError(actionError.response?.data?.message || t('Could not update registration.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Employee registrations')}</h1>
          <p className="page-description">{t('Approve verified employee access requests.')}</p>
        </div>
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>
        ) : registrations.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('No pending registrations.')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50"><tr>
                {[t('Employee'), t('Email'), t('Username'), t('Registered'), t('Actions')].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">{registration.firstName} {registration.lastName}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{registration.email}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{registration.username}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(new Date(registration.registeredAt))}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <button type="button" disabled={busyId === registration.id} onClick={() => void decide(registration, 'approve')} className="mr-4 font-semibold text-emerald-700 disabled:opacity-50">{t('Approve')}</button>
                      <button type="button" disabled={busyId === registration.id} onClick={() => void decide(registration, 'reject')} className="font-semibold text-rose-600 disabled:opacity-50">{t('Reject')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationsPage;
