import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { PrivateRoute } from "./PrivateRoute";
import { RoleRoute } from "./RoleRoute";

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

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />

          {/* Client Specific */}
          <Route element={<RoleRoute allowedRoles={['CLIENT']} />}>
            <Route path="/specialists" element={<SpecialistsPage />} />
            <Route path="/specialists/:id" element={<SpecialistDetail />} />
          </Route>

          {/* Specialist Specific */}
          <Route element={<RoleRoute allowedRoles={['SPECIALIST']} />}>
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
          </Route>

          {/* Admin Specific */}
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
