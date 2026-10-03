import apiClient from './client';

export interface RegistrationRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface PendingRegistration {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  registeredAt: string;
}

export const registerEmployee = async (data: RegistrationRequest): Promise<void> => {
  await apiClient.post('/registrations', data);
};

export const verifyEmployeeEmail = async (token: string): Promise<{ message: string }> => {
  const response = await apiClient.get('/registrations/verify', { params: { token } });
  return response.data;
};

export const getPendingRegistrations = async (): Promise<PendingRegistration[]> => {
  const response = await apiClient.get('/registrations/pending');
  return response.data;
};

export const approveRegistration = async (id: number): Promise<void> => {
  await apiClient.post(`/registrations/${id}/approve`);
};

export const rejectRegistration = async (id: number): Promise<void> => {
  await apiClient.post(`/registrations/${id}/reject`);
};
