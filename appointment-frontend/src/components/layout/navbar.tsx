import { useState } from "react";
import { Button } from "../ui/Button";


export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <h1 className="text-xl font-bold text-primary">
          Appointment
        </h1>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          <a className="text-text hover:text-primary">Accueil</a>
          <a className="text-text hover:text-primary">Prestataires</a>
          <a className="text-text hover:text-primary">Contact</a>

          <Button variant="outline">Login</Button>
          <Button>Signup</Button>
        </div>

        {/* Mobile button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4">
          <a>Accueil</a>
          <a>Prestataires</a>
          <a>Contact</a>

          <Button variant="outline">Login</Button>
          <Button>Signup</Button>
        </div>
      )}
    </nav>
  );
};