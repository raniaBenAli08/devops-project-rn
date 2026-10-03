import apiClient from './client';
import { LeaveRequest, LeaveBalance } from '../types';

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get('/leave');
  return response.data;
};

export const requestLeave = async (data: {
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<LeaveRequest> => {
  const response = await apiClient.post('/leave/request', data);
  return response.data;
};

export const requestMyLeave = async (data: Omit<Parameters<typeof requestLeave>[0], 'employeeId'>): Promise<LeaveRequest> => {
  const response = await apiClient.post('/leave/request/me', data);
  return response.data;
};

export const approveLeave = async (id: number, approverId: number): Promise<LeaveRequest> => {
  const response = await apiClient.post(`/leave/${id}/approve`, null, {
    params: { approverId },
  });
  return response.data;
};

export const rejectLeave = async (id: number, approverId: number): Promise<LeaveRequest> => {
  const response = await apiClient.post(`/leave/${id}/reject`, null, {
    params: { approverId },
  });
  return response.data;
};

export const getLeaveBalance = async (
  employeeId: number,
  year: number,
): Promise<LeaveBalance[]> => {
  const response = await apiClient.get(`/leave/balance/${employeeId}`, { params: { year } });
  return response.data;
};

export const getLeaveBalances = async (year: number): Promise<LeaveBalance[]> => {
  const response = await apiClient.get('/leave/balance', { params: { year } });
  return response.data;
};

export const getEmployeeLeaves = async (employeeId: number): Promise<LeaveRequest[]> => {
  const response = await apiClient.get(`/leave/employee/${employeeId}`);
  return response.data;
};

export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get('/leave/me');
  return response.data;
};

export const getMyLeaveBalance = async (year: number): Promise<LeaveBalance[]> => {
  const response = await apiClient.get('/leave/balance/me', { params: { year } });
  return response.data;
};

export const getPendingRequests = async (): Promise<LeaveRequest[]> => {
  const response = await apiClient.get('/leave/pending');
  return response.data;
};
