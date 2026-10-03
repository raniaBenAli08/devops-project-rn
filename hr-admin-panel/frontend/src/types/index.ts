export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  hireDate: string;
  terminationDate: string | null;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionTitle: string | null;
  managerId: number | null;
  managerName: string | null;
  salary: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  attendanceUsername?: string | null;
  createdAt: string;
}

export interface AttendanceAccount {
  id: number;
  username: string;
  email: string;
  employeeId: number | null;
}

export interface AttendanceQr {
  token: string;
  date: string;
  expiresAt: string;
}

export interface AttendanceToday {
  employeeId: number | null;
  employeeName: string | null;
  attendance: Attendance | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  headId: number | null;
  headName: string | null;
  parentDepartmentId: number | null;
  parentDepartmentName: string | null;
  employeeCount: number;
  childDepartments: Department[];
  createdAt: string;
}

export interface Position {
  id: number;
  title: string;
  level: string;
  minSalary: number | null;
  maxSalary: number | null;
  departmentId: number | null;
  departmentName: string | null;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
  totalHours: number | null;
  notes: string | null;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  type: 'ANNUAL' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedById: number | null;
  approvedByName: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  year: number;
  type: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface Payroll {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  month: number;
  year: number;
  baseSalary: number;
  overtime: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
  createdAt: string;
}

export type ContractType = 'CDI' | 'CDD' | 'INTERNSHIP' | 'FREELANCE';
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'ARCHIVED';

export interface Contract {
  id: number;
  contractNumber: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  type: ContractType;
  startDate: string;
  endDate: string | null;
  salary: number | null;
  status: ContractStatus;
  notes: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  attachmentContentType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRequest {
  employeeId: number;
  type: ContractType;
  startDate: string;
  endDate: string | null;
  salary: number | null;
  status: ContractStatus;
  notes: string;
}

export interface PerformanceReview {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewerId: number;
  reviewerName: string;
  period: string;
  rating: number;
  strengths: string;
  improvements: string;
  goals: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AuthUser {
  id: number;
  employeeId?: number | null;
  username: string;
  email: string;
  role: string;
  token: string;
}
