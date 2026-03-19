import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, MapPin, AlertTriangle, Pencil, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import CampaignDetailModal from "./CampaignDetailModal";

const EMPTY_FORM = {
  title: "", description: "", type: "volunteers", category: "",
  location: "", volunteers_needed: "", volunteers_enrolled: "",
  goal_amount: "", collected_amount: "", start_date: "", end_date: "",
  signup_deadline: "", requirements: "", min_age: "", max_age: ""
};

const CATEGORIES = ["Food", "Education", "Shelter", "Health", "Environment", "Refugees", "Children"];

export default function CampaignsSection({ campaigns, ngoId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAll, setShowAll] = useState(false);
  const qc = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => { qc.invalidateQueries(["campaigns"]); closeForm(); },
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["campaigns"]); closeForm(); },
  });

  const completeCampaign = useMutation({
    mutationFn: (id) => base44.entities.Campaign.update(id, { is_active: false }),
    onSuccess: () => qc.invalidateQueries(["campaigns"]),
  });

  const openCreate = () => {
    setEditingCampaign(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (campaign, e) => {
    e.stopPropagation();
    setEditingCampaign(campaign);
    setForm({
      title: campaign.title || "",
      description: campaign.description || "",
      type: campaign.type || "volunteers",
      category: campaign.category || "",
      location: campaign.location || "",
      volunteers_needed: campaign.volunteers_needed ?? "",
      volunteers_enrolled: campaign.volunteers_enrolled ?? "",
      goal_amount: campaign.goal_amount ?? "",
      collected_amount: campaign.collected_amount ?? "",
      start_date: campaign.start_date || "",
      end_date: campaign.end_date || "",
      signup_deadline: campaign.signup_deadline || "",
      requirements: campaign.requirements || "",
      min_age: campaign.min_age ?? "",
      max_age: campaign.max_age ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingCampaign(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    if (!form.title || !form.location || !form.description || !form.category) return;
    const volunteersNeeded = form.volunteers_needed !== "" ? Number(form.volunteers_needed) : undefined;
    const volunteersEnrolled = form.volunteers_enrolled !== "" ? Number(form.volunteers_enrolled) : 0;
    // Auto-complete if volunteers are full
    const isFull = volunteersNeeded && volunteersEnrolled >= volunteersNeeded;
    const payload = {
      ...form,
      ngo_id: ngoId,
      volunteers_needed: volunteersNeeded,
      volunteers_enrolled: volunteersEnrolled,
      goal_amount: form.goal_amount !== "" ? Number(form.goal_amount) : undefined,
      collected_amount: form.collected_amount !== "" ? Number(form.collected_amount) : 0,
      min_age: form.min_age !== "" ? Number(form.min_age) : undefined,
      max_age: form.max_age !== "" ? Number(form.max_age) : undefined,
      is_active: !isFull,
    };
    if (editingCampaign) {
      updateCampaign.mutate({ id: editingCampaign.id, data: payload });
    } else {
      createCampaign.mutate(payload);
    }
  };

  const isBusy = createCampaign.isPending || updateCampaign.isPending;
  const isInvalid = !form.title || !form.location || !form.description || !form.category;

  const activeCampaigns = campaigns?.filter(c => c.is_active) || [];
  const visibleCampaigns = showAll ? activeCampaigns : activeCampaigns.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Active Campaigns</h2>
        <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5 text-xs" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm text-foreground">{editingCampaign ? "Edit Campaign" : "Create Campaign"}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <Input placeholder="Campaign name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
              <span className="absolute top-2 right-3 text-red-500 text-xs font-bold">*</span>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-input">
              <button onClick={() => setForm({ ...form, type: "volunteers" })} className={`flex-1 text-xs py-2 font-medium transition-colors ${form.type === "volunteers" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                🤝 Volunteers
              </button>
              <button onClick={() => setForm({ ...form, type: "fundraising" })} className={`flex-1 text-xs py-2 font-medium transition-colors ${form.type === "fundraising" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                💰 Fundraising
              </button>
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Category <span className="text-red-500 text-[10px]">*</span></p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setForm({ ...form, category: form.category === cat ? "" : cat })}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${form.category === cat ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Input placeholder="Location (e.g. Beirut, Gaza)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" />
              <span className="absolute top-2 right-3 text-red-500 text-xs font-bold">*</span>
            </div>
            <div className="relative">
              <Input placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
              <span className="absolute top-2 right-3 text-red-500 text-xs font-bold">*</span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">From</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">To</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Application Deadline</label>
              <Input type="date" value={form.signup_deadline} onChange={e => setForm({ ...form, signup_deadline: e.target.value })} className="rounded-xl" />
              <p className="text-[10px] text-muted-foreground mt-1">Last date volunteers are allowed to apply</p>
            </div>

            {form.type === "volunteers" && (
              <>
                <Input type="number" placeholder="Volunteers needed" value={form.volunteers_needed} onChange={e => setForm({ ...form, volunteers_needed: e.target.value })} className="rounded-xl" />
                <Input type="number" placeholder="Already enrolled" value={form.volunteers_enrolled} onChange={e => setForm({ ...form, volunteers_enrolled: e.target.value })} className="rounded-xl" />
                <Input type="number" placeholder="Min age" value={form.min_age} onChange={e => setForm({ ...form, min_age: e.target.value })} className="rounded-xl" />
                <Input type="number" placeholder="Max age" value={form.max_age} onChange={e => setForm({ ...form, max_age: e.target.value })} className="rounded-xl" />
              </>
            )}
            {form.type === "fundraising" && (
              <>
                <Input type="number" placeholder="Goal amount ($)" value={form.goal_amount} onChange={e => setForm({ ...form, goal_amount: e.target.value })} className="rounded-xl" />
                <Input type="number" placeholder="Already collected ($)" value={form.collected_amount} onChange={e => setForm({ ...form, collected_amount: e.target.value })} className="rounded-xl" />
              </>
            )}
            <textarea placeholder="Requirements (what you're looking for in volunteers)" value={form.requirements}
              onChange={e => setForm({ ...form, requirements: e.target.value })}
              className="md:col-span-2 w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={3} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={closeForm}>Cancel</Button>
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={isBusy || isInvalid}>
              {isBusy ? "Saving..." : editingCampaign ? "Save Changes" : "Launch Campaign"}
            </Button>
          </div>
        </div>
      )}

      {!activeCampaigns.length ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
          No active campaigns yet. Launch your first campaign!
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {visibleCampaigns.map(c => (
              <CampaignCard key={c.id} campaign={c}
                onClick={() => setSelectedCampaign(c)}
                onEdit={(e) => openEdit(c, e)}
                onComplete={(e) => { e.stopPropagation(); completeCampaign.mutate(c.id); }}
              />
            ))}
          </div>

          {activeCampaigns.length > 2 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-primary font-medium py-2 hover:underline"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4" /> Show Less</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> Show {activeCampaigns.length - 2} More</>
              )}
            </button>
          )}
        </>
      )}

      {selectedCampaign && (
        <CampaignDetailModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      )}
    </div>
  );
}

