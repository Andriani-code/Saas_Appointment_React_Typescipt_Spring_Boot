import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui";

export function PrivateRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Profile completion enforcement
  if (user && user.profileCompleted === false) {
    // If user is already on profile creation page, don't redirect to avoid loop
    if (location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }
  }

  return <Outlet />;
}
