import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { PrivateRoute } from "./PrivateRoute";
import { RoleRoute } from "./RoleRoute";
import { PageSpinner } from "@/components/ui";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const LandingPage = lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ProvidersPage = lazy(() => import("@/pages/ProvidersPage").then((m) => ({ default: m.ProvidersPage })));
const ProviderDetail = lazy(() => import("@/pages/ProviderDetail").then((m) => ({ default: m.ProviderDetail })));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })));
const MessagesPage = lazy(() => import("@/pages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const ServicesPage = lazy(() => import("@/pages/ServicesPage").then((m) => ({ default: m.ServicesPage })));
const ClientsPage = lazy(() => import("@/pages/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const AvailabilityPage = lazy(() => import("@/pages/AvailabilityPage").then((m) => ({ default: m.AvailabilityPage })));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));

/**
 * Wrapper for public (non-layout) lazy routes so they get their own local
 * Suspense fallback. Routes inside <MainLayout /> are wrapped by the
 * <Suspense> around <Outlet />, so only the page content shows the spinner
 * while the sidebar/header remain visible.
 */
function PublicPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<PublicPage><LandingPage /></PublicPage>} />
        <Route path="/login" element={<PublicPage><LoginPage /></PublicPage>} />
        <Route path="/register" element={<PublicPage><RegisterPage /></PublicPage>} />

        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* Client Specific */}
            <Route element={<RoleRoute allowedRoles={['CLIENT']} />}>
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/providers/:id" element={<ProviderDetail />} />
            </Route>

            {/* Provider Specific */}
            <Route element={<RoleRoute allowedRoles={['PROVIDER']} />}>
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
            </Route>

            {/* Admin Specific */}
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

          <Route path="*" element={<PublicPage><NotFoundPage /></PublicPage>} />
        </Routes>
    </ErrorBoundary>
  );
}
