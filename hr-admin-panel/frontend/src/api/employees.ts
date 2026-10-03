import apiClient from './client';
import { Employee, PageResponse } from '../types';

export interface EmployeeCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  hireDate: string;
  departmentId: number | null;
  positionId: number | null;
  managerId: number | null;
  salary: number | null;
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  clearDepartment?: boolean;
  clearPosition?: boolean;
  clearManager?: boolean;
  clearPhone?: boolean;
  clearDateOfBirth?: boolean;
  clearSalary?: boolean;
  status: Employee['status'];
}

export const getEmployees = async (params: {
  search?: string;
  departmentId?: number;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<PageResponse<Employee>> => {
  const response = await apiClient.get('/employees', { params });
  return response.data;
};

export const getEmployeeById = async (id: number): Promise<Employee> => {
  const response = await apiClient.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: EmployeeCreateRequest): Promise<Employee> => {
  const response = await apiClient.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: number, data: EmployeeUpdateRequest): Promise<Employee> => {
  const response = await apiClient.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};
