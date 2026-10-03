import apiClient from './client';
import { Attendance, LeaveRequest, Payroll, PerformanceReview } from '../types';
import { getEmployeeAttendance } from './attendance';
import { getEmployeeLeaves } from './leave';

export interface EmployeeHistory {
  leaves: LeaveRequest[];
  attendance: Attendance[];
  payroll: Payroll[];
  reviews: PerformanceReview[];
}

export const getEmployeeHistory = async (employeeId: number): Promise<EmployeeHistory> => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const toDate = (date: Date) => date.toISOString().slice(0, 10);

  const [leaves, attendance, payrollResponse, reviewsResponse] = await Promise.all([
    getEmployeeLeaves(employeeId),
    getEmployeeAttendance(employeeId, toDate(startDate), toDate(endDate)),
    apiClient.get(`/payroll/history/${employeeId}`),
    apiClient.get(`/reviews/employee/${employeeId}`),
  ]);

  return {
    leaves,
    attendance,
    payroll: payrollResponse.data,
    reviews: reviewsResponse.data,
  };
};
