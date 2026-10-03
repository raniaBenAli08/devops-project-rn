import apiClient from './client';
import { Contract, ContractRequest } from '../types';

export const getContracts = async (): Promise<Contract[]> => {
  const response = await apiClient.get('/contracts');
  return response.data;
};

export const createContract = async (data: ContractRequest): Promise<Contract> => {
  const response = await apiClient.post('/contracts', data);
  return response.data;
};

export const updateContract = async (id: number, data: ContractRequest): Promise<Contract> => {
  const response = await apiClient.put(`/contracts/${id}`, data);
  return response.data;
};

export const archiveContract = async (id: number): Promise<Contract> => {
  const response = await apiClient.patch(`/contracts/${id}/archive`);
  return response.data;
};

export const uploadContractAttachment = async (id: number, file: File): Promise<Contract> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/contracts/${id}/attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const downloadContractAttachment = async (id: number, fileName: string): Promise<void> => {
  const response = await apiClient.get(`/contracts/${id}/attachment`, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
