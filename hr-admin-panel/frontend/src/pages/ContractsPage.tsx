import React, { useEffect, useMemo, useState } from 'react';
import {
  archiveContract,
  createContract,
  downloadContractAttachment,
  getContracts,
  updateContract,
  uploadContractAttachment,
} from '../api/contracts';
import { getEmployees } from '../api/employees';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { formatTnd } from '../utils/currency';
import { Contract, ContractRequest, ContractStatus, ContractType, Employee } from '../types';

const emptyForm: ContractRequest = {
  employeeId: 0,
  type: 'CDI',
  startDate: '',
  endDate: null,
  salary: null,
  status: 'DRAFT',
  notes: '',
};

const contractTypes: ContractType[] = ['CDI', 'CDD', 'INTERNSHIP', 'FREELANCE'];
const contractStatuses: ContractStatus[] = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ARCHIVED'];

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
    const validationErrors = apiError.response?.data?.errors;
    if (validationErrors) {
      return Object.values(validationErrors).join(' ');
    }
    if (typeof apiError.response?.data?.message === 'string') {
      return apiError.response.data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const statusColors: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-amber-100 text-amber-800',
  TERMINATED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

const ContractsPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<ContractRequest>(emptyForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const loadContracts = async (): Promise<boolean> => {
    setLoading(true);
    try {
      setContracts(await getContracts());
      setError('');
      return true;
    } catch (loadError) {
      console.error('Failed to fetch contracts:', loadError);
      setError(t('Could not load contracts. Please try again.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const visibleContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return contracts.filter((contract) => {
      const matchesSearch = !normalizedSearch || [
        contract.contractNumber,
        contract.employeeName,
        contract.employeeCode,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (!statusFilter || contract.status === statusFilter);
    });
  }, [contracts, search, statusFilter]);

  const activeCount = contracts.filter((contract) => contract.status === 'ACTIVE').length;
  const expiringCount = contracts.filter((contract) => {
    if (contract.status !== 'ACTIVE' || !contract.endDate) return false;
    const daysLeft = Math.ceil((new Date(`${contract.endDate}T00:00:00`).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  const formatDate = (date: string | null) => date
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(new Date(`${date}T12:00:00`))
    : t('Unlimited');

  const formatSalary = (salary: number | null) => salary === null
    ? '—'
    : formatTnd(salary, locale);

  const openCreateForm = async () => {
    setError('');
    setEditingContract(null);
    setFormData(emptyForm);
    setAttachment(null);
    setShowForm(true);
    try {
      const response = await getEmployees({ page: 0, size: 1000 });
      setEmployees(response.content);
    } catch (loadError) {
      console.error('Failed to fetch employees for contracts:', loadError);
      setError(t('Could not load employees. Please try again.'));
    }
  };

  const openEditForm = async (contract: Contract) => {
    setError('');
    setEditingContract(contract);
    setFormData({
      employeeId: contract.employeeId,
      type: contract.type,
      startDate: contract.startDate,
      endDate: contract.endDate,
      salary: contract.salary,
      status: contract.status,
      notes: contract.notes || '',
    });
    setAttachment(null);
    setShowForm(true);
    if (employees.length === 0) {
      try {
        const response = await getEmployees({ page: 0, size: 1000 });
        setEmployees(response.content);
      } catch (loadError) {
        console.error('Failed to fetch employees for contracts:', loadError);
        setError(t('Could not load employees. Please try again.'));
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingContract(null);
    setFormData(emptyForm);
    setAttachment(null);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    let savedContract: Contract | null = null;
    try {
      savedContract = editingContract
        ? await updateContract(editingContract.id, formData)
        : await createContract(formData);
      if (attachment) {
        savedContract = await uploadContractAttachment(savedContract.id, attachment);
      }
      const persistedContract = savedContract;
      setContracts((current) => [
        persistedContract,
        ...current.filter((item) => item.id !== persistedContract.id),
      ]);
      if (await loadContracts()) {
        closeForm();
      } else {
        setShowForm(false);
        setEditingContract(null);
        setFormData(emptyForm);
        setAttachment(null);
      }
    } catch (saveError) {
      console.error('Failed to save contract:', saveError);
      if (savedContract && !editingContract) {
        setEditingContract(savedContract);
      }
      setError(getErrorMessage(saveError, t('Could not save the contract.')));
      if (savedContract) {
        const persistedContract = savedContract;
        setContracts((current) => [
          persistedContract,
          ...current.filter((item) => item.id !== persistedContract.id),
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (contract: Contract) => {
    if (!window.confirm(t('Archive this contract?'))) return;
    try {
      await archiveContract(contract.id);
      await loadContracts();
    } catch (archiveError) {
      console.error('Failed to archive contract:', archiveError);
      setError(getErrorMessage(archiveError, t('Could not archive the contract.')));
    }
  };

  const handleDownload = async (contract: Contract) => {
    if (!contract.attachmentName) return;
    try {
      await downloadContractAttachment(contract.id, contract.attachmentName);
    } catch (downloadError) {
      console.error('Failed to download contract attachment:', downloadError);
      setError(getErrorMessage(downloadError, t('Could not download the attachment.')));
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Contracts')}</h1>
          <p className="page-description">{t('Manage employee contracts and signed files.')}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm text-white hover:bg-primary-700"
          >
            <span aria-hidden="true">＋</span> {t('New Contract')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <div className="stat-card rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">{t('All Contracts')}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{contracts.length}</p>
        </div>
        <div className="stat-card rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">{t('Active Contracts')}</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="stat-card rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">{t('Expiring in 30 Days')}</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{expiringCount}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingContract ? t('Edit Contract') : t('New Contract')}
            </h2>
            <button type="button" onClick={closeForm} className="text-sm text-slate-500 hover:text-slate-800">
              {t('Cancel')}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              {t('Employee')}
              <select
                required
                value={formData.employeeId || ''}
                onChange={(event) => setFormData({ ...formData, employeeId: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">{t('Select an employee')}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.fullName} ({employee.employeeCode})</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('Contract Type')}
              <select
                value={formData.type}
                onChange={(event) => setFormData({ ...formData, type: event.target.value as ContractType })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {contractTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('Status')}
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as ContractStatus })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {contractStatuses.filter((status) => status !== 'ARCHIVED').map((status) => (
                  <option key={status} value={status}>{t(status)}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('Start Date')}
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('End Date')}
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(event) => setFormData({ ...formData, endDate: event.target.value || null })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('Monthly Salary')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary ?? ''}
                onChange={(event) => setFormData({ ...formData, salary: event.target.value ? Number(event.target.value) : null })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 md:col-span-2">
              {t('Notes')}
              <textarea
                rows={3}
                maxLength={2000}
                value={formData.notes}
                onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('Contract File (PDF, DOC, DOCX)')}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
              />
              <span className="mt-1 block text-xs font-normal text-slate-400">{t('Maximum file size: 10 MB')}</span>
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? t('Saving...') : editingContract ? t('Save Changes') : t('Create Contract')}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('Contract List')}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search by employee or contract number...')}
              aria-label={t('Search by employee or contract number...')}
              className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label={t('Filter by status')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">{t('All Status')}</option>
              {contractStatuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : visibleContracts.length === 0 ? (
          <div className="dashboard-empty-state">{t('No contracts found')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">{t('Contract')}</th>
                  <th className="px-5 py-3 text-left">{t('Employee')}</th>
                  <th className="px-5 py-3 text-left">{t('Contract Type')}</th>
                  <th className="px-5 py-3 text-left">{t('Dates')}</th>
                  <th className="px-5 py-3 text-left">{t('Monthly Salary')}</th>
                  <th className="px-5 py-3 text-left">{t('Status')}</th>
                  <th className="px-5 py-3 text-left">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">{contract.contractNumber}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="text-sm font-medium text-slate-800">{contract.employeeName}</div>
                      <div className="text-xs text-slate-400">{contract.employeeCode}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{t(contract.type)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatSalary(contract.salary)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[contract.status]}`}>
                        {t(contract.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        {canManage && contract.status !== 'ARCHIVED' && (
                          <>
                            <button type="button" onClick={() => openEditForm(contract)} className="text-primary-600 hover:text-primary-800">
                              {t('Edit')}
                            </button>
                            <button type="button" onClick={() => handleArchive(contract)} className="text-red-600 hover:text-red-800">
                              {t('Archive')}
                            </button>
                          </>
                        )}
                        {contract.attachmentName && (
                          <button type="button" onClick={() => handleDownload(contract)} className="text-slate-600 hover:text-slate-900">
                            {t('Download')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ContractsPage;
