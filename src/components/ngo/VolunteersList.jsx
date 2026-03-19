import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, User, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function VolunteersList({ activities, hourEntries }) {
  const [expanded, setExpanded] = useState(null);
  const [selectedVolunteerEmail, setSelectedVolunteerEmail] = useState(null);
  
  const { data: selectedVolunteerProfile = null } = useQuery({
    queryKey: ["volunteer-profile", selectedVolunteerEmail],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: selectedVolunteerEmail }).then(r => r[0] || null),
    enabled: !!selectedVolunteerEmail,
  });

  // Group activities by volunteer
  const volunteerMap = {};
  activities.forEach(act => {
    if (!volunteerMap[act.user_email]) {
      volunteerMap[act.user_email] = { email: act.user_email, activities: [], totalHours: 0 };
    }
    volunteerMap[act.user_email].activities.push(act);
  });

  // Sum approved hours per volunteer
  hourEntries.filter(h => h.status === "approved").forEach(h => {
    const act = activities.find(a => a.id === h.activity_id);
    if (act && volunteerMap[act.user_email]) {
      volunteerMap[act.user_email].totalHours += h.hours || 0;
    }
  });

  const volunteers = Object.values(volunteerMap);

  if (!volunteers.length) return (
    <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
      No volunteers yet. Activities will appear here once created.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Volunteer</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Activities</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Total Hours</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((v) => (
            <>
              <tr
                key={v.email}
                className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === v.email ? null : v.email)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedVolunteerEmail(v.email); }}
                      className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                      title="View profile"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                    </button>
                    <span className="text-sm font-medium text-foreground">{v.email}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{v.activities.length}</td>
                <td className="px-5 py-4 text-sm font-semibold text-primary">{v.totalHours}h</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {expanded === v.email ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </td>
              </tr>
              {expanded === v.email && (
                <tr key={`${v.email}-detail`} className="bg-secondary/30">
                  <td colSpan={4} className="px-5 py-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Hour Log</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="text-left pb-2">Date</th>
                          <th className="text-left pb-2">Activity</th>
                          <th className="text-left pb-2">Hours</th>
                          <th className="text-left pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hourEntries
                          .filter(h => v.activities.some(a => a.id === h.activity_id))
                          .map((h, i) => {
                            const act = v.activities.find(a => a.id === h.activity_id);
                            return (
                              <tr key={i} className="border-t border-border/50">
                                <td className="py-2">{h.date ? format(new Date(h.date), "MMM d, yyyy") : "—"}</td>
                                <td className="py-2">{act?.title || "—"}</td>
                                <td className="py-2 font-medium">{h.hours}h</td>
                                <td className="py-2">
                                  <StatusBadge status={h.status} />
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}