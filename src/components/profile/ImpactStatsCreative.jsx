import { Clock, Award, DollarSign, Flame } from "lucide-react";

const STATS = [
  {
    key: "hours",
    icon: Clock,
    label: "Volunteer Hours",
    gradient: "from-primary to-orange-400",
    bg: "bg-orange-50",
    textColor: "text-primary",
  },
  {
    key: "badges",
    icon: Award,
    label: "Badges Earned",
    gradient: "from-amber-400 to-yellow-300",
    bg: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    key: "donations",
    icon: DollarSign,
    label: "Total Donated",
    gradient: "from-emerald-400 to-green-300",
    bg: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    key: "missions",
    icon: Flame,
    label: "Missions Done",
    gradient: "from-rose-400 to-pink-300",
    bg: "bg-rose-50",
    textColor: "text-rose-500",
  },
];

export default function ImpactStatsCreative({ profile, activityCount }) {
  const values = {
    hours: profile?.volunteer_hours || 0,
    badges: profile?.badges?.length || 0,
    donations: profile?.show_donations ? `$${profile?.total_donations || 0}` : "Private",
    missions: activityCount,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS.map(({ key, icon: Icon, label, gradient, bg, textColor }) => (
        <div
          key={key}
          className={`relative rounded-2xl overflow-hidden border border-border shadow-sm ${bg} p-5 flex flex-col gap-2`}
        >
          {/* Decorative circle */}
          <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-20`} />
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className={`text-2xl font-extrabold ${textColor}`}>{values[key]}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}