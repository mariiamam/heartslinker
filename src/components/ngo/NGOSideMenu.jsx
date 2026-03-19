import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, X, Settings, BookOpen, Users, ImagePlus, Check, Instagram, Facebook, MapPin, Calendar, Tag, Clock, UserPlus, FileText, ChevronDown, ChevronUp, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import VolunteerCVModal from "./VolunteerCVModal";

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
        className="relative inline-flex items-center justify-center bg-white border border-border rounded-xl p-2.5 shadow-sm hover:bg-muted transition-colors"
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
            {section === "volunteers" && <VolunteerBook activities={activities} hourEntries={hourEntries} ngo={ngo} />}
            {section === "hours" && <HoursRequests hourEntries={hourEntries} activities={activities} qc={qc} />}
            {section === "participation" && <ParticipationRequests requests={participationRequests || []} campaigns={campaigns} ngo={ngo} qc={qc} />}
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
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // campaign id for full delete confirm

  const endCampaign = useMutation({
    mutationFn: (id) => base44.entities.Campaign.update(id, { is_active: false }),
    onSuccess: () => qc.invalidateQueries(["campaigns"]),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => { qc.invalidateQueries(["campaigns"]); setConfirmDelete(null); setExpandedId(null); },
  });

  if (!campaigns.length) return (
    <div className="p-10 text-center">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-sm text-muted-foreground font-medium">No campaigns yet</p>
    </div>
  );

  const active = campaigns.filter(c => c.is_active);
  const ended = campaigns.filter(c => !c.is_active);

  const CampaignCard = ({ c }) => {
    const isExpanded = expandedId === c.id;
    const enrolled = c.volunteers_enrolled || 0;
    const needed = c.volunteers_needed || 0;
    const progress = needed > 0 ? Math.min(100, Math.round((enrolled / needed) * 100)) : 0;
    const isFund = c.type === "fundraising";
    const fundProgress = isFund && c.goal_amount > 0
      ? Math.min(100, Math.round(((c.collected_amount || 0) / c.goal_amount) * 100))
      : 0;
    // Volunteers who participated in this campaign
    const campVolunteers = activities.filter(a => a.campaign_id === c.id);
    const uniqueVolunteers = [...new Map(campVolunteers.map(a => [a.user_email, a])).values()];

    return (
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className={`h-1 ${c.is_active ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"}`} />

        {/* Clickable header */}
        <button
          className="w-full p-4 text-left space-y-3 hover:bg-muted/20 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : c.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{isFund ? "💰" : "🤝"}</span>
              <h3 className="font-bold text-foreground text-sm leading-snug">{c.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {c.is_active ? "ACTIVE" : "ENDED"}
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {c.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                <MapPin className="w-3 h-3" /> {c.location}
              </span>
            )}
            {c.start_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                <Calendar className="w-3 h-3" /> {format(new Date(c.start_date), "MMM d, yyyy")}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
              <Users className="w-3 h-3" /> {uniqueVolunteers.length} volunteers
            </span>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t border-border px-4 pb-4 space-y-4 pt-3">
            {/* Full description */}
            {c.description && (
              <p className="text-xs text-foreground/80 leading-relaxed">{c.description}</p>
            )}

            {/* Extra details grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {c.end_date && <Detail label="End Date" value={format(new Date(c.end_date), "MMM d, yyyy")} />}
              {c.signup_deadline && <Detail label="Signup Deadline" value={format(new Date(c.signup_deadline), "MMM d, yyyy")} />}
              {c.category && <Detail label="Category" value={c.category} />}
              {c.type && <Detail label="Type" value={isFund ? "Fundraising" : "Volunteers"} />}
              {(c.min_age || c.max_age) && <Detail label="Age Range" value={`${c.min_age || ""}–${c.max_age || ""} yrs`} />}
            </div>

            {/* Requirements */}
            {c.requirements && (
              <div className="bg-muted/40 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Requirements</p>
                <p className="text-xs text-foreground/80 whitespace-pre-line">{c.requirements}</p>
              </div>
            )}

            {/* Progress bars */}
            {!isFund && needed > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Volunteers</span>
                  <span className="font-bold text-foreground">{enrolled} / {needed}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {isFund && c.goal_amount > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-primary">${(c.collected_amount || 0).toLocaleString()} raised</span>
                  <span className="text-muted-foreground">of ${c.goal_amount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full" style={{ width: `${fundProgress}%` }} />
                </div>
              </div>
            )}

            {/* Volunteers who participated */}
            {uniqueVolunteers.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Participants ({uniqueVolunteers.length})</p>
                <div className="space-y-2">
                  {uniqueVolunteers.map(v => (
                    <div key={v.user_email} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                        {v.user_email[0]?.toUpperCase()}
                      </div>
                      <p className="text-xs text-foreground font-medium truncate">{v.user_email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {c.is_active && (
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs text-muted-foreground border-border hover:bg-muted flex-1"
                  disabled={endCampaign.isPending}
                  onClick={() => endCampaign.mutate(c.id)}>
                  <XCircle className="w-3.5 h-3.5" /> End Campaign
                </Button>
              )}
              {confirmDelete === c.id ? (
                <div className="flex gap-2 flex-1">
                  <Button size="sm" className="rounded-xl gap-1 text-xs bg-red-600 hover:bg-red-700 text-white flex-1"
                    disabled={deleteCampaign.isPending}
                    onClick={() => deleteCampaign.mutate(c.id)}>
                    {deleteCampaign.isPending ? "Deleting..." : "Confirm Delete"}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs"
                    onClick={() => setConfirmDelete(null)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50 flex-1"
                  onClick={() => setConfirmDelete(c.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 space-y-5">
      {active.length > 0 && (
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Active ({active.length})</p>
          <div className="space-y-3">{active.map(c => <CampaignCard key={c.id} c={c} />)}</div>
        </div>
      )}
      {ended.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ended ({ended.length})</p>
          <div className="space-y-3">{ended.map(c => <CampaignCard key={c.id} c={c} />)}</div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-muted/40 rounded-xl px-3 py-2">
      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function VolunteerBook({ activities, hourEntries, ngo }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", title: "", cause: "", start_date: "", hours: "", note: "" });

  const addVolunteer = useMutation({
    mutationFn: async () => {
      const activity = await base44.entities.Activity.create({
        user_email: form.email,
        ngo_id: ngo?.id,
        ngo_name: ngo?.name || "",
        title: form.title || "Manual Entry",
        cause: form.cause,
        start_date: form.start_date || new Date().toISOString().split("T")[0],
        status: "in_process",
        type: "volunteer",
        description: [form.name && `Name: ${form.name}`, form.phone && `Phone: ${form.phone}`, form.note].filter(Boolean).join(" · "),
        is_visible: true,
      });
      // If hours provided, create an approved HourEntry directly
      if (form.hours && Number(form.hours) > 0) {
        await base44.entities.HourEntry.create({
          activity_id: activity.id,
          user_email: form.email,
          date: form.start_date || new Date().toISOString().split("T")[0],
          hours: Number(form.hours),
          submitted_by: "ngo",
          status: "approved",
          note: "Added manually by NGO",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["ngo-activities"]);
      qc.invalidateQueries(["hour-entries"]);
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", title: "", cause: "", start_date: "", hours: "", note: "" });
    },
  });

  const volunteers = [...new Map(activities.map(a => [a.user_email, a])).values()];

  return (
    <div className="p-5 space-y-4">
      {/* Add Volunteer Button */}
      <Button
        size="sm"
        className="w-full rounded-xl bg-primary hover:bg-primary/90 gap-1.5 text-xs"
        onClick={() => setShowForm(v => !v)}
      >
        <UserPlus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "Add Volunteer Manually"}
      </Button>

      {/* Add Form */}
      {showForm && (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Volunteer Info</p>
          <div className="space-y-2">
            <Input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl text-sm h-8" />
            <Input placeholder="Email address *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl text-sm h-8" />
            <Input placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl text-sm h-8" />
            <Input placeholder="Activity / role title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl text-sm h-8" />
            <Input placeholder="Cause (e.g. Education, Health)" value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className="rounded-xl text-sm h-8" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Start Date</p>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="rounded-xl text-sm h-8" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Hours (approved)</p>
                <Input type="number" placeholder="e.g. 10" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className="rounded-xl text-sm h-8" />
              </div>
            </div>
            <textarea placeholder="Notes (optional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              rows={2} className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <Button size="sm" className="w-full rounded-xl bg-primary hover:bg-primary/90 text-xs"
            disabled={!form.email || addVolunteer.isPending}
            onClick={() => addVolunteer.mutate()}>
            {addVolunteer.isPending ? "Adding..." : "Add to Volunteer Book"}
          </Button>
        </div>
      )}

      {/* Volunteer List */}
      {volunteers.length === 0 && !showForm && (
        <div className="py-8 text-center text-muted-foreground text-sm">No volunteers yet.</div>
      )}

      {volunteers.map(v => {
        const myActivities = activities.filter(a => a.user_email === v.user_email);
        const myHours = hourEntries.filter(h => h.user_email === v.user_email && h.status === "approved")
          .reduce((s, h) => s + (h.hours || 0), 0);
        // Extract name from description if manually added
        const nameMatch = myActivities[0]?.description?.match(/Name:\s*([^·]+)/);
        const displayName = nameMatch ? nameMatch[1].trim() : null;

        return (
          <div key={v.user_email} className="border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                {(displayName || v.user_email)?.[0]?.toUpperCase()}
              </div>
              <div>
                {displayName && <p className="font-semibold text-foreground text-sm">{displayName}</p>}
                <p className={`${displayName ? "text-xs text-muted-foreground" : "font-semibold text-foreground text-sm"}`}>{v.user_email}</p>
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

function ParticipationRequests({ requests, campaigns, ngo, qc }) {
  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");
  const [cvModal, setCVModal] = useState(null); // { email, name }

  const updateRequest = useMutation({
    mutationFn: async ({ id, status, req }) => {
      await base44.entities.CampaignParticipationRequest.update(id, { status });

      if (status === "accepted") {
        const campaign = campaigns.find(c => c.id === req.campaign_id);

        // Increment volunteers_enrolled on the campaign
        if (campaign) {
          const newEnrolled = (campaign.volunteers_enrolled || 0) + 1;
          await base44.entities.Campaign.update(campaign.id, { volunteers_enrolled: newEnrolled });
        }

        // Add to volunteer book (Activity) only if not already there for this NGO
        const ngoId = req.ngo_id;
        const existingActivities = await base44.entities.Activity.filter({
          ngo_id: ngoId,
          user_email: req.user_email,
        });

        if (existingActivities.length === 0) {
          // New volunteer for this NGO — add to book
          await base44.entities.Activity.create({
            user_email: req.user_email,
            ngo_id: ngoId,
            ngo_name: ngo?.name || "",
            campaign_id: req.campaign_id,
            title: req.campaign_title || campaign?.title || "Campaign Volunteer",
            status: "in_process",
            type: "volunteer",
            start_date: new Date().toISOString().split("T")[0],
            is_visible: true,
          });
        }
        // If already exists — do nothing (volunteer already in the book for this NGO)
      }

      // Send notification to volunteer
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: status === "accepted" ? "volunteering_accepted" : "volunteering_rejected",
        title: status === "accepted" ? "Request Accepted! 🎉" : "Request Rejected",
        message: `Your request to join "${req.campaign_title || "the campaign"}" has been ${status}.`,
        is_read: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(["participation-requests"]);
      qc.invalidateQueries(["campaigns"]);
      qc.invalidateQueries(["ngo-activities"]);
    },
  });

  return (
    <div className="p-5 space-y-5">
      {cvModal && (
        <VolunteerCVModal
          userEmail={cvModal.email}
          volunteerName={cvModal.name}
          onClose={() => setCVModal(null)}
        />
      )}

      {requests.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-sm text-muted-foreground font-medium">No participation requests yet</p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Pending ({pending.length})</p>
          <div className="space-y-3">
            {pending.map(r => {
              const nameMatch = r.message?.match(/Name:\s*(.+)/);
              const volunteerName = nameMatch ? nameMatch[1].trim() : r.user_email;
              const campaignTitle = r.campaign_title || campaigns.find(c => c.id === r.campaign_id)?.title || "Campaign";

              return (
                <div key={r.id} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-400 to-primary" />
                  <div className="p-4 space-y-3">
                    {/* Campaign + Volunteer */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Campaign</p>
                      <p className="font-bold text-foreground text-sm">🤝 {campaignTitle}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {volunteerName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{volunteerName}</p>
                        <p className="text-xs text-muted-foreground">{r.user_email}</p>
                      </div>
                    </div>

                    {/* CV + Actions row */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setCVModal({ email: r.user_email, name: volunteerName })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl px-3 py-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> View CV
                      </button>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"
                          disabled={updateRequest.isPending}
                          onClick={() => updateRequest.mutate({ id: r.id, status: "accepted", req: r })}>
                          <Check className="w-3.5 h-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl gap-1 text-red-500 border-red-200 hover:bg-red-50 text-xs h-8 px-3"
                          disabled={updateRequest.isPending}
                          onClick={() => updateRequest.mutate({ id: r.id, status: "rejected", req: r })}>
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Reviewed ({reviewed.length})</p>
          <div className="space-y-2">
            {reviewed.map(r => {
              const nameMatch = r.message?.match(/Name:\s*(.+)/);
              const volunteerName = nameMatch ? nameMatch[1].trim() : r.user_email;
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs flex-shrink-0">
                    {volunteerName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{volunteerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.campaign_title || "Campaign"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${r.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {r.status === "accepted" ? "✓ Accepted" : "✕ Rejected"}
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