import { Link, useLocation } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Home", to: "/Landing" },
  { label: "Campaigns", to: "/Campaigns" },
  { label: "Volunteer", to: "/Volunteering" },
  { label: "NGOs", to: "/NGODirectory" },
  { label: "Feed", to: "/SocialFeed" },
  { label: "My Profile", to: "/ImpactProfile" },
  { label: "My NGO", to: "/NGOProfile" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/Landing" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">HeartsLinker</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${pathname === l.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white px-5 py-3 flex flex-col gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`text-sm px-3 py-2 rounded-lg font-medium ${pathname === l.to ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}