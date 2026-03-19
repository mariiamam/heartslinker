import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, X, Settings, BookOpen, Users, ImagePlus, Check, Instagram, Facebook, MapPin, Calendar, Tag, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function NGOSideMenu({ ngo, campaigns, activities, hourEntries, participationRequests }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null);
  const qc = useQueryClient();

  const pendingHours = hourEntries.filter(h => h.status === "pending").length;
  const pendingParticipation = (participationRequests || []).filter(r => r.status === "pending").length;
  const totalBadge = pendingHours + pendingParticipation;

  return (
    <>
      {/* Hamburger button - inline trigger rendered by parent */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-5 right-5 z-40 relative inline-flex items-center justify-center bg-white border border-border rounded-xl p-2.5 shadow-md hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5 text-foreground" />
        {totalBadge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalBadge}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => { setOpen(false); setSection(null); }} />
      )}

      {/* Side drawer */}
      {open && (
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground text-lg">
              {section === "settings" ? "Settings" : section === "history" ? "Campaign History" : section === "volunteers" ? "Volunteer Book" : section === "hours" ? "Hours Requests" : section === "participation" ? "Participation Requests" : "Menu"}
            </h2>
            <button onClick={() => { if (section) setSection(null); else { setOpen(false); } }}>
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Menu items */}
            {!section && (
              <div className="p-5 space-y-3">
                <MenuCard icon={Settings} label="Settings" desc="Edit mission, photo, and NGO details" onClick={() => setSection("settings")} />
                <MenuCard icon={BookOpen} label="Campaign History" desc="All campaigns with full details" onClick={() => setSection("history")} />
                <MenuCard icon={Users} label="Volunteer Book" desc="Who volunteered, what they did and when" onClick={() => setSection("volunteers")} />
                <MenuCard icon={Clock} label="Hours Requests" desc="Approve or reject volunteer hour submissions" badge={pendingHours} onClick={() => setSection("hours")} />
                <MenuCard icon={UserPlus} label="Participation Requests" desc="Accept or reject volunteers joining campaigns" badge={pendingParticipation} onClick={() => setSection("participation")} />
              </div>
            )}

            {section === "settings" && <SettingsPanel ngo={ngo} qc={qc} />}
            {section === "history" && <CampaignHistory campaigns={campaigns} activities={activities} />}
            {section === "volunteers" && <VolunteerBook activities={activities} hourEntries={hourEntries} />}
            {section === "hours" && <HoursRequests hourEntries={hourEntries} activities={activities} qc={qc} />}
            {section === "participation" && <ParticipationRequests requests={participationRequests || []} campaigns={campaigns} qc={qc} />}
          </div>
        </div>
      )}
    </>
  );
}

