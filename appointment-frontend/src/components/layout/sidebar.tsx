import { NavLink } from "react-router-dom";

export const Sidebar = () => {
  const linkClass =
    "px-4 py-2 rounded-xl transition hover:bg-surface";

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-white p-4">
      
      <h2 className="text-lg font-bold text-primary mb-6">
        Dashboard
      </h2>

      <nav className="flex flex-col gap-2">
        <NavLink to="/dashboard" className={linkClass}>
          Accueil
        </NavLink>

        <NavLink to="/booking" className={linkClass}>
          Réserver
        </NavLink>

        <NavLink to="/profile-provider" className={linkClass}>
          Profil
        </NavLink>
      </nav>
    </aside>
  );
};