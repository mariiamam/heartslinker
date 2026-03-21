import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Send, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function LogHours() {
  const qc = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [form, setForm] = useState({ date: "", hours: "", note: "" });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
    { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState(String(currentYear));

  const buildDate = (d, m, y) => (d && m && y) ? `${y}-${m}-${d}` : "";
  const handleDateChange = (d, m, y) => {
    setForm(f => ({ ...f, date: buildDate(d, m, y) }));
  };
  const [done, setDone] = useState(false);

  // Get NGO for current user
  const { data: ngos = [] } = useQuery({
    queryKey: ["my-ngo-log"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.NGO.filter({ created_by: user.email });
    },
  });
  const ngo = ngos[0] || null;

  const { data: campaigns = [] } = useQuery({
    queryKey: ["ngo-campaigns-log", ngo?.id],
    queryFn: () => base44.entities.Campaign.filter({ ngo_id: ngo.id, is_active: true }),
    enabled: !!ngo?.id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["ngo-activities-log", ngo?.id],
    queryFn: () => base44.entities.Activity.filter({ ngo_id: ngo.id }),
    enabled: !!ngo?.id,
  });

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["hour-entries-log", ngo?.id],
    queryFn: async () => {
      const allActivities = await base44.entities.Activity.filter({ ngo_id: ngo.id });
      const actIds = allActivities.map(a => a.id);
      if (!actIds.length) return [];
      const all = await base44.entities.HourEntry.list();
      return all.filter(h => actIds.includes(h.activity_id));
    },
    enabled: !!ngo?.id,
  });

  const campaignVolunteers = selectedCampaign
    ? activities.filter(a => a.campaign_id === selectedCampaign.id)
    : [];

  const submitHours = useMutation({
    mutationFn: () =>
      base44.entities.HourEntry.create({
        activity_id: selectedActivity.id,
        user_email: selectedActivity.user_email,
        date: form.date,
        hours: Number(form.hours),
        submitted_by: "ngo",
        status: "approved",
        note: form.note || "Logged by NGO",
      }),
    onSuccess: async () => {
      await base44.entities.Notification.create({
        user_email: selectedActivity.user_email,
        type: "hour_approved",
        title: "Hours Logged ✅",
        message: `${form.hours}h were added for "${selectedActivity.title}" by the NGO.`,
        is_read: false,
      });
      qc.invalidateQueries(["hour-entries-log"]);
      qc.invalidateQueries(["hour-entries"]);
      qc.invalidateQueries(["my-hour-entries"]);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setForm({ date: "", hours: "", note: "" });
      }, 1800);
    },
  });

  const getApprovedHours = (activityId) =>
    hourEntries.filter(h => h.activity_id === activityId && h.status === "approved")
      .reduce((s, h) => s + (h.hours || 0), 0);

  // Page: Campaign list
  if (!selectedCampaign) {
    return (
      <div className="min-h-screen bg-background font-inter">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/NGODashboard">
              <button className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Log Volunteer Hours</h1>
              <p className="text-xs text-muted-foreground">Select a campaign to get started</p>
            </div>
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No active campaigns found.</p>
            </div>
          )}

          <div className="space-y-3">
            {campaigns.map(c => {
              const count = activities.filter(a => a.campaign_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className="w-full text-left flex items-center gap-4 bg-white border border-border rounded-2xl px-5 py-4 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                >
                  <span className="text-2xl">🤝</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {count} volunteer{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Page: Volunteer list for selected campaign
  if (!selectedActivity) {
    return (
      <div className="min-h-screen bg-background font-inter">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{selectedCampaign.title}</h1>
              <p className="text-xs text-muted-foreground">Select a volunteer to log hours for</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {campaignVolunteers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-3xl mb-2">🙋</p>
                <p className="text-sm">No volunteers in this campaign yet.</p>
              </div>
            )}
            {campaignVolunteers.map(act => {
              const approved = getApprovedHours(act.id);
              return (
                <button
                  key={act.id}
                  onClick={() => { setSelectedActivity(act); setDone(false); setForm({ date: "", hours: "", note: "" }); }}
                  className="w-full text-left flex items-center gap-4 bg-white border border-border rounded-2xl px-5 py-4 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                    {act.user_email[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{act.user_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{approved}h approved so far</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Page: Log hours form
  const approvedSoFar = getApprovedHours(selectedActivity.id);
  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedActivity(null)}
            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Log Hours</h1>
            <p className="text-xs text-muted-foreground">Adding hours for {selectedActivity.user_email}</p>
          </div>
        </div>

        {/* Volunteer + campaign summary */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
              {selectedActivity.user_email[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-foreground">{selectedActivity.user_email}</p>
              <p className="text-xs text-muted-foreground">🤝 {selectedCampaign.title}</p>
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total approved so far: </span>
            <span className="font-bold text-primary">{approvedSoFar}h</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date *</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hours *</label>
              <Input type="number" placeholder="e.g. 4" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
            <Input placeholder="e.g. Community cleanup session" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="rounded-xl" />
          </div>

          <Button
            className={`w-full rounded-xl gap-2 ${done ? "bg-green-600 hover:bg-green-600" : "bg-primary hover:bg-primary/90"}`}
            disabled={!form.date || !form.hours || submitHours.isPending || done}
            onClick={() => submitHours.mutate()}
          >
            {done
              ? <><Check className="w-4 h-4" /> Hours Added Successfully!</>
              : submitHours.isPending
              ? "Saving..."
              : <><Send className="w-4 h-4" /> Add Verified Hours</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}