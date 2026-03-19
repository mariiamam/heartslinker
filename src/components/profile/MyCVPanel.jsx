import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, BadgeCheck, FileText } from "lucide-react";

const SKILLS_OPTIONS = ["Teaching", "Medical", "Engineering", "Construction", "Cooking", "Driving", "Languages", "IT", "Photography", "Fundraising", "Administration", "Social Work"];

export default function MyCVPanel({ user, activities }) {
  const qc = useQueryClient();

  const { data: cvList = [] } = useQuery({
    queryKey: ["my-cv", user?.email],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const cv = cvList[0] || null;

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", age: "", birth_date: "",
    location: "", skills: [], bio: "", uploaded_cv_url: "",
    cv_agreed: false,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Init form from saved CV / user
  useEffect(() => {
    if (cv || user) {
      setForm(f => ({
        ...f,
        full_name: f.full_name || user?.full_name || "",
        email: f.email || user?.email || "",
        location: f.location || cv?.location || "",
        bio: f.bio || cv?.bio || "",
        skills: f.skills.length ? f.skills : (cv?.skills || []),
        uploaded_cv_url: f.uploaded_cv_url || cv?.uploaded_cv_url || "",
        cv_agreed: cv?.cv_agreed || false,
        phone: f.phone || cv?.cv_phone || "",
        age: f.age || cv?.cv_age || "",
        birth_date: f.birth_date || cv?.cv_birth_date || "",
        full_name: f.full_name || cv?.cv_full_name || user?.full_name || "",
      }));
    }
  }, [cv, user]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (cv) return base44.entities.ImpactProfile.update(cv.id, data);
      return base44.entities.ImpactProfile.create({ ...data, created_by: user?.email });
    },
    onSuccess: () => {
      qc.invalidateQueries(["my-cv"]);
      qc.invalidateQueries(["impact-profile"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
      cv_age: form.age,
      cv_birth_date: form.birth_date,
      location: form.location,
      bio: form.bio,
      skills: form.skills,
      uploaded_cv_url: form.uploaded_cv_url,
      cv_agreed: form.cv_agreed,
    });
  };

  const toggleSkill = (s) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }));
  };

  // Volunteering activities from HeartsLinker
  const verifiedActivities = activities.filter(a => a.ngo_name);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">My CV</h2>
            <p className="text-xs text-muted-foreground">Fill in your details or upload your CV. It will be sent automatically when you join a campaign.</p>
          </div>
        </div>

        {/* Upload existing CV */}
        <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground">Option A — Upload your existing CV</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
            <div className="flex items-center gap-2 bg-white border border-border text-sm px-3 py-2 rounded-xl hover:border-primary transition-colors font-medium text-foreground">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-muted-foreground" />
              )}
              {uploading ? "Uploading..." : form.uploaded_cv_url ? "Replace CV File" : "Upload CV (PDF / Word)"}
            </div>
            {form.uploaded_cv_url && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> File uploaded
              </span>
            )}
          </label>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="font-medium">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Auto-fill form */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">Option B — Fill automatically</p>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Full Name</label>
              <Input className="rounded-xl" placeholder="Your full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Phone Number</label>
              <Input className="rounded-xl" placeholder="+1 234 567 8900" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Email</label>
              <Input className="rounded-xl" placeholder="your@email.com" value={form.email} readOnly />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Age</label>
              <Input className="rounded-xl" type="number" placeholder="e.g. 25" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Date of Birth</label>
              <Input className="rounded-xl" type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Location</label>
              <Input className="rounded-xl" placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS_OPTIONS.map(s => (
                <button key={s} type="button"
                  onClick={() => toggleSkill(s)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${form.skills.includes(s) ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">About Me / Bio</label>
            <textarea
              className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              placeholder="A short paragraph about yourself, your motivation, experience..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>

          {/* Volunteering history — auto from HeartsLinker */}
          {verifiedActivities.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Volunteering History</label>
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
              <p className="text-[10px] text-muted-foreground mt-1.5 italic">✓ These activities are verified through HeartsLinker and will appear on your CV with an orange HL badge.</p>
            </div>
          )}
        </div>

        {/* Terms & consent */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Before saving your CV — please read and agree:</p>
          <ul className="space-y-2 text-xs text-foreground/80 list-none">
            <li className="flex gap-2"><span className="text-primary font-bold">1.</span> By saving this CV, I authorize HeartsLinker to automatically share it with any NGO when I click "Join" on a campaign.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">2.</span> I confirm that all information provided is truthful and accurate. I take full legal and moral responsibility for any false or misleading information.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">3.</span> I understand my CV may be reviewed by NGO staff and stored securely. I can update or delete it at any time from my profile settings.</li>
          </ul>
          <label className="flex items-start gap-2.5 cursor-pointer mt-2">
            <input
              type="checkbox"
              className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
              checked={form.cv_agreed}
              onChange={e => setForm(f => ({ ...f, cv_agreed: e.target.checked }))}
            />
            <span className="text-xs font-semibold text-foreground">I have read and agree to all the above terms</span>
          </label>
        </div>

        <div className="flex items-center gap-3 justify-end">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" /> CV saved!
            </span>
          )}
          <Button
            className="rounded-xl bg-primary hover:bg-primary/90"
            disabled={!form.cv_agreed || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? "Saving..." : "Save CV"}
          </Button>
        </div>
      </div>
    </div>
  );
}