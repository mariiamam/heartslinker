import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, MapPin, AlertTriangle } from "lucide-react";
import CampaignDetailModal from "./CampaignDetailModal";

export default function CampaignsSection({ campaigns, ngoId }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", type: "volunteers", location: "", volunteers_needed: "", volunteers_enrolled: "", goal_amount: "", collected_amount: "", start_date: "", end_date: "", requirements: "", min_age: "", max_age: "" });
  const qc = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => { qc.invalidateQueries(["campaigns"]); setShowForm(false); setForm({ title: "", description: "", type: "volunteers", location: "", volunteers_needed: "", goal_amount: "", collected_amount: "" }); },
  });

  const handleCreate = () => {
    if (!form.title) return;
    createCampaign.mutate({
      ...form,
      ngo_id: ngoId,
      volunteers_needed: form.volunteers_needed ? Number(form.volunteers_needed) : undefined,
      volunteers_enrolled: form.volunteers_enrolled ? Number(form.volunteers_enrolled) : 0,
      goal_amount: form.goal_amount ? Number(form.goal_amount) : undefined,
      collected_amount: form.collected_amount ? Number(form.collected_amount) : 0,
      min_age: form.min_age ? Number(form.min_age) : undefined,
      max_age: form.max_age ? Number(form.max_age) : undefined,
      is_active: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Active Campaigns</h2>
        <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Create Campaign</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Campaign title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
            <div className="flex rounded-xl overflow-hidden border border-input">
              <button onClick={() => setForm({ ...form, type: "volunteers" })} className={`flex-1 text-xs py-2 font-medium transition-colors ${form.type === "volunteers" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                🤝 Volunteers
              </button>
              <button onClick={() => setForm({ ...form, type: "fundraising" })} className={`flex-1 text-xs py-2 font-medium transition-colors ${form.type === "fundraising" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                💰 Fundraising
              </button>
            </div>
            <Input placeholder="Location (e.g. Africa, Gaza)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-xl" />
            <Input placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
            {form.type === "volunteers" && (
              <Input type="number" placeholder="Volunteers needed" value={form.volunteers_needed} onChange={e => setForm({ ...form, volunteers_needed: e.target.value })} className="rounded-xl" />
            )}
            {form.type === "fundraising" && (
              <>
                <Input type="number" placeholder="Goal amount ($)" value={form.goal_amount} onChange={e => setForm({ ...form, goal_amount: e.target.value })} className="rounded-xl" />
                <Input type="number" placeholder="Already collected ($)" value={form.collected_amount} onChange={e => setForm({ ...form, collected_amount: e.target.value })} className="rounded-xl" />
              </>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Creating..." : "Launch Campaign"}
            </Button>
          </div>
        </div>
      )}

      {!campaigns?.length ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
          No active campaigns yet. Launch your first campaign!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.filter(c => c.is_active).map(c => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }) {
  const isFund = campaign.type === "fundraising";
  const progress = isFund && campaign.goal_amount ? Math.min(100, Math.round((campaign.collected_amount / campaign.goal_amount) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">{isFund ? "💰" : "🤝"}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm leading-snug">{campaign.title}</h3>
          {campaign.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" /> {campaign.location}
            </span>
          )}
        </div>
      </div>

      {campaign.description && (
        <p className="text-xs text-foreground/70 leading-relaxed">{campaign.description}</p>
      )}

      {isFund && campaign.goal_amount ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium text-primary">${(campaign.collected_amount || 0).toLocaleString()} raised</span>
            <span>Goal: ${campaign.goal_amount.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{progress}% of goal reached</p>
        </div>
      ) : campaign.volunteers_needed ? (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Users className="w-3.5 h-3.5" />
          {campaign.volunteers_needed} volunteers needed
        </div>
      ) : null}
    </div>
  );
}