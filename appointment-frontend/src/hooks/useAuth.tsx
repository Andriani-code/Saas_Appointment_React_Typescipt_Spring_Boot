import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { AuthUser, Role } from "@/types";
import {
  clearAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from "@/services/authStorage";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser & { accessToken?: string; refreshToken?: string }) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getStoredAuthSession();
    if (session) {
      setUser({ email: session.email, role: session.role });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((authUser: AuthUser & { accessToken?: string; refreshToken?: string }) => {
    storeAuthSession(authUser);
    setUser({ email: authUser.email, role: authUser.role });
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
  }), [user, isLoading, login, logout, hasRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
