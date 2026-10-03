import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEmployeeById } from '../api/employees';
import { getAttendanceAccounts, linkAttendanceAccount } from '../api/attendanceAccounts';
import { AttendanceAccount, Employee } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { formatTnd } from '../utils/currency';

type Tab = 'info' | 'attendance' | 'leave' | 'payroll' | 'reviews';

const EmployeeDetailPage: React.FC = () => {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceAccounts, setAttendanceAccounts] = useState<AttendanceAccount[]>([]);
  const [selectedAttendanceAccount, setSelectedAttendanceAccount] = useState('');
  const [savingAttendanceAccount, setSavingAttendanceAccount] = useState(false);
  const [attendanceAccountError, setAttendanceAccountError] = useState('');
  const canManageAttendanceAccounts = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const data = await getEmployeeById(parseInt(id));
        setEmployee(data);
      } catch (err) {
        console.error('Failed to fetch employee:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (!canManageAttendanceAccounts || !id) return;
    getAttendanceAccounts()
      .then(setAttendanceAccounts)
      .catch((error) => {
        console.error('Failed to fetch attendance accounts:', error);
        setAttendanceAccountError(t('Could not load attendance accounts.'));
      });
  }, [canManageAttendanceAccounts, id, t]);

  useEffect(() => {
    if (employee) {
      setSelectedAttendanceAccount(
        String(attendanceAccounts.find((account) => account.username === employee.attendanceUsername)?.id || ''),
      );
    }
  }, [employee, attendanceAccounts]);

  const handleSaveAttendanceAccount = async () => {
    if (!employee) return;
    setSavingAttendanceAccount(true);
    setAttendanceAccountError('');
    try {
      const accountId = selectedAttendanceAccount ? Number(selectedAttendanceAccount) : null;
      await linkAttendanceAccount(employee.id, accountId);
      const linkedAccount = attendanceAccounts.find((account) => account.id === accountId);
      setEmployee({ ...employee, attendanceUsername: linkedAccount?.username || null });
      setAttendanceAccounts((accounts) => accounts.map((account) => {
        if (account.id === accountId) return { ...account, employeeId: employee.id };
        if (account.username === employee.attendanceUsername) return { ...account, employeeId: null };
        return account;
      }));
    } catch (error) {
      console.error('Failed to link attendance account:', error);
      setAttendanceAccountError(t('Could not save attendance account.'));
    } finally {
      setSavingAttendanceAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!employee) {
    return <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">{t('Employee not found')}</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: t('Info') },
    { key: 'attendance', label: t('Attendance') },
    { key: 'leave', label: t('Leave') },
    { key: 'payroll', label: t('Payroll') },
    { key: 'reviews', label: t('Reviews') },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link to="/employees" className="text-primary-600 hover:text-primary-800 text-sm">
          &larr; {t('Back to Employees')}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
              <p className="text-gray-500">{employee.employeeCode} | {employee.positionTitle || t('No position')}</p>
              <p className="text-gray-500">{employee.departmentName || t('No department')}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
            employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {t(employee.status)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Email')}</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Phone')}</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Date of Birth')}</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Hire Date')}</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.hireDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Manager')}</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.managerName || t('None')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">{t('Salary')}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.salary ? formatTnd(employee.salary, locale) : '-'}
                  </p>
                </div>
              </div>
              {canManageAttendanceAccounts && (
                <section className="mt-8 rounded-xl border border-gray-200 bg-slate-50 p-5">
                  <h2 className="text-base font-semibold text-slate-900">{t('Attendance Account')}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t('Link a login account so this employee can clock in with the daily QR code.')}</p>
                  {attendanceAccountError && <p className="mt-3 text-sm text-red-600" role="alert">{attendanceAccountError}</p>}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedAttendanceAccount}
                      onChange={(event) => setSelectedAttendanceAccount(event.target.value)}
                      aria-label={t('Attendance Account')}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2"
                    >
                      <option value="">{t('No account linked')}</option>
                      {attendanceAccounts.map((account) => (
                        <option
                          key={account.id}
                          value={account.id}
                          disabled={account.employeeId !== null && account.username !== employee.attendanceUsername}
                        >
                          {account.username} ({account.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveAttendanceAccount}
                      disabled={savingAttendanceAccount}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                      {savingAttendanceAccount ? t('Saving...') : t('Save Changes')}
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
          {activeTab === 'attendance' && (
            <p className="text-gray-500">{t('Attendance history will be displayed here.')}</p>
          )}
          {activeTab === 'leave' && (
            <p className="text-gray-500">{t('Leave history will be displayed here.')}</p>
          )}
          {activeTab === 'payroll' && (
            <p className="text-gray-500">{t('Payroll history will be displayed here.')}</p>
          )}
          {activeTab === 'reviews' && (
            <p className="text-gray-500">{t('Performance reviews will be displayed here.')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
