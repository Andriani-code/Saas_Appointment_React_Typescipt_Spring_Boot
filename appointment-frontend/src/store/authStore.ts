import { create } from 'zustand';
import type { AuthUser, Role } from "@/types";
import { getStoredAuthSession, storeAuthSession, clearAuthSession } from "@/services/authStorage";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser & { accessToken?: string; refreshToken?: string }) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  setProfileCompleted: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const session = getStoredAuthSession();
  
  return {
    user: session 
      ? { email: session.email, role: session.role, profileCompleted: session.profileCompleted, userId: session.userId } as AuthUser 
      : null,
    isAuthenticated: !!session,
    isLoading: false, // We check localStorage immediately, so it's not loading
    
    login: (authUser) => {
      storeAuthSession(authUser);
      set({ 
        user: { email: authUser.email, role: authUser.role, profileCompleted: authUser.profileCompleted, userId: authUser.userId } as AuthUser, 
        isAuthenticated: true 
      });
    },
    
    logout: () => {
      clearAuthSession();
      set({ user: null, isAuthenticated: false });
    },
    
    hasRole: (...roles: Role[]) => {
      const user = get().user;
      return user ? roles.includes(user.role) : false;
    },
    
    setProfileCompleted: (status: boolean) => {
      const user = get().user;
      if (user) {
        const updatedUser = { ...user, profileCompleted: status };
        set({ user: updatedUser });
        const session = getStoredAuthSession();
        if (session) {
           storeAuthSession({ ...session, profileCompleted: status });
        }
      }
    }
  };
});
