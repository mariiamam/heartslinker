import { useState } from "react";
import { Clock, Award, DollarSign, Flame } from "lucide-react";

const STATS = [
  { key: "hours", icon: Clock, label: "Volunteer Hours", color: "text-primary", bg: "bg-orange-50 border-orange-200" },
  { key: "badges", icon: Award, label: "Badges Earned", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { key: "donations", icon: DollarSign, label: "Total Donated", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { key: "missions", icon: Flame, label: "Missions Done", color: "text-rose-500", bg: "bg-rose-50 border-rose-200" },
];

export default function ImpactStatsIcons({ profile, activityCount }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  const values = {
    hours: profile?.volunteer_hours || 0,
    badges: profile?.badges?.length || 0,
    donations: profile?.show_donations ? `$${profile?.total_donations || 0}` : "Private",
    missions: activityCount,
  };

  return (
    <div className="flex gap-4 justify-center">
      {STATS.map(({ key, icon: Icon, label, color, bg }) => (
        <div
          key={key}
          className="relative flex flex-col items-center"
          onMouseEnter={() => setHoveredKey(key)}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>

          {/* Tooltip on hover */}
          {hoveredKey === key && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap z-20">
              {values[key]} {label}
              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}