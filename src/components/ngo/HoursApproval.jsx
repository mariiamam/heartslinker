import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

export default function HoursApproval({ hourEntries, activities }) {
  const qc = useQueryClient();

  const updateEntry = useMutation({
    mutationFn: ({ id, status }) => base44.entities.HourEntry.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["hour-entries"]),
  });

  const pending = hourEntries.filter(h => h.status === "pending");
  const reviewed = hourEntries.filter(h => h.status !== "pending");

  const getActivity = (id) => activities.find(a => a.id === id);

  if (!hourEntries.length) return (
    <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
      No hour entries yet.
    </div>
  );

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Section title="Pending Approval" count={pending.length}>
          {pending.map(h => (
            <HourRow key={h.id} entry={h} activity={getActivity(h.activity_id)} onApprove={() => updateEntry.mutate({ id: h.id, status: "approved" })} onReject={() => updateEntry.mutate({ id: h.id, status: "rejected" })} />
          ))}
        </Section>
      )}

      {reviewed.length > 0 && (
        <Section title="Reviewed" count={reviewed.length} muted>
          {reviewed.map(h => (
            <HourRow key={h.id} entry={h} activity={getActivity(h.activity_id)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, children, muted }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <h3 className={`text-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}>{title}</h3>
        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{count}</span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function HourRow({ entry, activity, onApprove, onReject }) {
  const STATUS_STYLE = {
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">{activity?.title || "Unknown Activity"}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[entry.status]}`}>
            {entry.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
          <span>Volunteer: {entry.user_email}</span>
          <span>{entry.hours}h</span>
          {entry.date && <span>{format(new Date(entry.date), "MMM d, yyyy")}</span>}
          <span>Submitted by: {entry.submitted_by}</span>
          {entry.note && <span>Note: {entry.note}</span>}
        </div>
      </div>
      {entry.status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={onApprove}>
            <Check className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs" onClick={onReject}>
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}