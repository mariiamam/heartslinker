import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, CheckCircle, Clock, Eye, EyeOff, Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MyCampaignsWindow({ activities, userEmail }) {
  const [expanded, setExpanded] = useState(null);
  const [logActivity, setLogActivity] = useState(null); // activity id being logged
  const [logForm, setLogForm] = useState({ date: "", hours: "" });
  const qc = useQueryClient();

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["my-hour-entries", userEmail],
    queryFn: async () => {
      const all = await base44.entities.HourEntry.filter({ user_email: userEmail });
      return all;
    },
    enabled: !!userEmail,
  });

  const toggleVisible = useMutation({
    mutationFn: ({ id, is_visible }) => base44.entities.Activity.update(id, { is_visible }),
    onSuccess: () => qc.invalidateQueries(["all-activities"]),
  });

  const submitHours = useMutation({
    mutationFn: ({ activity_id, date, hours }) =>
      base44.entities.HourEntry.create({
        activity_id,
        user_email: userEmail,
        date,
        hours: Number(hours),
        submitted_by: "volunteer",
        status: "pending",
      }),
    onSuccess: () => {
      qc.invalidateQueries(["my-hour-entries"]);
      setLogActivity(null);
      setLogForm({ date: "", hours: "" });
    },
  });

  const active = activities.filter(a => a.status === "in_process");
  const done = activities.filter(a => a.status !== "in_process");

  const getHoursForActivity = (actId) => hourEntries.filter(h => h.activity_id === actId);
  const approvedHours = (actId) => getHoursForActivity(actId).filter(h => h.status === "approved").reduce((s, h) => s + (h.hours || 0), 0);

  const renderActivity = (act) => {
    const entries = getHoursForActivity(act.id);
    const isDonation = act.type === "donation";
    const isOpen = expanded === act.id;

    return (
      <div key={act.id} className="border border-border rounded-xl overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(isOpen ? null : act.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{act.title}</p>
            <p className="text-xs text-muted-foreground">{act.ngo_name}</p>
          </div>
          {isDonation ? (
            <span className="text-xs text-muted-foreground">Donated{act.donation_amount ? ` $${act.donation_amount}` : ""}</span>
          ) : (
            <span className="text-xs font-semibold text-primary">{approvedHours(act.id)}h approved</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); toggleVisible.mutate({ id: act.id, is_visible: !act.is_visible }); }}
            className="text-muted-foreground hover:text-primary" title={act.is_visible ? "Hide from profile" : "Show on profile"}>
            {act.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-40" />}
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>

        {isOpen && (
          <div className="border-t border-border bg-secondary/20 px-4 py-3 space-y-3">
            {isDonation ? (
              <p className="text-sm text-muted-foreground">
                Donated to <strong>{act.ngo_name}</strong>
                {act.donation_amount && ` — $${act.donation_amount}`}
                {act.start_date && ` on ${format(new Date(act.start_date), "MMM d, yyyy")}`}
              </p>
            ) : (
              <>
                {entries.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-2">Date</th>
                        <th className="text-left pb-2">Hours</th>
                        <th className="text-left pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((h, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-1.5">{h.date ? format(new Date(h.date), "MMM d, yyyy") : "—"}</td>
                          <td className="py-1.5 font-medium">{h.hours}h</td>
                          <td className="py-1.5">
                            {h.status === "approved" ? (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            ) : h.status === "pending" ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <span className="text-red-500">Rejected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-muted-foreground">No hours logged yet.</p>
                )}

                {act.status === "in_process" && (
                  logActivity === act.id ? (
                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <Input type="date" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} className="rounded-xl text-xs h-8 w-36" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Hours</p>
                        <Input type="number" placeholder="e.g. 4" value={logForm.hours} onChange={e => setLogForm({ ...logForm, hours: e.target.value })} className="rounded-xl text-xs h-8 w-24" />
                      </div>
                      <Button size="sm" className="gap-1 rounded-xl bg-primary hover:bg-primary/90 text-xs h-8"
                        disabled={!logForm.date || !logForm.hours || submitHours.isPending}
                        onClick={() => submitHours.mutate({ activity_id: act.id, ...logForm })}>
                        <Send className="w-3 h-3" /> Submit
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setLogActivity(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => setLogActivity(act.id)} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                      <Plus className="w-3 h-3" /> Log Hours
                    </button>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold text-foreground">My Campaigns & Activities</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Click to expand, log hours, and manage visibility</p>
      </div>
      <div className="p-4 space-y-3">
        {active.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Active</p>
            <div className="space-y-2">{active.map(renderActivity)}</div>
          </div>
        )}
        {done.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Completed / Past</p>
            <div className="space-y-2">{done.map(renderActivity)}</div>
          </div>
        )}
        {!activities.length && (
          <p className="text-sm text-muted-foreground text-center py-6">No activities yet. Start volunteering!</p>
        )}
      </div>
    </div>
  );
}