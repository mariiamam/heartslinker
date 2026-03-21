import { useState } from "react";
import { Menu, X, Settings, Bell, Briefcase, BarChart2, FileText } from "lucide-react";

const PANELS = [
  { key: "analytics", label: "Impact Analytics", icon: BarChart2, color: "bg-primary/10 text-primary" },
  { key: "updates", label: "Notifications", icon: Bell, color: "bg-amber-100 text-amber-600" },
  { key: "campaigns", label: "Campaigns I Joined", icon: Briefcase, color: "bg-green-100 text-green-600" },
  { key: "cv", label: "My CV", icon: FileText, color: "bg-orange-100 text-orange-600" },
  { key: "settings", label: "Settings", icon: Settings, color: "bg-secondary text-secondary-foreground" },
];

export default function QuickMenu({ activePanel, onSelect, unreadNotifications = 0 }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (key) => {
    onSelect(key === activePanel ? null : key);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2.5 rounded-2xl bg-muted border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative"
        title="Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        {unreadNotifications > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl border border-border shadow-xl w-64 overflow-hidden">
          <div className="p-2 space-y-1">
            {PANELS.map(p => (
              <button
                key={p.key}
                onClick={() => handleSelect(p.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activePanel === p.key ? "bg-primary/5 text-primary" : "hover:bg-muted text-foreground"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${p.color}`}>
                  <p.icon className="w-4 h-4" />
                </div>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}