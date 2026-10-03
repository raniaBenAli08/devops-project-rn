import React, { useMemo, useState } from 'react';
import { createEmployee, EmployeeCreateRequest, EmployeeUpdateRequest, updateEmployee } from '../api/employees';
import { useLocale } from '../contexts/LocaleContext';
import { Department, Employee, Position } from '../types';

interface EmployeeFormProps {
  employee: Employee | null;
  departments: Department[];
  positions: Position[];
  onSuccess: (employee: Employee) => void;
  onCancel: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: unknown;
      errors?: Record<string, string>;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as ApiError;
    const validationMessage = apiError.response?.data?.errors
      ? Object.values(apiError.response.data.errors).join(' ')
      : null;
    if (validationMessage) return validationMessage;
    if (typeof apiError.response?.data?.message === 'string') {
      return apiError.response.data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  departments,
  positions,
  onSuccess,
  onCancel,
}) => {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    dateOfBirth: employee?.dateOfBirth || '',
    hireDate: employee?.hireDate || new Date().toISOString().slice(0, 10),
    departmentId: employee?.departmentId ? String(employee.departmentId) : '',
    positionId: employee?.positionId ? String(employee.positionId) : '',
    salary: employee?.salary != null ? String(employee.salary) : '',
    status: employee?.status || 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const availablePositions = useMemo(
    () => positions.filter((position) => position.departmentId === Number(formData.departmentId)),
    [positions, formData.departmentId],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const request: EmployeeCreateRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      hireDate: formData.hireDate,
      departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      positionId: formData.positionId ? Number(formData.positionId) : null,
      managerId: null,
      salary: formData.salary ? Number(formData.salary) : null,
    };

    try {
      const savedEmployee = employee
        ? await updateEmployee(employee.id, {
          ...request,
          clearDepartment: !formData.departmentId,
          clearPosition: !formData.positionId,
          clearPhone: !formData.phone.trim(),
          clearDateOfBirth: !formData.dateOfBirth,
          clearSalary: !formData.salary,
          status: formData.status,
        } satisfies EmployeeUpdateRequest)
        : await createEmployee(request);
      onSuccess(savedEmployee);
    } catch (saveError) {
      console.error('Failed to save employee:', saveError);
      setError(getErrorMessage(saveError, t('Could not save the employee.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t('First Name *')}
          <input
            type="text"
            value={formData.firstName}
            onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
            maxLength={50}
            autoComplete="given-name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Last Name *')}
          <input
            type="text"
            value={formData.lastName}
            onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
            maxLength={50}
            autoComplete="family-name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Email *')}
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            maxLength={100}
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Phone')}
          <input
            type="tel"
            value={formData.phone}
            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
            maxLength={20}
            autoComplete="tel"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Date of Birth')}
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Hire Date')}
          <input
            type="date"
            value={formData.hireDate}
            onChange={(event) => setFormData({ ...formData, hireDate: event.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Department')}
          <select
            value={formData.departmentId}
            onChange={(event) => setFormData({ ...formData, departmentId: event.target.value, positionId: '' })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">{t('No department')}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Position')}
          <select
            value={formData.positionId}
            onChange={(event) => setFormData({ ...formData, positionId: event.target.value })}
            disabled={!formData.departmentId}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
          >
            <option value="">{t('No position')}</option>
            {availablePositions.map((position) => (
              <option key={position.id} value={position.id}>{position.title}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Salary')}
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.salary}
            onChange={(event) => setFormData({ ...formData, salary: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {employee && (
          <label className="block text-sm font-medium text-slate-700">
            {t('Status')}
            <select
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value as Employee['status'] })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="ACTIVE">{t('Active')}</option>
              <option value="ON_LEAVE">{t('On Leave')}</option>
              <option value="TERMINATED">{t('Terminated')}</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-200">
          {t('Cancel')}
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('Saving...') : employee ? t('Save Changes') : t('Create Employee')}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
