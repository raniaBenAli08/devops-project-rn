import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  approveLeave,
  getLeaveBalances,
  getMyLeaveBalance,
  getMyLeaveRequests,
  getLeaveRequests,
  rejectLeave,
  requestLeave,
  requestMyLeave,
} from '../api/leave';
import { getEmployees } from '../api/employees';
import { useLocale } from '../contexts/LocaleContext';
import { formatTnd } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import { Employee, LeaveBalance, LeaveRequest } from '../types';
import { getEmployeeHistory, EmployeeHistory } from '../api/employeeHistory';

const DEFAULT_ANNUAL_LEAVE_DAYS = 20;

const leaveTypeLabels: Record<LeaveRequest['type'], string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  PERSONAL: 'Personal Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
};

const statusStyles: Record<LeaveRequest['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
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

const MetricIcon: React.FC<{ kind: 'calendar' | 'check' | 'clock' | 'trend' }> = ({ kind }) => {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /><path d="M8 15h.01M12 15h.01M16 15h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  };
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[kind]}
    </svg>
  );
};

const LeavePage: React.FC = () => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historyEmployee, setHistoryEmployee] = useState<LeaveRequest | null>(null);
  const [history, setHistory] = useState<EmployeeHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ANNUAL' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    reason: '',
  });
  const year = new Date().getFullYear();
  const formatDays = (days: number): string =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(days);
  const daysUnit = locale === 'fr' ? 'j' : 'd';

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [leaveRequests, leaveBalances, firstEmployeePage] = await Promise.all([
        isEmployee ? getMyLeaveRequests() : getLeaveRequests(),
        isEmployee ? getMyLeaveBalance(year) : getLeaveBalances(year),
        isEmployee ? Promise.resolve({ content: [], totalPages: 0 }) : getEmployees({ page: 0, size: 100, sortBy: 'lastName', sortDir: 'asc' }),
      ]);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, firstEmployeePage.totalPages - 1) }, (_, index) =>
          getEmployees({ page: index + 1, size: 100, sortBy: 'lastName', sortDir: 'asc' }),
        ),
      );
      setRequests(leaveRequests);
      setBalances(leaveBalances);
      setEmployees(isEmployee ? [] : [
        ...firstEmployeePage.content,
        ...remainingPages.flatMap((page) => page.content),
      ]);
    } catch (loadError) {
      console.error('Failed to load leave dashboard:', loadError);
      setError(errorMessage(loadError, t('Could not load leave information.')));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isEmployee, user?.employeeId]);

  const employeeBalances = useMemo(() => employees.map((employee) => {
    const annualBalance = balances.find(
      (balance) => balance.employeeId === employee.id && balance.type === 'ANNUAL',
    );
    const totalDays = Number(annualBalance?.totalDays ?? DEFAULT_ANNUAL_LEAVE_DAYS);
    const usedDays = Number(annualBalance?.usedDays ?? 0);
    const pendingDays = requests
      .filter((request) =>
        request.employeeId === employee.id &&
        request.type === 'ANNUAL' &&
        request.status === 'PENDING',
      )
      .reduce((total, request) => total + request.days, 0);

    return {
      employee,
      totalDays,
      usedDays,
      pendingDays,
      availableDays: Math.max(0, totalDays - usedDays - pendingDays),
    };
  }), [balances, employees, requests]);

  const annualTotals = useMemo(() => employeeBalances.reduce((totals, balance) => ({
    total: totals.total + balance.totalDays,
    used: totals.used + balance.usedDays,
    pending: totals.pending + balance.pendingDays,
    available: totals.available + balance.availableDays,
  }), { total: 0, used: 0, pending: 0, available: 0 }), [employeeBalances]);

  const pendingRequestCount = requests.filter((request) => request.status === 'PENDING').length;
  const approvedRequestCount = requests.filter((request) => request.status === 'APPROVED').length;
  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return requests.filter((request) => {
      const matchesSearch = !normalizedSearch ||
        request.employeeName.toLocaleLowerCase().includes(normalizedSearch) ||
        (request.reason ?? '').toLocaleLowerCase().includes(normalizedSearch);
      return matchesSearch && (!statusFilter || request.status === statusFilter);
    });
  }, [requests, search, statusFilter]);

  const formatDate = (date: string) => new Intl.DateTimeFormat(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' },
  ).format(new Date(`${date}T12:00:00`));
  const formatTime = (datetime: string | null) => datetime
    ? new Date(datetime).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const formatCurrency = (amount: number) => formatTnd(amount, locale);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const requestData = {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      };
      if (isEmployee) await requestMyLeave(requestData);
      else await requestLeave({ employeeId: Number(formData.employeeId), ...requestData });
      setShowForm(false);
      setFormData({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      setSuccess(t('Leave request submitted successfully.'));
      await loadData(false);
    } catch (saveError) {
      console.error('Failed to submit leave request:', saveError);
      setError(errorMessage(saveError, t('Could not submit the leave request.')));
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (request: LeaveRequest, decision: 'approve' | 'reject') => {
    setError('');
    setSuccess('');
    setBusyRequestId(request.id);
    try {
      if (decision === 'approve') await approveLeave(request.id, 1);
      else await rejectLeave(request.id, 1);
      setSuccess(t(decision === 'approve' ? 'Leave request approved.' : 'Leave request rejected.'));
      await loadData(false);
    } catch (decisionError) {
      console.error(`Failed to ${decision} leave request:`, decisionError);
      setError(errorMessage(decisionError, t('Could not update the leave request.')));
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleViewHistory = async (request: LeaveRequest) => {
    setHistoryEmployee(request);
    setHistory(null);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      setHistory(await getEmployeeHistory(request.employeeId));
    } catch (loadError) {
      console.error('Failed to load employee history:', loadError);
      setHistoryError(errorMessage(loadError, t('Could not load employee history.')));
    } finally {
      setHistoryLoading(false);
    }
  };

  const metrics = [
    { label: t('Total balance'), value: `${formatDays(annualTotals.total)}${daysUnit}`, kind: 'calendar' as const, tone: 'blue' },
    { label: t('Days taken'), value: `${formatDays(annualTotals.used)}${daysUnit}`, kind: 'check' as const, tone: 'green' },
    { label: t('Pending days'), value: `${formatDays(annualTotals.pending)}${daysUnit}`, kind: 'clock' as const, tone: 'amber' },
    { label: t('Available'), value: `${formatDays(annualTotals.available)}${daysUnit}`, kind: 'trend' as const, tone: 'blue-strong' },
  ];

  if (isEmployee) {
    const annualBalance = balances.find((balance) => balance.type === 'ANNUAL');
    const personalRequests = requests;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('My leave')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('Manage your leave requests and personal balance.')}</p>
        </div>
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('Available days')}</p><p className="mt-2 text-3xl font-bold text-emerald-700">{formatDays(Number(annualBalance?.remainingDays ?? DEFAULT_ANNUAL_LEAVE_DAYS))}{daysUnit}</p></article>
          <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('Used days')}</p><p className="mt-2 text-3xl font-bold text-slate-900">{formatDays(Number(annualBalance?.usedDays ?? 0))}{daysUnit}</p></article>
          <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t('My requests')}</p><p className="mt-2 text-3xl font-bold text-blue-700">{personalRequests.length}</p></article>
        </section>
        <button type="button" onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">{t('New Leave Request')}</button>
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{t('My leave requests')}</h2></div>
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100"><thead><tr>{[t('Leave Type'), t('Dates'), t('Days'), t('Status')].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{personalRequests.map((request) => <tr key={request.id}><td className="px-5 py-4 text-sm">{t(leaveTypeLabels[request.type])}</td><td className="px-5 py-4 text-sm">{formatDate(request.startDate)} – {formatDate(request.endDate)}</td><td className="px-5 py-4 text-sm">{formatDays(request.days)}{daysUnit}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>{t(request.status)}</span></td></tr>)}</tbody>
          </table></div>
        </section>
        {showForm && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value as LeaveRequest['type'] })} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="ANNUAL">{t('Annual Leave')}</option><option value="SICK">{t('Sick Leave')}</option><option value="PERSONAL">{t('Personal Leave')}</option></select>
              <input required type="date" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <input required type="date" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <input value={formData.reason} onChange={(event) => setFormData({ ...formData, reason: event.target.value })} placeholder={t('Reason')} className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{saving ? t('Saving...') : t('Submit')}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">{t('Cancel')}</button></div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('Leave')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingRequestCount} {t('pending')} · {approvedRequestCount} {t('approved')}
          </p>
        </div>
        {isEmployee && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            {t('New Leave Request')}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          {!loading && (
            <button type="button" onClick={() => void loadData()} className="ml-3 font-semibold underline">
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
          <section aria-label={t('Leave summary')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const toneClasses: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-emerald-50 text-emerald-600',
                amber: 'bg-amber-50 text-amber-600',
                'blue-strong': 'bg-blue-100 text-blue-700',
              };
              return (
                <article key={metric.label} className="flex min-h-24 items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${toneClasses[metric.tone]}`}>
                    <MetricIcon kind={metric.kind} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">{metric.label}</p>
                    <p className={`mt-0.5 text-2xl font-bold tracking-tight ${metric.tone === 'blue-strong' ? 'text-blue-700' : 'text-slate-900'}`}>
                      {metric.value}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-blue-600"><MetricIcon kind="calendar" /></span>
              <h2 className="text-lg font-semibold text-slate-900">{t('Leave balances')} ({year})</h2>
            </div>
            {employeeBalances.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">{t('No employees found')}</p>
            ) : (
              <div className="space-y-5">
                {employeeBalances.map(({ employee, totalDays, usedDays, pendingDays, availableDays }) => {
                  const progress = totalDays > 0
                    ? Math.min(100, ((usedDays + pendingDays) / totalDays) * 100)
                    : 0;
                  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
                  return (
                    <div key={employee.id} className="grid gap-3 sm:grid-cols-[190px_minmax(100px,1fr)_125px_70px] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                          {initials}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-700">{employee.fullName}</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={t('Leave used by {name}').replace('{name}', employee.fullName)}
                        aria-valuemin={0}
                        aria-valuemax={totalDays}
                        aria-valuenow={Math.min(totalDays, usedDays + pendingDays)}
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                      >
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                                <span className="text-sm text-slate-500">
                                  {formatDays(usedDays)} / {formatDays(totalDays)} {daysUnit}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatDays(availableDays)}{daysUnit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative block">
                <span className="sr-only">{t('Search leave requests')}</span>
                <svg aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Search leave requests')}
                  className="w-64 rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label>
                <span className="sr-only">{t('Filter by status')}</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">{t('All statuses')}</option>
                  <option value="PENDING">{t('PENDING')}</option>
                  <option value="APPROVED">{t('APPROVED')}</option>
                  <option value="REJECTED">{t('REJECTED')}</option>
                </select>
              </label>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-slate-900">{t('Leave requests')}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {[t('Employee'), t('Leave Type'), t('Dates'), t('Days'), t('Status'), t('Actions')].map((heading) => (
                        <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">{request.employeeName}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{t(leaveTypeLabels[request.type])}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(request.startDate)} – {formatDate(request.endDate)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDays(request.days)}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                            {t(request.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => void handleViewHistory(request)}
                                className="font-medium text-blue-700 hover:text-blue-900"
                              >
                                {t('View history')}
                              </button>
                            {request.status === 'PENDING' && (
                              <>
                                <button
                                type="button"
                                disabled={busyRequestId === request.id}
                                onClick={() => void handleDecision(request, 'approve')}
                                className="font-medium text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                              >
                                {t('Approve')}
                              </button>
                              <button
                                type="button"
                                disabled={busyRequestId === request.id}
                                onClick={() => void handleDecision(request, 'reject')}
                                className="font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
                              >
                                {t('Reject')}
                              </button>
                            </>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                          {requests.length === 0 ? t('No leave requests yet.') : t('No leave requests match your filters.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setShowForm(false);
          }}
        >
          <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{t('New Leave Request')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('Fill in the details to submit a leave request.')}</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} disabled={saving} aria-label={t('Close')} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                {t('Employee')}
                <select
                  required
                  value={formData.employeeId}
                  onChange={(event) => setFormData({ ...formData, employeeId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">{t('Select an employee')}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName} · {employee.employeeCode}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                {t('Leave Type')}
                <select
                  value={formData.type}
                  onChange={(event) => setFormData({ ...formData, type: event.target.value as LeaveRequest['type'] })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {(Object.keys(leaveTypeLabels) as LeaveRequest['type'][]).map((type) => (
                    <option key={type} value={type}>{t(leaveTypeLabels[type])}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                {t('Start Date')}
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                {t('End Date')}
                <input
                  required
                  type="date"
                  min={formData.startDate || undefined}
                  value={formData.endDate}
                  onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                {t('Reason')}
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(event) => setFormData({ ...formData, reason: event.target.value })}
                  placeholder={t('Reason for leave...')}
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {t('Cancel')}
              </button>
              <button type="submit" disabled={saving || employees.length === 0} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? t('Saving...') : t('Submit Request')}
              </button>
            </div>
          </form>
        </div>
      )}

      {historyEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHistoryEmployee(null);
          }}
        >
          <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="employee-history-title">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">{t('Employee history')}</p>
                <h2 id="employee-history-title" className="mt-1 text-2xl font-semibold text-slate-900">{historyEmployee.employeeName}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('Review the employee record before processing this request.')}</p>
              </div>
              <button type="button" onClick={() => setHistoryEmployee(null)} aria-label={t('Close')} className="rounded-lg p-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
            </div>
            {historyLoading && <div className="flex min-h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>}
            {historyError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{historyError}</div>}
            {history && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <HistoryMetric label={t('Leave requests')} value={history.leaves.length} />
                  <HistoryMetric label={t('Attendance records')} value={history.attendance.length} />
                  <HistoryMetric label={t('Payslips')} value={history.payroll.length} />
                  <HistoryMetric label={t('Performance reviews')} value={history.reviews.length} />
                </div>
                <HistorySection title={t('Leave history')}>
                  <HistoryTable headers={[t('Type'), t('Dates'), t('Days'), t('Status')]} rows={history.leaves.slice(0, 8).map((leave) => [
                    t(leaveTypeLabels[leave.type]), `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`, `${formatDays(leave.days)}${daysUnit}`, t(leave.status),
                  ])} empty={t('No leave history.')} />
                </HistorySection>
                <HistorySection title={t('Attendance history (last 12 months)')}>
                  <HistoryTable headers={[t('Date'), t('Check In'), t('Check Out'), t('Hours'), t('Status')]} rows={history.attendance.slice(-10).reverse().map((attendance) => [
                    formatDate(attendance.date), formatTime(attendance.checkIn), formatTime(attendance.checkOut), attendance.totalHours == null ? '—' : String(attendance.totalHours), t(attendance.status),
                  ])} empty={t('No attendance history.')} />
                </HistorySection>
                <div className="grid gap-6 lg:grid-cols-2">
                  <HistorySection title={t('Payroll history')}>
                    <HistoryTable headers={[t('Period'), t('Net salary'), t('Status')]} rows={history.payroll.slice(-6).reverse().map((payroll) => [
                      `${payroll.month}/${payroll.year}`, formatCurrency(payroll.netSalary), t(payroll.status),
                    ])} empty={t('No payroll history.')} />
                  </HistorySection>
                  <HistorySection title={t('Performance history')}>
                    <HistoryTable headers={[t('Period'), t('Rating'), t('Status')]} rows={history.reviews.slice(-6).reverse().map((review) => [
                      review.period, `${review.rating}/5`, t(review.status),
                    ])} empty={t('No performance history.')} />
                  </HistorySection>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const HistoryMetric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
  </article>
);

const HistorySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-xl border border-slate-100 bg-white">
    <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{title}</h3>
    <div className="overflow-x-auto">{children}</div>
  </section>
);

const HistoryTable: React.FC<{ headers: string[]; rows: string[][]; empty: string }> = ({ headers, rows, empty }) => (
  <table className="min-w-full divide-y divide-slate-100 text-sm">
    <thead className="bg-slate-50/80"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{header}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">
      {rows.map((row, index) => <tr key={`${row.join('-')}-${index}`}><>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="whitespace-nowrap px-4 py-3 text-slate-600">{cell}</td>)}</></tr>)}
      {rows.length === 0 && <tr><td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500">{empty}</td></tr>}
    </tbody>
  </table>
);

export default LeavePage;
