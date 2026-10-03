import React, { useEffect, useMemo, useState } from 'react';
import {
  createDepartment,
  deleteDepartment,
  DepartmentRequest,
  getDepartments,
  updateDepartment,
} from '../api/departments';
import { createPosition, getPositions, PositionRequest } from '../api/positions';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Department, Position } from '../types';

const emptyDepartmentForm: DepartmentRequest = { name: '', code: '', description: '' };
const emptyPositionForm: PositionRequest = {
  title: '',
  level: '',
  minSalary: null,
  maxSalary: null,
  departmentId: 0,
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
    if (typeof apiError.response?.data?.message === 'string') {
      return apiError.response.data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const DepartmentIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
    <path d="M4 20V7.5L12 4v16M4 20h16M12 10h8v10M8 9h1m-1 3h1m-1 3h1m7-2h1m-1 3h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ActionIcon: React.FC<{ action: 'edit' | 'delete' }> = ({ action }) => action === 'edit' ? (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path d="m14 6 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
    <path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DepartmentsPage: React.FC = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const canDelete = user?.role === 'ADMIN';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<'department' | 'position' | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentRequest>(emptyDepartmentForm);
  const [positionForm, setPositionForm] = useState<PositionRequest>(emptyPositionForm);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedDepartments, loadedPositions] = await Promise.all([getDepartments(), getPositions()]);
      setDepartments(loadedDepartments);
      setPositions(loadedPositions);
      setError('');
    } catch (loadError) {
      console.error('Failed to load departments and positions:', loadError);
      setError(getErrorMessage(loadError, t('Could not load departments and positions.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const positionsByDepartment = useMemo(() => {
    const grouped = new Map<number, Position[]>();
    positions.forEach((position) => {
      if (position.departmentId === null) return;
      const departmentPositions = grouped.get(position.departmentId) || [];
      departmentPositions.push(position);
      grouped.set(position.departmentId, departmentPositions);
    });
    return grouped;
  }, [positions]);

  const openCreateDepartment = () => {
    setEditingDepartment(null);
    setDepartmentForm(emptyDepartmentForm);
    setError('');
    setDialog('department');
  };

  const openEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      code: department.code,
      description: department.description || '',
    });
    setError('');
    setDialog('department');
  };

  const openCreatePosition = () => {
    setPositionForm({
      ...emptyPositionForm,
      departmentId: departments[0]?.id || 0,
    });
    setError('');
    setDialog('position');
  };

  const closeDialog = () => {
    setDialog(null);
    setEditingDepartment(null);
    setDepartmentForm(emptyDepartmentForm);
    setPositionForm(emptyPositionForm);
    setError('');
  };

  const handleDepartmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, departmentForm);
      } else {
        await createDepartment(departmentForm);
      }
      closeDialog();
      await loadData();
    } catch (saveError) {
      console.error('Failed to save department:', saveError);
      setError(getErrorMessage(saveError, t('Could not save the department.')));
    } finally {
      setSaving(false);
    }
  };

  const handlePositionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPosition(positionForm);
      closeDialog();
      await loadData();
    } catch (saveError) {
      console.error('Failed to save position:', saveError);
      setError(getErrorMessage(saveError, t('Could not save the position.')));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!window.confirm(t('Delete this department?'))) return;
    setDeletingDepartmentId(department.id);
    setError('');
    try {
      await deleteDepartment(department.id);
      await loadData();
    } catch (deleteError) {
      console.error('Failed to delete department:', deleteError);
      setError(getErrorMessage(deleteError, t('Could not delete the department.')));
    } finally {
      setDeletingDepartmentId(null);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Departments & Positions')}</h1>
          <p className="page-description">
            {departments.length} {t('departments')} · {positions.length} {t('positions')}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreatePosition}
              disabled={departments.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">＋</span> {t('Position')}
            </button>
            <button
              type="button"
              onClick={openCreateDepartment}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700"
            >
              <span aria-hidden="true">＋</span> {t('Department')}
            </button>
          </div>
        )}
      </div>

      {error && !dialog && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
          <button type="button" onClick={loadData} className="ml-3 font-semibold underline">
            {t('Retry')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          {t('Loading...')}
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          <p>{t('No departments found.')}</p>
          {canManage && (
            <button type="button" onClick={openCreateDepartment} className="mt-4 font-semibold text-blue-600 hover:text-blue-700">
              {t('Add your first department')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => {
            const departmentPositions = positionsByDepartment.get(department.id) || [];
            return (
              <article key={department.id} className="flex min-h-[330px] flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <DepartmentIcon />
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openEditDepartment(department)}
                        aria-label={`${t('Edit')} ${department.name}`}
                        title={t('Edit')}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <ActionIcon action="edit" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(department)}
                        disabled={deletingDepartmentId === department.id}
                        aria-label={`${t('Delete')} ${department.name}`}
                        title={t('Delete')}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <ActionIcon action="delete" />
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="mt-4 text-lg font-semibold text-slate-900">{department.name}</h2>
                {department.description && (
                  <p className="mt-1 min-h-6 text-sm leading-6 text-slate-500">{department.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7.5a4 4 0 0 1 0 7.75M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {department.employeeCount} {t('employees')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                      <path d="M3 8h18v12H3zM7 8V5h10v3m-7 4v2m4-2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {departmentPositions.length} {t('positions')}
                  </span>
                </div>

                <div className="my-4 border-t border-slate-100" />
                <ul className="flex-1 space-y-2 text-sm text-slate-600">
                  {departmentPositions.length ? departmentPositions.map((position) => (
                    <li key={position.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-slate-300" />
                      <span>{position.title}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-slate-400">{t('No positions yet.')}</li>
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {dialog && (
        <div className="department-dialog-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-dialog-title"
            className="department-dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="department-dialog-title" className="text-lg font-semibold text-slate-900">
                {dialog === 'department'
                  ? editingDepartment ? t('Edit Department') : t('New Department')
                  : t('New Position')}
              </h2>
              <button type="button" onClick={closeDialog} className="text-sm text-slate-500 hover:text-slate-800">
                {t('Cancel')}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {dialog === 'department' ? (
              <form onSubmit={handleDepartmentSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Department name')}
                    <input
                      required
                      maxLength={100}
                      value={departmentForm.name}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Code')}
                    <input
                      required
                      maxLength={20}
                      value={departmentForm.code}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    {t('Description')}
                    <textarea
                      rows={3}
                      value={departmentForm.description}
                      onChange={(event) => setDepartmentForm({ ...departmentForm, description: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
                    {saving ? t('Saving...') : editingDepartment ? t('Save Changes') : t('Create Department')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePositionSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Position title')}
                    <input
                      required
                      maxLength={100}
                      value={positionForm.title}
                      onChange={(event) => setPositionForm({ ...positionForm, title: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Level')}
                    <input
                      required
                      maxLength={50}
                      value={positionForm.level}
                      onChange={(event) => setPositionForm({ ...positionForm, level: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    {t('Department')}
                    <select
                      required
                      value={positionForm.departmentId || ''}
                      onChange={(event) => setPositionForm({ ...positionForm, departmentId: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Minimum salary')}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={positionForm.minSalary ?? ''}
                      onChange={(event) => setPositionForm({ ...positionForm, minSalary: event.target.value ? Number(event.target.value) : null })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('Maximum salary')}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={positionForm.maxSalary ?? ''}
                      onChange={(event) => setPositionForm({ ...positionForm, maxSalary: event.target.value ? Number(event.target.value) : null })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={saving || departments.length === 0} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60">
                    {saving ? t('Saving...') : t('Create Position')}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