function MenuCard({ icon: Icon, label, desc, onClick, badge }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 bg-muted/40 hover:bg-muted rounded-2xl p-4 text-left transition-colors">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
        <Icon className="w-5 h-5 text-primary" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function SettingsPanel({ ngo, qc }) {
  const [form, setForm] = useState({
    mission: ngo?.mission || "",
    country: ngo?.country || "",
    exact_location: ngo?.exact_location || "",
    founded_year: ngo?.founded_year || "",
    campaign_types: ngo?.campaign_types || "",
    email: ngo?.email || "",
    website: ngo?.website || "",
    instagram: ngo?.instagram || "",
    facebook: ngo?.facebook || "",
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = useMutation({
    mutationFn: (data) => base44.entities.NGO.update(ngo.id, data),
    onSuccess: () => { qc.invalidateQueries(["my-ngo"]); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await update.mutateAsync({ cover_url: file_url });
    setUploadingCover(false);
  };

  const f = (label, key, placeholder, type = "text") => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="rounded-xl text-sm" />
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {/* Cover photo */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Cover Photo</label>
        <div className="relative h-32 rounded-2xl overflow-hidden border border-border bg-muted">
          <img src={ngo?.cover_url || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80"} alt="" className="w-full h-full object-cover" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/50 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <div className="flex flex-col items-center gap-1 text-white">
              {uploadingCover ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-5 h-5" />}
              <span className="text-xs">{uploadingCover ? "Uploading..." : "Change Photo"}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Mission */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Mission Statement</label>
        <textarea rows={3} placeholder="Your NGO's mission..." value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })}
          className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {f("Country", "country", "e.g. Lebanon")}
      {f("Exact Location", "exact_location", "e.g. Beirut, Hamra St.")}
      {f("Founded Year", "founded_year", "e.g. 2012")}
      {f("Campaign Types", "campaign_types", "e.g. Education, Health, Environment")}
      {f("Contact Email", "email", "contact@ngo.org", "email")}
      {f("Official Website", "website", "https://...")}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Instagram className="w-3.5 h-3.5" /> Instagram</label>
        <Input placeholder="https://instagram.com/yourpage" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className="rounded-xl text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Facebook className="w-3.5 h-3.5" /> Facebook</label>
        <Input placeholder="https://facebook.com/yourpage" value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} className="rounded-xl text-sm" />
      </div>

      <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 gap-1.5" onClick={() => update.mutate(form)} disabled={update.isPending}>
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : update.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

function CampaignHistory({ campaigns, activities }) {
  if (!campaigns.length) return (
    <div className="p-8 text-center text-muted-foreground text-sm">No campaigns yet.</div>
  );

  return (
    <div className="p-5 space-y-4">
      {campaigns.map(c => {
        const campActivities = activities.filter(a => a.campaign_id === c.id);
        const uniqueVols = [...new Set(campActivities.map(a => a.user_email))].length;
        return (
          <div key={c.id} className="border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.is_active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                {c.is_active ? "Ongoing" : "Completed"}
              </span>
            </div>
            {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{c.type === "fundraising" ? "Fundraising" : "Volunteers"}</span>
              {c.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
              {c.created_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {format(new Date(c.created_date), "MMM yyyy")}</span>}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{uniqueVols} volunteers participated</span>
            </div>
            {c.type === "fundraising" && c.goal_amount > 0 && (
              <div className="pt-1">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>${(c.collected_amount || 0).toLocaleString()} raised</span>
                  <span>Goal: ${c.goal_amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${Math.min(100, ((c.collected_amount || 0) / c.goal_amount) * 100)}%` }} />
                </div>
              </div>
            )}
            {c.volunteers_needed > 0 && (
              <p className="text-xs text-muted-foreground">{c.volunteers_needed} volunteers needed</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VolunteerBook({ activities, hourEntries }) {
  const volunteers = [...new Map(activities.map(a => [a.user_email, a])).values()];

  if (!volunteers.length) return (
    <div className="p-8 text-center text-muted-foreground text-sm">No volunteers yet.</div>
  );

  return (
    <div className="p-5 space-y-4">
      {volunteers.map(v => {
        const myActivities = activities.filter(a => a.user_email === v.user_email);
        const myHours = hourEntries.filter(h => h.user_email === v.user_email && h.status === "approved")
          .reduce((s, h) => s + (h.hours || 0), 0);

        return (
          <div key={v.user_email} className="border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {v.user_email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{v.user_email}</p>
                <p className="text-xs text-muted-foreground">{myActivities.length} activities · {myHours}h approved</p>
              </div>
            </div>
            <div className="space-y-2">
              {myActivities.map(act => (
                <div key={act.id} className="flex items-start gap-2 text-xs bg-muted/40 rounded-xl px-3 py-2">
                  <span className="text-base">{act.type === "donation" ? "💰" : "🤝"}</span>
                  <div>
                    <p className="font-medium text-foreground">{act.title}</p>
                    <p className="text-muted-foreground">
                      {act.cause ? `${act.cause} · ` : ""}
                      {act.start_date ? format(new Date(act.start_date), "MMM d, yyyy") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HoursRequests({ hourEntries, activities, qc }) {
  const pending = hourEntries.filter(h => h.status === "pending");
  const reviewed = hourEntries.filter(h => h.status !== "pending");

  const updateEntry = useMutation({
    mutationFn: async ({ id, status, entry }) => {
      await base44.entities.HourEntry.update(id, { status });
      // Send notification to volunteer
      const activity = activities.find(a => a.id === entry.activity_id);
      await base44.entities.Notification.create({
        user_email: entry.user_email,
        type: status === "approved" ? "hour_approved" : "hour_rejected",
        title: status === "approved" ? "Hours Approved ✅" : "Hours Rejected",
        message: `Your ${entry.hours}h for "${activity?.title || "activity"}" have been ${status}.`,
        is_read: false,
      });
    },
    onSuccess: () => { qc.invalidateQueries(["hour-entries"]); },
  });

  const getActivity = (id) => activities.find(a => a.id === id);

  return (
    <div className="p-5 space-y-4">
      {pending.length === 0 && reviewed.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">No hour requests yet.</p>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Pending ({pending.length})</p>
          <div className="space-y-3">
            {pending.map(h => {
              const act = getActivity(h.activity_id);
              return (
                <div key={h.id} className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4">
                  <p className="font-semibold text-foreground text-sm">{act?.title || "Unknown Activity"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.user_email}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span className="font-bold text-foreground">{h.hours}h</span>
                    {h.date && <span>{format(new Date(h.date), "MMM d, yyyy")}</span>}
                    {h.note && <span>· {h.note}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                      onClick={() => updateEntry.mutate({ id: h.id, status: "approved", entry: h })}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs h-7"
                      onClick={() => updateEntry.mutate({ id: h.id, status: "rejected", entry: h })}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reviewed ({reviewed.length})</p>
          <div className="space-y-2">
            {reviewed.map(h => {
              const act = getActivity(h.activity_id);
              return (
                <div key={h.id} className="border border-border rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{act?.title || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{h.user_email} · {h.hours}h</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {h.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipationRequests({ requests, campaigns, qc }) {
  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  const updateRequest = useMutation({
    mutationFn: async ({ id, status, req }) => {
      await base44.entities.CampaignParticipationRequest.update(id, { status });
      // Send notification to volunteer
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: status === "accepted" ? "volunteering_accepted" : "volunteering_rejected",
        title: status === "accepted" ? "Request Accepted! 🎉" : "Request Rejected",
        message: `Your request to join "${req.campaign_title || "the campaign"}" has been ${status}.`,
        is_read: false,
      });
    },
    onSuccess: () => qc.invalidateQueries(["participation-requests"]),
  });

  return (
    <div className="p-5 space-y-4">
      {requests.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">No participation requests yet.</p>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Pending ({pending.length})</p>
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="border border-blue-200 bg-blue-50/50 rounded-2xl p-4">
                <p className="font-semibold text-foreground text-sm">{r.campaign_title || campaigns.find(c => c.id === r.campaign_id)?.title || "Campaign"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.user_email} wants to participate</p>
                {r.message && <p className="text-xs text-foreground/70 mt-1 italic">"{r.message}"</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                    onClick={() => updateRequest.mutate({ id: r.id, status: "accepted", req: r })}>
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs h-7"
                    onClick={() => updateRequest.mutate({ id: r.id, status: "rejected", req: r })}>
                    <X className="w-3 h-3" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reviewed ({reviewed.length})</p>
          <div className="space-y-2">
            {reviewed.map(r => (
              <div key={r.id} className="border border-border rounded-2xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.campaign_title || "Campaign"}</p>
                  <p className="text-xs text-muted-foreground">{r.user_email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}