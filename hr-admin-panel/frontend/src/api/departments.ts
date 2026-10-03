import apiClient from './client';
import { Department } from '../types';

export interface DepartmentRequest {
  name: string;
  code: string;
  description: string;
}

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get('/departments');
  return response.data;
};

export const createDepartment = async (data: DepartmentRequest): Promise<Department> => {
  const response = await apiClient.post('/departments', data);
  return response.data;
};

export const updateDepartment = async (id: number, data: DepartmentRequest): Promise<Department> => {
  const response = await apiClient.put(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
  await apiClient.delete(`/departments/${id}`);
};
