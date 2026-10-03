import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import { Payroll } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { formatTnd } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

const statusStyles: Record<Payroll['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  CALCULATED: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PAID: 'bg-green-50 text-green-700',
};

interface ApiError {
  response?: {
    data?: {
      message?: unknown;
      errors?: Record<string, string>;
    };
  };
}

const errorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as ApiError;
    const validationErrors = apiError.response?.data?.errors;
    if (validationErrors) return Object.values(validationErrors).join(' ');
    if (typeof apiError.response?.data?.message === 'string') {
      return apiError.response.data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const PayrollPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const today = new Date();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayrolls = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = isEmployee && user?.employeeId
        ? await apiClient.get('/payroll/me')
        : await apiClient.get('/payroll/monthly', { params: { month, year } });
      setPayrolls(response.data);
    } catch (loadError) {
      console.error('Failed to fetch payrolls:', loadError);
      setPayrolls([]);
      setError(errorMessage(loadError, t('Could not load payroll records.')));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayrolls();
  }, [month, year, isEmployee, user?.employeeId]);

  const visiblePayrolls = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return payrolls.filter((payroll) => {
      const matchesSearch = !normalizedSearch ||
        payroll.employeeName.toLocaleLowerCase().includes(normalizedSearch) ||
        payroll.employeeCode.toLocaleLowerCase().includes(normalizedSearch);
      return matchesSearch && (!statusFilter || payroll.status === statusFilter);
    });
  }, [payrolls, search, statusFilter]);

  const counts = useMemo(() => ({
    total: payrolls.length,
    inProgress: payrolls.filter((payroll) =>
      payroll.status === 'DRAFT' || payroll.status === 'CALCULATED',
    ).length,
    calculated: payrolls.filter((payroll) => payroll.status === 'CALCULATED').length,
    approved: payrolls.filter((payroll) => payroll.status === 'APPROVED').length,
    paid: payrolls.filter((payroll) => payroll.status === 'PAID').length,
  }), [payrolls]);

  const formatCurrency = (amount: number) => formatTnd(amount, locale);

  const handleCalculate = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.post('/payroll/calculate', null, { params: { month, year } });
      const generatedCount = Array.isArray(response.data) ? response.data.length : 0;
      setSuccess(
        generatedCount > 0
          ? t('Payroll generated successfully.').replace('{count}', String(generatedCount))
          : t('Payroll records already exist for active employees.'),
      );
      await fetchPayrolls(false);
    } catch (generationError) {
      console.error('Failed to calculate payroll:', generationError);
      setError(errorMessage(generationError, t('Could not generate payroll.')));
    } finally {
      setGenerating(false);
    }
  };

  const monthLabel = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'long',
  }).format(new Date(year, month - 1, 1));

  const metrics = [
    { label: t('Total'), value: counts.total, tone: 'blue' },
    { label: t('In progress'), value: counts.inProgress, tone: 'slate' },
    { label: t('Paid'), value: counts.paid, tone: 'green' },
    { label: t('Approved'), value: counts.approved, tone: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('Payslips')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {payrolls.length} {t('payslip count')} · {t('Payroll generation and status tracking')}
          </p>
        </div>
        {!isEmployee && <button
          type="button"
          onClick={() => void handleCalculate()}
          disabled={generating || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          {generating ? t('Generating...') : t('Generate')}
        </button>}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          {!loading && (
            <button type="button" onClick={() => void fetchPayrolls()} className="ml-3 font-semibold underline">
              {t('Retry')}
            </button>
          )}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-100 bg-white">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <section aria-label={t('Payroll summary')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const toneClasses: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-700',
                slate: 'bg-slate-100 text-slate-600',
                green: 'bg-emerald-50 text-emerald-700',
              };
              return (
                <article key={metric.label} className="min-h-28 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${toneClasses[metric.tone]}`}>
                    {metric.label}
                  </span>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                </article>
              );
            })}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            {!isEmployee && <label className="relative block">
              <span className="sr-only">{t('Search payrolls')}</span>
              <svg aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search payrolls')}
                className="w-64 rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>}
            <label>
              <span className="sr-only">{t('Filter by status')}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">{t('All statuses')}</option>
                <option value="DRAFT">{t('DRAFT')}</option>
                <option value="CALCULATED">{t('CALCULATED')}</option>
                <option value="APPROVED">{t('APPROVED')}</option>
                <option value="PAID">{t('PAID')}</option>
              </select>
            </label>
            {!isEmployee && <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <span>{t('Period')}</span>
              <select
                value={month}
                aria-label={t('Month')}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' }).format(new Date(2023, index, 1))}
                  </option>
                ))}
              </select>
              <select
                value={year}
                aria-label={t('Year')}
                onChange={(event) => setYear(Number(event.target.value))}
                className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {Array.from({ length: 7 }, (_, index) => today.getFullYear() - 5 + index).map((optionYear) => (
                  <option key={optionYear} value={optionYear}>{optionYear}</option>
                ))}
              </select>
            </label>}
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {visiblePayrolls.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="17" height="14" rx="2" />
                    <path d="M7 9h7M7 13h4" />
                    <path d="M17 12h4v5h-4a2.5 2.5 0 0 1 0-5Z" />
                    <circle cx="17.5" cy="14.5" r=".5" fill="currentColor" />
                  </svg>
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search || statusFilter ? t('No payroll records match your filters.') : t('No payslips')}
                </h2>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  {search || statusFilter
                    ? t('Try changing your search or status filter.')
                    : isEmployee ? t('Your payslip history will appear here.') : t('Generate the first payslips for active employees.')}
                </p>
                {!isEmployee && !search && !statusFilter && (
                  <button
                    type="button"
                    onClick={() => void handleCalculate()}
                    disabled={generating}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    <span aria-hidden="true" className="text-lg leading-none">+</span>
                    {generating ? t('Generating...') : t('Generate a payslip')}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="font-semibold text-slate-900">{t('Payslip list')} · {monthLabel} {year}</h2>
                </div>
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {[t('Employee'), t('Base Salary'), t('Overtime'), t('Deductions'), t('Bonus'), t('Net Salary'), t('Status')].map((heading) => (
                        <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visiblePayrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="text-sm font-medium text-slate-800">{payroll.employeeName}</div>
                          <div className="text-xs text-slate-500">{payroll.employeeCode}</div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatCurrency(payroll.baseSalary)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatCurrency(payroll.overtime)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-rose-600">−{formatCurrency(payroll.deductions)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-emerald-700">+{formatCurrency(payroll.bonus)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">{formatCurrency(payroll.netSalary)}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[payroll.status]}`}>
                            {t(payroll.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {visiblePayrolls.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                          {t('No payroll records match your filters.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PayrollPage;
