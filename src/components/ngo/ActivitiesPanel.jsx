import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_META = {
  in_process: { label: "In Process", icon: Clock, color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-700" },
};

export default function ActivitiesPanel({ activities, ngo }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_date: "", target_hours: "", cause: "" });
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      qc.invalidateQueries(["ngo-activities"]);
      setShowForm(false);
      setForm({ title: "", description: "", start_date: "", target_hours: "", cause: "" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Activity.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["ngo-activities"]),
  });

  const handleCreate = () => {
    if (!form.title || !ngo?.id) return;
    createMutation.mutate({
      ...form,
      ngo_id: ngo.id,
      ngo_name: ngo.name,
      target_hours: form.target_hours ? Number(form.target_hours) : undefined,
      volunteer_can_submit_hours: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 rounded-xl bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Activity
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-3">
          <h3 className="font-semibold text-foreground">Create New Activity</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Activity title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
            <Input placeholder="Cause (e.g. education, food)" value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className="rounded-xl" />
            <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
            <Input type="number" placeholder="Target hours (optional)" value={form.target_hours} onChange={e => setForm({ ...form, target_hours: e.target.value })} className="rounded-xl" />
            <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="rounded-xl" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      )}

      {!activities.length ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
          No activities yet. Create the first one!
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(act => {
            const meta = STATUS_META[act.status] || STATUS_META.in_process;
            const Icon = meta.icon;
            return (
              <div key={act.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{act.title}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Volunteer: {act.user_email}</span>
                    {act.target_hours && <span>Target: {act.target_hours}h</span>}
                    {act.start_date && <span>Started: {format(new Date(act.start_date), "MMM d, yyyy")}</span>}
                    {act.cause && <span className="capitalize">Cause: {act.cause}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {act.status === "in_process" && (
                    <Button size="sm" variant="outline" className="rounded-xl text-green-600 border-green-200 hover:bg-green-50 text-xs"
                      onClick={() => updateStatus.mutate({ id: act.id, status: "completed" })}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}