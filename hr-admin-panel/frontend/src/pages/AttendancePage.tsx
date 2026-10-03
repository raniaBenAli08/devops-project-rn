import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  checkInWithQr,
  checkOutWithQr,
  getDailyReport,
  getEmployeeAttendance,
  getMyAttendance,
  getMyAttendanceToday,
  getTodayAttendanceQr,
  rotateTodayAttendanceQr,
} from '../api/attendance';
import { Attendance, AttendanceQr, AttendanceToday } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-orange-100 text-orange-800',
  HALF_DAY: 'bg-yellow-100 text-yellow-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
};

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ApiError {
  response?: {
    data?: {
      message?: unknown;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as ApiError;
    if (typeof apiError.response?.data?.message === 'string') return apiError.response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};

const AttendancePage: React.FC = () => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const canViewQr = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [date, setDate] = useState(localDateString(new Date()));
  const [records, setRecords] = useState<Attendance[]>([]);
  const [today, setToday] = useState<AttendanceToday | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qr, setQr] = useState<AttendanceQr | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [rotatingQr, setRotatingQr] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDailyReport = useCallback(async () => {
    try {
      setRecords(user?.role === 'EMPLOYEE'
        ? await getMyAttendance(date, date)
        : await getDailyReport(date));
    } catch (reportError) {
      console.error('Failed to fetch attendance:', reportError);
      setError(t(getErrorMessage(reportError, t('Could not load attendance records.'))));
    } finally {
      setLoading(false);
    }
  }, [date, t, user?.role, user?.employeeId]);

  const fetchToday = useCallback(async () => {
    try {
      setToday(await getMyAttendanceToday());
    } catch (todayError) {
      console.error('Failed to fetch personal attendance:', todayError);
      setError(t(getErrorMessage(todayError, t('Could not load your attendance.'))));
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    fetchDailyReport();
  }, [fetchDailyReport]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const formatTime = (datetime: string | null) => {
    if (!datetime) return t('Not recorded');
    return new Date(datetime).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { dateStyle: 'full' },
  ).format(new Date(`${value}T12:00:00`));

  const handleClockAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!today?.employeeId || !token.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const attendance = today.attendance?.checkIn && !today.attendance.checkOut
        ? await checkOutWithQr(token.trim())
        : await checkInWithQr(token.trim());
      setToday({ ...today, attendance });
      setToken('');
      setSuccess(attendance.checkOut ? t('Check-out recorded successfully.') : t('Check-in recorded successfully.'));
      await fetchDailyReport();
    } catch (clockError) {
      console.error('Failed to record attendance:', clockError);
      setError(t(getErrorMessage(clockError, t('Could not record attendance.'))));
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowQr = async () => {
    setQrLoading(true);
    setError('');
    setQrFeedback(null);
    try {
      setQr(await getTodayAttendanceQr());
    } catch (qrError) {
      console.error('Failed to generate daily attendance QR:', qrError);
      setError(t(getErrorMessage(qrError, t('Could not load today’s QR code.'))));
    } finally {
      setQrLoading(false);
    }
  };

  const handleRotateQr = async () => {
    setRotatingQr(true);
    setQrFeedback(null);
    try {
      setQr(await rotateTodayAttendanceQr());
      setQrFeedback({ type: 'success', message: t('A new QR token is now active.') });
    } catch (qrError) {
      console.error('Failed to rotate daily attendance QR:', qrError);
      setQrFeedback({
        type: 'error',
        message: t(getErrorMessage(qrError, t('Could not generate a new QR token.'))),
      });
    } finally {
      setRotatingQr(false);
    }
  };

  const isCheckedIn = Boolean(today?.attendance?.checkIn);
  const isCheckedOut = Boolean(today?.attendance?.checkOut);
  const displayedCheckIn = formatTime(today?.attendance?.checkIn || null);
  const displayedCheckOut = formatTime(today?.attendance?.checkOut || null);

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Attendance')}</h1>
          <p className="page-description">{t('Modern attendance with daily QR code check-in.')}</p>
        </div>
        {canViewQr && (
          <button
            type="button"
            onClick={handleShowQr}
            disabled={qrLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v2m-6 5h2m3 0h2v-3" />
            </svg>
            {qrLoading ? t('Loading...') : t('Today’s QR Code')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
          {success}
        </div>
      )}

      <section className={`attendance-hero${user?.role === 'EMPLOYEE' ? ' attendance-employee-hero' : ' attendance-admin-hero'}`}>
        {user?.role !== 'EMPLOYEE' ? (
          <>
            <div className="attendance-admin-heading">
              <div>
                <h2>{t('Attendance management')}</h2>
                <p className="attendance-date">{formatDate(localDateString(new Date()))}</p>
              </div>
              <div className="attendance-admin-badge">
                <span aria-hidden="true">●</span> {t('Live overview')}
              </div>
            </div>
            <div className="attendance-admin-content">
              <div>
                <p className="attendance-admin-eyebrow">{t('Today’s attendance')}</p>
                <h3>{t('Monitor your team’s daily check-in')}</h3>
                <p className="attendance-admin-description">
                  {t('Display the daily QR code so employees can validate their arrival and departure.')}
                </p>
              </div>
              <div className="attendance-admin-metrics">
                <div>
                  <span>{t('Recorded')}</span>
                  <strong>{records.length}</strong>
                </div>
                <div>
                  <span>{t('Present')}</span>
                  <strong>{records.filter((record) => record.status === 'PRESENT').length}</strong>
                </div>
                <div>
                  <span>{t('Late')}</span>
                  <strong>{records.filter((record) => record.status === 'LATE').length}</strong>
                </div>
              </div>
            </div>
          </>
        ) : (
        <div className="attendance-personal">
          <div>
            <h2>{t('My attendance today')}</h2>
            <p className="attendance-date">{formatDate(localDateString(new Date()))}</p>
          </div>
          {!today?.employeeId ? (
            <div className="attendance-unlinked">
              <strong>{t('Your login account is not linked to an employee yet.')}</strong>
              <span>{t('Please ask HR to link your account from your employee profile before clocking in.')}</span>
            </div>
          ) : (
            <>
              <div className="attendance-times">
                <div className="attendance-time-card">
                  <span className="attendance-time-label">
                    <span aria-hidden="true">↳</span> {t('Check In')}
                  </span>
                  <strong>{displayedCheckIn}</strong>
                </div>
                <div className="attendance-time-card">
                  <span className="attendance-time-label">
                    <span aria-hidden="true">↗</span> {t('Check Out')}
                  </span>
                  <strong>{displayedCheckOut}</strong>
                </div>
              </div>
              <form className="attendance-token-form" onSubmit={handleClockAction}>
                <label htmlFor="attendance-qr-token">
                  <span className="attendance-qr-label-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v2m-6 4h2m3 0h2v-3" />
                    </svg>
                  </span>
                  {isCheckedIn && !isCheckedOut ? t('Validate check-out') : t('QR attendance')}
                </label>
                <input
                  id="attendance-qr-token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={isCheckedIn && !isCheckedOut
                    ? t('Scan the same QR code to check out')
                    : t('Scan or enter today’s QR token')}
                  autoComplete="off"
                  disabled={isCheckedOut || submitting}
                  required
                />
                <button
                  type="submit"
                  disabled={isCheckedOut || submitting || !token.trim()}
                  className="attendance-clock-button"
                >
                  {submitting
                    ? t('Saving...')
                    : isCheckedOut
                      ? t('Day completed')
                      : isCheckedIn
                        ? t('Validate check-out')
                        : t('Validate check-in')}
                </button>
                <p>
                  {isCheckedIn && !isCheckedOut
                    ? t('Your arrival is recorded. Scan the same QR code again to record your departure.')
                    : t('Use a QR scanner keyboard or enter the token printed under the daily QR code.')}
                </p>
              </form>
            </>
          )}
        </div>
        )}
        <div className="attendance-hero-footer">
          {user?.role === 'EMPLOYEE' && today?.employeeName && <span>{t('Employee')}: {today.employeeName}</span>}
          {user?.role === 'EMPLOYEE' && today?.attendance?.status && (
            <span className={`employee-status ${statusColors[today.attendance.status]}`}>
              {t(today.attendance.status)}
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="attendance-summary-card">
          <span>{t('Total Records')}</span>
          <strong>{records.length}</strong>
        </div>
        <div className="attendance-summary-card">
          <span>{t('Present')}</span>
          <strong className="text-green-600">{records.filter((record) => record.status === 'PRESENT').length}</strong>
        </div>
        <div className="attendance-summary-card">
          <span>{t('Late')}</span>
          <strong className="text-orange-600">{records.filter((record) => record.status === 'LATE').length}</strong>
        </div>
        <div className="attendance-summary-card">
          <span>{t('On Leave')}</span>
          <strong className="text-blue-600">{records.filter((record) => record.status === 'ON_LEAVE').length}</strong>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="attendance-date">{t('Date')}</label>
        <input
          id="attendance-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {user?.role !== 'EMPLOYEE' && <th className="px-6 py-3 text-left">{t('Employee')}</th>}
                  {user?.role !== 'EMPLOYEE' && <th className="px-6 py-3 text-left">{t('Code')}</th>}
                  <th className="px-6 py-3 text-left">{t('Check In')}</th>
                  <th className="px-6 py-3 text-left">{t('Check Out')}</th>
                  <th className="px-6 py-3 text-left">{t('Hours')}</th>
                  <th className="px-6 py-3 text-left">{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    {user?.role !== 'EMPLOYEE' && <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{record.employeeName}</td>}
                    {user?.role !== 'EMPLOYEE' && <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{record.employeeCode}</td>}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatTime(record.checkIn)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatTime(record.checkOut)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {record.totalHours === null ? t('Not calculated') : `${record.totalHours} ${t('hours-short')}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[record.status]}`}>
                        {t(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'EMPLOYEE' ? 4 : 6} className="px-6 py-12 text-center text-gray-500">
                      {t('No attendance records for this date')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qr && (
        <div
          className="attendance-qr-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQr(null);
          }}
        >
          <section className="attendance-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="attendance-qr-title">
            <header className="attendance-qr-header">
              <h2 id="attendance-qr-title">{t('Today’s attendance QR code')}</h2>
              <button
                type="button"
                className="attendance-qr-close"
                onClick={() => setQr(null)}
                aria-label={t('Close')}
              >
                ×
              </button>
            </header>
            <div className="attendance-qr-content">
              <div className="attendance-qr-image">
                <QRCodeSVG value={qr.token} size={256} level="M" includeMargin />
              </div>
              <div className="attendance-qr-token" aria-label={t('Daily token')}>{qr.token}</div>
              {qrFeedback && (
                <p className={`attendance-qr-feedback attendance-qr-feedback-${qrFeedback.type}`} role={qrFeedback.type === 'error' ? 'alert' : 'status'}>
                  {qrFeedback.message}
                </p>
              )}
              <p className="attendance-qr-help">
                {t('Display this QR so employees can record their arrival.')}
              </p>
              <button
                type="button"
                className="attendance-qr-rotate"
                onClick={handleRotateQr}
                disabled={rotatingQr}
              >
                {rotatingQr ? t('Generating...') : t('Generate a new token')}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
