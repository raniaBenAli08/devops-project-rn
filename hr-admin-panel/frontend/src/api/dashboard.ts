import apiClient from './client';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  openPositions: number;
  averageAttendance: number;
  departmentDistribution: { department: string; count: number }[];
  attendanceTrend: { date: string; present: number; absent: number }[];
  headcountGrowth: { month: string; count: number }[];
}

export interface PersonalDashboardStats {
  employeeName: string;
  attendancePresentDays: number;
  attendanceTotalDays: number;
  attendanceRate: number;
  pendingLeaveRequests: number;
  approvedLeaveDays: number;
  performanceRating: number | null;
  recentPayrollNet: number | null;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getPersonalDashboardStats = async (): Promise<PersonalDashboardStats> => {
  const response = await apiClient.get('/dashboard/me');
  return response.data;
};
