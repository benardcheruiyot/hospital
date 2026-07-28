import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingState from './components/LoadingState.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const PatientPortal = lazy(() => import('./pages/PatientPortal.jsx'));
const StaffPortal = lazy(() => import('./pages/StaffPortal.jsx'));
const AdminPortal = lazy(() => import('./pages/AdminPortal.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage.jsx'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'));
const TelemedicinePage = lazy(() => import('./pages/TelemedicinePage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const PatientsPage = lazy(() => import('./pages/PatientsPage.jsx'));
const ProviderConsultation = lazy(() => import('./pages/ProviderConsultation.jsx'));
const ProviderSchedule = lazy(() => import('./pages/ProviderSchedule.jsx'));
const ProviderLab = lazy(() => import('./pages/ProviderLab.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

export default function App() {
  return (
    <RouteErrorBoundary>
      <Suspense
        fallback={
          <LoadingState
            title="Loading workspace"
            message="Preparing secure records, schedules, and communication tools."
          />
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/portal/patient" element={<PatientPortal />} />
          <Route path="/portal/staff" element={<StaffPortal />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPortal />} />

          <Route
            path="/provider/consultation"
            element={
              <ProtectedRoute roles={["doctor", "admin"]}>
                <ProviderConsultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/schedule"
            element={
              <ProtectedRoute roles={["doctor", "admin"]}>
                <ProviderSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/lab"
            element={
              <ProtectedRoute roles={["doctor", "admin"]}>
                <ProviderLab />
              </ProtectedRoute>
              }
            />
            <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registration"
            element={
              <ProtectedRoute roles={['patient']}>
                <RegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={['patient']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/telemedicine"
            element={
              <ProtectedRoute>
                <TelemedicinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['doctor', 'admin']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute roles={['admin']}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
