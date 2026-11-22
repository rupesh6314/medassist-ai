import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { RoleRoute } from '@/layouts/RoleRoute'

import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import SignUpPage from '@/pages/SignUpPage'
import DashboardPage from '@/pages/DashboardPage'
import MedicalReportsPage from '@/pages/MedicalReportsPage'
import HealthTrendsPage from '@/pages/HealthTrendsPage'
import DiseaseRiskPage from '@/pages/DiseaseRiskPage'
import DietPlannerPage from '@/pages/DietPlannerPage'
import HealthAssistantPage from '@/pages/HealthAssistantPage'
import ReportUploadPage from '@/pages/ReportUploadPage'
import DoctorDashboardPage from '@/pages/DoctorDashboardPage'
import AppointmentsPage from '@/pages/AppointmentsPage'
import MessagesPage from '@/pages/MessagesPage'
import PrescriptionsPage from '@/pages/PrescriptionsPage'
import ConsultationPage from '@/pages/ConsultationPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import ErrorPage from '@/pages/ErrorPage'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Patient Specific Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <DashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <Navigate to="/reports" replace />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <MedicalReportsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/manual-entry"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <Navigate to="/reports?tab=manual" replace />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/trends"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <HealthTrendsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/risk"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <DiseaseRiskPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/diet"
                    element={
                      <RoleRoute allowedRoles={['patient']}>
                        <DietPlannerPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/assistant"
                    element={
                      <RoleRoute allowedRoles={['patient', 'doctor']}>
                        <HealthAssistantPage />
                      </RoleRoute>
                    }
                  />

                  {/* Doctor Specific Routes */}
                  <Route
                    path="/doctor-dashboard"
                    element={
                      <RoleRoute allowedRoles={['doctor']}>
                        <DoctorDashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/doctor-search"
                    element={
                      <RoleRoute allowedRoles={['doctor']}>
                        <Navigate to="/doctor-dashboard?tab=patients" replace />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/doctor-alerts"
                    element={
                      <RoleRoute allowedRoles={['doctor']}>
                        <Navigate to="/doctor-dashboard?tab=overview" replace />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/doctor-patients"
                    element={
                      <RoleRoute allowedRoles={['doctor']}>
                        <Navigate to="/doctor-dashboard?tab=patients" replace />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/doctor-appointments"
                    element={
                      <RoleRoute allowedRoles={['doctor']}>
                        <Navigate to="/doctor-dashboard?tab=appointments" replace />
                      </RoleRoute>
                    }
                  />

                  {/* Shared Authenticated Routes */}
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/prescriptions" element={<PrescriptionsPage />} />
                  <Route path="/consultation/:appointmentNumber" element={<ConsultationPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<ErrorPage code="404" message="We couldn't find the page you're looking for." />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

