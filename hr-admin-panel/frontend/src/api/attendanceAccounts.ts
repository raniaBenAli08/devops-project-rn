import apiClient from './client';
import { AttendanceAccount } from '../types';

export const getAttendanceAccounts = async (): Promise<AttendanceAccount[]> => {
  const response = await apiClient.get('/users/attendance-accounts');
  return response.data;
};

export const linkAttendanceAccount = async (employeeId: number, userId: number | null): Promise<void> => {
  await apiClient.put(`/employees/${employeeId}/attendance-account`, { userId });
};
