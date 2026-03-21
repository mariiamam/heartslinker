import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Building2, User, ArrowRight, CheckCircle } from "lucide-react";

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState("choose_role"); // choose_role | volunteer_cv | done
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cv_full_name: user?.full_name || "",
    cv_phone: "",
    cv_city: "",
    cv_country: "",
    cv_birth_date: "",
  });

  const selectRole = async (appRole) => {
    setSaving(true);
    await base44.auth.updateMe({ app_role: appRole });
    setSaving(false);
    if (appRole === "volunteer") {
      setStep("volunteer_cv");
    } else {
      // NGO users go straight to NGO Dashboard
      await base44.auth.updateMe({ onboarding_complete: true });
      onComplete("ngo");
    }
  };

  const saveCV = async () => {
    if (!form.cv_full_name || !form.cv_phone || !form.cv_city) return;
    setSaving(true);
    // Create or update ImpactProfile with mandatory CV fields
    const existing = await base44.entities.ImpactProfile.filter({ created_by: user.email });
    const cvData = {
      cv_full_name: form.cv_full_name,
      cv_phone: form.cv_phone,
      cv_city: form.cv_city,
      cv_country: form.cv_country,
      cv_birth_date: form.cv_birth_date,
    };
    if (existing[0]) {
      await base44.entities.ImpactProfile.update(existing[0].id, cvData);
    } else {
      await base44.entities.ImpactProfile.create(cvData);
    }
    await base44.auth.updateMe({ onboarding_complete: true });
    setSaving(false);
    onComplete("volunteer");
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-secondary/30 to-primary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Welcome to HeartsLinker!</h1>
          <p className="text-white/80 text-sm mt-1">
            {step === "choose_role" ? "Tell us who you are" : "Complete your volunteer profile"}
          </p>
        </div>

        <div className="p-6">
          {step === "choose_role" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-6">
                How will you be using HeartsLinker?
              </p>
              <button
                onClick={() => selectRole("volunteer")}
                disabled={saving}
                className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">I'm a Volunteer</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Browse campaigns, join NGOs, track my impact</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => selectRole("ngo")}
                disabled={saving}
                className="w-full flex items-center gap-4 p-5 border-2 border-border rounded-2xl hover:border-accent hover:bg-accent/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Building2 className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-bold text-foreground">I represent an NGO</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Publish campaigns, manage volunteers, track impact</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-accent-foreground transition-colors" />
              </button>
            </div>
          )}

          {step === "volunteer_cv" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                NGOs will see this when you apply to their campaigns.
              </p>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Full Name *</label>
                <Input
                  placeholder="Your full name"
                  value={form.cv_full_name}
                  onChange={e => setForm({ ...form, cv_full_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Phone Number *</label>
                <Input
                  placeholder="+961 71 000 000"
                  value={form.cv_phone}
                  onChange={e => setForm({ ...form, cv_phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">City *</label>
                  <Input
                    placeholder="e.g. Beirut"
                    value={form.cv_city}
                    onChange={e => setForm({ ...form, cv_city: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Country</label>
                  <Input
                    placeholder="e.g. Lebanon"
                    value={form.cv_country}
                    onChange={e => setForm({ ...form, cv_country: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Date of Birth</label>
                <Input
                  type="date"
                  value={form.cv_birth_date}
                  onChange={e => setForm({ ...form, cv_birth_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button
                className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-2 gap-2"
                disabled={!form.cv_full_name || !form.cv_phone || !form.cv_city || saving}
                onClick={saveCV}
              >
                {saving ? "Saving..." : <><CheckCircle className="w-4 h-4" /> Complete Setup</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can add more details (skills, languages, etc.) in your profile later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}