function CampaignCard({ campaign, onClick, onEdit, onComplete }) {
  const isFund = campaign.type === "fundraising";
  const seatsLeft = campaign.volunteers_needed && campaign.volunteers_enrolled != null
    ? campaign.volunteers_needed - (campaign.volunteers_enrolled || 0)
    : null;
  const fewSeatsLeft = seatsLeft !== null && seatsLeft <= 10 && seatsLeft > 0;
  const shortDesc = campaign.description
    ? campaign.description.length > 50 ? campaign.description.slice(0, 50) + "…" : campaign.description
    : null;

  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all relative group overflow-hidden">
      {/* Thick orange top bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-accent w-full" />

      <div className="p-5 space-y-3">
        {/* Action buttons */}
        <div className="absolute top-4 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-xl hover:bg-muted"
            title="Edit campaign"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onComplete}
            className="p-1.5 rounded-xl hover:bg-green-50"
            title="Mark as completed"
          >
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          </button>
        </div>

        <div className="flex items-start gap-2 pr-14">
          <span className="text-lg">{isFund ? "💰" : "🤝"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm leading-snug">{campaign.title}</h3>
              {fewSeatsLeft && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" /> {seatsLeft} seats left
                </span>
              )}
            </div>
            {campaign.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" /> {campaign.location}
              </span>
            )}
          </div>
        </div>

        {shortDesc && <p className="text-xs text-foreground/60 leading-relaxed">{shortDesc}</p>}

        {!isFund && campaign.volunteers_needed ? (
          <>
            <div className="border-t border-primary/20" />
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Users className="w-3.5 h-3.5" />
              {campaign.volunteers_needed} volunteers needed
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}