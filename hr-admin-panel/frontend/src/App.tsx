import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Lazy-loaded pages
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ContractsPage = React.lazy(() => import('./pages/ContractsPage'));
const EmployeesPage = React.lazy(() => import('./pages/EmployeesPage'));
const EmployeeDetailPage = React.lazy(() => import('./pages/EmployeeDetailPage'));
const DepartmentsPage = React.lazy(() => import('./pages/DepartmentsPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const LeavePage = React.lazy(() => import('./pages/LeavePage'));
const PayrollPage = React.lazy(() => import('./pages/PayrollPage'));
const ReviewsPage = React.lazy(() => import('./pages/ReviewsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const RegistrationsPage = React.lazy(() => import('./pages/RegistrationsPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="registrations" element={<RegistrationsPage />} />
        </Route>
      </Routes>
    </React.Suspense>
  );
};

export default App;
