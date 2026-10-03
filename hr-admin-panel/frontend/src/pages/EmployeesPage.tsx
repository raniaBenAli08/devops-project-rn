import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteEmployee, getEmployees } from '../api/employees';
import { getDepartments } from '../api/departments';
import { getPositions } from '../api/positions';
import EmployeeForm from '../components/EmployeeForm';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Department, Employee, PageResponse, Position } from '../types';

const statusColors: Record<Employee['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  ON_LEAVE: 'bg-amber-50 text-amber-700',
  TERMINATED: 'bg-red-50 text-red-700',
};

const EmployeesPage: React.FC = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const canDelete = user?.role === 'ADMIN';
  const [employees, setEmployees] = useState<PageResponse<Employee> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees({
        search: search.trim() || undefined,
        departmentId: departmentFilter ? Number(departmentFilter) : undefined,
        page,
        size: 20,
        sortBy: 'id',
        sortDir: 'desc',
      });
      setEmployees(data);
      setError('');
    } catch (loadError) {
      console.error('Failed to fetch employees:', loadError);
      setError(t('Could not load employees. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getDepartments(), getPositions()])
      .then(([departmentData, positionData]) => {
        setDepartments(departmentData);
        setPositions(positionData);
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load employee form options:', loadError);
        setError(t('Could not load departments and positions.'));
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, search, departmentFilter]);

  const openCreateForm = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
    setError('');
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
    setError('');
  };

  const closeForm = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleSaveSuccess = async () => {
    closeForm();
    if (page !== 0) {
      setPage(0);
    } else {
      await fetchEmployees();
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(t('Terminate this employee?'))) return;
    setDeletingEmployeeId(employee.id);
    setError('');
    try {
      await deleteEmployee(employee.id);
      await fetchEmployees();
    } catch (deleteError) {
      console.error('Failed to terminate employee:', deleteError);
      setError(t('Could not delete the employee.'));
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Employees')}</h1>
          <p className="page-description">
            {employees?.totalElements || 0} {t('employees in total')}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            <span aria-hidden="true">＋</span> {t('Add')}
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="employee-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={t('Search employees')}
            aria-label={t('Search employees')}
          />
        </label>
        <select
          value={departmentFilter}
          onChange={(event) => {
            setDepartmentFilter(event.target.value);
            setPage(0);
          }}
          aria-label={t('Filter by department')}
          className="employee-department-filter"
        >
          <option value="">{t('All departments')}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
          <button type="button" onClick={fetchEmployees} className="ml-3 font-semibold underline">
            {t('Retry')}
          </button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : employees?.content.length ? (
          <>
            <div className="employees-grid">
              {employees.content.map((employee) => (
                <article className="employee-card" key={employee.id}>
                  <div className="employee-card-top">
                    <div className="employee-avatar" aria-hidden="true">
                      {`${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div className="employee-card-copy">
                      <div className="employee-card-name">{employee.fullName}</div>
                      <div className="employee-card-role">{employee.positionTitle || t('No position')}</div>
                      <div className="employee-card-department">{employee.departmentName || t('No department')}</div>
                    </div>
                    <span className={`employee-status ${statusColors[employee.status]}`}>
                      {t(employee.status)}
                    </span>
                  </div>
                  <div className="employee-card-email" title={employee.email}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                    <span>{employee.email}</span>
                  </div>
                  <div className="employee-card-footer">
                    <Link to={`/employees/${employee.id}`}>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      {t('View')}
                    </Link>
                    {canManage && (
                      <button type="button" onClick={() => openEditForm(employee)}>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="m14 6 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" />
                        </svg>
                        {t('Edit')}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(employee)}
                        disabled={deletingEmployeeId === employee.id}
                        aria-label={`${t('Terminate')} ${employee.fullName}`}
                        title={t('Terminate')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {employees.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-sm text-gray-600">
                  {t('Showing page')} {employees.page + 1} {t('of')} {employees.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {t('Previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={employees.last}
                    className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {t('Next')}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="dashboard-empty-state rounded-xl border border-gray-200 bg-white">
            {t('No employees found')}
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="department-dialog-backdrop">
          <section role="dialog" aria-modal="true" aria-labelledby="employee-dialog-title" className="department-dialog">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="employee-dialog-title" className="text-lg font-semibold text-slate-900">
                {editingEmployee ? t('Edit Employee') : t('New Employee')}
              </h2>
              <button type="button" onClick={closeForm} className="text-sm text-slate-500 hover:text-slate-800">
                {t('Cancel')}
              </button>
            </div>
            <EmployeeForm
              key={editingEmployee?.id || 'new'}
              employee={editingEmployee}
              departments={departments}
              positions={positions}
              onSuccess={handleSaveSuccess}
              onCancel={closeForm}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
