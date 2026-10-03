import React, { useState, useEffect } from 'react';
import { getDashboardStats, getPersonalDashboardStats, DashboardStats, PersonalDashboardStats } from '../api/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { formatTnd } from '../utils/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  tint: string;
  icon: string;
  detail: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, tint, icon, detail }) => (
  <div className="stat-card bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      </div>
      <div className="stat-icon" style={{ '--stat-tint': tint } as React.CSSProperties}>
        <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-400">{detail}</p>
  </div>
);

const DashboardPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [personalStats, setPersonalStats] = useState<PersonalDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'EMPLOYEE') {
          setPersonalStats(await getPersonalDashboardStats());
        } else {
          setStats(await getDashboardStats());
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.role]);

  const trend = stats?.attendanceTrend || [];
  const maxAttendance = Math.max(1, ...trend.map((day) => day.present));
  const points = trend.map((day, index) => {
    const x = trend.length <= 1 ? 500 : 24 + (index * 952) / (trend.length - 1);
    const attendanceRate = day.present / maxAttendance;
    return { x, y: 176 - attendanceRate * 135, day };
  });
  const chartLine = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const chartArea = points.length ? `24,184 ${chartLine} 976,184` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={t('Loading dashboard')}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user?.role === 'EMPLOYEE') {
    const personal = personalStats;
    return (
      <div>
        <div className="dashboard-intro">
          <div>
            <h1>{t('Hello')}, {personal?.employeeName || user.username} <span aria-hidden="true">👋</span></h1>
            <p>{t('Here is your personal HR dashboard.')}</p>
          </div>
          <div className="dashboard-date">
            {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'full' }).format(new Date())}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard title={t('My attendance rate')} value={`${personal?.attendanceRate || 0}%`} color="text-blue-600" tint="#eff6ff"
            detail={t('Last 30 days')} icon="M9 19v-6a2 2 0 01 2-2h2a2 2 0 012 2v6" />
          <StatCard title={t('Present days')} value={personal?.attendancePresentDays || 0} color="text-green-600" tint="#e8fbf3"
            detail={`${personal?.attendanceTotalDays || 0} ${t('recorded days')}`} icon="m5 12 4 4L19 6" />
          <StatCard title={t('Pending leave')} value={personal?.pendingLeaveRequests || 0} color="text-yellow-600" tint="#fff7e6"
            detail={t('Requests awaiting approval')} icon="M8 7V3m8 4V3m-9 8h10" />
          <StatCard title={t('Performance rating')} value={personal?.performanceRating == null ? '—' : `${personal.performanceRating.toFixed(1)}/5`}
            color="text-purple-600" tint="#f5f3ff" detail={t('Average review rating')} icon="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3" />
        </div>
        <div className="dashboard-panels">
          <section className="dashboard-panel">
            <h2 className="dashboard-panel-heading">{t('My HR summary')}</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <p>{t('Approved leave days')}: <strong>{personal?.approvedLeaveDays || 0}</strong></p>
              <p>{t('Latest net salary')}: <strong>{personal?.recentPayrollNet == null ? '—' : formatTnd(personal.recentPayrollNet, locale)}</strong></p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-intro">
        <div>
          <h1>{t('Hello')}, {user?.username || t('Team')} <span aria-hidden="true">👋</span></h1>
          <p>{t("Here's an overview of today's HR activity.")}</p>
        </div>
        <div className="dashboard-date">
          {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'full' }).format(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('Total Employees')}
          value={stats?.totalEmployees || 0}
          color="text-blue-600"
          tint="#eff6ff"
          detail={`${stats?.activeEmployees || 0} ${t('active employees')}`}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
        <StatCard
          title={t('On Leave Today')}
          value={stats?.onLeaveToday || 0}
          color="text-yellow-600"
          tint="#fff7e6"
          detail={t('employees away today')}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
        <StatCard
          title={t('Open Positions')}
          value={stats?.openPositions || 0}
          color="text-green-600"
          tint="#e8fbf3"
          detail={t('currently available')}
          icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
        <StatCard
          title={t('Avg Attendance')}
          value={`${stats?.averageAttendance || 0}%`}
          color="text-blue-600"
          tint="#eaf2ff"
          detail={t('organization average')}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </div>

      <div className="dashboard-panels">
        <section className="dashboard-panel">
          <h2 className="dashboard-panel-heading">{t('Attendance Trend (Last 7 Days)')}</h2>
          <p className="dashboard-panel-caption">{t('Daily attendance')}</p>
          {points.length > 0 ? (
            <>
              <svg className="attendance-chart" viewBox="0 0 1000 200" role="img" aria-label={t('Attendance Trend (Last 7 Days)')}>
                <defs>
                  <linearGradient id="attendance-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="attendance-chart-grid" d="M24 42H976 M24 105H976 M24 168H976" />
                <polygon className="attendance-chart-area" points={chartArea} />
                <polyline className="attendance-chart-line" points={chartLine} />
                {points.map(({ x, y, day }) => (
                  <circle key={day.date} className="attendance-chart-point" cx={x} cy={y} r="5">
                    <title>{`${day.date}: ${day.present} ${t('Present')}`}</title>
                  </circle>
                ))}
              </svg>
              <div className="attendance-chart-labels">
                {points.map(({ day }) => (
                  <span key={day.date}>
                    {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }).format(new Date(`${day.date}T12:00:00`))}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="dashboard-empty-state">{t('No attendance data available')}</div>
          )}
        </section>

        <section className="dashboard-panel">
          <h2 className="dashboard-panel-heading">{t('Department Distribution')}</h2>
          <p className="dashboard-panel-caption">{t('Employee distribution')}</p>
          <div className="department-list">
            {stats?.departmentDistribution?.map((dept) => (
              <div key={dept.department} className="department-row">
                <div className="department-row-head">
                  <span>{dept.department}</span>
                  <span>{dept.count}</span>
                </div>
                <div className="department-track" aria-label={`${dept.department}: ${dept.count}`}>
                  <div
                    className="department-fill"
                    style={{ width: `${Math.min(100, (dept.count / Math.max(1, stats?.totalEmployees || 0)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.departmentDistribution || stats.departmentDistribution.length === 0) && (
              <p className="text-gray-500 text-sm">{t('No department data available')}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
