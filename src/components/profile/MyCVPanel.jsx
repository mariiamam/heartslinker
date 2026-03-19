import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, BadgeCheck, FileText, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

const STEPS = [
  { label: "Basic Info", icon: "👤" },
  { label: "Skills & Languages", icon: "🛠" },
  { label: "Experience", icon: "📋" },
  { label: "Availability", icon: "📅" },
  { label: "Additional Info", icon: "➕" },
  { label: "Consent & Save", icon: "✅" },
];

const PRIMARY_SKILLS = ["Teaching", "Medical / First Aid", "Engineering", "Construction", "Cooking", "IT / Tech", "Photography / Media", "Fundraising", "Social Work", "Administration", "Legal", "Translation"];
const OTHER_SKILLS = ["Driving", "Event Planning", "Graphic Design", "Public Speaking", "Research", "Childcare", "Elderly Care", "Animal Care", "Sports Coaching", "Music / Arts"];
const LANG_LEVELS = ["Basic", "Intermediate", "Fluent", "Native"];
const CAUSES = ["Education", "Refugees", "Environment", "Health", "Children", "Food", "Shelter", "Animals", "Elderly", "Disability"];
const TRAVEL_OPTIONS = ["Local only", "National", "International"];
const AVAILABILITY_OPTIONS = ["Full-time", "Part-time", "Occasional / Weekends only"];
const DAYS_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EMPTY_FORM = {
  full_name: "", phone: "", birth_date: "",
  city: "", country: "", address: "",
  primary_skills: [], other_skills: [], custom_skill: "",
  cv_languages: [{ language: "", level: "Fluent" }],
  experience: [{ org: "", role: "", duration: "" }],
  availability: "", available_days: [], start_date: "",
  certifications: "", has_license: false, has_car: false, travel: "",
  preferred_causes: [],
  emergency_name: "", emergency_phone: "",
  bio: "",
  cv_public: false, cv_contactable: true,
  uploaded_cv_url: "",
  cv_agreed: false,
};

function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age > 0 ? age : null;
}

