import { Clock, Heart, Award, Users } from "lucide-react";

const Stat = ({ icon: Icon, value, label, color }) => (
  <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-2xl font-bold text-foreground font-inter">{value}</span>
    <span className="text-xs text-muted-foreground mt-0.5 text-center">{label}</span>
  </div>
);

export default function ImpactStats({ profile, activityCount }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat
        icon={Clock}
        value={`${profile?.volunteer_hours || 0}h`}
        label="Volunteer Hours"
        color="bg-primary/10 text-primary"
      />
      <Stat
        icon={Award}
        value={profile?.badges?.length || 0}
        label="Badges Earned"
        color="bg-accent/20 text-amber-600"
      />
      <Stat
        icon={Heart}
        value={profile?.show_donations && profile?.total_donations ? `$${profile.total_donations}` : "❤️"}
        label={profile?.show_donations ? "Total Donated" : "Compassionate"}
        color="bg-rose-100 text-rose-500"
      />
      <Stat
        icon={Users}
        value={activityCount || 0}
        label="Missions Completed"
        color="bg-orange-100 text-orange-500"
      />
    </div>
  );
}