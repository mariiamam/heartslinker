import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, Heart, Award, Target } from "lucide-react";
import { format, subMonths, parseISO, isAfter } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#8b5cf6"];

export default function ImpactAnalytics({ profile, activities, hourEntries = [] }) {
  const volunteerActivities = activities.filter(a => a.type !== "donation");
  const donationActivities = activities.filter(a => a.type === "donation");

  const totalApprovedHours = hourEntries
    .filter(h => h.status === "approved")
    .reduce((s, h) => s + (h.hours || 0), 0);

  const totalDonations = donationActivities.reduce((s, a) => s + (a.donation_amount || 0), 0);
  const badgeCount = profile?.badges?.length || 0;

  // Hours per month (last 6 months)
  const hoursPerMonth = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, "MMM"), date: d, hours: 0 };
    });
    hourEntries.filter(h => h.status === "approved" && h.date).forEach(h => {
      try {
        const d = parseISO(h.date);
        const idx = months.findIndex(m =>
          format(m.date, "yyyy-MM") === format(d, "yyyy-MM")
        );
        if (idx !== -1) months[idx].hours += h.hours || 0;
      } catch {}
    });
    return months;
  }, [hourEntries]);

  // Activities by cause for pie
  const byCause = useMemo(() => {
    const map = {};
    activities.forEach(a => {
      const c = a.cause || "Other";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activities]);

  // Monthly activity count
  const activitiesPerMonth = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { month: format(d, "MMM"), count: 0 };
    });
    activities.forEach(a => {
      if (!a.start_date) return;
      try {
        const d = parseISO(a.start_date);
        const idx = months.findIndex(m =>
          format(subMonths(new Date(), 5 - months.indexOf(m)), "yyyy-MM") === format(d, "yyyy-MM")
        );
        if (idx !== -1) months[idx].count += 1;
      } catch {}
    });
    return months;
  }, [activities]);

  const stats = [
    { label: "Approved Hours", value: totalApprovedHours, icon: Clock, color: "text-primary bg-primary/10" },
    { label: "Activities", value: activities.length, icon: Target, color: "text-green-600 bg-green-100" },
    { label: "Donations", value: totalDonations > 0 ? `$${totalDonations}` : "—", icon: Heart, color: "text-rose-500 bg-rose-100" },
    { label: "Badges", value: badgeCount, icon: Award, color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-foreground">Impact Analytics</h3>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl border border-border p-4 gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Volunteer Hours Chart */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Volunteer Hours (Last 6 Months)</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={hoursPerMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
            <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#hoursGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Activities per month + Causes breakdown */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Activities per Month</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={activitiesPerMonth} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">By Cause</p>
          {byCause.length === 0 ? (
            <div className="h-[130px] flex items-center justify-center text-sm text-muted-foreground">No activities yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <PieChart width={100} height={130}>
                <Pie data={byCause} cx={45} cy={60} innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={3}>
                  {byCause.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {byCause.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground capitalize">{item.name}</span>
                    <span className="text-muted-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}