export default function MyCVPanel({ user, activities }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: cvList = [] } = useQuery({
    queryKey: ["my-cv", user?.email],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const cv = cvList[0] || null;

  useEffect(() => {
    if (!cv && !user) return;
    setForm(f => ({
      ...f,
      full_name: cv?.cv_full_name || user?.full_name || "",
      phone: cv?.cv_phone || "",
      birth_date: cv?.cv_birth_date || "",
      city: cv?.cv_city || "",
      country: cv?.cv_country || "",
      address: cv?.cv_address || "",
      primary_skills: cv?.cv_primary_skills || [],
      other_skills: cv?.cv_other_skills || [],
      custom_skill: cv?.cv_custom_skill || "",
      cv_languages: cv?.cv_languages?.length ? cv.cv_languages : [{ language: "", level: "Fluent" }],
      experience: cv?.cv_experience?.length ? cv.cv_experience : [{ org: "", role: "", duration: "" }],
      availability: cv?.cv_availability || "",
      available_days: cv?.cv_available_days || [],
      start_date: cv?.cv_start_date || "",
      certifications: cv?.cv_certifications || "",
      has_license: cv?.cv_has_license || false,
      has_car: cv?.cv_has_car || false,
      travel: cv?.cv_travel || "",
      preferred_causes: cv?.cv_preferred_causes || [],
      emergency_name: cv?.cv_emergency_name || "",
      emergency_phone: cv?.cv_emergency_phone || "",
      bio: cv?.bio || "",
      cv_public: cv?.cv_public || false,
      cv_contactable: cv?.cv_contactable ?? true,
      uploaded_cv_url: cv?.uploaded_cv_url || "",
      cv_agreed: cv?.cv_agreed || false,
    }));
  }, [cv, user]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (cv) return base44.entities.ImpactProfile.update(cv.id, data);
      return base44.entities.ImpactProfile.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries(["my-cv"]);
      qc.invalidateQueries(["impact-profile"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, uploaded_cv_url: file_url }));
    setUploading(false);
  };

  const handleSave = () => {
    if (!form.cv_agreed) return;
    saveMutation.mutate({
      cv_full_name: form.full_name,
      cv_phone: form.phone,
      cv_birth_date: form.birth_date,
      cv_city: form.city,
      cv_country: form.country,
      cv_address: form.address,
      cv_primary_skills: form.primary_skills,
      cv_other_skills: form.other_skills,
      cv_custom_skill: form.custom_skill,
      cv_languages: form.cv_languages.filter(l => l.language),
      cv_experience: form.experience.filter(e => e.org || e.role),
      cv_availability: form.availability,
      cv_available_days: form.available_days,
      cv_start_date: form.start_date,
      cv_certifications: form.certifications,
      cv_has_license: form.has_license,
      cv_has_car: form.has_car,
      cv_travel: form.travel,
      cv_preferred_causes: form.preferred_causes,
      cv_emergency_name: form.emergency_name,
      cv_emergency_phone: form.emergency_phone,
      bio: form.bio,
      cv_public: form.cv_public,
      cv_contactable: form.cv_contactable,
      skills: [...form.primary_skills, ...form.other_skills],
      uploaded_cv_url: form.uploaded_cv_url,
      cv_agreed: form.cv_agreed,
    });
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
  }));

  const verifiedActivities = (activities || []).filter(a => a.ngo_name);
  const age = calcAge(form.birth_date);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />

      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">My CV</h2>
            <p className="text-xs text-muted-foreground">Shared with NGOs when you join a campaign</p>
          </div>
        </div>

        {/* Upload shortcut */}
        <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-2.5">
          <span className="text-xs text-muted-foreground font-medium flex-1">Already have a CV file?</span>
          <label className="cursor-pointer">
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              {uploading ? <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Uploading...</> : form.uploaded_cv_url ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Uploaded ✓</> : <><Upload className="w-3.5 h-3.5" /> Upload PDF / Word</>}
            </span>
          </label>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex overflow-x-auto border-b border-border bg-muted/20 px-2 py-2 gap-1">
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${step === i ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4 min-h-[320px]">

        {/* ─── STEP 0: Basic Info ─── */}
        {step === 0 && (
          <div className="space-y-3">
            <SectionTitle>Basic Information</SectionTitle>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Full Name *">
                <Input className="rounded-xl" placeholder="Your full name" value={form.full_name} onChange={e => set("full_name", e.target.value)} />
              </Field>
              <Field label="Phone Number">
                <Input className="rounded-xl" placeholder="+1 234 567 8900" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input className="rounded-xl" value={user?.email || ""} readOnly className="rounded-xl opacity-60" />
              </Field>
              <Field label="Date of Birth">
                <Input className="rounded-xl" type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} />
                {age && <p className="text-xs text-muted-foreground mt-1">Age: {age} years old</p>}
              </Field>
            </div>
            <SectionTitle className="pt-2">Location</SectionTitle>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="City *">
                <Input className="rounded-xl" placeholder="e.g. Beirut" value={form.city} onChange={e => set("city", e.target.value)} />
              </Field>
              <Field label="Country *">
                <Input className="rounded-xl" placeholder="e.g. Lebanon" value={form.country} onChange={e => set("country", e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address / Region (optional)">
                  <Input className="rounded-xl" placeholder="e.g. Hamra district, or nearby airport" value={form.address} onChange={e => set("address", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 1: Skills & Languages ─── */}
        {step === 1 && (
          <div className="space-y-4">
            <SectionTitle>Primary Skills <span className="font-normal text-muted-foreground text-xs ml-1">(choose up to 5)</span></SectionTitle>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_SKILLS.map(s => (
                <ToggleChip key={s} active={form.primary_skills.includes(s)}
                  onClick={() => {
                    if (form.primary_skills.includes(s)) toggleArr("primary_skills", s);
                    else if (form.primary_skills.length < 5) toggleArr("primary_skills", s);
                  }}>{s}</ToggleChip>
              ))}
            </div>

            <SectionTitle>Other Skills</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {OTHER_SKILLS.map(s => (
                <ToggleChip key={s} active={form.other_skills.includes(s)} onClick={() => toggleArr("other_skills", s)}>{s}</ToggleChip>
              ))}
            </div>
            <Field label="Other (write your own)">
              <Input className="rounded-xl" placeholder="e.g. Sign language, Plumbing..." value={form.custom_skill} onChange={e => set("custom_skill", e.target.value)} />
            </Field>

            <SectionTitle className="pt-1">Languages</SectionTitle>
            <div className="space-y-2">
              {form.cv_languages.map((lang, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input className="rounded-xl flex-1" placeholder="Language (e.g. Arabic)" value={lang.language}
                    onChange={e => {
                      const updated = [...form.cv_languages];
                      updated[i] = { ...updated[i], language: e.target.value };
                      set("cv_languages", updated);
                    }} />
                  <select className="text-sm border border-input rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-ring"
                    value={lang.level}
                    onChange={e => {
                      const updated = [...form.cv_languages];
                      updated[i] = { ...updated[i], level: e.target.value };
                      set("cv_languages", updated);
                    }}>
                    {LANG_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                  {form.cv_languages.length > 1 && (
                    <button onClick={() => set("cv_languages", form.cv_languages.filter((_, j) => j !== i))} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => set("cv_languages", [...form.cv_languages, { language: "", level: "Fluent" }])}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-1">
                <Plus className="w-3.5 h-3.5" /> Add language
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Experience ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>Previous Volunteering Experience</SectionTitle>
            <p className="text-xs text-muted-foreground">Add any volunteering or relevant work, even informal.</p>

            <div className="space-y-3">
              {form.experience.map((exp, i) => (
                <div key={i} className="bg-muted/30 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-foreground">Experience #{i + 1}</p>
                    {form.experience.length > 1 && (
                      <button onClick={() => set("experience", form.experience.filter((_, j) => j !== i))} className="p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input className="rounded-xl" placeholder="Organization / NGO name" value={exp.org}
                    onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], org: e.target.value }; set("experience", u); }} />
                  <Input className="rounded-xl" placeholder="Role / what you did" value={exp.role}
                    onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], role: e.target.value }; set("experience", u); }} />
                  <Input className="rounded-xl" placeholder="Duration (e.g. 3 months, 2019–2020)" value={exp.duration}
                    onChange={e => { const u = [...form.experience]; u[i] = { ...u[i], duration: e.target.value }; set("experience", u); }} />
                </div>
              ))}
              <button onClick={() => set("experience", [...form.experience, { org: "", role: "", duration: "" }])}
                className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add another experience
              </button>
            </div>

            {/* HeartsLinker verified */}
            {verifiedActivities.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-foreground mb-2">✓ Verified via HeartsLinker</p>
                <div className="space-y-2">
                  {verifiedActivities.map(act => (
                    <div key={act.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                      <span className="text-sm">🤝</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {act.ngo_name}
                          <span className="inline-flex items-center gap-0.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                            <BadgeCheck className="w-2.5 h-2.5" /> HL
                          </span>
                        </p>
                      </div>
                      {act.start_date && <span className="text-[10px] text-muted-foreground flex-shrink-0">{act.start_date}</span>}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">These are automatically included and shown with an HL badge.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: Availability ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <SectionTitle>Availability</SectionTitle>
            <Field label="How available are you?">
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map(o => (
                  <ToggleChip key={o} active={form.availability === o} onClick={() => set("availability", form.availability === o ? "" : o)}>{o}</ToggleChip>
                ))}
              </div>
            </Field>

            <Field label="Available days">
              <div className="flex flex-wrap gap-2">
                {DAYS_OPTIONS.map(d => (
                  <ToggleChip key={d} active={form.available_days.includes(d)} onClick={() => toggleArr("available_days", d)}>{d}</ToggleChip>
                ))}
              </div>
            </Field>

            <Field label="Earliest start date">
              <Input className="rounded-xl max-w-xs" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            </Field>

            <SectionTitle className="pt-1">Preferred Causes</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {CAUSES.map(c => (
                <ToggleChip key={c} active={form.preferred_causes.includes(c)} onClick={() => toggleArr("preferred_causes", c)}>{c}</ToggleChip>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Additional Info ─── */}
        {step === 4 && (
          <div className="space-y-4">
            <SectionTitle>About Me</SectionTitle>
            <textarea
              className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={4}
              placeholder="Tell NGOs about yourself, your motivation, and what kind of volunteering you are looking for."
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
            />

            <SectionTitle>Certifications / Qualifications</SectionTitle>
            <Input className="rounded-xl" placeholder="e.g. First Aid, Teaching Certificate, Driver's License Class B..." value={form.certifications} onChange={e => set("certifications", e.target.value)} />

            <SectionTitle>Transportation & Mobility</SectionTitle>
            <div className="flex flex-wrap gap-4">
              <BoolToggle label="Driver's License" value={form.has_license} onChange={v => set("has_license", v)} />
              <BoolToggle label="Own a Car" value={form.has_car} onChange={v => set("has_car", v)} />
            </div>
            <Field label="Can travel?">
              <div className="flex flex-wrap gap-2">
                {TRAVEL_OPTIONS.map(o => (
                  <ToggleChip key={o} active={form.travel === o} onClick={() => set("travel", form.travel === o ? "" : o)}>{o}</ToggleChip>
                ))}
              </div>
            </Field>

            <SectionTitle>Emergency Contact <span className="font-normal text-muted-foreground text-xs ml-1">(optional)</span></SectionTitle>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Contact Name">
                <Input className="rounded-xl" placeholder="Full name" value={form.emergency_name} onChange={e => set("emergency_name", e.target.value)} />
              </Field>
              <Field label="Contact Phone">
                <Input className="rounded-xl" placeholder="+1 234 567 8900" value={form.emergency_phone} onChange={e => set("emergency_phone", e.target.value)} />
              </Field>
            </div>

            <SectionTitle>Profile Visibility</SectionTitle>
            <div className="flex flex-wrap gap-4">
              <BoolToggle label="Make my profile public" value={form.cv_public} onChange={v => set("cv_public", v)} />
              <BoolToggle label="Allow NGOs to contact me directly" value={form.cv_contactable} onChange={v => set("cv_contactable", v)} />
            </div>
          </div>
        )}

        {/* ─── STEP 5: Consent & Save ─── */}
        {step === 5 && (
          <div className="space-y-4">
            {/* Summary preview */}
            <div className="bg-muted/30 rounded-2xl p-4 space-y-1.5 text-xs text-foreground/80">
              <p className="font-bold text-foreground text-sm mb-2">CV Summary</p>
              {form.full_name && <p>👤 {form.full_name}{age ? `, ${age} yrs` : ""}</p>}
              {user?.email && <p>✉️ {user.email}</p>}
              {form.phone && <p>📞 {form.phone}</p>}
              {(form.city || form.country) && <p>📍 {[form.city, form.country].filter(Boolean).join(", ")}</p>}
              {form.primary_skills.length > 0 && <p>🛠 {form.primary_skills.join(", ")}</p>}
              {form.availability && <p>📅 {form.availability}</p>}
              {form.uploaded_cv_url && <p className="text-green-600">📎 CV file uploaded</p>}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Terms — please read and agree</p>
              <ul className="space-y-2 text-xs text-foreground/80 list-none">
                <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">1.</span> By saving this CV, I authorize HeartsLinker to automatically share it with NGOs when I click "Join" on a campaign.</li>
                <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">2.</span> I confirm all information is truthful and accurate. I take full responsibility for any false or misleading information.</li>
                <li className="flex gap-2"><span className="text-primary font-bold flex-shrink-0">3.</span> I understand my CV may be reviewed by NGO staff and stored securely. I can update or delete it anytime.</li>
              </ul>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0" checked={form.cv_agreed}
                  onChange={e => set("cv_agreed", e.target.checked)} />
                <span className="text-xs font-semibold text-foreground">I have read and agree to all the above terms</span>
              </label>
            </div>

            <div className="flex items-center gap-3 justify-end">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> CV saved successfully!
                </span>
              )}
              <Button className="rounded-xl bg-primary hover:bg-primary/90 px-6"
                disabled={!form.cv_agreed || saveMutation.isPending}
                onClick={handleSave}>
                {saveMutation.isPending ? "Saving..." : "Save CV"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-5 pb-5 flex justify-between">
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground self-center">{step + 1} / {STEPS.length}</span>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={step === STEPS.length - 1} onClick={() => setStep(s => s + 1)}>
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }) {
  return <p className={`text-xs font-semibold text-foreground uppercase tracking-wide ${className}`}>{children}</p>;
}

function Field({ label, children }) {
  return (
    <div>
      {label && <label className="text-xs text-muted-foreground mb-1 block font-medium">{label}</label>}
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${active ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
      {children}
    </button>
  );
}

function BoolToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${value ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${value ? "left-4.5 left-[18px]" : "left-0.5"}`} />
      </button>
      <span className="text-xs text-foreground font-medium">{label}</span>
    </div>
  );
}