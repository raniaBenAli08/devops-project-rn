import apiClient from './client';
import { Attendance, AttendanceQr, AttendanceToday } from '../types';

export const checkIn = async (employeeId: number): Promise<Attendance> => {
  const response = await apiClient.post(`/attendance/check-in/${employeeId}`);
  return response.data;
};

export const checkOut = async (employeeId: number): Promise<Attendance> => {
  const response = await apiClient.post(`/attendance/check-out/${employeeId}`);
  return response.data;
};

export const getDailyReport = async (date: string): Promise<Attendance[]> => {
  const response = await apiClient.get('/attendance/daily', { params: { date } });
  return response.data;
};

export const getMonthlyReport = async (
  employeeId: number,
  year: number,
  month: number,
): Promise<Attendance[]> => {
  const response = await apiClient.get(`/attendance/monthly/${employeeId}`, {
    params: { year, month },
  });
  return response.data;
};

export const getEmployeeAttendance = async (
  employeeId: number,
  startDate: string,
  endDate: string,
): Promise<Attendance[]> => {
  const response = await apiClient.get(`/attendance/employee/${employeeId}`, {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getMyAttendance = async (startDate: string, endDate: string): Promise<Attendance[]> => {
  const response = await apiClient.get('/attendance/me', { params: { startDate, endDate } });
  return response.data;
};

export const getMyAttendanceToday = async (): Promise<AttendanceToday> => {
  const response = await apiClient.get('/attendance/me/today');
  return response.data;
};

export const getTodayAttendanceQr = async (): Promise<AttendanceQr> => {
  const response = await apiClient.get('/attendance/qr/today');
  return response.data;
};

export const rotateTodayAttendanceQr = async (): Promise<AttendanceQr> => {
  const response = await apiClient.post('/attendance/qr/today/rotate');
  return response.data;
};

export const checkInWithQr = async (token: string): Promise<Attendance> => {
  const response = await apiClient.post('/attendance/me/check-in', { token });
  return response.data;
};

export const checkOutWithQr = async (token: string): Promise<Attendance> => {
  const response = await apiClient.post('/attendance/me/check-out', { token });
  return response.data;
};
