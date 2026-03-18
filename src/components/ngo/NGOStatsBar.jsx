import { Users, Clock, CheckCircle, Activity } from "lucide-react";

const Stat = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default function NGOStatsBar({ activities, hourEntries }) {
  const uniqueVolunteers = new Set(activities.map(a => a.user_email)).size;
  const totalApprovedHours = hourEntries.filter(h => h.status === "approved").reduce((s, h) => s + (h.hours || 0), 0);
  const activeActivities = activities.filter(a => a.status === "in_process").length;
  const pendingHours = hourEntries.filter(h => h.status === "pending").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat icon={Users} value={uniqueVolunteers} label="Total Volunteers" color="bg-primary/10 text-primary" />
      <Stat icon={Activity} value={activeActivities} label="Active Activities" color="bg-amber-100 text-amber-600" />
      <Stat icon={Clock} value={`${totalApprovedHours}h`} label="Approved Hours" color="bg-orange-100 text-orange-500" />
      <Stat icon={CheckCircle} value={pendingHours} label="Pending Approvals" color="bg-rose-100 text-rose-500" />
    </div>
  );
}