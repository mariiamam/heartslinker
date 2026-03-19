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

        {/* Volunteer Info Modal */}
        {selectedVolunteerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedVolunteerEmail(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-bold text-foreground text-lg">Volunteer Profile</h2>
              <button onClick={() => setSelectedVolunteerEmail(null)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Email</p>
                <p className="text-sm font-medium text-foreground">{selectedVolunteerEmail}</p>
              </div>

              {selectedVolunteerProfile.cv_full_name && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Full Name</p>
                  <p className="text-sm font-medium text-foreground">{selectedVolunteerProfile.cv_full_name}</p>
                </div>
              )}

              {selectedVolunteerProfile.cv_phone && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Phone</p>
                  <p className="text-sm font-medium text-foreground">{selectedVolunteerProfile.cv_phone}</p>
                </div>
              )}

              {selectedVolunteerProfile.cv_city && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Location</p>
                  <p className="text-sm font-medium text-foreground">{[selectedVolunteerProfile.cv_city, selectedVolunteerProfile.cv_country].filter(Boolean).join(", ")}</p>
                </div>
              )}

              {selectedVolunteerProfile.cv_primary_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Primary Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedVolunteerProfile.cv_primary_skills.map((skill, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVolunteerProfile.uploaded_cv_url && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Uploaded CV</p>
                  <a href={selectedVolunteerProfile.uploaded_cv_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                    📄 Download CV
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
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