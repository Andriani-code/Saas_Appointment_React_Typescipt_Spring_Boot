import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui";

import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SpecialistsPage } from "@/pages/SpecialistsPage";
import { SpecialistDetail } from "@/pages/SpecialistDetail";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { AvailabilityPage } from "@/pages/AvailabilityPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { AdminPage } from "@/pages/AdminPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size={28} />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Navigate to="/dashboard" replace />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/specialists"
        element={
          <PrivateRoute>
            <MainLayout>
              <SpecialistsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/specialists/:id"
        element={
          <PrivateRoute>
            <MainLayout>
              <SpecialistDetail />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <PrivateRoute>
            <MainLayout>
              <AppointmentsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <PrivateRoute>
            <MainLayout>
              <MessagesPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <PrivateRoute>
            <MainLayout>
              <ReviewsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/services"
        element={
          <PrivateRoute>
            <MainLayout>
              <ServicesPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <PrivateRoute>
            <MainLayout>
              <PatientsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/availability"
        element={
          <PrivateRoute>
            <MainLayout>
              <AvailabilityPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <PrivateRoute>
            <MainLayout>
              <PaymentsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
