import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/utils";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Star,
  Settings,
  LogOut,
  ChevronRight,
  Stethoscope,
  UserCog,
  Shield,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    to: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Tableau de bord",
  },
  {
    to: "/appointments",
    icon: <Calendar size={18} />,
    label: "Mes rendez-vous",
  },
  {
    to: "/specialists",
    icon: <Stethoscope size={18} />,
    label: "Spécialistes",
    roles: ["CLIENT"],
  },
  {
    to: "/patients",
    icon: <Users size={18} />,
    label: "Patients",
    roles: ["SPECIALIST"],
  },
  {
    to: "/services",
    icon: <UserCog size={18} />,
    label: "Mes services",
    roles: ["SPECIALIST"],
  },
  {
    to: "/availability",
    icon: <Calendar size={18} />,
    label: "Disponibilités",
    roles: ["SPECIALIST"],
  },
  { to: "/messages", icon: <MessageSquare size={18} />, label: "Messages" },
  { to: "/reviews", icon: <Star size={18} />, label: "Avis" },
  {
    to: "/admin",
    icon: <Shield size={18} />,
    label: "Administration",
    roles: ["ADMIN"],
  },
  { to: "/settings", icon: <Settings size={18} />, label: "Paramètres" },
];

export function MainLayout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter(
    (item) =>
      !item.roles ||
      item.roles.some((r) => hasRole(r as "ADMIN" | "CLIENT" | "SPECIALIST")),
  );

  const displayName = user?.email?.split("@")[0] ?? "Utilisateur";
  const roleLabel = {
    ADMIN: "Administrateur",
    CLIENT: "Patient",
    SPECIALIST: "Spécialiste",
  }[user?.role ?? "CLIENT"];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-surface border-r border-border flex flex-col shadow-sm transition-transform duration-300 lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-text">
              BookDoc
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-soft rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-soft transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text truncate capitalize">
                {displayName}
              </p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
            <ChevronRight size={14} className="text-muted shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn("sidebar-link", isActive && "sidebar-link-active")
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-danger hover:bg-red-50 hover:text-danger"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted/50 pb-3">
          © 2024 BookDoc
        </p>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F9FAFB]">
        {/* Unified Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-6 lg:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 text-muted hover:bg-soft rounded-2xl transition-colors"
            >
              <Menu size={22} />
            </button>
            
            {/* Search Bar */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full bg-[#F3F4F6] border-none rounded-2xl pl-12 pr-6 py-2.5 text-sm text-text placeholder:text-gray-400 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Notification */}
            <button className="relative p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
            </button>
            
            <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block" />

            {/* Profile */}
            <div className="flex items-center gap-3 pl-1 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text truncate max-w-[150px] capitalize leading-tight">{displayName}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{roleLabel}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all overflow-hidden">
                <span className="font-bold text-base">{displayName[0]?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 lg:py-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
