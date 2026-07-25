import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { hasRole, user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
